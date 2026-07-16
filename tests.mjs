import assert from "node:assert/strict";
import test from "node:test";
import {
  addExpiration,
  categoryFor,
  createInitialState,
  detectVoiceCommand,
  getActiveExpirations,
  getPendingExpirationAlerts,
  getSuggestions,
  groupItems,
  isFreezable,
  isPerishable,
  markExpirationAlerted,
  parseEntry,
  parseExtraPurchaseCommand,
  parseSpokenList,
  parseSpokenExpiryDate,
  productKey,
  registerPurchase,
  registerRequest,
} from "./core.mjs";

test("separa una frase con varios productos", () => {
  const entries = parseSpokenList("Añade leche, pan y dos kilos de patatas a la lista de la compra");
  assert.deepEqual(entries.map(({ key, quantity, unit }) => ({ key, quantity, unit })), [
    { key: "leche", quantity: 1, unit: "" },
    { key: "pan", quantity: 1, unit: "" },
    { key: "patata", quantity: 2, unit: "kilos" },
  ]);
});

test("normaliza plurales habituales para detectar repetidos", () => {
  assert.equal(productKey("Fresas"), "fresa");
  assert.equal(productKey("los huevos"), "huevo");
  assert.equal(parseEntry("3 yogures").key, "yogur");
});

test("clasifica productos en familias", () => {
  assert.equal(categoryFor("leche entera"), "Lácteos y huevos");
  assert.equal(categoryFor("pañales talla 5"), "Bebés y niños");
  assert.equal(categoryFor("tomates cherry"), "Fruta y verdura");
  assert.equal(groupItems([{ category: "Bebidas" }, { category: "Despensa" }]).length, 2);
});

test("reconoce comandos de compra", () => {
  assert.equal(detectVoiceCommand("Voy a hacer la compra").type, "shopping");
  assert.equal(detectVoiceCommand("leer la lista").type, "read");
  assert.equal(detectVoiceCommand("¿Qué hay en la lista de la compra?").type, "read");
  assert.equal(detectVoiceCommand("Hay en la lista de la compra").type, "read");
  assert.equal(detectVoiceCommand("Hay").type, "read");
  assert.equal(detectVoiceCommand("Qué ingredientes hay en la lista de la compra").type, "read");
  assert.equal(detectVoiceCommand("Qué productos tengo en mi lista").type, "read");
  assert.equal(detectVoiceCommand("Cuáles son los ingredientes de la lista de la compra").type, "read");
  assert.equal(detectVoiceCommand("Dime qué hay en mi lista de la compra").type, "read");
  assert.equal(detectVoiceCommand("Qué tengo en la lista de la compra").type, "read");
  assert.equal(detectVoiceCommand("Léeme la lista").type, "read");
  assert.equal(detectVoiceCommand("He terminado la compra").type, "finish");
  assert.equal(detectVoiceCommand("Hazme la lista final que voy a comprar").type, "shopping");
  assert.equal(detectVoiceCommand("Muéstrame la lista de la compra").type, "show-list");
});

test("entiende fechas de caducidad dichas en voz alta", () => {
  const now = new Date(2026, 6, 16, 10).getTime();
  assert.equal(parseSpokenExpiryDate("caducan en tres días", now), "2026-07-19");
  assert.equal(parseSpokenExpiryDate("caduca el 25 de julio", now), "2026-07-25");
  assert.equal(parseSpokenExpiryDate("caduca mañana", now), "2026-07-17");
});

test("registra una compra extra con producto y fecha dictados", () => {
  const now = new Date(2026, 6, 16, 10).getTime();
  const command = parseExtraPurchaseCommand("He comprado hamburguesas extra que caducan en tres días", now);
  assert.equal(command.type, "extra-expiration");
  assert.equal(command.entry.key, "hamburguesa");
  assert.equal(command.expiresOn, "2026-07-19");
  const incomplete = detectVoiceCommand("He comprado algo extra que caduque");
  assert.equal(incomplete.type, "extra-expiration");
  assert.equal(incomplete.entry, null);
});

test("sugiere un producto olvidado según el historial", () => {
  const state = createInitialState();
  const entry = parseEntry("leche");
  const fiftyDays = 50 * 86_400_000;
  registerRequest(state, entry, 0);
  registerPurchase(state, { ...entry, id: "1" }, 0);
  const ideas = getSuggestions(state, fiftyDays);
  assert.equal(ideas.remembered[0].key, "leche");
});

test("no sugiere algo que ya está en la lista", () => {
  const state = createInitialState();
  const entry = parseEntry("leche");
  registerRequest(state, entry, 0);
  registerPurchase(state, { ...entry, id: "1" }, 0);
  state.items.push({ ...entry, id: "2", checked: false });
  assert.equal(getSuggestions(state, 50 * 86_400_000).remembered.length, 0);
});

test("detecta productos delicados y cuáles se pueden congelar", () => {
  assert.equal(isPerishable(parseEntry("hamburguesas")), true);
  assert.equal(isFreezable(parseEntry("hamburguesas")), true);
  assert.equal(isPerishable(parseEntry("detergente")), false);
  assert.equal(isFreezable(parseEntry("yogures")), false);
});

test("avisa a tres días y vuelve a avisar a un día", () => {
  const state = createInitialState();
  const item = parseEntry("hamburguesas");
  const firstCheck = new Date(2026, 6, 16, 10).getTime();
  const expiration = addExpiration(state, item, "2026-07-19", firstCheck);
  assert.equal(getActiveExpirations(state, firstCheck)[0].daysLeft, 3);
  assert.equal(getPendingExpirationAlerts(state, firstCheck)[0].threshold, 3);

  markExpirationAlerted(state, expiration.id, 3);
  assert.equal(getPendingExpirationAlerts(state, firstCheck).length, 0);
  const secondCheck = new Date(2026, 6, 18, 10).getTime();
  assert.equal(getPendingExpirationAlerts(state, secondCheck)[0].threshold, 1);
});
