import {
  addExpiration,
  CATEGORY_META,
  createInitialState,
  detectVoiceCommand,
  formatAmount,
  getActiveExpirations,
  getPendingExpirationAlerts,
  getPreviouslyPurchased,
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
  updateExpiration,
} from "./core.mjs?v=22";
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
} from "./family-sync.mjs?v=22";
import {
  createSharedPasswordCodec,
  validateSharedPassword,
} from "./secure-sharing.mjs?v=22";
import {
  ACCOUNT_ACTIVE_LIST_PREFIX,
  acceptListInvite,
  accountInviteFromUrl,
  accountStateFrom,
  clearAccountInviteFromUrl,
  createAccountList,
  createListInvite,
  deleteAccountList,
  deleteAccountAndData,
  ensureFamilyAccountList,
  getAccountList,
  getListInvite,
  getListMembers,
  initializeAccountAuth,
  leaveAccountList,
  listAccountMemberships,
  makeAccountInviteUrl,
  mergeAccountState,
  removeListMember,
  saveAccountProfile,
  signInWithAccount,
  signOutAccount,
  subscribeAccountList,
  updateAccountListState,
} from "./account-sharing.mjs?v=22";

const STORAGE_KEY = "la-compra-state-v1";
const DATABASE_URL = "https://la-compra-familiar-default-rtdb.europe-west1.firebasedatabase.app";
const SHARE_BASE_URL = "https://carlosgarau.github.io/que-te-falta/";
const NATIVE = globalThis.LaCompraNative || {};
const SHARED_PASSWORD_STORAGE_PREFIX = "la-compra-shared-password-v1:";
const ACCOUNT_MIGRATION_KEY_PREFIX = "que-te-falta-account-migrated:";
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
let pendingAccountInviteId = accountInviteFromUrl(window.location.href);
let familyId = standaloneListId ? "" : rememberFamilyId();
let familySync = null;
let accountUser = null;
let accountPrimaryList = null;
let accountPrimarySync = null;
let accountMemberships = [];
let accountSpecialSyncs = new Map();
let accountStatus = "local";
let accountDialogIntent = "";
let accountWriteTimer = null;
let accountInitialization = null;
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
let editingExpirationId = "";
let expirationAlertQueue = [];
let currentExpirationAlert = null;
let recognition = null;
let toastTimer = null;
let nativeNotificationTimer = null;
let sharedPasswordPrompt = null;
const unlockingShareIds = new Set();

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
  if (sync && accountPrimaryList) scheduleAccountPrimarySync();
  if (sync && familySync) familySync.schedule(sharedStateFrom(state));
  scheduleNativeExpirationNotifications();
}

function scheduleAccountPrimarySync(delay = 350) {
  if (!accountPrimaryList || !accountUser) return;
  clearTimeout(accountWriteTimer);
  accountWriteTimer = setTimeout(() => {
    accountWriteTimer = null;
    updateAccountListState(accountPrimaryList.id, accountStateFrom(state))
      .then(() => setAccountStatus("synced"))
      .catch(() => setAccountStatus("offline"));
  }, delay);
}

function cleanListName(value, fallback = "Lista especial") {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 50) || fallback;
}

function normalizeSharedList(value, fallbackName = "Lista compartida") {
  return {
    name: cleanListName(value?.name, fallbackName),
    items: Array.isArray(value?.items) ? value.items : [],
    shareId: normalizeFamilyId(value?.shareId),
    accountListId: String(value?.accountListId || ""),
    accountRole: value?.accountRole === "owner" ? "owner" : value?.accountRole ? "editor" : "",
  };
}

function specialListById(listId) {
  return state.specialLists.find((list) => list.id === listId) || null;
}

function listRecordById(listId = activeListId) {
  if (listId === "standalone") return standaloneList;
  if (listId === "main") return { id: "main", name: "Lista habitual", items: state.items };
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
    if (list?.accountListId) {
      updateAccountListState(list.accountListId, sharedListPayload(list)).catch(() => {});
      return;
    }
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

function impact(style = "light") {
  if (NATIVE.isNative && NATIVE.impact) {
    NATIVE.impact(style).catch(() => {});
    return;
  }
  navigator.vibrate?.(style === "medium" ? 35 : 20);
}

async function shareOrCopy(shareData, copiedMessage, promptLabel) {
  if (NATIVE.isNative && NATIVE.share) {
    await NATIVE.share(shareData);
    return;
  }
  if (navigator.share) {
    await navigator.share(shareData);
  } else if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareData.url);
    showToast(copiedMessage);
  } else {
    window.prompt(promptLabel, shareData.url);
  }
}

function sharedPasswordStorageKey(shareId) {
  return `${SHARED_PASSWORD_STORAGE_PREFIX}${normalizeFamilyId(shareId)}`;
}

function storedSharedPassword(shareId) {
  const id = normalizeFamilyId(shareId);
  if (!id) return "";
  try {
    return localStorage.getItem(sharedPasswordStorageKey(id)) || "";
  } catch {
    return "";
  }
}

function rememberSharedPassword(shareId, password) {
  localStorage.setItem(sharedPasswordStorageKey(shareId), validateSharedPassword(password));
}

function forgetSharedPassword(shareId) {
  try {
    localStorage.removeItem(sharedPasswordStorageKey(shareId));
  } catch {}
}

function passwordCodecFor(shareId) {
  const password = storedSharedPassword(shareId);
  if (!password) return null;
  try {
    return createSharedPasswordCodec(password);
  } catch {
    forgetSharedPassword(shareId);
    return null;
  }
}

function askForSharedPassword({ mode = "unlock", name = "la lista", wrong = false } = {}) {
  if (sharedPasswordPrompt) return sharedPasswordPrompt.promise;
  const dialog = $("#sharedPasswordDialog");
  const creating = mode === "create";
  $("#sharedPasswordTitle").textContent = creating ? `Protege ${name}` : `Abre ${name}`;
  $("#sharedPasswordText").textContent = wrong
    ? "Esa contraseÃ±a no abre la lista. CompruÃ©bala y vuelve a intentarlo."
    : creating
      ? "El enlace se puede enviar por WhatsApp, pero la contraseÃ±a debes comunicarla aparte."
      : "Introduce la contraseÃ±a que te ha enviado la persona que comparte la lista.";
  $("#sharedPasswordConfirmField").hidden = !creating;
  $("#sharedPasswordSave").textContent = creating ? "Proteger y compartir" : "Abrir lista";
  $("#sharedPasswordInput").value = "";
  $("#sharedPasswordConfirm").value = "";

  let resolvePrompt;
  let rejectPrompt;
  const promise = new Promise((resolve, reject) => {
    resolvePrompt = resolve;
    rejectPrompt = reject;
  });
  sharedPasswordPrompt = { mode, promise, resolve: resolvePrompt, reject: rejectPrompt };
  dialog.showModal();
  setTimeout(() => $("#sharedPasswordInput").focus(), 50);
  return promise;
}

function submitSharedPassword(event) {
  event.preventDefault();
  if (!sharedPasswordPrompt) return;
  const input = $("#sharedPasswordInput");
  const confirmation = $("#sharedPasswordConfirm");
  let password;
  try {
    password = validateSharedPassword(input.value);
  } catch (error) {
    input.setCustomValidity(error.message);
    input.reportValidity();
    input.setCustomValidity("");
    return;
  }
  if (sharedPasswordPrompt.mode === "create" && password !== confirmation.value.normalize("NFC")) {
    confirmation.setCustomValidity("Las dos contraseÃ±as no coinciden");
    confirmation.reportValidity();
    confirmation.setCustomValidity("");
    return;
  }
  const prompt = sharedPasswordPrompt;
  sharedPasswordPrompt = null;
  $("#sharedPasswordDialog").close();
  prompt.resolve(password);
}

function cancelSharedPassword() {
  if (!sharedPasswordPrompt) return;
  const prompt = sharedPasswordPrompt;
  sharedPasswordPrompt = null;
  $("#sharedPasswordDialog").close();
  prompt.reject(new DOMException("AcciÃ³n cancelada", "AbortError"));
}

function requestSharedAccess(error, { shareId, name, restart }) {
  const id = normalizeFamilyId(shareId);
  if (!id || unlockingShareIds.has(id)) return;
  if (error?.code === "WRONG_SHARED_PASSWORD") forgetSharedPassword(id);
  unlockingShareIds.add(id);
  askForSharedPassword({ mode: "unlock", name, wrong: error?.code === "WRONG_SHARED_PASSWORD" })
    .then(async (password) => {
      rememberSharedPassword(id, password);
      unlockingShareIds.delete(id);
      await restart();
    })
    .catch(() => showToast(`${name} sigue protegida`))
    .finally(() => unlockingShareIds.delete(id));
}

function accountAvatarMarkup(user, className = "account-avatar") {
  if (user?.photoURL) return `<span class="${className}"><img src="${escapeHtml(user.photoURL)}" alt="" referrerpolicy="no-referrer"></span>`;
  const initial = (user?.displayName || user?.email || "?").trim().charAt(0).toUpperCase() || "?";
  return `<span class="${className}" aria-hidden="true">${escapeHtml(initial)}</span>`;
}

function setAccountStatus(status) {
  accountStatus = status;
  renderFamilySharing();
}

function stopAccountDataSync() {
  clearTimeout(accountWriteTimer);
  accountWriteTimer = null;
  accountPrimarySync?.stop();
  accountPrimarySync = null;
  accountSpecialSyncs.forEach((entry) => entry.sync.stop());
  accountSpecialSyncs.clear();
  accountPrimaryList = null;
  accountMemberships = [];
  setAccountSta×Ï9ÖÚ$z{-®éÜj×†æFÆTW‡G&W‡—&F–öä6öÖÖæB†6öÖÖæB“°¢FDVçG&–W2†6öÖÖæBæVçG&–W2Â²g&öÕfö–6S¢G'VRÂÆ—7D–C¢F&vWDÆ—7D–BÒ“°§Ð Ð¦gVæ7F–öâ†æFÆTÆVæ6„6öÖÖæB‚’°¢6öç7BW&ÂÒæWrU$Â‡v–æF÷ræÆö6F–öâæ‡&Vb“°Ð¢6öç7B6öÖÖæBÒW&Âç6V&6…&×2ævWB‚&6öÖÖæB"“°Ð¢6öç7BF—&V7DFBÒW&Âç6V&6…&×2ævWB‚&FB"“°Ð¢–b‚6öÖÖæBbbF—&V7DFB’&WGW&ã°Ð¢W&Âç6V&6…&×2æFVÆWFR‚&6öÖÖæB"“°Ð¢W&Âç6V&6…&×2æFVÆWFR‚&FB"“°Ð¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR‡·ÒÂ""ÂG·W&ÂçF†æÖWÒG·W&Âç6V&6‡ÒG·W&Âæ†6‡Ö“°Ð¢6öç7B7ö¶VâÒ6öÖÖæBÇÂw&VvG¶F—&V7DFGÖ°Ð¢B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ7ö¶Vã°¢6WEF–ÖV÷WB‚‚’Óâ°¢†æFÆUfö–6UFW‡B‡7ö¶VâÂ²Æ—7D–C¢&Ö–â"Ò“°¢6WEF–ÖV÷WB‚‚’Óâ²B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ"#²ÒÂ3“°Ð¢ÒÂ3“°Ð§ÐÐ Ð¦gVæ7F–öâf–æ—6„æF—fUfö–6R‡FW‡BÒ""ÂW'&÷"ÒçVÆÂ’°¢–b‚&V6övæ—F–öãòææF—fR’&WGW&ã°¢&V6övæ—F–öâÒçVÆÃ°¢Fö7VÖVçBæ&öG’æ6Æ74Æ—7Bç&VÖ÷fR‚&Æ—7FVæ–ær"“°¢B‚"7fö–6UF—FÆR"’çFW‡D6öçFVçBÒ,+õ\:’†6RfÇFò#°¢B‚"7fö–6T†–çB"’çFW‡D6öçFVçBÒ%Fö6VÂÖ–7,;6föæò’F’(	ÆÆV6†RÂâ’F÷2¶–Æ÷2FRFF>(	Òâ#°¢–b†W'&÷"’°¢6†÷uFö7B†W'&÷"æ6öFRÓÓÒ&æ÷BÖÆÆ÷vVB ¢ò$æV6W6—FòW&Ö—6ò&W6"VÂÖ–7,;6föæò ¢¢W'&÷"æÖW76vRÇÂ$æò†RöF–FòVçFVæFW'FRâ'VV&÷G&fW¢â"“°¢ÒVÇ6R–b‡FW‡BçG&–Ò‚’’°¢†æFÆUfö–6UFW‡B‡FW‡BçG&–Ò‚’“°¢Ð¢6WEF–ÖV÷WB‚‚’Óâ²B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ"#²ÒÂ3S“°§Ð ¦gVæ7F–öâ†æFÆTæF—fTÆVæ6…W&Â‡fÇVR’°¢ÆWBW&Ã°¢G'’°¢W&ÂÒæWrU$Â‡fÇVR“°¢Ò6F6‚°¢&WGW&ã°¢Ð¢6öç7B6öÖÖæBÒW&Âç6V&6…&×2ævWB‚&6öÖÖæB"“°¢6öç7BF—&V7DFBÒW&Âç6V&6…&×2ævWB‚&FB"“°¢–b‚6öÖÖæBbbF—&V7DFB’&WGW&ã°¢6öç7B7ö¶VâÒ6öÖÖæBÇÂw&VvG¶F—&V7DFGÖ°¢æf–vFR‚&Æ—7B"“°¢B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ7ö¶Vã°¢6WEF–ÖV÷WB‚‚’Óâ°¢†æFÆUfö–6UFW‡B‡7ö¶VâÂ²Æ—7D–C¢&Ö–â"Ò“°¢6WEF–ÖV÷WB‚‚’Óâ²B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ"#²ÒÂ3“°¢ÒÂS“°§Ð ¦gVæ7F–öâ7F'DæF—fUfö–6R‚’°¢–b‡&V6övæ—F–öãòææF—fR’°¢äD•dRç7F÷7VV6…&V6övæ—F–öãòâ‚’æ6F6‚‚‚’Óâ·Ò“°¢&WGW&ã°¢Ð¢&V6övæ—F–öâÒ²æF—fS¢G'VRÓ°¢Fö7VÖVçBæ&öG’æ6Æ74Æ—7BæFB‚&Æ—7FVæ–ær"“°¢B‚"7fö–6UF—FÆR"’çFW‡D6öçFVçBÒ%FRW67V6†òâ#°¢B‚"7fö–6T†–çB"’çFW‡D6öçFVçBÒ%VVFW2FV6—"f&–÷2&öGV7F÷26VwV–F÷2â#°¢B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ"#°¢–×7B‚&ÖVF—VÒ"“°¢äD•dRç7F'E7VV6…&V6övæ—F–öâ‡°¢öå'F–Ã¢‡FW‡B’Óâ²B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒFW‡C²ÒÀ¢öå7F÷VC¢‡FW‡B’Óâf–æ—6„æF—fUfö–6R‡FW‡B’À¢öäW'&÷#¢†W'&÷"’Óâf–æ—6„æF—fUfö–6R‚""ÂW'&÷"’À¢Ò’æ6F6‚‚†W'&÷"’Óâf–æ—6„æF—fUfö–6R‚""ÂW'&÷"’“°§Ð ¦gVæ7F–öâ7F'Efö–6R‚’°¢–b„äD•dRæ—4æF—fRbbäD•dRç7F'E7VV6…&V6övæ—F–öâ’°¢7F'DæF—fUfö–6R‚“°¢&WGW&ã°¢Ð¢6öç7B&V6övæ—F–öâÒv–æF÷rå7VV6…&V6övæ—F–öâÇÂv–æF÷rçvV&¶—E7VV6…&V6övæ—F–öã°¢–b‚&V6övæ—F–öâ’°Ð¢6†÷uFö7B‚$W7FRæfVvF÷"æòW&Ö—FRF–7FFòF—&V7FòâW66f&’7GVÆ—¦FòòW67&–&RFV&¦òâ"“°Ð¢B‚"6—FVÔ–çWB"’æfö7W2‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‡&V6övæ—F–öâ’°Ð¢&V6övæ—F–öâç7F÷‚“°Ð¢&WGW&ã°Ð¢ÐÐ Ð¢&V6övæ—F–öâÒæWr&V6övæ—F–öâ‚“°Ð¢&V6övæ—F–öâæÆærÒ&W2ÔU2#°Ð¢&V6övæ—F–öâæ–çFW&–Õ&W7VÇG2ÒG'VS°Ð¢&V6övæ—F–öâæ6öçF–çV÷W2ÒfÇ6S°Ð¢ÆWBf–æÅFW‡BÒ"#°Ð¢Fö7VÖVçBæ&öG’æ6Æ74Æ—7BæFB‚&Æ—7FVæ–ær"“°Ð¢B‚"7fö–6UF—FÆR"’çFW‡D6öçFVçBÒ%FRW67V6†þ(
b#°Ð¢B‚"7fö–6T†–çB"’çFW‡D6öçFVçBÒ%VVFW2FV6—"f&–÷2&öGV7F÷26VwV–F÷2â#°Ð¢B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ"#°Ð¢–×7B‚&ÖVF—VÒ"“° Ð¢&V6övæ—F–öâæöç&W7VÇBÒ†WfVçB’Óâ°Ð¢ÆWB–çFW&–ÒÒ"#°Ð¢f÷"†ÆWB–æFW‚ÒWfVçBç&W7VÇD–æFWƒ²–æFW‚ÂWfVçBç&W7VÇG2æÆVæwFƒ²–æFW‚³Ò’°Ð¢6öç7BG&ç67&—BÒWfVçBç&W7VÇG5¶–æFW…Õ³ÒçG&ç67&—C°Ð¢–b†WfVçBç&W7VÇG5¶–æFW…Òæ—4f–æÂ’f–æÅFW‡B³ÒG&ç67&—C°Ð¢VÇ6R–çFW&–Ò³ÒG&ç67&—C°Ð¢ÐÐ¢B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒf–æÅFW‡BÇÂ–çFW&–Ó°Ð¢Ó°Ð¢&V6övæ—F–öâæöæW'&÷"Ò†WfVçB’Óâ°Ð¢–b†WfVçBæW'&÷"ÓÒ&æò×7VV6‚"bbWfVçBæW'&÷"ÓÒ&&÷'FVB"’°Ð¢6†÷uFö7B†WfVçBæW'&÷"ÓÓÒ&æ÷BÖÆÆ÷vVB"ò$æV6W6—FòW&Ö—6ò&W6"VÂÖ–7,;6föæò"¢$æò†RöF–FòVçFVæFW'FRâ'VV&÷G&fW¢â"“°Ð¢ÐÐ¢Ó°Ð¢&V6övæ—F–öâæöæVæBÒ‚’Óâ°Ð¢&V6övæ—F–öâÒçVÆÃ°Ð¢Fö7VÖVçBæ&öG’æ6Æ74Æ—7Bç&VÖ÷fR‚&Æ—7FVæ–ær"“°Ð¢B‚"7fö–6UF—FÆR"’çFW‡D6öçFVçBÒ,+õ\:’†6RfÇFò#°Ð¢B‚"7fö–6T†–çB"’çFW‡D6öçFVçBÒ%Fö6VÂÖ–7,;6föæò’F’(	ÆÆV6†RÂâ’F÷2¶–Æ÷2FRFF>(	Òâ#°Ð¢–b†f–æÅFW‡BçG&–Ò‚’’†æFÆUfö–6UFW‡B†f–æÅFW‡BçG&–Ò‚’“°Ð¢6WEF–ÖV÷WB‚‚’Óâ²B‚"6Æ—fUG&ç67&—B"’çFW‡D6öçFVçBÒ"#²ÒÂ3S“°Ð¢Ó°Ð¢&V6övæ—F–öâç7F'B‚“°Ð§ÐÐ Ð¦gVæ7F–öâæf–vFR‡f–Wr’°Ð¢7F—fUf–WrÒf–Ws°Ð¢BB‚"çf–Wr"’æf÷$V6‚‚†VÆVÖVçB’ÓâVÆVÖVçBæ6Æ74Æ—7BçFövvÆR‚&7F—fR"ÂVÆVÖVçBæFF6WBçf–WrÓÓÒf–Wr’“°Ð¢BB‚%¶FFÖæeÒ"’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâæ6Æ74Æ—7BçFövvÆR‚&7F—fR"Â'WGFöâæFF6WBææbÓÓÒf–Wr’“°Ð¢v–æF÷rç67&öÆÅFò‡²F÷¢Â&V†f–÷#¢'6Öö÷F‚"Ò“°Ð§ÐÐ Ð¦gVæ7F–öâF—6Ö—757VvvW7F–öâ†¶W’’°Ð¢6öç7B²F—6Ö—76Ä¶W’ÒÒvWE7VvvW7F–öç2‡7FFR“°Ð¢6öç7BF—6Ö—76VBÒæWr6WB‡7FFRæF—6Ö—76VE7VvvW7F–öç5¶F—6Ö—76Ä¶W•ÒÇÂµÒ“°Ð¢F—6Ö—76VBæFB†¶W’“°Ð¢7FFRæF—6Ö—76VE7VvvW7F–öç5¶F—6Ö—76Ä¶W•ÒÒ²ââæF—6Ö—76VEÓ°Ð¢6fU7FFR‚“°Ð¢&VæFW$–FV2‚“°Ð§ÐÐ Ð¦gVæ7F–öâW‡÷'DFF‚’°Ð¢6öç7B&Æö"ÒæWr&Æö"…´¥4ôâç7G&–æv–g’‡7FFRÂçVÆÂÂ"•ÒÂ²G—S¢&Æ–6F–öâö§6öâ"Ò“°Ð¢6öç7BW&ÂÒU$Âæ7&VFTö&¦V7EU$Â†&Æö"“°Ð¢6öç7BÆ–æ²ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚&"“°Ð¢Æ–æ²æ‡&VbÒW&Ã°Ð¢Æ–æ²æF÷væÆöBÒ6÷–×VR×FRÖfÇFÒG¶æWrFFR‚’çFô•4õ7G&–ær‚’ç6Æ–6RƒÂ—Òæ§6öæ°¢Æ–æ²æ6Æ–6²‚“°Ð¢U$Âç&Wfö¶Tö&¦V7EU$Â‡W&Â“°Ð¢6†÷uFö7B‚$6÷–&W&F"“°Ð§ÐÐ Ð¦7–æ2gVæ7F–öâ–×÷'DFF†f–ÆR’°Ð¢G'’°Ð¢7FFRÒ‡–G&FU7FFR„¥4ôâç'6R†v—Bf–ÆRçFW‡B‚’’“°Ð¢6fU7FFR‚“°Ð¢&VæFW"‚“°Ð¢B‚"76WGF–æw4F–Æör"’æ6Æ÷6R‚“°Ð¢6†÷uFö7B‚$6÷–&W7FW&F"“°Ð¢Ò6F6‚°Ð¢6†÷uFö7B‚$Æ6÷–æòW2l:Æ–F"“°Ð¢ÐÐ§ÐÐ Ð¢B‚"6FDf÷&Ò"’æFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°Ð¢6öç7B–çWBÒB‚"6—FVÔ–çWB"“°Ð¢FDVçG&–W2‡'6U7ö¶VäÆ—7B†–çWBçfÇVR’“°Ð¢–çWBçfÇVRÒ"#°Ð¢–çWBæfö7W2‚“°§Ò“°¢B‚"6ÖçVÄW‡—&F–öäf÷&Ò"’æFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â6fTÖçVÄW‡—&F–öâ“°¢B‚"77V6–ÄÆ—7Df÷&Ò"’æFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â6fU7V6–ÄÆ—7B“°¢B‚"76†&VE77v÷&Df÷&Ò"’æFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7V&Ö—E6†&VE77v÷&B“°¢B‚"76†&VE77v÷&D6æ6VÂ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6æ6VÅ6†&VE77v÷&B“°¢B‚"76†&VE77v÷&DF–Æör"’æFDWfVçDÆ—7FVæW"‚&6æ6VÂ"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢6æ6VÅ6†&VE77v÷&B‚“°§Ò“°¢B‚"6vöövÆU6–vä–ä'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ†æFÆT66÷VçE6–vä–â‚&vöövÆR"’“°¢B‚"6ÆU6–vä–ä'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ†æFÆT66÷VçE6–vä–â‚&ÆR"’“°¢B‚"666÷VçD6æ6VÄ'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"666÷VçDF–Æör"’æ6Æ÷6R‚’“°¢B‚"6–çf—FT66WD'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â66WEVæF–æt–çf—FR“°¢B‚"6–çf—FT6æ6VÄ'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢B‚"6–çf—FTF–Æör"’æ6Æ÷6R‚“°¢–æ—F–Æ—¦T66÷VçDFF‚“°§Ò“°¢B‚"6ÖVÖ&W'46Æ÷6T'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"6ÖVÖ&W'4F–Æör"’æ6Æ÷6R‚’“°¢B‚"6ÖVÖ&W'4–çf—FT'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6†&TfÖ–Ç”Æ–æ²‚’æ6F6‚‚†W'&÷"’Óâ6†÷uFö7B†W'&÷#òæÖW76vRÇÂ$æò†RöF–Fò6ö×'F—""’’“° ¢B‚"6Ö–4'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7F'Efö–6R“°¢B‚"77V6–ÄÆ—7D7&VFR"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ÷Vå7V6–ÄÆ—7DF–Æör‚’“°¢B‚"77V6–ÄÆ—7E&VæÖR"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ÷Vå7V6–ÄÆ—7DF–Æör†7F—fTÆ—7D–B’“°¢B‚"77V6–ÄÆ—7E6†&R"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6†&U7V6–ÄÆ—7B‚’æ6F6‚‚†W'&÷"’Óâ°¢–b†W'&÷#òææÖRÓÒ$&÷'DW'&÷""’6†÷uFö7B†W'&÷#òæÖW76vRÇÂ$æò†RöF–Fò6ö×'F—"W7FÆ—7F"“°§Ò’“°¢B‚"77V6–ÄÆ—7DFVÆWFR"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂFVÆWFU7V6–ÄÆ—7B“°¢B‚"77V6–ÄÆ—7D6æ6VÂ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"77V6–ÄÆ—7DF–Æör"’æ6Æ÷6R‚’“°¢B‚"76†÷–æu7F'B"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂVçFW%6†÷–ætÖöFR“°¢B‚"6f–æ—6…6†÷–ær"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â&WVW7Df–æ—6…6†÷–ær“°Ð¢B‚"6f–æ—6„6öæf—&Ò"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Âf–æ—6…6†÷–ær“°Ð¢B‚"6f–æ—6„6æ6VÂ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"6f–æ—6„F–Æör"’æ6Æ÷6R‚’“°Ð¢B‚"6GWÆ–6FU–W2"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ&W6öÇfTGWÆ–6FR‡G'VR’“°Ð¢B‚"6GWÆ–6FTæò"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ&W6öÇfTGWÆ–6FR†fÇ6R’“°Ð¢B‚"6W‡—&F–öäFFU6fR"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6fTW‡—&F–öäFFR“°¢B‚"6W‡—&F–öäFFU6¶—"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6¶—W‡—&F–öäFFR“°¢B‚"6W‡—&F–öäFFT–çWB"’æFDWfVçDÆ—7FVæW"‚&6†ævR"ÂWFFTW‡—&F–öåV–6´FFW2“°¢BB‚u¶FFÖW‡—&F–öâÖöfg6WEÒr’æf÷$V6‚‚†'WGFöâ’Óâ'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6VÆV7DW‡—&F–öåV–6´FFR’“°¢B‚"6W‡—&F–öä6öç7VÖVE–W2"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ&W6öÇfTW‡—&F–öäÆW'B‡G'VR’“°Ð¢B‚"6W‡—&F–öä6öç7VÖVDæò"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ&W6öÇfTW‡—&F–öäÆW'B†fÇ6R’“°Ð¢B‚"6W‡G&W‡—&F–öå6fR"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6fTW‡G&W‡—&F–öäg&öÔF–Æör“°Ð¢B‚"6W‡G&W‡—&F–öä6æ6VÂ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"6W‡G&W‡—&F–öäF–Æör"’æ6Æ÷6R‚’“°Ð Ð¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°¢6öç7BæbÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖæeÒ"“°¢–b†æb’æf–vFR†æbæFF6WBææb“° ¢6öç7BÆ—7E6VÆV7F÷"ÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖÆ—7B×6VÆV7EÒ"“°¢–b†Æ—7E6VÆV7F÷"’6VÆV7DÆ—7B†Æ—7E6VÆV7F÷"æFF6WBæÆ—7E6VÆV7B“° ¢6öç7B—FVÔVÆVÖVçBÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ—FVÒÖ–EÒ"“°¢6öç7B—FVÔ7F–öâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ7F–öåÒ"“°¢–b†—FVÔVÆVÖVçBbb—FVÔ7F–öâ’°¢6öç7B—FV×2ÒÆ—7D—FV×2‚“°¢6öç7B—FVÒÒ—FV×2æf–æB‚†VçG'’’ÓâVçG'’æ–BÓÓÒ—FVÔVÆVÖVçBæFF6WBæ—FVÔ–B“°¢–b‚—FVÒ’&WGW&ã°¢6öç7B7F–öâÒ—FVÔ7F–öâæFF6WBæ7F–öã°¢–b†7F–öâÓÓÒ'FövvÆR"’—FVÒæ6†V6¶VBÒ—FVÒæ6†V6¶VC°¢–b†7F–öâÓÓÒ&–æ7&V6R"’—FVÒçVçF—G’³Ò°¢–b†7F–öâÓÓÒ&FV7&V6R"’—FVÒçVçF—G’ÒÖF‚æÖ‚ƒÂ—FVÒçVçF—G’Ò“°¢–b†7F–öâÓÓÒ'&VÖ÷fR"’&WÆ6TÆ—7D—FV×2†7F—fTÆ—7D–BÂ—FV×2æf–ÇFW"‚†VçG'’’ÓâVçG'’æ–BÓÒ—FVÒæ–B’“°¢W'6—7DÆ—7B‚“°¢&VæFW"‚“°¢–×7B‚&Æ–v‡B"“°¢Ð ¢6öç7B7VvvW7F–öâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FF×7VvvW7BÖ¶W•Ò"“°¢–b‡7VvvW7F–öâ’°¢7F—fTÆ—7D–BÒ&Ö–â#°¢FDVçG&–W2‡'6U7ö¶VäÆ—7B‡7VvvW7F–öâæFF6WBç7VvvW7DæÖR’Â²Æ—7D–C¢&Ö–â"Ò“°¢æf–vFR‚&Æ—7B"“°¢Ð¢6öç7BF—6Ö—72ÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖF—6Ö—75Ò"“°¢–b†F—6Ö—72’F—6Ö—757VvvW7F–öâ†F—6Ö—72æFF6WBæF—6Ö—72“° ¢6öç7BW&6†6VBÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FF×W&6†6VBÖFEÒ"“°¢–b‡W&6†6VB’°¢6öç7B&Wf–÷W2ÒvWE&Wf–÷W6Ç•W&6†6VB‡7FFRÂµÒÂS¢æf–æB‚†VçG'’’ÓâVçG'’æ¶W’ÓÓÒW&6†6VBæFF6WBçW&6†6VDFB“°¢–b‡&Wf–÷W2’°¢7F—fTÆ—7D–BÒ&Ö–â#°¢FDVçG&–W2…·°¢¶W“¢&Wf–÷W2æ¶W’À¢æÖS¢&Wf–÷W2ææÖRÀ¢6FVv÷'“¢&Wf–÷W2æ6FVv÷'’À¢VçF—G“¢çVÖ&W"‡&Wf–÷W2çVçF—G’’ÇÂÀ¢Væ—C¢&Wf–÷W2çVæ—BÇÂ""À¢ÕÒÂ²Æ—7D–C¢&Ö–â"Ò“°¢æf–vFR‚&Æ—7B"“°¢Ð¢Ð ¢6öç7BW‡—&F–öäVF—BÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖW‡—&F–öâÖVF—EÒ"“°¢–b†W‡—&F–öäVF—B’VF—DW‡—&F–öäFFR†W‡—&F–öäVF—BæFF6WBæW‡—&F–öäVF—B“°¢6öç7B6öç7VÖVBÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖW‡—&F–öâÖ6öç7VÖVEÒ"“°¢–b†6öç7VÖVB’Ö&´W‡—&F–öä6öç7VÖVB†6öç7VÖVBæFF6WBæW‡—&F–öä6öç7VÖVB“° ¢6öç7B&VÖ÷fTÖVÖ&W"ÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖÖVÖ&W"×&VÖ÷fUÒ"“°¢–b‡&VÖ÷fTÖVÖ&W"’&VÖ÷fT66÷VçDÖVÖ&W"‡&VÖ÷fTÖVÖ&W"æFF6WBæÖVÖ&W%&VÖ÷fR’æ6F6‚‚†W'&÷"’Óâ6†÷uFö7B†W'&÷#òæÖW76vRÇÂ$æò†RöF–FòV—F"VÂ66W6ò"’“° ¢6öç7B66÷VçDÆ—7D÷VâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ66÷VçBÖÆ—7BÖ÷VåÒ"“°¢–b†66÷VçDÆ—7D÷Vâ’7v—F6„66÷VçDfÖ–Ç”Æ—7B†66÷VçDÆ—7D÷VâæFF6WBæ66÷VçDÆ—7D÷Vâ“°§Ò“° Ð¢B‚"76WGF–æw4'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"76WGF–æw4F–Æör"’ç6†÷tÖöFÂ‚’“°Ð¢B‚"76WGF–æw46Æ÷6R"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’ÓâB‚"76WGF–æw4F–Æör"’æ6Æ÷6R‚’“°Ð¢B‚"77VµFövvÆR"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â†WfVçB’Óâ°¢7FFRç6WGF–æw2ç7V²ÒWfVçBçF&vWBæ6†V6¶VC°¢6fU7FFR‚“°§Ò“°¢B‚"6fÖ–Ç•6†&T'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6†&TfÖ–Ç”Æ–æ²‚’æ6F6‚‚†W'&÷"’Óâ°¢–b†W'&÷#òææÖRÓÒ$&÷'DW'&÷""’6†÷uFö7B†W'&÷#òæÖW76vRÇÂ$æò†RöF–Fò6ö×'F—"VÂVæÆ6R"“°§Ò’“°¢B‚"6fÖ–Ç”ÖVÖ&W'4'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ÷VäÖVÖ&W'4F–Æör‚’æ6F6‚‚†W'&÷"’Óâ6†÷uFö7B†W'&÷#òæÖW76vRÇÂ$æò†RöF–Fò6&v"Æ2W'6öæ2"’’“°¢B‚"6fÖ–Ç”F—66öææV7D'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂF—66öææV7DfÖ–Ç’“°¢B‚"666÷VçE6–vä–ä'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ÷Vä66÷VçDF–Æör‚’“°¢B‚"666÷VçE6–vä÷WD'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ†æFÆT66÷VçE6–vä÷WB‚’æ6F6‚‚†W'&÷"’Óâ6†÷uFö7B†W'&÷#òæÖW76vRÇÂ$æò†RöF–Fò6W'&"6W6œ;6â"’’“°¢B‚"6FVÆWFT66÷VçD'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†æFÆTFVÆWFT66÷VçB“°¢B‚"6W‡÷'D'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂW‡÷'DFF“°¢B‚"6–×÷'D–çWB"’æFDWfVçDÆ—7FVæW"‚&6†ævR"Â†WfVçB’ÓâWfVçBçF&vWBæf–ÆW5³Òbb–×÷'DFF†WfVçBçF&vWBæf–ÆW5³Ò’“°Ð¢B‚"66ÆV$'WGFöâ"’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ð¢–b‚6öæf—&Ò‚,+õ6VwW&òVRV–W&W2&÷'&"FöFÆÆ—7F’VÂ†—7F÷&–Ãò"’’&WGW&ã°Ð¢7FFRÒ7&VFT–æ—F–Å7FFR‚“°Ð¢6fU7FFR‚“°Ð¢&VæFW"‚“°Ð¢B‚"76WGF–æw4F–Æör"’æ6Æ÷6R‚“°Ð¢6†÷uFö7B‚$FF÷2&÷'&F÷2"“°Ð§Ò“°Ð Ð§v–æF÷ræFDWfVçDÆ—7FVæW"‚&&Vf÷&V–ç7FÆÇ&ö×B"Â†WfVçB’ÓâWfVçBç&WfVçDFVfVÇB‚’“° ¦7–æ2gVæ7F–öâ–æ—F–Æ—¦TWFFW2‚’°¢–b„äD•dRæ—4æF—fR’&WGW&ã°¢–b‚‚'6W'f–6Uv÷&¶W""–âæf–vF÷"’’&WGW&ã°¢6W'f–6Uv÷&¶W%&Vv—7G&F–öâÒv—Bæf–vF÷"ç6W'f–6Uv÷&¶W"ç&Vv—7FW"‚"â÷6W'f–6R×v÷&¶W"æ§3÷cÓ#""“°¢6W'f–6Uv÷&¶W%&Vv—7G&F–öâçWFFR‚’æ6F6‚‚‚’Óâ·Ò“°§Ð ¦gVæ7F–öâ6†V6´f÷$WFFR‚’°¢–b‡6†÷–ætÖöFRÇÂFö7VÖVçBçVW'•6VÆV7F÷"‚&F–Æöu¶÷VåÒ"’’&WGW&ã°¢6W'f–6Uv÷&¶W%&Vv—7G&F–öãòçWFFR‚’æ6F6‚‚‚’Óâ·Ò“°§Ð §v–æF÷ræFDWfVçDÆ—7FVæW"‚&ÆöB"Â‚’Óâ–æ—F–Æ—¦TWFFW2‚’æ6F6‚‚‚’Óâ·Ò’“°¦gVæ7F–öâ&Vg&W6…6†&VDFF‚’°¢fÖ–Ç•7–æ3òç&Vg&W6‚‚“°¢6†&VDÆ—7E7–æ72æf÷$V6‚‚†VçG'’’ÓâVçG'’ç7–æ2ç&Vg&W6‚‚’“°¢66÷VçE&–Ö'•7–æ3òç&Vg&W6‚‚“°¢66÷VçE7V6–Å7–æ72æf÷$V6‚‚†VçG'’’ÓâVçG'’ç7–æ2ç&Vg&W6‚‚’“°§Ð §v–æF÷ræFDWfVçDÆ—7FVæW"‚&öæÆ–æR"Â‚’Óâ°¢&Vg&W6…6†&VDFF‚“°¢6†V6´f÷$WFFR‚“°§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚'f—6–&–Æ—G–6†ævR"Â‚’Óâ°¢–b†Fö7VÖVçBçf—6–&–Æ—G•7FFRÓÓÒ'f—6–&ÆR"’°¢&Vg&W6…6†&VDFF‚“°¢6†V6´f÷$WFFR‚“°¢–b‚7FæFÆöæTÆ—7D–B’6†V6´W‡—&F–öäÆW'G2‚“°¢Ð§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&ÆÖ6ö×&¦æF—fRÖ7F—fR"Â‚’Óâ°¢&Vg&W6…6†&VDFF‚“°¢66†VGVÆTæF—fTW‡—&F–öäæ÷F–f–6F–öç2ƒ“°¢–b‚7FæFÆöæTÆ—7D–B’6†V6´W‡—&F–öäÆW'G2‚“°§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&ÆÖ6ö×&¦æ÷F–f–6F–öâÖ÷VæVB"Â‚’Óâ°¢–b‡7FæFÆöæTÆ—7D–B’&WGW&ã°¢æf–vFR‚&W‡—&F–öâ"“°¢6†V6´W‡—&F–öäÆW'G2‚“°§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&ÆÖ6ö×&¦×W&ÂÖ÷Vâ"Â†WfVçB’Óâ°¢†æFÆTæF—fTÆVæ6…W&Â†WfVçBæFWF–ÃòçW&Â“°§Ò“° ¦7–æ2gVæ7F–öâ&ö÷G7G&‚’°¢&VæFW"‚“°¢–b‡7FæFÆöæTÆ—7D–B’v—B–æ—F–Æ—¦U7FæFÆöæTÆ—7E6†&–ær‚“°¢VÇ6Rv—B–æ—F–Æ—¦TfÖ–Ç•6†&–ær‚“°¢–b‚7FæFÆöæTÆ—7D–B’°¢–æ—F–Æ—¦T66÷VçDWF‚‡°¢öä6†ævS¢‡W6W"’Óâöä66÷VçDWF„6†ævVB‡W6W"’æ6F6‚‚‚’Óâ6WD66÷VçE7FGW2‚&öffÆ–æR"’’À¢Ò’æ6F6‚‚‚’Óâ°¢66÷VçEW6W"ÒçVÆÃ°¢&VæFW$fÖ–Ç•6†&–ær‚“°¢Ò“°¢–b‡VæF–æt66÷VçD–çf—FT–B’÷Vä66÷VçDF–Æör‚&–çf—FR"“°¢Ð¢†æFÆTÆVæ6„6öÖÖæB‚“°¢66†VGVÆTæF—fTW‡—&F–öäæ÷F–f–6F–öç2ƒ“°¢–b‚7FæFÆöæTÆ—7D–B’6WEF–ÖV÷WB†6†V6´W‡—&F–öäÆW'G2ÂS“°§Ð ¦&ö÷G7G&‚“°