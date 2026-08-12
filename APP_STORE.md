# PreparaciÃ³n para App Store

Estado de este paquete: **proyecto iOS preparado; la compilaciÃ³n se ejecutarÃ¡ en GitHub Actions con macOS 26 y Xcode 26, sin necesitar un Mac propio. La firma y la subida quedan pendientes de activar la cuenta Apple Developer**.

## Lo que ya estÃ¡ configurado

- Capacitor 8 con destino mÃ­nimo iOS 15.
- Identificador del paquete: `com.carlosgarau.lacompra`.
- VersiÃ³n: `1.0`; compilaciÃ³n: `1`.
- Icono de App Store de 1024 Ã— 1024 y pantalla de inicio.
- Permisos explicados para micrÃ³fono y reconocimiento de voz.
- Compartir nativo, respuesta hÃ¡ptica y notificaciones locales de caducidad.
- Esquema `lacompra://` para el Atajo de Siri.
- Manifiesto de privacidad sin seguimiento y con los datos opcionales de sincronizaciÃ³n declarados.
- PolÃ­tica de privacidad y pÃ¡gina de ayuda incluidas en la aplicaciÃ³n.
- CategorÃ­a propuesta: **Compras**; secundaria: **Productividad**.

## Requisitos externos pendientes

1. Una suscripciÃ³n activa al Apple Developer Program.
2. Crear la ficha de la aplicaciÃ³n en App Store Connect.
3. Crear el certificado de distribuciÃ³n, el perfil de App Store y una clave de la API de App Store Connect para la compilaciÃ³n remota.
4. Publicar `privacy.html` y `support.html` en las URL indicadas en `APP_STORE_METADATA.md` antes de enviar la aplicaciÃ³n a revisiÃ³n.
5. Preparar capturas reales en los tamaÃ±os solicitados por App Store Connect.

Desde el 28 de abril de 2026, Apple exige Xcode 26 y el SDK de iOS 26 para nuevas subidas. GitHub ofrece ejecutores estÃ¡ndar `macos-26` con Xcode 26 y su uso es gratuito mientras el repositorio siga siendo pÃºblico. Fuentes oficiales: [requisitos de subida](https://developer.apple.com/app-store/submitting/), [ejecutores macOS de GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [facturaciÃ³n de Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [crear una ficha](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/) y [subir una compilaciÃ³n](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/).

## Archivos de entrega preparados

- `APP_STORE_CONNECT_ANSWERS.md`: respuestas para la ficha, privacidad, edad, cifrado y DSA.
- `APP_STORE_SCREENSHOTS.md`: formato y guion de las seis capturas reales.
- `APP_STORE_ACTIVATION_CHECKLIST.md`: orden exacto de alta, firma, TestFlight y revisiÃ³n.
- `.github/workflows/ios-testflight.yml`: compilaciÃ³n firmada, validaciÃ³n y subida manual.

## CompilaciÃ³n sin Mac propio

El flujo `.github/workflows/ios-xcode26.yml` ejecuta las pruebas, sincroniza Capacitor y compila la aplicaciÃ³n en un equipo remoto `macos-26` con Xcode 26.6. No usa credenciales de Apple y puede comprobar el proyecto antes de terminar la membresÃ­a.

El segundo flujo, separado y manual, ya estÃ¡ preparado en `.github/workflows/ios-testflight.yml`. Cuando la cuenta Apple Developer estÃ© activa, firmarÃ¡ el archivo y, solo si se selecciona expresamente la opciÃ³n `upload`, lo subirÃ¡ a TestFlight. Los certificados, perfiles y claves se guardarÃ¡n Ãºnicamente como secretos cifrados de GitHub; nunca dentro del repositorio.

## Alta de Apple Developer desde el iPhone

No hace falta un Mac para registrarse. Apple recomienda completar la identidad desde la app **Apple Developer** del iPhone:

1. Comprueba que la Cuenta de Apple tiene autenticaciÃ³n de dos factores y datos reales actualizados.
2. Instala o actualiza la app Apple Developer e inicia sesiÃ³n en iCloud en el iPhone.
3. En Apple Devmxã]¸¶‰Ëkºwµç\ÙpìXHH[Y[›ÜÈØ\˜Xİ\™\ËÛO‚ˆO‘[YÙHÚ]Ğ\[ˆHÚ˜HHÛÛ\\\‹ÛO‚ˆO‘[°ëXHHÛÛ˜\ÙpìXH[ˆ[ˆY[œØZ™HÙ\\˜YËÛO‚ˆÛÛ‚ˆÛÛXİÏÚ‚ˆ”YY\ÈÛÛ][šXØ\ˆ[˜H[˜ÚY[˜ÚXHÈ[˜HÛÛXÚ]YHš]˜XÚYY[ˆ[H™YHšÎ‹ËÙÚ]X‹˜ÛÛKØØ\›ÜÙØ\˜]KÛKXÛÛ\˜KÚ\ÜİY\È˜Ø[˜[HÛÜÜHHHÛÛ\˜OØO‹ˆ›ÈX›\]Y\ÈÛÛ˜\ÙpìX\ÈšH[›XÙ\È˜[Z[X\™\ÈÛÛ\]ÜËÜ‚ˆH™YHœš]˜XŞKš[“Y\ˆHÛ0ë]XØHHš]˜XÚYYØOÜ‚ˆÛXZ[‚ˆØ›ÙO‚Ú[‚