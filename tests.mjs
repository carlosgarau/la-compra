import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryFor,
  createInitialState,
  detectVoiceCommand,
  getSuggestions,
  groupItems,
  parseEntry,
  parseSpokenList,
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
  assert.equal(detectVoiceCommand("Léeme la lista").type, "read");
  assert.equal(detectVoiceCommand("He terminado la compra").type, "finish");
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
