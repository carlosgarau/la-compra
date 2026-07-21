import {
  addExpiration,
  CATEGORY_META,
  createInitialState,
  detectVoiceCommand,
  formatAmount,
  getActiveExpirations,
  getPendingExpirationAlerts,
  getSuggestions,
  groupItems,
  hydrateState,
  isFreezable,
  isPerishable,
  makeItem,
  markExpirationAlerted,
  parseEntry,
  parseSpokenList,
  registerPurchase,
  registerRequest,
  shoppingSummary,
} from "./core.mjs?v=16";
import {
  createFamilyId,
  createFamilySync,
  createSharedListSync,
  DEVICE_STORAGE_KEY,
  expireFamilyCookie,
  familyCookiePathFromUrl,
  familyIdFromCookie,
  familyIdFromUrl,
  FAMILY_STORAGE_KEY,
  makeFamilyCookie,
  makeFamilyShareUrl,
  makeSharedListUrl,
  mergeFamilyStates,
  mergeSharedState,
  normalizeFamilyId,
  sharedStateFrom,
  sharedListIdFromUrl,
} from "./family-sync.mjs?v=16";

const STORAGE_KEY = "la-compra-state-v1";
const DATABASE_URL = "https://la-compra-familiar-default-rtdb.europe-west1.firebasedatabase.app";
const ICONS = {
  leaf: '<path d="M19 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 9-7 9-15Z"/><path d="M5 20c2-5 5-8 10-11"/>',
  fish: '<path d="M4 12c3-5 8-6 13-3l3-3v12l-3-3c-5 3-10 2-13-3Z"/><circle cx="13.5" cy="10.5" r=".7"/>',
  milk: '<path d="M8 3h8M9 3v4L7 10v11h10V10l-2-3V3"/><path d="M7 11h10"/>',
  bread: '<path d="M5 19V9c0-3 3-5 7-5s7 2 7 5v10H5Z"/><path d="m9 9 1.5 2M14 8l1.5 2"/>',
  jar: '<path d="M7 4h10v4l2 2v10H5V10l2-2V4Z"/><path d="M7 8h10M8 13h8"/>',
  bottle: '<path d="M10 3h4v5l2 3v10H8V11l2-3V3Z"/><path d="M8 13h8"/>',
  snow: '<path d="M12 2v20M4 7l16 10M4 17 20 7M9 4l3 3 3-3M9 20l3-3 3 3"/>',
  sparkle: '<path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>',
  drop: '<path d="M12 3S6 10 6 15a6 6 0 0 0 12 0c0-5-6-12-6-12Z"/>',
  baby: '<circle cx="12" cy="13" r="7"/><path d="M10 5c0-2 3-3 4-1M9 13h.01M15 13h.01M10 16c1 1 3 1 4 0"/>',
  paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 17c0-4 2-7 5-7s5 3 5 7c0 3-3 3-5 1-2 2-5 2-5-1Z"/>',
  basket: '<path d="M4 9h16l-2 11H6L4 9ZM8 9l4-6 4 6M9 13v3M15 13v3"/>',
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let state = loadState();
let standaloneListId = sharedListIdFromUrl(window.location.href);
let familyId = standaloneListId ? "" : rememberFamilyId();
let familySync = null;
let serviceWorkerRegistration = null;
let familyStatus = familyId ? "connecting" : "local";
let deviceId = getDeviceId();
let activeListId = standaloneListId ? "standalone" : "main";
let standaloneList = null;
let sharedListSyncs = new Map();
let editingSpecialListId = "";
let activeView = "list";
let shoppingMode = false;
let duplicateQueue = [];
let currentDuplicate = null;
let expirationPromptQueue = [];
let currentExpirationPrompt = null;
let expirationPromptTotal = 0;
let expirationPromptPosition = 0;
let expirationAlertQueue = [];
let currentExpirationAlert = null;
let recognition = null;
let toastTimer = null;

function loadState() {
  try {
    return hydrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return createInitialState();
  }
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, id);
  }
  return id;
}

function storeFamilyAccess(value) {
  const id = normalizeFamilyId(value);
  if (!id) return "";
  try {
    localStorage.setItem(FAMILY_STORAGE_KEY, id);
  } catch {}
  try {
    document.cookie = makeFamilyCookie(id, familyCookiePathFromUrl(window.location.href));
  } catch {}
  return id;
}

function clearFamilyAccess() {
  try {
    localStorage.removeItem(FAMILY_STORAGE_KEY);
  } catch {}
  try {
    document.cookie = expireFamilyCookie(familyCookiePathFromUrl(window.location.href));
  } catch {}
}

function rememberFamilyId() {
  const url = new URL(window.location.href);
  const incoming = familyIdFromUrl(url);
  if (incoming) {
    storeFamilyAccess(incoming);
    url.searchParams.delete("familia");
    url.searchParams.delete("family");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    return incoming;
  }
  let stored = "";
  try {
    stored = normalizeFamilyId(localStorage.getItem(FAMILY_STORAGE_KEY));
  } catch {}
  const remembered = stored || familyIdFromCookie(document.cookie);
  if (remembered) storeFamilyAccess(remembered);
  return remembered;
}

function saveState({ sync = true } = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (sync && familySync) familySync.schedule(sharedStateFrom(state));
}

function cleanListName(value, fallback = "Lista especial") {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 50) || fallback;
}

function normalizeSharedList(value, fallbackName = "Lista compartida") {
  return {
    name: cleanListName(value?.name, fallbackName),
    items: Array.isArray(value?.items) ? value.items : [],
  };
}

function specialListById(listId) {
  return state.specialLists.find((list) => list.id === listId) || null;
}

function listRecordById(listId = activeListId) {
  if (listId === "standalone") return standaloneList;
  if (listId === "main") return { id: "main", name: "Compra habitual", items: state.items };
  return specialListById(listId);
}

function activeListRecord() {
  return listRecordById(activeListId);
}

function listItems(listId = activeListId) {
  return listRecordById(listId)?.items || [];
}

function replaceListItems(listId, items) {
  if (listId === "main") state.items = items;
  else if (listId === "standalone" && standaloneList) standaloneList.items = items;
  else {
    const list = specialListById(listId);
    if (list) list.items = items;
  }
}

function sharedListPayload(list) {
  return {
    version: 1,
    name: cleanListName(list?.name),
    items: Array.isArray(list?.items) ? list.items : [],
  };
}

function sharedSyncEntry(listId) {
  return sharedListSyncs.get(listId);
}

function persistList(listId = activeListId) {
  if (listId === "standalone") {
    const entry = sharedSyncEntry("standalone");
    if (standaloneList && entry) entry.sync.schedule(sharedListPayload(standaloneList));
    return;
  }

  saveState();
  if (listId !== "main") {
    const list = specialListById(listId);
    const entry = sharedSyncEntry(listId);
    if (list && entry) entry.sync.schedule(sharedListPayload(list));
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function icon(name, className = "") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.basket}</svg>`;
}

function speak(message) {
  if (!state.settings.speak || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "es-ES";
  utterance.rate = 1.02;
  window.speechSynthesis.speak(utterance);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function renderFamilySharing() {
  const status = $("#familyStatus");
  const shareButton = $("#familyShareButton");
  const disconnectButton = $("#familyDisconnectButton");
  const badge = $("#familyBadge");
  if (!status || !shareButton || !disconnectButton || !badge) return;

  const copy = {
    local: "Esta copia solo está en este móvil.",
    connecting: "Conectando con vuestra lista familiar…",
    synced: "Compartida y sincronizada entre los dos móviles.",
    offline: "Sin conexión. Los cambios se sincronizarán cuando vuelva Internet.",
  };
  status.textContent = copy[familyStatus] || copy.local;
  shareButton.textContent = familyId ? "Compartir enlace familiar" : "Crear lista compartida";
  disconnectButton.hidden = !familyId;
  badge.hidden = !familyId;
  badge.className = `family-badge ${familyStatus}`;
  badge.textContent = familyStatus === "synced" ? "Compartida" : familyStatus === "offline" ? "Sin conexión" : "Conectando";
}

function setFamilyStatus(status) {
  familyStatus = status;
  renderFamilySharing();
}

async function initializeSpecialListSync(list) {
  const shareId = normalizeFamilyId(list?.shareId);
  if (!list?.id || !shareId) return;
  const currentEntry = sharedSyncEntry(list.id);
  if (currentEntry?.shareId === shareId) return;
  currentEntry?.sync.stop();

  const sync = createSharedListSync({
    databaseUrl: DATABASE_URL,
    listId: shareId,
    deviceId,
    onRemoteState: (remoteState, { initial = false } = {}) => {
      const currentList = specialListById(list.id);
      if (!currentList || normalizeFamilyId(currentList.shareId) !== shareId) return;
      const remote = normalizeSharedList(remoteState, currentList.name);
      currentList.name = remote.name;
      currentList.items = remote.items;
      saveState();
      render();
      if (!initial) showToast(`${currentList.name} se ha actualizado`);
    },
  });
  sharedListSyncs.set(list.id, { shareId, sync });
  await sync.start(sharedListPayload(list));
}

function initializeAllSharedListSyncs() {
  const activeIds = new Set(
    state.specialLists
      .filter((list) => normalizeFamilyId(list.shareId))
      .map((list) => list.id),
  );
  sharedListSyncs.forEach((entry, listId) => {
    if (listId !== "standalone" && !activeIds.has(listId)) {
      entry.sync.stop();
      sharedListSyncs.delete(listId);
    }
  });
  state.specialLists.forEach((list) => {
    if (normalizeFamilyId(list.shareId)) initializeSpecialListSync(list).catch(() => {});
  });
}

async function initializeStandaloneListSharing() {
  document.body.classList.add("standalone-special-list");
  standaloneList = { id: "standalone", name: "Lista compartida", items: [] };
  const sync = createSharedListSync({
    databaseUrl: DATABASE_URL,
    listId: standaloneListId,
    deviceId,
    onRemoteState: (remoteState, { initial = false } = {}) => {
      standaloneList = {
        id: "standalone",
        ...normalizeSharedList(remoteState, standaloneList?.name),
      };
      render();
      if (!initial) showToast(`${standaloneList.name} se ha actualizado`);
    },
  });
  sharedListSyncs.set("standalone", { shareId: standaloneListId, sync });
  await sync.start(sharedListPayload(standaloneList));
}

function hasFamilyData(candidate) {
  return ["items", "purchases", "expirations", "specialLists"]
    .some((key) => Array.isArray(candidate?.[key]) && candidate[key].length > 0)
    || Object.keys(candidate?.catalog || {}).length > 0
    || Object.keys(candidate?.dismissedSuggestions || {}).length > 0;
}

function applyRemoteFamilyState(remoteState, { initial = false } = {}) {
  const localSettings = state.settings;
  const localSharedState = sharedStateFrom(state);
  const shouldRecoverLocalData = initial && hasFamilyData(localSharedState);
  const nextSharedState = shouldRecoverLocalData
    ? mergeFamilyStates(localSharedState, remoteState)
    : remoteState;
  const recoveredLocalData = shouldRecoverLocalData && JSON.stringify(nextSharedState) !== JSON.stringify(remoteState);
  state = hydrateState(mergeSharedState(nextSharedState, localSettings));
  if (activeListId !== "main" && activeListId !== "standalone" && !specialListById(activeListId)) {
    activeListId = "main";
  }
  saveState({ sync: false });
  if (recoveredLocalData) familySync?.schedule(sharedStateFrom(state), 0);
  initializeAllSharedListSyncs();
  render();
  if (recoveredLocalData) showToast("He unido la lista antigua con la familiar");
  else if (!initial) showToast("Lista actualizada desde el otro móvil");
}

async function initializeFamilySharing() {
  familySync?.stop();
  familySync = null;
  if (!familyId) {
    setFamilyStatus("local");
    initializeAllSharedListSyncs();
    return;
  }
  familySync = createFamilySync({
    databaseUrl: DATABASE_URL,
    familyId,
    deviceId,
    onRemoteState: applyRemoteFamilyState,
    onStatus: setFamilyStatus,
  });
  await familySync.start(sharedStateFrom(state));
  initializeAllSharedListSyncs();
}

async function shareFamilyLink() {
  if (!familyId) {
    familyId = createFamilyId();
    storeFamilyAccess(familyId);
    initializeFamilySharing().catch(() => setFamilyStatus("offline"));
    familySync?.writeNow(sharedStateFrom(state)).catch(() => {});
  }
  storeFamilyAccess(familyId);
  const url = makeFamilyShareUrl(window.location.href, familyId);
  const shareData = {
    title: "Nuestra lista de la compra",
    text: "Abre este enlace una vez para compartir y actualizar nuestra lista de la compra.",
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      showToast("Enlace familiar copiado");
    } else {
      window.prompt("Copia y comparte este enlace", url);
    }
  } catch (error) {
    if (error?.name !== "AbortError") showToast("No he podido compartir el enlace");
  }
}

function disconnectFamily() {
  if (!confirm("¿Dejar de compartir esta lista en este móvil? Conservarás una copia de lo que hay ahora.")) return;
  familySync?.stop();
  familySync = null;
  familyId = "";
  clearFamilyAccess();
  setFamilyStatus("local");
  showToast("Este móvil ya no comparte la lista");
}

function selectList(listId) {
  if (!listRecordById(listId)) return;
  activeListId = listId;
  shoppingMode = false;
  render();
}

function openSpecialListDialog(listId = "") {
  editingSpecialListId = listId;
  const list = specialListById(listId);
  $("#specialListDialogTitle").textContent = list ? `Renombrar ${list.name}` : "Nueva lista especial";
  $("#specialListSave").textContent = list ? "Guardar nombre" : "Crear lista";
  $("#specialListName").value = list?.name || "";
  $("#specialListDialog").showModal();
  setTimeout(() => $("#specialListName").focus(), 50);
}

function saveSpecialList(event) {
  event.preventDefault();
  const input = $("#specialListName");
  const name = cleanListName(input.value, "");
  if (!name) {
    input.reportValidity();
    return;
  }

  if (editingSpecialListId) {
    const list = specialListById(editingSpecialListId);
    if (!list) return;
    list.name = name;
    persistList(list.id);
    showToast(`La lista ahora se llama ${name}`);
  } else {
    const list = {
      id: globalThis.crypto?.randomUUID?.() || `lista-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      shareId: "",
      createdAt: new Date().toISOString(),
      items: [],
    };
    state.specialLists.push(list);
    activeListId = list.id;
    saveState();
    showToast(`${name} está preparada`);
  }

  editingSpecialListId = "";
  $("#specialListDialog").close();
  render();
}

function deleteSpecialList() {
  const list = specialListById(activeListId);
  if (!list || !confirm(`¿Eliminar la lista “${list.name}”? La compra habitual no cambiará.`)) return;
  const shareId = normalizeFamilyId(list.shareId);
  sharedSyncEntry(list.id)?.sync.stop();
  sharedListSyncs.delete(list.id);
  state.specialLists = state.specialLists.filter((candidate) => candidate.id !== list.id);
  activeListId = "main";
  saveState();
  render();
  showToast(`${list.name} eliminada`);
  if (shareId) {
    fetch(`${DATABASE_URL}/sharedLists/${shareId}.json`, { method: "DELETE" }).catch(() => {});
  }
}

async function shareSpecialList() {
  const list = specialListById(activeListId);
  if (!list) return;
  if (!normalizeFamilyId(list.shareId)) {
    list.shareId = createFamilyId();
    saveState();
    initializeSpecialListSync(list).catch(() => {});
    sharedSyncEntry(list.id)?.sync.writeNow(sharedListPayload(list)).catch(() => {});
  }

  const url = makeSharedListUrl(window.location.href, list.shareId);
  const shareData = {
    title: `Lista ${list.name}`,
    text: `Puedes ver y actualizar únicamente la lista “${list.name}” desde este enlace.`,
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      showToast(`Enlace de ${list.name} copiado`);
    } else {
      window.prompt(`Copia y comparte la lista ${list.name}`, url);
    }
  } catch (error) {
    if (error?.name !== "AbortError") showToast("No he podido compartir esta lista");
  }
}

function renderListControls() {
  const switcher = $("#listSwitcher");
  switcher.innerHTML = [
    `<button class="${activeListId === "main" ? "active" : ""}" type="button" data-list-select="main">Compra habitual</button>`,
    ...state.specialLists.map((list) => (
      `<button class="${activeListId === list.id ? "active" : ""}" type="button" data-list-select="${escapeHtml(list.id)}">${escapeHtml(list.name)}</button>`
    )),
  ].join("");

  const list = specialListById(activeListId);
  const actions = $("#specialListActions");
  actions.hidden = !list;
  if (list) $("#specialListShare").textContent = `Compartir ${list.name}`;
}

function render() {
  renderList();
  renderExpirations();
  renderIdeas();
  renderHistory();
  renderShoppingDock();
  renderFamilySharing();
  $("#speakToggle").checked = state.settings.speak;
  const list = activeListRecord();
  const pending = listItems().filter((item) => !item.checked).length;
  $("#headerSummary").textContent = activeListId === "main"
    ? (pending ? `${pending} ${pending === 1 ? "producto pendiente" : "productos pendientes"}` : "Tu lista familiar")
    : `${list?.name || "Lista compartida"} · ${pending} ${pending === 1 ? "pendiente" : "pendientes"}`;
}

function renderList() {
  const content = $("#listContent");
  const list = activeListRecord() || { name: "Lista compartida", items: [] };
  const items = list.items || [];
  renderListControls();
  $("#listTitle").textContent = list.name;
  $("#itemCount").textContent = items.length;
  $("#shoppingStart").hidden = activeListId !== "main";
  $("#shoppingStart").disabled = !items.length;
  if (!document.body.classList.contains("listening")) {
    $("#voiceTitle").textContent = activeListId === "main" ? "¿Qué hace falta?" : `¿Qué añadimos a ${list.name}?`;
    $("#voiceHint").textContent = activeListId === "main"
      ? "Toca el micrófono y di “leche, pan y dos kilos de patatas”."
      : `Lo que añadas quedará solo en la lista ${list.name}.`;
  }

  if (!items.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration">
          <span></span><span></span><span></span>
          ${icon("basket")}
        </div>
        <h3>${activeListId === "main" ? "La cesta está esperando" : `${escapeHtml(list.name)} está vacía`}</h3>
        <p>${activeListId === "main" ? "Todo lo que añadas se ordenará automáticamente por familias." : "Añade aquí lo necesario para esta ocasión. No se mezclará con la compra habitual."}</p>
      </div>`;
    return;
  }

  content.innerHTML = `<div class="category-list">${groupItems(items).map(({ category, items: categoryItems }) => {
    const meta = CATEGORY_META[category];
    return `
      <section class="category-group" style="--category-color:${meta.color}">
        <div class="category-heading">
          <span class="category-icon">${icon(meta.icon)}</span>
          <h3>${escapeHtml(category)}</h3>
          <span>${categoryItems.filter((item) => !item.checked).length}</span>
        </div>
        <div class="item-list">
          ${categoryItems.map(renderItem).join("")}
        </div>
      </section>`;
  }).join("")}</div>`;
}

function renderItem(item) {
  const amount = formatAmount(item);
  return `
    <article class="shopping-item ${item.checked ? "checked" : ""}" data-item-id="${item.id}">
      <button class="item-check" type="button" data-action="toggle" aria-label="${item.checked ? "Desmarcar" : "Marcar"} ${escapeHtml(item.name)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg>
      </button>
      <div class="item-copy"><strong>${escapeHtml(item.name)}</strong>${amount ? `<small>${escapeHtml(amount)}</small>` : ""}</div>
      <div class="quantity-control">
        <button type="button" data-action="decrease" aria-label="Quitar uno">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increase" aria-label="Añadir uno">+</button>
      </div>
      <button class="item-remove" type="button" data-action="remove" aria-label="Eliminar ${escapeHtml(item.name)}">×</button>
    </article>`;
}

function renderIdeas() {
  const { remembered, seasonal } = getSuggestions(state);
  const content = $("#ideasContent");
  const total = remembered.length + seasonal.length;
  $("#ideaDot").classList.toggle("visible", total > 0);

  const blocks = [];
  if (remembered.length) {
    blocks.push(suggestionBlock("Puede que falte", "Según vuestro historial", remembered, "history"));
  }
  if (seasonal.length) {
    blocks.push(suggestionBlock("De temporada", "Fruta y verdura que suele estar en su mejor momento", seasonal, "season"));
  }
  if (!blocks.length) {
    blocks.push(`
      <div class="ideas-empty">
        ${icon("sparkle")}
        <h3>Aún estoy aprendiendo</h3>
        <p>Cuando completes algunas compras, aquí aparecerán recordatorios personalizados y productos de temporada.</p>
      </div>`);
  }
  content.innerHTML = blocks.join("");
}

function renderExpirations() {
  const expirations = getActiveExpirations(state);
  const content = $("#expirationContent");
  const count = $("#expirationCount");
  const dot = $("#expirationDot");
  if (!content || !count || !dot) return;
  count.textContent = expirations.length;
  dot.classList.toggle("visible", expirations.some((entry) => entry.daysLeft <= 3));
  $("#manualExpirationDate").min = localDateValue();
  content.innerHTML = expirations.length
    ? expirationBlock(expirations, false)
    : `
      <div class="ideas-empty expiration-empty">
        ${icon("snow")}
        <h3>No hay caducidades pendientes</h3>
        <p>Añadid aquí cualquier alimento delicado, aunque no estuviera en la lista de la compra.</p>
      </div>`;
}

function expirationLabel(daysLeft) {
  if (daysLeft < 0) return `Caducó hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "día" : "días"}`;
  if (daysLeft === 0) return "Caduca hoy";
  if (daysLeft === 1) return "Caduca mañana";
  return `Caduca en ${daysLeft} días`;
}

function expirationBlock(expirations, showHeading = true) {
  return `
    <section class="expiration-section">
      ${showHeading ? '<div class="suggestion-heading"><div><h2>Caducidades</h2><p>Lo más delicado, ordenado por urgencia</p></div></div>' : ""}
      <div class="expiration-list">
        ${expirations.map((entry) => {
          const urgency = entry.daysLeft <= 1 ? "urgent" : entry.daysLeft <= 3 ? "soon" : "";
          const date = new Date(`${entry.expiresOn}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
          const freezeHint = entry.daysLeft <= 1 && isFreezable(entry)
            ? "Si no lo vais a consumir, conviene congelarlo hoy."
            : `Fecha indicada: ${date}.`;
          return `
            <article class="expiration-card ${urgency}">
              <span class="expiration-clock">${icon("snow")}</span>
              <div><strong>${escapeHtml(entry.name)}</strong><b>${escapeHtml(expirationLabel(entry.daysLeft))}</b><small>${escapeHtml(freezeHint)}</small></div>
              <button type="button" data-expiration-consumed="${escapeHtml(entry.id)}">Ya consumido</button>
            </article>`;
        }).join("")}
      </div>
    </section>`;
}

function suggestionBlock(title, subtitle, suggestions, kind) {
  return `
    <section class="suggestion-section">
      <div class="suggestion-heading"><div><h2>${title}</h2><p>${subtitle}</p></div></div>
      <div class="suggestion-grid">
        ${suggestions.map((suggestion) => `
          <article class="suggestion-card ${kind}">
            <button class="suggestion-dismiss" type="button" data-dismiss="${escapeHtml(suggestion.key)}" aria-label="No sugerir este mes">×</button>
            <span class="suggestion-art">${icon(suggestion.category === "Fruta y verdura" ? "leaf" : (CATEGORY_META[suggestion.category]?.icon || "basket"))}</span>
            <div><strong>${escapeHtml(suggestion.name)}</strong><small>${escapeHtml(suggestion.reason)}</small></div>
            <button class="suggestion-add" type="button" data-suggest-key="${escapeHtml(suggestion.key)}" data-suggest-name="${escapeHtml(suggestion.name)}">Añadir <span>+</span></button>
          </article>`).join("")}
      </div>
    </section>`;
}

function renderHistory() {
  const unique = Object.keys(state.catalog).length;
  const purchases = state.purchases.length;
  const mostRequested = Object.values(state.catalog)
    .sort((a, b) => (b.requestDates?.length || 0) - (a.requestDates?.length || 0))[0];
  $("#historyStats").innerHTML = `
    <article><strong>${unique}</strong><span>${unique === 1 ? "producto recordado" : "productos recordados"}</span></article>
    <article><strong>${purchases}</strong><span>${purchases === 1 ? "producto comprado" : "productos comprados"}</span></article>
    <article class="wide"><strong>${mostRequested ? escapeHtml(mostRequested.name) : "—"}</strong><span>lo más pedido</span></article>`;

  const content = $("#historyContent");
  if (!state.purchases.length) {
    content.innerHTML = `<div class="history-empty"><h3>Todavía no hay compras guardadas</h3><p>En la tienda, marca lo que metas en la cesta y pulsa “Terminar compra”.</p></div>`;
    return;
  }

  const byDate = new Map();
  state.purchases.forEach((purchase) => {
    const date = new Date(purchase.purchasedAt);
    const key = date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(purchase);
  });
  content.innerHTML = `<div class="history-list">${[...byDate.entries()].slice(0, 12).map(([date, entries]) => `
      <section><h3>${date}</h3>${entries.map((entry) => `<div><span>${escapeHtml(entry.name)}</span><small>${escapeHtml(formatAmount(entry))}</small></div>`).join("")}</section>`).join("")}</div>`;
}

function renderShoppingDock() {
  document.body.classList.toggle("shopping-mode", shoppingMode);
  const dock = $("#shoppingDock");
  const checked = state.items.filter((item) => item.checked).length;
  dock.setAttribute("aria-hidden", String(!shoppingMode));
  $("#shoppingProgress").textContent = `${checked} de ${state.items.length}`;
}

function addEntries(entries, options = {}) {
  if (!entries.length) {
    showToast("No he encontrado ningún producto");
    return;
  }

  const targetListId = options.listId || activeListId;
  const targetItems = listItems(targetListId);
  const addedNames = [];
  entries.forEach((entry) => {
    const duplicate = targetItems.find((item) => item.key === entry.key);
    if (duplicate) {
      duplicateQueue.push({ listId: targetListId, existingId: duplicate.id, entry });
    } else {
      targetItems.push(makeItem(entry));
      if (targetListId === "main") registerRequest(state, entry);
      addedNames.push(entry.name);
    }
  });
  persistList(targetListId);
  render();

  if (addedNames.length) {
    const message = addedNames.length === 1 ? `He añadido ${addedNames[0]}` : `He añadido ${addedNames.length} productos`;
    showToast(message);
    if (options.fromVoice) speak(message);
  }
  if (duplicateQueue.length && !currentDuplicate) showNextDuplicate();
}

function showNextDuplicate() {
  currentDuplicate = duplicateQueue.shift();
  if (!currentDuplicate) return;
  const existing = listItems(currentDuplicate.listId).find((item) => item.id === currentDuplicate.existingId);
  if (!existing) {
    currentDuplicate = null;
    showNextDuplicate();
    return;
  }
  $("#duplicateTitle").textContent = `¿Compramos más ${existing.name.toLocaleLowerCase("es")}?`;
  $("#duplicateText").textContent = `Ya estaba en la lista${existing.quantity > 1 ? ` con cantidad ${existing.quantity}` : ""}. Puedo aumentar la cantidad o dejarlo como está.`;
  $("#duplicateDialog").showModal();
  speak(`Ya tenías ${existing.name} en la lista. ¿Compramos más?`);
}

function resolveDuplicate(addMore) {
  const listId = currentDuplicate?.listId || "main";
  const existing = listItems(listId).find((item) => item.id === currentDuplicate?.existingId);
  if (existing && addMore) {
    existing.quantity += currentDuplicate.entry.quantity || 1;
    if (listId === "main") registerRequest(state, currentDuplicate.entry);
    showToast(`Cantidad de ${existing.name}: ${existing.quantity}`);
  }
  $("#duplicateDialog").close();
  currentDuplicate = null;
  saveState();
  render();
  if (duplicateQueue.length) showNextDuplicate();
}

function enterShoppingMode() {
  if (!state.items.length) {
    showToast("La lista está vacía");
    speak("La lista está vacía");
    return;
  }
  shoppingMode = true;
  navigate("list");
  renderShoppingDock();
  const summary = shoppingSummary(state.items);
  showToast(`Lista agrupada: ${summary}`);
  speak(`He agrupado la lista. Tienes ${summary}.`);
}

function requestFinishShopping() {
  const checked = state.items.filter((item) => item.checked);
  if (!checked.length) {
    showToast("Marca primero lo que has metido en la cesta");
    speak("Aún no has marcado ningún producto");
    return;
  }
  const pending = state.items.length - checked.length;
  const checkedLabel = `${checked.length} ${checked.length === 1 ? "producto" : "productos"}`;
  $("#finishText").textContent = pending
    ? `Guardaré ${checkedLabel} en el historial y dejaré ${pending} pendientes en la lista.`
    : `Guardaré ${checked.length === 1 ? "el" : "los"} ${checkedLabel} en el historial y dejaré la lista preparada para la próxima vez.`;
  $("#finishDialog").showModal();
}

function finishShopping() {
  const now = Date.now();
  const checked = state.items.filter((item) => item.checked);
  const delicate = checked.filter(isPerishable);
  checked.forEach((item, index) => registerPurchase(state, item, now + index));
  state.items = state.items.filter((item) => !item.checked);
  shoppingMode = false;
  $("#finishDialog").close();
  saveState();
  render();
  if (delicate.length) {
    expirationPromptQueue = [...delicate];
    expirationPromptTotal = delicate.length;
    expirationPromptPosition = 0;
    showToast("Compra guardada. Revisemos las caducidades");
    speak("Compra guardada. Ahora te preguntaré las caducidades de los productos más delicados.");
    showNextExpirationPrompt();
  } else {
    showToast("Compra guardada. Ya puedo aprender de ella");
    speak("Compra guardada. Ya puedo aprender de ella.");
  }
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveExtraPurchase(entry, expiresOn, askPermission = false) {
  const now = Date.now();
  registerPurchase(state, entry, now);
  addExpiration(state, entry, expiresOn, now);
  persistList(listId);
  render();
  navigate("expiration");
  const message = `Caducidad guardada para ${entry.name}`;
  showToast(message);
  speak(`${message}. Te avisaré cuando falten tres días y un día.`);
  if (askPermission) requestNotificationPermission();
  setTimeout(checkExpirationAlerts, 150);
}

function saveManualExpiration(event) {
  event.preventDefault();
  const productInput = $("#manualExpirationProduct");
  const dateInput = $("#manualExpirationDate");
  if (!productInput.value.trim()) {
    productInput.reportValidity();
    return;
  }
  if (!dateInput.value) {
    dateInput.reportValidity();
    return;
  }
  const entry = parseEntry(productInput.value);
  addExpiration(state, entry, dateInput.value);
  saveState();
  render();
  productInput.value = "";
  dateInput.value = "";
  showToast(`Caducidad añadida para ${entry.name}`);
  requestNotificationPermission();
  setTimeout(checkExpirationAlerts, 150);
}

function openExtraExpirationDialog(command = {}) {
  $("#extraProductInput").value = command.entry?.name || "";
  $("#extraExpirationInput").value = command.expiresOn || "";
  $("#extraExpirationInput").min = localDateValue();
  $("#extraExpirationDialog").showModal();
  const missing = command.entry ? "¿Cuándo caduca?" : "¿Qué producto extra has comprado y cuándo caduca?";
  speak(missing);
  setTimeout(() => (command.entry ? $("#extraExpirationInput") : $("#extraProductInput")).focus(), 50);
}

function handleExtraExpirationCommand(command) {
  if (command.entry && command.expiresOn) {
    saveExtraPurchase(command.entry, command.expiresOn);
    return;
  }
  openExtraExpirationDialog(command);
}

function saveExtraExpirationFromDialog() {
  const productInput = $("#extraProductInput");
  const expirationInput = $("#extraExpirationInput");
  if (!productInput.value.trim()) {
    productInput.reportValidity();
    return;
  }
  if (!expirationInput.value) {
    expirationInput.reportValidity();
    return;
  }
  const entry = parseEntry(productInput.value);
  $("#extraExpirationDialog").close();
  saveExtraPurchase(entry, expirationInput.value, true);
}

function showNextExpirationPrompt() {
  currentExpirationPrompt = expirationPromptQueue.shift() || null;
  if (!currentExpirationPrompt) {
    expirationPromptTotal = 0;
    expirationPromptPosition = 0;
    checkExpirationAlerts();
    return;
  }
  expirationPromptPosition += 1;
  $("#expirationDateProduct").textContent = currentExpirationPrompt.name;
  $("#expirationDateProgress").textContent = `Producto ${expirationPromptPosition} de ${expirationPromptTotal}`;
  const amount = formatAmount(currentExpirationPrompt);
  $("#expirationDateAmount").textContent = amount;
  $("#expirationDateAmount").hidden = !amount;
  $("#expirationDateInput").value = "";
  $("#expirationDateInput").min = localDateValue();
  updateExpirationQuickDates();
  $("#expirationDateDialog").showModal();
}

function expirationDateFromOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + Number(offset));
  return localDateValue(date);
}

function updateExpirationQuickDates() {
  const selected = $("#expirationDateInput").value;
  $$('[data-expiration-offset]').forEach((button) => {
    const active = expirationDateFromOffset(button.dataset.expirationOffset) === selected;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function selectExpirationQuickDate(event) {
  $("#expirationDateInput").value = expirationDateFromOffset(event.currentTarget.dataset.expirationOffset);
  updateExpirationQuickDates();
}

async function requestNotificationPermission() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") showToast("Te avisaré al abrir La compra");
  } catch {
    showToast("Te avisaré al abrir La compra");
  }
}

function saveExpirationDate() {
  const input = $("#expirationDateInput");
  if (!input.value) {
    input.reportValidity();
    return;
  }
  addExpiration(state, currentExpirationPrompt, input.value);
  saveState();
  renderExpirations();
  $("#expirationDateDialog").close();
  requestNotificationPermission();
  showNextExpirationPrompt();
}

function skipExpirationDate() {
  $("#expirationDateDialog").close();
  showNextExpirationPrompt();
}

function markExpirationConsumed(expirationId) {
  const entry = state.expirations.find((candidate) => candidate.id === expirationId);
  if (!entry) return;
  entry.consumedAt = new Date().toISOString();
  saveState();
  render();
  showToast(`${entry.name}: marcado como consumido`);
}

function alertTimingText(entry) {
  const plural = entry.name.toLocaleLowerCase("es").endsWith("s");
  if (entry.daysLeft < 0) return plural ? "ya han caducado" : "ya ha caducado";
  if (entry.daysLeft === 0) return plural ? "caducan hoy" : "caduca hoy";
  if (entry.daysLeft === 1) return plural ? "caducan mañana" : "caduca mañana";
  return `${plural ? "caducan" : "caduca"} en ${entry.daysLeft} días`;
}

function eatenPronoun(entry) {
  const name = entry.name.toLocaleLowerCase("es");
  if (name.endsWith("as")) return "las";
  if (name.endsWith("os") || name.endsWith("es")) return "los";
  if (["leche", "carne", "fruta", "verdura", "mantequilla", "nata", "mozzarella"].includes(entry.key)) return "la";
  if (name.endsWith("a")) return "la";
  return "lo";
}

async function showExpirationNotification(entry) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const freeze = entry.threshold === 1 && isFreezable(entry) ? " Si no, conviene congelarlo hoy." : "";
  const body = `${entry.name} ${alertTimingText(entry)}. ¿Ya te ${eatenPronoun(entry)} has comido?${freeze}`;
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Caducidad próxima", {
        body,
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        tag: `caducidad-${entry.id}-${entry.threshold}`,
        data: { url: "./" },
      });
    } else {
      new Notification("Caducidad próxima", { body, icon: "./icon-192.png" });
    }
  } catch {
    // El aviso dentro de la aplicación sigue disponible.
  }
}

function showNextExpirationAlert() {
  currentExpirationAlert = expirationAlertQueue.shift() || null;
  if (!currentExpirationAlert) return;
  const timing = alertTimingText(currentExpirationAlert);
  const freeze = currentExpirationAlert.threshold === 1 && isFreezable(currentExpirationAlert);
  const question = `¿Ya te ${eatenPronoun(currentExpirationAlert)} has comido?`;
  $("#expirationAlertTitle").textContent = `${currentExpirationAlert.name} ${timing}. ${question}`;
  $("#expirationAlertText").textContent = freeze
    ? "Si todavía lo tenéis, os recomiendo congelarlo hoy para no desperdiciarlo."
    : "Así dejaré de avisaros si ya está consumido.";
  $("#expirationAlertDialog").showModal();
  speak(`${currentExpirationAlert.name} ${timing}. ${question}${freeze ? " Si no, te recomiendo congelarlo hoy." : ""}`);
  showExpirationNotification(currentExpirationAlert);
}

function resolveExpirationAlert(consumed) {
  if (!currentExpirationAlert) return;
  const entry = state.expirations.find((candidate) => candidate.id === currentExpirationAlert.id);
  if (entry && consumed) entry.consumedAt = new Date().toISOString();
  if (entry && !consumed) markExpirationAlerted(state, entry.id, currentExpirationAlert.threshold);
  const shouldFreeze = !consumed && currentExpirationAlert.threshold === 1 && isFreezable(currentExpirationAlert);
  $("#expirationAlertDialog").close();
  saveState();
  render();
  if (shouldFreeze) {
    showToast(`Conviene congelar ${currentExpirationAlert.name.toLocaleLowerCase("es")} hoy`);
    speak(`Te recomiendo congelar ${currentExpirationAlert.name.toLocaleLowerCase("es")} hoy.`);
  }
  currentExpirationAlert = null;
  showNextExpirationAlert();
}

function checkExpirationAlerts() {
  if ($$("dialog[open]").length || currentExpirationAlert) return;
  expirationAlertQueue = getPendingExpirationAlerts(state);
  showNextExpirationAlert();
}

function readList(listId = activeListId) {
  const items = listItems(listId);
  const list = listRecordById(listId);
  if (!items.length) {
    speak("La lista está vacía");
    showToast("La lista está vacía");
    return;
  }
  const names = items.filter((item) => !item.checked).map((item) => {
    if (item.unit) return `${item.quantity} ${item.unit} de ${item.name}`;
    return `${item.quantity > 1 ? `${item.quantity} de ` : ""}${item.name}`;
  });
  if (!names.length) {
    speak("Ya has marcado todos los productos de la lista");
    showToast("Todos los productos están marcados");
    return;
  }
  speak(`En ${list?.name || "la lista"} hay: ${names.join(", ")}.`);
  showToast(shoppingSummary(items));
}

function handleVoiceText(text, options = {}) {
  const targetListId = options.listId || activeListId;
  const command = detectVoiceCommand(text);
  if (command.type === "shopping") {
    activeListId = "main";
    return enterShoppingMode();
  }
  if (command.type === "finish") return requestFinishShopping();
  if (command.type === "read") return readList(targetListId);
  if (command.type === "show-list") {
    activeListId = targetListId;
    navigate("list");
    render();
    showToast(shoppingSummary(listItems(targetListId)));
    return;
  }
  if (command.type === "extra-expiration") return handleExtraExpirationCommand(command);
  addEntries(command.entries, { fromVoice: true, listId: targetListId });
}

function handleLaunchCommand() {
  const url = new URL(window.location.href);
  const command = url.searchParams.get("command");
  const directAdd = url.searchParams.get("add");
  if (!command && !directAdd) return;
  url.searchParams.delete("command");
  url.searchParams.delete("add");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  const spoken = command || `agrega ${directAdd}`;
  $("#liveTranscript").textContent = spoken;
  setTimeout(() => {
    handleVoiceText(spoken, { listId: "main" });
    setTimeout(() => { $("#liveTranscript").textContent = ""; }, 3000);
  }, 300);
}

function startVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showToast("Este navegador no permite dictado directo. Usa Safari actualizado o escribe debajo.");
    $("#itemInput").focus();
    return;
  }
  if (recognition) {
    recognition.stop();
    return;
  }

  recognition = new Recognition();
  recognition.lang = "es-ES";
  recognition.interimResults = true;
  recognition.continuous = false;
  let finalText = "";
  document.body.classList.add("listening");
  $("#voiceTitle").textContent = "Te escucho…";
  $("#voiceHint").textContent = "Puedes decir varios productos seguidos.";
  $("#liveTranscript").textContent = "";
  navigator.vibrate?.(35);

  recognition.onresult = (event) => {
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript;
      if (event.results[index].isFinal) finalText += transcript;
      else interim += transcript;
    }
    $("#liveTranscript").textContent = finalText || interim;
  };
  recognition.onerror = (event) => {
    if (event.error !== "no-speech" && event.error !== "aborted") {
      showToast(event.error === "not-allowed" ? "Necesito permiso para usar el micrófono" : "No he podido entenderte. Prueba otra vez.");
    }
  };
  recognition.onend = () => {
    recognition = null;
    document.body.classList.remove("listening");
    $("#voiceTitle").textContent = "¿Qué hace falta?";
    $("#voiceHint").textContent = "Toca el micrófono y di “leche, pan y dos kilos de patatas”.";
    if (finalText.trim()) handleVoiceText(finalText.trim());
    setTimeout(() => { $("#liveTranscript").textContent = ""; }, 3500);
  };
  recognition.start();
}

function navigate(view) {
  activeView = view;
  $$(".view").forEach((element) => element.classList.toggle("active", element.dataset.view === view));
  $$("[data-nav]").forEach((button) => button.classList.toggle("active", button.dataset.nav === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function dismissSuggestion(key) {
  const { dismissalKey } = getSuggestions(state);
  const dismissed = new Set(state.dismissedSuggestions[dismissalKey] || []);
  dismissed.add(key);
  state.dismissedSuggestions[dismissalKey] = [...dismissed];
  saveState();
  renderIdeas();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `copia-la-compra-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Copia preparada");
}

async function importData(file) {
  try {
    state = hydrateState(JSON.parse(await file.text()));
    saveState();
    render();
    $("#settingsDialog").close();
    showToast("Copia restaurada");
  } catch {
    showToast("La copia no es válida");
  }
}

$("#addForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#itemInput");
  addEntries(parseSpokenList(input.value));
  input.value = "";
  input.focus();
});
$("#manualExpirationForm").addEventListener("submit", saveManualExpiration);
$("#specialListForm").addEventListener("submit", saveSpecialList);

$("#micButton").addEventListener("click", startVoice);
$("#specialListCreate").addEventListener("click", () => openSpecialListDialog());
$("#specialListRename").addEventListener("click", () => openSpecialListDialog(activeListId));
$("#specialListShare").addEventListener("click", shareSpecialList);
$("#specialListDelete").addEventListener("click", deleteSpecialList);
$("#specialListCancel").addEventListener("click", () => $("#specialListDialog").close());
$("#shoppingStart").addEventListener("click", enterShoppingMode);
$("#finishShopping").addEventListener("click", requestFinishShopping);
$("#finishConfirm").addEventListener("click", finishShopping);
$("#finishCancel").addEventListener("click", () => $("#finishDialog").close());
$("#duplicateYes").addEventListener("click", () => resolveDuplicate(true));
$("#duplicateNo").addEventListener("click", () => resolveDuplicate(false));
$("#expirationDateSave").addEventListener("click", saveExpirationDate);
$("#expirationDateSkip").addEventListener("click", skipExpirationDate);
$("#expirationDateInput").addEventListener("change", updateExpirationQuickDates);
$$('[data-expiration-offset]').forEach((button) => button.addEventListener("click", selectExpirationQuickDate));
$("#expirationConsumedYes").addEventListener("click", () => resolveExpirationAlert(true));
$("#expirationConsumedNo").addEventListener("click", () => resolveExpirationAlert(false));
$("#extraExpirationSave").addEventListener("click", saveExtraExpirationFromDialog);
$("#extraExpirationCancel").addEventListener("click", () => $("#extraExpirationDialog").close());

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) navigate(nav.dataset.nav);

  const listSelector = event.target.closest("[data-list-select]");
  if (listSelector) selectList(listSelector.dataset.listSelect);

  const itemElement = event.target.closest("[data-item-id]");
  const itemAction = event.target.closest("[data-action]");
  if (itemElement && itemAction) {
    const items = listItems();
    const item = items.find((entry) => entry.id === itemElement.dataset.itemId);
    if (!item) return;
    const action = itemAction.dataset.action;
    if (action === "toggle") item.checked = !item.checked;
    if (action === "increase") item.quantity += 1;
    if (action === "decrease") item.quantity = Math.max(1, item.quantity - 1);
    if (action === "remove") replaceListItems(activeListId, items.filter((entry) => entry.id !== item.id));
    persistList();
    render();
    navigator.vibrate?.(20);
  }

  const suggestion = event.target.closest("[data-suggest-key]");
  if (suggestion) {
    activeListId = "main";
    addEntries(parseSpokenList(suggestion.dataset.suggestName), { listId: "main" });
    navigate("list");
  }
  const dismiss = event.target.closest("[data-dismiss]");
  if (dismiss) dismissSuggestion(dismiss.dataset.dismiss);

  const consumed = event.target.closest("[data-expiration-consumed]");
  if (consumed) markExpirationConsumed(consumed.dataset.expirationConsumed);
});

$("#settingsButton").addEventListener("click", () => $("#settingsDialog").showModal());
$("#settingsClose").addEventListener("click", () => $("#settingsDialog").close());
$("#speakToggle").addEventListener("change", (event) => {
  state.settings.speak = event.target.checked;
  saveState();
});
$("#familyShareButton").addEventListener("click", shareFamilyLink);
$("#familyDisconnectButton").addEventListener("click", disconnectFamily);
$("#exportButton").addEventListener("click", exportData);
$("#importInput").addEventListener("change", (event) => event.target.files[0] && importData(event.target.files[0]));
$("#clearButton").addEventListener("click", () => {
  if (!confirm("¿Seguro que quieres borrar toda la lista y el historial?")) return;
  state = createInitialState();
  saveState();
  render();
  $("#settingsDialog").close();
  showToast("Datos borrados");
});

window.addEventListener("beforeinstallprompt", (event) => event.preventDefault());

async function initializeAppUpdates() {
  if (!("serviceWorker" in navigator)) return;
  serviceWorkerRegistration = await navigator.serviceWorker.register("./service-worker.js?v=16");
  serviceWorkerRegistration.update().catch(() => {});
}

function checkForAppUpdate() {
  if (shoppingMode || document.querySelector("dialog[open]")) return;
  serviceWorkerRegistration?.update().catch(() => {});
}

window.addEventListener("load", () => initializeAppUpdates().catch(() => {}));
function refreshSharedData() {
  familySync?.refresh();
  sharedListSyncs.forEach((entry) => entry.sync.refresh());
}

window.addEventListener("online", () => {
  refreshSharedData();
  checkForAppUpdate();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshSharedData();
    checkForAppUpdate();
    if (!standaloneListId) checkExpirationAlerts();
  }
});

async function bootstrap() {
  render();
  if (standaloneListId) await initializeStandaloneListSharing();
  else await initializeFamilySharing();
  handleLaunchCommand();
  if (!standaloneListId) setTimeout(checkExpirationAlerts, 500);
}

bootstrap();
