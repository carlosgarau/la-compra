export const CATEGORY_ORDER = [
  "Fruta y verdura",
  "Carne y pescado",
  "Lácteos y huevos",
  "Panadería y desayuno",
  "Despensa",
  "Bebidas",
  "Congelados",
  "Limpieza",
  "Higiene",
  "Bebés y niños",
  "Mascotas",
  "Otros",
];

export const CATEGORY_META = {
  "Fruta y verdura": { icon: "leaf", color: "#3f7d58" },
  "Carne y pescado": { icon: "fish", color: "#c95f54" },
  "Lácteos y huevos": { icon: "milk", color: "#5681a6" },
  "Panadería y desayuno": { icon: "bread", color: "#b7793f" },
  Despensa: { icon: "jar", color: "#8b6f47" },
  Bebidas: { icon: "bottle", color: "#4b87a3" },
  Congelados: { icon: "snow", color: "#6d87b5" },
  Limpieza: { icon: "sparkle", color: "#667a89" },
  Higiene: { icon: "drop", color: "#97749a" },
  "Bebés y niños": { icon: "baby", color: "#cc7f94" },
  Mascotas: { icon: "paw", color: "#9a755c" },
  Otros: { icon: "basket", color: "#706c65" },
};

const CATEGORY_KEYWORDS = {
  "Bebés y niños": [
    "panal", "pañal", "toallita", "potito", "papilla", "leche infantil",
    "formula infantil", "chupete", "biberon",
  ],
  Mascotas: ["pienso", "arena de gato", "comida de perro", "comida de gato", "mascota"],
  Limpieza: [
    "detergente", "lavavajillas", "lejia", "suavizante", "limpiador", "bayeta",
    "estropajo", "bolsa de basura", "papel de cocina", "limpieza", "lavadora",
  ],
  Higiene: [
    "champu", "gel de ducha", "jabon", "desodorante", "dentifrico", "pasta de dientes",
    "cepillo de dientes", "papel higienico", "compresa", "tampon", "afeitar",
  ],
  Congelados: ["congelado", "helado", "hielo", "pizza congelada"],
  Bebidas: [
    "agua", "cerveza", "vino", "refresco", "zumo", "coca cola", "tonica", "sidra",
    "ginebra", "ron", "whisky", "batido",
  ],
  "Lácteos y huevos": [
    "leche", "yogur", "queso", "huevo", "mantequilla", "nata", "kefir", "requeson",
    "cuajada", "mozzarella",
  ],
  "Carne y pescado": [
    "pollo", "pavo", "ternera", "cerdo", "cordero", "hamburguesa", "carne", "jamon",
    "salchicha", "bacon", "pescado", "salmon", "atun", "merluza", "bacalao", "gamba",
    "langostino", "calamar", "sepia", "mejillon", "sardina", "embutido",
  ],
  "Panadería y desayuno": [
    "pan", "barra", "baguette", "croissant", "ensaimada", "galleta", "cereal", "tostada",
    "magdalena", "bizcocho", "bolleria", "mermelada",
  ],
  "Fruta y verdura": [
    "fresa", "frambuesa", "arandano", "mora", "manzana", "platano", "banana", "pera",
    "naranja", "mandarina", "limon", "lima", "sandia", "melon", "melocoton", "nectarina",
    "albaricoque", "ciruela", "cereza", "uva", "kiwi", "mango", "aguacate", "higo",
    "tomate", "lechuga", "cebolla", "ajo", "patata", "zanahoria", "calabacin", "berenjena",
    "pimiento", "pepino", "brocoli", "coliflor", "espinaca", "acelga", "alcachofa",
    "esparrago", "puerro", "judia verde", "champiñon", "seta", "verdura", "fruta",
  ],
  Despensa: [
    "arroz", "pasta", "macarron", "espagueti", "harina", "azucar", "sal", "pimienta",
    "aceite", "vinagre", "cafe", "te", "infusion", "legumbre", "lenteja", "garbanzo",
    "alubia", "conserva", "tomate frito", "salsa", "mayonesa", "ketchup", "mostaza",
    "chocolate", "cacao", "fruto seco", "almendra", "nuez", "avena", "quinoa", "caldo",
  ],
};

const ALIASES = {
  "aguacates": "aguacate", "ajos": "ajo", "albaricoques": "albaricoque",
  "alcachofas": "alcachofa", "arandanos": "arandano", "berenjenas": "berenjena",
  "calabacines": "calabacin", "cebollas": "cebolla", "cerezas": "cereza",
  "cervezas": "cerveza", "ciruelas": "ciruela", "fresas": "fresa", "galletas": "galleta",
  "garbanzos": "garbanzo", "higos": "higo", "huevos": "huevo", "judias verdes": "judia verde",
  "lechugas": "lechuga", "leches": "leche", "limones": "limon", "latas de atun": "atun",
  "macarrones": "macarron", "mandarinas": "mandarina", "manzanas": "manzana",
  "melocotones": "melocoton", "naranjas": "naranja", "nectarinas": "nectarina",
  "panales": "panal", "pañales": "panal", "patatas": "patata", "pepinos": "pepino",
  "peras": "pera", "pimientos": "pimiento", "platanos": "platano", "plátanos": "platano",
  "refrescos": "refresco", "tomates": "tomate", "toallitas": "toallita", "yogures": "yogur",
  "zanahorias": "zanahoria", "zumos": "zumo",
};

const NUMBER_WORDS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
};

const UNITS = [
  "kilogramos", "kilogramo", "kilos", "kilo", "kg", "gramos", "gramo", "g",
  "litros", "litro", "l", "mililitros", "mililitro", "ml", "botellas", "botella",
  "paquetes", "paquete", "bandejas", "bandeja", "latas", "lata", "botes", "bote",
  "docenas", "docena", "cajas", "caja", "bolsas", "bolsa",
];

export const SEASONAL_PRODUCE = [
  { name: "Fresas", key: "fresa", months: [1, 2, 3, 4, 5] },
  { name: "Alcachofas", key: "alcachofa", months: [1, 2, 3, 4, 11, 12] },
  { name: "Naranjas", key: "naranja", months: [1, 2, 3, 4, 11, 12] },
  { name: "Mandarinas", key: "mandarina", months: [1, 2, 3, 10, 11, 12] },
  { name: "Espárragos", key: "esparrago", months: [3, 4, 5] },
  { name: "Guisantes", key: "guisante", months: [2, 3, 4, 5] },
  { name: "Cerezas", key: "cereza", months: [5, 6, 7] },
  { name: "Albaricoques", key: "albaricoque", months: [5, 6, 7] },
  { name: "Melocotones", key: "melocoton", months: [6, 7, 8, 9] },
  { name: "Nectarinas", key: "nectarina", months: [6, 7, 8, 9] },
  { name: "Sandía", key: "sandia", months: [6, 7, 8, 9] },
  { name: "Melón", key: "melon", months: [6, 7, 8, 9] },
  { name: "Tomates", key: "tomate", months: [6, 7, 8, 9] },
  { name: "Pimientos", key: "pimiento", months: [6, 7, 8, 9, 10] },
  { name: "Calabacín", key: "calabacin", months: [5, 6, 7, 8, 9] },
  { name: "Higos", key: "higo", months: [7, 8, 9] },
  { name: "Uvas", key: "uva", months: [8, 9, 10, 11] },
  { name: "Granadas", key: "granada", months: [9, 10, 11] },
  { name: "Caquis", key: "caqui", months: [10, 11, 12] },
  { name: "Calabaza", key: "calabaza", months: [9, 10, 11, 12, 1, 2] },
  { name: "Brócoli", key: "brocoli", months: [1, 2, 3, 10, 11, 12] },
  { name: "Coliflor", key: "coliflor", months: [1, 2, 3, 11, 12] },
];

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function productKey(name) {
  let key = normalizeText(name)
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/, "")
    .trim();
  return ALIASES[key] || key;
}

export function titleCase(value) {
  const cleaned = String(value).trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return cleaned.charAt(0).toLocaleUpperCase("es") + cleaned.slice(1);
}

export function categoryFor(name) {
  const normalized = normalizeText(name);
  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    if (CATEGORY_KEYWORDS[category].some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return "Otros";
}

export function splitListText(value) {
  return String(value)
    .replace(/\s+(?:además|también)\s+/gi, ",")
    .split(/\s*(?:,|;|\n|\s+y\s+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseEntry(raw) {
  let text = String(raw).trim().replace(/[.!?]+$/g, "");
  let quantity = 1;
  let unit = "";

  const quantityMatch = text.match(/^(\d+(?:[.,]\d+)?|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s+(.+)$/i);
  if (quantityMatch) {
    const quantityToken = normalizeText(quantityMatch[1]);
    quantity = NUMBER_WORDS[quantityToken] || Number(quantityToken.replace(",", ".")) || 1;
    text = quantityMatch[2].trim();
  }

  const unitPattern = new RegExp(`^(${UNITS.join("|")})\\s+(?:de\\s+)?(.+)$`, "i");
  const unitMatch = text.match(unitPattern);
  if (unitMatch) {
    unit = normalizeText(unitMatch[1]);
    text = unitMatch[2].trim();
  }

  text = text.replace(/^(de\s+)/i, "").trim();
  const key = productKey(text);
  const canonicalName = ALIASES[normalizeText(text)] || normalizeText(text);

  return {
    key,
    name: titleCase(canonicalName || text),
    quantity,
    unit,
    category: categoryFor(key || text),
  };
}

export function parseSpokenList(value) {
  let text = String(value).trim();
  text = text
    .replace(/^(oye\s+siri[,:]?\s*)/i, "")
    .replace(/^(añade|agrega|apunta|anota|pon|mete|necesitamos|necesito|hace falta|hay que comprar|comprar)\s+/i, "")
    .replace(/\s+(?:a|en)\s+(?:mi\s+|la\s+)?lista\s+de\s+(?:la\s+)?compra\s*$/i, "")
    .trim();
  return splitListText(text).map(parseEntry).filter((entry) => entry.key);
}

export function detectVoiceCommand(value) {
  const normalized = normalizeText(value);
  if (/^(voy|vamos) a (hacer )?la compra$/.test(normalized) || normalized === "modo compra") {
    return { type: "shopping" };
  }
  if (/^(he |hemos )?(terminado|acabado)( la compra)?$/.test(normalized) || /^(terminar|finalizar|fin de) compra$/.test(normalized)) {
    return { type: "finish" };
  }
  if (/^que (hay|tenemos) (en )?(la|mi) lista/.test(normalized) || ["leer la lista", "leeme la lista", "dime que hay en la lista"].includes(normalized)) {
    return { type: "read" };
  }
  return { type: "add", entries: parseSpokenList(value) };
}

export function createInitialState() {
  return {
    version: 1,
    items: [],
    catalog: {},
    purchases: [],
    dismissedSuggestions: {},
    settings: { speak: true },
  };
}

export function hydrateState(raw) {
  const initial = createInitialState();
  if (!raw || typeof raw !== "object") return initial;
  return {
    ...initial,
    ...raw,
    items: Array.isArray(raw.items) ? raw.items : [],
    catalog: raw.catalog && typeof raw.catalog === "object" ? raw.catalog : {},
    purchases: Array.isArray(raw.purchases) ? raw.purchases : [],
    dismissedSuggestions: raw.dismissedSuggestions && typeof raw.dismissedSuggestions === "object"
      ? raw.dismissedSuggestions
      : {},
    settings: { ...initial.settings, ...(raw.settings || {}) },
  };
}

export function makeItem(entry, now = Date.now()) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `${now}-${Math.random().toString(16).slice(2)}`,
    ...entry,
    addedAt: new Date(now).toISOString(),
    checked: false,
  };
}

export function registerRequest(state, entry, now = Date.now()) {
  const current = state.catalog[entry.key] || {
    key: entry.key,
    name: entry.name,
    category: entry.category,
    requestDates: [],
    purchaseDates: [],
  };
  current.name = entry.name;
  current.category = entry.category;
  current.requestDates = [...(current.requestDates || []), new Date(now).toISOString()].slice(-20);
  state.catalog[entry.key] = current;
}

export function registerPurchase(state, item, now = Date.now()) {
  const entry = state.catalog[item.key] || {
    key: item.key,
    name: item.name,
    category: item.category,
    requestDates: [],
    purchaseDates: [],
  };
  entry.purchaseDates = [...(entry.purchaseDates || []), new Date(now).toISOString()].slice(-20);
  entry.name = item.name;
  entry.category = item.category;
  state.catalog[item.key] = entry;
  state.purchases.unshift({
    id: globalThis.crypto?.randomUUID?.() || `${now}-${Math.random().toString(16).slice(2)}`,
    key: item.key,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    purchasedAt: new Date(now).toISOString(),
  });
  state.purchases = state.purchases.slice(0, 500);
}

export function groupItems(items) {
  const groups = new Map(CATEGORY_ORDER.map((category) => [category, []]));
  for (const item of items) {
    const category = groups.has(item.category) ? item.category : "Otros";
    groups.get(category).push(item);
  }
  return [...groups.entries()]
    .filter(([, entries]) => entries.length)
    .map(([category, entries]) => ({ category, items: entries }));
}

export function formatAmount(item) {
  if (item.quantity === 1 && !item.unit) return "";
  const quantity = Number.isInteger(item.quantity) ? item.quantity : String(item.quantity).replace(".", ",");
  return `${quantity}${item.unit ? ` ${item.unit}` : ""}`;
}

const DAY = 86_400_000;

function daysSince(isoDate, now) {
  return Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / DAY));
}

function averageIntervals(dates) {
  const ordered = dates.map((date) => new Date(date).getTime()).sort((a, b) => a - b);
  if (ordered.length < 2) return null;
  const intervals = ordered.slice(1).map((time, index) => (time - ordered[index]) / DAY);
  return intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
}

export function getSuggestions(state, now = Date.now()) {
  const activeKeys = new Set(state.items.map((item) => item.key));
  const month = new Date(now).getMonth() + 1;
  const dismissalKey = `${new Date(now).getFullYear()}-${String(month).padStart(2, "0")}`;
  const dismissed = new Set(state.dismissedSuggestions[dismissalKey] || []);

  const remembered = Object.values(state.catalog)
    .filter((entry) => !activeKeys.has(entry.key) && !dismissed.has(entry.key))
    .map((entry) => {
      const purchaseDates = entry.purchaseDates || [];
      const requestDates = entry.requestDates || [];
      if (purchaseDates.length) {
        const elapsed = daysSince(purchaseDates.at(-1), now);
        const average = averageIntervals(purchaseDates);
        const dueAfter = average === null ? 45 : Math.min(90, Math.max(12, Math.round(average * 1.25)));
        if (elapsed >= dueAfter) {
          return {
            key: entry.key,
            name: entry.name,
            category: entry.category,
            reason: `Hace ${elapsed} días que no lo compras`,
            score: elapsed / dueAfter,
            kind: "remembered",
          };
        }
      } else if (requestDates.length) {
        const elapsed = daysSince(requestDates.at(-1), now);
        if (elapsed >= 21) {
          return {
            key: entry.key,
            name: entry.name,
            category: entry.category,
            reason: `Lo pediste hace ${elapsed} días`,
            score: elapsed / 21,
            kind: "remembered",
          };
        }
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const seasonal = SEASONAL_PRODUCE
    .filter((produce) => produce.months.includes(month))
    .filter((produce) => !activeKeys.has(produce.key) && !dismissed.has(produce.key))
    .map((produce) => ({
      ...produce,
      category: "Fruta y verdura",
      reason: "Suele estar de temporada este mes",
      kind: "seasonal",
    }))
    .slice(0, 8);

  return { remembered, seasonal, dismissalKey };
}

export function shoppingSummary(items) {
  const pending = items.filter((item) => !item.checked);
  const families = groupItems(pending).length;
  if (!pending.length) return "La lista está vacía";
  return `${pending.length} ${pending.length === 1 ? "producto" : "productos"} en ${families} ${families === 1 ? "familia" : "familias"}`;
}
