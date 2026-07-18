export const FAMILY_STORAGE_KEY = "la-compra-family-v1";
export const DEVICE_STORAGE_KEY = "la-compra-device-v1";
export const FAMILY_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function normalizeFamilyId(value) {
  const candidate = String(value || "").trim();
  return FAMILY_ID_PATTERN.test(candidate) ? candidate : "";
}

export function createFamilyId(cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.getRandomValues) throw new Error("No se puede crear un enlace seguro");
  const bytes = cryptoImpl.getRandomValues(new Uint8Array(32));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export function familyIdFromUrl(value) {
  const url = value instanceof URL ? value : new URL(String(value), "https://example.invalid/");
  return normalizeFamilyId(url.searchParams.get("familia") || url.searchParams.get("family"));
}

export function sharedListIdFromUrl(value) {
  const url = value instanceof URL ? value : new URL(String(value), "https://example.invalid/");
  return normalizeFamilyId(url.searchParams.get("lista"));
}

export function makeFamilyShareUrl(value, familyId) {
  const id = normalizeFamilyId(familyId);
  if (!id) throw new Error("El enlace familiar no es válido");
  const url = value instanceof URL ? new URL(value) : new URL(String(value));
  url.search = "";
  url.hash = "";
  url.searchParams.set("familia", id);
  return url.toString();
}

export function makeSharedListUrl(value, listId) {
  const id = normalizeFamilyId(listId);
  if (!id) throw new Error("El enlace de la lista no es válido");
  const url = value instanceof URL ? new URL(value) : new URL(String(value));
  url.search = "";
  url.hash = "";
  url.searchParams.set("lista", id);
  return url.toString();
}

export function sharedStateFrom(state) {
  const { settings: _settings, ...shared } = state || {};
  return shared;
}

export function mergeSharedState(shared, localSettings = {}) {
  return {
    ...(shared || {}),
    settings: { ...localSettings },
  };
}

export function createFamilySync({
  databaseUrl,
  familyId,
  collection = "families",
  deviceId,
  fetchImpl = globalThis.fetch,
  EventSourceImpl = globalThis.EventSource,
  onRemoteState = () => {},
  onStatus = () => {},
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
}) {
  const id = normalizeFamilyId(familyId);
  if (!id) throw new Error("El enlace familiar no es válido");
  if (!databaseUrl || !fetchImpl) throw new Error("La sincronización no está disponible");
  if (!["families", "sharedLists"].includes(collection)) throw new Error("La colección compartida no es válida");

  const endpoint = `${String(databaseUrl).replace(/\/+$/g, "")}/${collection}/${id}.json`;
  let stopped = false;
  let source = null;
  let writeTimer = null;
  let pendingState = null;
  let writing = false;
  let latestUpdatedAt = 0;

  function setStatus(status) {
    if (!stopped) onStatus(status);
  }

  async function readRemote({ initial = false } = {}) {
    const response = await fetchImpl(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`No se puede leer la lista (${response.status})`);
    const remote = await response.json();
    if (remote?.state) {
      latestUpdatedAt = Math.max(latestUpdatedAt, Number(remote.updatedAt) || 0);
      onRemoteState(remote.state, { initial, updatedBy: remote.updatedBy || "" });
    }
    return remote;
  }

  async function writeNow(sharedState) {
    pendingState = sharedStateFrom(sharedState);
    if (writing || stopped) return;
    writing = true;
    const nextState = pendingState;
    pendingState = null;
    setStatus("connecting");
    try {
      const response = await fetchImpl(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: nextState,
          updatedAt: { ".sv": "timestamp" },
          updatedBy: deviceId,
        }),
      });
      if (!response.ok) throw new Error(`No se puede guardar la lista (${response.status})`);
      const saved = await response.json();
      latestUpdatedAt = Math.max(latestUpdatedAt, Number(saved?.updatedAt) || 0);
      setStatus("synced");
    } catch (error) {
      pendingState = nextState;
      setStatus("offline");
      throw error;
    } finally {
      writing = false;
    }
    if (pendingState && !stopped) schedule(pendingState, 0);
  }

  function schedule(sharedState, delay = 300) {
    pendingState = sharedStateFrom(sharedState);
    if (stopped) return;
    clearTimeoutImpl(writeTimer);
    writeTimer = setTimeoutImpl(() => {
      writeTimer = null;
      writeNow(pendingState).catch(() => {});
    }, delay);
  }

  function receiveEvent(event) {
    try {
      const message = JSON.parse(event.data);
      if (message.path !== "/" || !message.data?.state) {
        readRemote().catch(() => setStatus("offline"));
        return;
      }
      const remote = message.data;
      const updatedAt = Number(remote.updatedAt) || 0;
      if (remote.updatedBy === deviceId || (updatedAt && updatedAt <= latestUpdatedAt)) return;
      latestUpdatedAt = Math.max(latestUpdatedAt, updatedAt);
      onRemoteState(remote.state, { initial: false, updatedBy: remote.updatedBy || "" });
      setStatus("synced");
    } catch {
      setStatus("offline");
    }
  }

  function subscribe() {
    if (!EventSourceImpl || stopped || source) return;
    source = new EventSourceImpl(endpoint);
    source.addEventListener("put", receiveEvent);
    source.addEventListener("patch", () => readRemote().catch(() => setStatus("offline")));
    source.addEventListener("open", () => setStatus("synced"));
    source.addEventListener("cancel", () => setStatus("offline"));
    source.addEventListener("auth_revoked", () => setStatus("offline"));
    source.onerror = () => setStatus("offline");
  }

  async function start(localState) {
    setStatus("connecting");
    try {
      const remote = await readRemote({ initial: true });
      if (!remote?.state) await writeNow(localState);
      else setStatus("synced");
    } catch {
      setStatus("offline");
    }
    subscribe();
  }

  async function refresh() {
    try {
      await readRemote();
      setStatus("synced");
      if (pendingState) await writeNow(pendingState);
    } catch {
      setStatus("offline");
    }
  }

  function stop() {
    stopped = true;
    clearTimeoutImpl(writeTimer);
    source?.close();
    source = null;
  }

  return {
    endpoint,
    refresh,
    schedule,
    start,
    stop,
    writeNow,
  };
}

export function createSharedListSync({ listId, ...options }) {
  return createFamilySync({
    ...options,
    familyId: listId,
    collection: "sharedLists",
  });
}
