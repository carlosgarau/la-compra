# ¿Qué te falta?

Lista familiar para iPhone y web, pensada para usarla con una mano o mediante la voz.

## Funciones principales

- Añade varios productos con una sola frase y agrúpalos por familias.
- Detecta repetidos y pregunta si debe aumentar la cantidad.
- Permite tachar productos desde el móvil y conserva el historial real.
- Mantiene listas puntuales independientes, por ejemplo «Navidad».
- Controla caducidades, avisa 3 días y 1 día antes y recomienda congelar cuando corresponde.
- Lee la lista en voz alta y entiende órdenes como «¿qué hay en la lista?».
- Comparte la lista familiar o una lista puntual mediante la hoja nativa de iOS, incluido WhatsApp.
- Cifra cada lista compartida con una contraseña que no viaja dentro del enlace.
- Funciona sin cuenta: los datos locales permanecen en el dispositivo y compartir es opcional.

## Seguridad al compartir

La aplicación cifra las listas compartidas con AES-256-GCM. La clave se deriva de una contraseña de al menos 8 caracteres mediante PBKDF2-SHA256. El enlace y la contraseña deben enviarse por canales o mensajes separados. El servidor recibe el contenido cifrado, no la contraseña.

## Desarrollo

Requisitos: Node.js, pnpm y, para compilar iOS, macOS con Xcode 26 o posterior.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build:web
pnpm ios:sync
pnpm ios:open
```

`pnpm build:web` crea `www/`, la versión empaquetada dentro de la aplicación. El proyecto nativo está en `ios/App/App.xcodeproj`.

## Siri y Atajos

La aplicación iOS acepta órdenes mediante el esquema:

```text
lacompra://?command=ORDEN_CODIFICADA
```

En el Atajo «Abre ¿Qué te falta?», conserva las acciones para pedir texto y codificarlo, pero cambia la URL web por `lacompra://?command=` seguida de la variable codificada. La versión web continúa admitiendo:

```text
https://carlosgarau.github.io/que-te-falta/?command=ORDEN_CODIFICADA
```

## Publicación

- [Preparación y subida a App Store](APP_STORE.md)
- [Textos y datos para App Store Connect](APP_STORE_METADATA.md)
- [Respuestas de App Store Connect](APP_STORE_CONNECT_ANSWERS.md)
- [Plan de capturas](APP_STORE_SCREENSHOTS.md)
- [Checklist de activación](APP_STORE_ACTIVATION_CHECKLIST.md)
- [Política de privacidad](privacy.html)
- [Ayuda y contacto](support.html)
