# Â¿QuÃ© te falta?

Lista familiar para iPhone y web, pensada para usarla con una mano o mediante la voz.

## Funciones principales

- AÃ±ade varios productos con una sola frase y agrÃºpalos por familias.
- Detecta repetidos y pregunta si debe aumentar la cantidad.
- Permite tachar productos desde el mÃ³vil y conserva el historial real.
- Mantiene listas puntuales independientes, por ejemplo Â«NavidadÂ».
- Controla caducidades, avisa 3 dÃ­as y 1 dÃ­a antes y recomienda congelar cuando corresponde.
- Lee la lista en voz alta y entiende Ã³rdenes como Â«Â¿quÃ© hay en la lista?Â».
- Comparte la lista familiar o una lista puntual mediante la hoja nativa de iOS, incluido WhatsApp.
- Cifra cada lista compartida con una contraseÃ±a que no viaja dentro del enlace.
- Funciona sin cuenta: los datos locales permanecen en el dispositivo y compartir es opcional.

## Seguridad al compartir

La aplicaciÃ³n cifra las listas compartidas con AES-256-GCM. La clave se deriva de una contraseÃ±a de al menos 8 caracteres mediante PBKDF2-SHA256. El enlace y la contraseÃ±a deben enviarse por canales o mensajes separados. El servidor recibe el contenido cifrado, no la contraseÃ±a.

## Desarrollo

Requisitos: Node.js, pnpm y, para compilar iOS, macOS con Xcode 26 o posterior.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build:web
pnpm ios:sync
pnpm ios:open
```

`pnpm build:web` crea `www/`, la versiÃ³n empaquetada dentro de la aplicaciÃ³n. El proyecto nativo estÃ¡ en `ios/App/App.xcodeproj`.

## Siri y Atajos

La aplicaciÃ³n iOS acepta Ã³rdenes mediante el esquema:

```text
lacompra://?command=ORDEN_CODIFICADA
```

En el Atajo Â«Abre Â¿QuÃ© te falta?Â», conserva las acciones para pedir texto y codificarlo, pero cambia la URL web por `lacompra://?command=` seguida de la variable codificada. La versiÃ³n web continÃºa admitiendo:

```text
https://carlosgarau.github.io/que-te-falta/?command=ORDEN_CODIFICADA
```

## PublicaciÃ³n

- [PreparaciÃ³n y subida a App Store](APP_STORE.md)
- [Textos y datos para App Store Connect](APP_STORE_METADATA.md)
- [Respuestas de App Store Connect](APP_STORE_CONNECT_ANSWERS.md)
- [Plan de capturas](APP_STORE_SCREENSHOTS.md)
- [Checklist de activaciÃ³n](APP_STORE_ACTIVATION_CHECKLIST.md)
- [PolÃ­tica de privacidad](privacy.html)
- [Ayuda y contacto](support.html)

