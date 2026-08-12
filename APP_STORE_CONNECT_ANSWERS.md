# Respuestas preparadas para App Store Connect

Valores previstos para la primera versión de **La compra**. Deben copiarse en App Store Connect cuando Apple active la membresía.

## Nueva aplicación

- Plataforma: iOS.
- Nombre público: `¿Qué te falta?`.
- Idioma principal: Español (España).
- Bundle ID: `com.carlosgarau.lacompra`.
- SKU: `LA-COMPRA-IOS-001`.
- Acceso de usuarios: completo.
- Compatibilidad inicial: iPhone, iOS 15 o posterior, orientación vertical.
- Precio: gratis.
- Compras integradas: no.
- Inicio de sesión: no.

## Categorías y derechos

- Categoría principal: Compras.
- Categoría secundaria: Productividad.
- Contenido editorial de terceros: no.
- Derechos de contenido: la aplicación solo muestra contenido introducido por las personas que usan la lista.
- Made for Kids: no.

## Privacidad

- Seguimiento, publicidad y analítica: no.
- Nombre, correo, teléfono, contactos y ubicación: no se recopilan.
- Audio: no se almacena; el micrófono se activa únicamente al pulsar el botón de voz.
- Contenido del usuario: sí, únicamente productos, cantidades, listas y caducidades cuando se activa una lista compartida.
  - Finalidad: funcionalidad de la aplicación.
  - Vinculado con la identidad: no.
  - Usado para seguimiento: no.
- Historial de compras: sí, cuando se activa una lista compartida.
  - Finalidades: personalización del producto y funcionalidad de la aplicación.
  - Vinculado con la identidad: no.
  - Usado para seguimiento: no.
- Identificador del dispositivo: identificador aleatorio de instalación para sincronización.
  - Finalidad: funcionalidad de la aplicación.
  - Vinculado con la identidad: no.
  - Usado para seguimiento: no.
- Servidor: Firebase Realtime Database; el contenido compartido se cifra en el dispositivo antes de enviarse.
- URL de privacidad: `https://carlosgarau.github.io/la-compra/privacy.html`.
- URL de opciones de privacidad: vacía; las opciones de borrado están dentro de la aplicación.

Respuestas publicadas en App Store Connect el 12 de agosto de 2026, después de revisar la sincronización con Firebase y los componentes de voz.

## Clasificación por edades

Respuestas confirmadas en App Store Connect con clasificación general 4+:

- Controles parentales y verificación de edad: no.
- Acceso web sin restricciones: no.
- Contenido generado por usuarios con distribución amplia: no. Las listas solo se comparten con personas que reciben el enlace y conocen la contraseña.
- Red social, mensajería o chat: no.
- Publicidad: no.
- Temas maduros, violencia, sexualidad, drogas, armas o lenguaje ofensivo: ninguno.
- Información médica, de tratamiento, salud o bienestar: no.
- Concursos, apuestas, juegos de azar o cajas de botín: no.
- Made for Kids: no.
- Modificación manual de la clasificación: no aplicable.

## Cifrado y exportación

- `ITSAppUsesNonExemptEncryption`: `NO`.
- La aplicación utiliza HTTPS y AES-GCM estándar para proteger listas compartidas.
- Respuesta prevista: cifrado exento, sin documentación adicional.
- Debe confirmarse en el cuestionario de exportación antes de subir la compilación final.

## Unión Europea - DSA

- Estado previsto: **no comerciante**, únicamente si la aplicación sigue siendo un proyecto personal gratuito, sin publicidad, compras ni intención de comercialización.
- Apple exige una autoevaluación del titular. Carlos debe confirmar personalmente esta declaración antes del envío.
- Si la aplicación se monetiza o pasa a formar parte de una actividad profesional, deberá revisarse el estado.

## Información para TestFlight

- Descripción beta: `Lista familiar por voz con listas compartidas y control de caducidad.`
- Funciones que probar: voz, lectura en alto, compartir una lista protegida, sincronización entre dos iPhone, notificaciones de caducidad y Atajo de Siri.
- Correo de comentarios: el correo de la Cuenta de Apple del titular.

## Información para App Review

- Persona de contacto: Carlos Garau Covas.
- Cuenta de demostración: no necesaria.
- Notas: usar las incluidas en `APP_STORE_METADATA.md`.
- URL de soporte: `https://carlosgarau.github.io/la-compra/support.html`.
- Publicación: manual después de la aprobación.
