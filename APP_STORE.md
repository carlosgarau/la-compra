# Preparación para App Store

Estado de este paquete: **proyecto iOS preparado; la compilación se ejecuta en GitHub Actions con macOS 26 y Xcode 26, sin necesitar un Mac propio. La cuenta Apple Developer, el App ID y el perfil de App Store están activos**.

## Lo que ya está configurado

- Capacitor 8 con destino mínimo iOS 15.
- Identificador del paquete: `com.carlosgarau.lacompra`.
- Versión: `1.0`; compilación: `1`.
- Icono de App Store de 1024 × 1024 y pantalla de inicio.
- Permisos explicados para micrófono y reconocimiento de voz.
- Compartir nativo, respuesta háptica y notificaciones locales de caducidad.
- Esquema `lacompra://` para el Atajo de Siri.
- Manifiesto de privacidad sin seguimiento y con los datos opcionales de sincronización declarados.
- Política de privacidad y página de ayuda incluidas en la aplicación.
- Categoría propuesta: **Compras**; secundaria: **Productividad**.

## Requisitos externos pendientes

1. Una suscripción activa al Apple Developer Program.
2. Crear la ficha de la aplicación en App Store Connect.
3. Mantener vigentes el certificado de distribución y la clave de la API de App Store Connect para la compilación remota.
4. Publicar `privacy.html` y `support.html` en las URL indicadas en `APP_STORE_METADATA.md` antes de enviar la aplicación a revisión.
5. Preparar capturas reales en los tamaños solicitados por App Store Connect.

Desde el 28 de abril de 2026, Apple exige Xcode 26 y el SDK de iOS 26 para nuevas subidas. GitHub ofrece ejecutores estándar `macos-26` con Xcode 26 y su uso es gratuito mientras el repositorio siga siendo público. Fuentes oficiales: [requisitos de subida](https://developer.apple.com/app-store/submitting/), [ejecutores macOS de GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [facturación de Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [crear una ficha](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/) y [subir una compilación](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/).

## Archivos de entrega preparados

- `APP_STORE_CONNECT_ANSWERS.md`: respuestas para la ficha, privacidad, edad, cifrado y DSA.
- `APP_STORE_SCREENSHOTS.md`: formato y guion de las seis capturas reales.
- `APP_STORE_ACTIVATION_CHECKLIST.md`: orden exacto de alta, firma, TestFlight y revisión.
- `.github/workflows/ios-testflight.yml`: compilación firmada, validación y subida manual.

## Compilación sin Mac propio

El flujo `.github/workflows/ios-xcode26.yml` ejecuta las pruebas, sincroniza Capacitor y compila la aplicación en un equipo remoto `macos-26` con Xcode 26.6. No usa credenciales de Apple y puede comprobar el proyecto antes de terminar la membresía.

El segundo flujo, separado y manual, está preparado en `.github/workflows/ios-testflight.yml`. Firma automáticamente con el perfil vigente y, solo si se selecciona expresamente la opción `upload`, sube el IPA a TestFlight. Los certificados y claves se guardan únicamente como secretos cifrados de GitHub; nunca dentro del repositorio.

## Alta de Apple Developer desde el iPhone

No hace falta un Mac para registrarse. Apple recomienda completar la identidad desde la app **Apple Developer** del iPhone:

1. Comprueba que la Cuenta de Apple tiene autenticación de dos factores y datos reales actualizados.
2. Instala o actualiza la app Apple Developer e inicia sesión en iCloud en el iPhone.
3. En Apple Developer, abre **Account > Enroll Now**.
4. Decide el tipo de alta antes de continuar:
   - **Individual:** el nombre legal de la persona aparece públicamente como vendedor.
   - **Organización:** aparece la razón social, pero Apple solicita entidad legal, web pública, autoridad de firma y número D-U-N-S.
5. Completa tú mismo la fotografía del documento de identidad, la aceptación del contrato y la suscripción anual.

Apple indica una cuota anual de 99 USD o su equivalente local. La suscripción se renueva automáticamente si el alta se realiza desde la app. Referencia: [alta y verificación con Apple Developer](https://developer.apple.com/help/account/membership/enrolling-in-the-app/).

## Compilar en un Mac, solo si alguna vez se dispone de uno

Desde la raíz del proyecto:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm ios:sync
pnpm ios:open
```

En Xcode:

1. Selecciona el proyecto **App** y el destino **App**.
2. En **Signing & Capabilities**, activa la firma automática y elige tu equipo Apple Developer.
3. Confirma que el Bundle Identifier sea `com.carlosgarau.lacompra`. Si ya estuviera ocupado en tu cuenta, cambia el identificador tanto en Xcode como en `capacitor.config.json`.
4. Conecta un iPhone y comprueba voz, notificaciones, acceso con Apple, compartir por WhatsApp y actualización entre dos dispositivos.
5. Selecciona **Any iOS Device (arm64)** y usa **Product > Archive**.
6. En Organizer, ejecuta **Validate App** y después **Distribute App > App Store Connect > Upload**.

## Crear la ficha en App Store Connect

- Plataforma: iOS.
- Nombre público: ¿Qué te falta?
- Idioma principal: Español (España).
- Bundle ID: el mismo que en Xcode.
- SKU sugerido: `LA-COMPRA-IOS-001`.
- Acceso de usuarios: completo.
- Precio inicial propuesto: gratis.
- No requiere usuario de demostración para las funciones locales. Para revisar el uso compartido, Apple puede usar <strong>Iniciar sesión con Apple</strong>.

La aplicación ofrece <strong>Iniciar sesión con Apple</strong> como equivalente a Google y permite eliminar la cuenta y sus datos desde Ajustes, de acuerdo con la regla 4.8. Las funciones personales siguen disponibles sin iniciar sesión. Consulta las [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Privacidad y cifrado

En App Store Connect, indica:

- Seguimiento: no.
- Datos vinculados a la identidad: nombre, correo, identificador de usuario y contenido compartido cuando se inicia sesión.
- Otros contenidos del usuario: sí, solo cuando se activa una lista compartida; finalidad «Funcionalidad de la app».
- Historial de compras: sí, solo cuando se activa una lista compartida; finalidades «Personalización del producto» y «Funcionalidad de la app».
- Identificador del dispositivo: identificador aleatorio de la instalación, no vinculado; finalidad «Funcionalidad de la app».
- Publicidad, analítica, contactos y ubicación: no. El correo se recibe del proveedor elegido únicamente para autenticación y miembros.

La etiqueta de privacidad se publicó en App Store Connect el 12 de agosto de 2026. La app se configuró como gratuita, pública y disponible al publicarse en 175 países o regiones, con España como región base.

La aplicación usa AES-GCM mediante Web Crypto y HTTPS, tecnologías estándar proporcionadas por el sistema. `ITSAppUsesNonExemptEncryption` está configurado como `NO` al considerarse cifrado exento de documentación. Hay que confirmar esta respuesta en el cuestionario de exportación de App Store Connect, especialmente si cambia la implementación o la disponibilidad por países. Referencias: [declaración de cifrado](https://developer.apple.com/documentation/Security/complying-with-encryption-export-regulations) y [privacidad de la app](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).

## Comprobaciones antes de enviar

- Ejecutar `pnpm check` sin errores.
- Probar la compilación Release en un iPhone físico.
- Confirmar que cada invitación permite acceder únicamente a la lista elegida.
- Verificar sincronización entre dos cuentas y retirada de acceso desde Miembros.
- Denegar micrófono y notificaciones y comprobar que la app sigue siendo utilizable por teclado.
- Confirmar que «Eliminar mi cuenta y mis datos» borra la cuenta y las listas compartidas de su propiedad.
- Revisar los textos de permisos y la política publicada.
- Completar edad, categoría, derechos de contenido, DSA y disponibilidad en App Store Connect.
- Subir las capturas, seleccionar la compilación y enviar manualmente a App Review.
