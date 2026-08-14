import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedBundleId = "com.carlosgarau.lacompra";
const failures = [];

function file(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Falta ${relativePath}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

function pngInfo(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Falta ${relativePath}`);
    return null;
  }
  const data = readFileSync(fullPath);
  const pngSignature = "89504e470d0a1a0a";
  if (data.subarray(0, 8).toString("hex") !== pngSignature) {
    failures.push(`${relativePath} no es un PNG válido`);
    return null;
  }
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
  };
}

const capacitor = JSON.parse(file("capacitor.config.json") || "{}");
requireCondition(capacitor.appId === expectedBundleId, "El appId de Capacitor no coincide con el Bundle ID");
requireCondition(capacitor.appName === "¿Qué te falta?", "El nombre de Capacitor debe ser ¿Qué te falta?");
requireCondition(capacitor.webDir === "www", "Capacitor debe empaquetar el directorio www");

const project = file("ios/App/App.xcodeproj/project.pbxproj");
requireCondition((project.match(/PRODUCT_BUNDLE_IDENTIFIER = com\.carlosgarau\.lacompra;/g) || []).length === 2,
  "El proyecto Xcode debe usar el Bundle ID en Debug y Release");
requireCondition((project.match(/TARGETED_DEVICE_FAMILY = 1;/g) || []).length === 2,
  "La primera versión debe estar limitada a iPhone");
requireCondition((project.match(/IPHONEOS_DEPLOYMENT_TARGET = 15\.0;/g) || []).length >= 2,
  "El destino mínimo debe ser iOS 15");

const infoPlist = file("ios/App/App/Info.plist");
requireCondition(infoPlist.includes("<string>¿Qué te falta?</string>"),
  "El nombre visible en iPhone debe ser ¿Qué te falta?");
for (const requiredText of [
  "NSMicrophoneUsageDescription",
  "NSSpeechRecognitionUsageDescription",
  "ITSAppUsesNonExemptEncryption",
  "public.app-category.shopping",
  "<string>lacompra</string>",
]) {
  requireCondition(infoPlist.includes(requiredText), `Info.plist no contiene ${requiredText}`);
}
requireCondition(!infoPlist.includes("UIInterfaceOrientationLandscape"),
  "La primera versión no debe anunciar orientaciones no probadas");

const privacyManifest = file("ios/App/App/PrivacyInfo.xcprivacy");
for (const requiredText of [
  "<key>NSPrivacyTracking</key>",
  "NSPrivacyCollectedDataTypeOtherUserContent",
  "NSPrivacyCollectedDataTypeDeviceID",
  "NSPrivacyCollectedDataTypePurposeAppFunctionality",
]) {
  requireCondition(privacyManifest.includes(requiredText), `PrivacyInfo.xcprivacy no contiene ${requiredText}`);
}

const metadata = file("APP_STORE_METADATA.md");
for (const requiredText of [
  expectedBundleId,
  "https://carlosgarau.github.io/que-te-falta/support.html",
  "https://carlosgarau.github.io/que-te-falta/privacy.html",
  "LA-COMPRA-IOS-001",
]) {
  requireCondition(metadata.includes(requiredText), `Los metadatos no contienen ${requiredText}`);
}

for (const requiredPath of [
  "privacy.html",
  "support.html",
  ".github/workflows/ios-xcode26.yml",
  ".github/workflows/ios-testflight.yml",
]) {
  file(requiredPath);
}

const appIcon = pngInfo("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
if (appIcon) {
  requireCondition(appIcon.width === 1024 && appIcon.height === 1024,
    "El icono de App Store debe medir 1024 x 1024 píxeles");
  requireCondition(![4, 6].includes(appIcon.colorType),
    "El icono de App Store no puede contener canal alfa");
}

if (failures.length) {
  console.error("Validación de App Store fallida:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Validación de App Store correcta");
console.log(`Bundle ID: ${expectedBundleId}`);
console.log("Destino: iPhone, iOS 15 o posterior, orientación vertical");
console.log("Icono: 1024 x 1024, sin transparencia");
