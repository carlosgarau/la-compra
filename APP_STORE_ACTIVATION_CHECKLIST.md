# Checklist al activarse Apple Developer

## Portal Apple Developer

- [ ] Confirmar que la membresía ya no aparece como `Pending`.
- [ ] Crear el App ID explícito `com.carlosgarau.lacompra`.
- [ ] Crear un certificado Apple Distribution.
- [x] Activar <strong>Sign in with Apple</strong> en el App ID y regenerar el perfil App Store.
- [ ] Descargar el certificado como `.p12`.

## App Store Connect

- [ ] Aceptar los acuerdos vigentes en Business si Apple los solicita.
- [ ] Crear la ficha con los valores de `APP_STORE_CONNECT_ANSWERS.md`.
- [ ] Crear una clave de API de App Store Connect con acceso suficiente para subir compilaciones.
- [ ] Guardar los secretos indicados abajo en el entorno protegido `app-store` de GitHub.

## Secretos de GitHub

- `APPLE_TEAM_ID`: identificador de equipo de diez caracteres.
- `APPLE_CERTIFICATE_P12_BASE64`: certificado de distribución P12 codificado en Base64.
- `APPLE_CERTIFICATE_PASSWORD`: contraseña elegida al exportar el P12.
- `APPLE_API_PRIVATE_KEY`: contenido completo de la clave `AuthKey_XXXXXXXXXX.p8`.
- `APPLE_API_KEY_ID`: identificador de la clave de API.
- `APPLE_API_ISSUER_ID`: identificador del emisor mostrado en App Store Connect.

El flujo usa firma automática autenticada con la clave de App Store Connect, por lo que obtiene el perfil vigente en cada compilación. Los certificados y claves no deben guardarse en el repositorio ni enviarse por correo o chat.

## Primera compilación

- [ ] Ejecutar `Comprobar iOS con Xcode 26`.
- [ ] Ejecutar `Preparar o subir ¿Qué te falta? a TestFlight` con `upload` desactivado.
- [ ] Revisar el IPA y los registros.
- [ ] Ejecutar otra vez el flujo con `upload` activado para subir a TestFlight.
- [ ] Esperar a que Apple procese la compilación y resolver cualquier aviso.

## Prueba y envío

- [ ] Probar en el iPhone de Carlos.
- [ ] Probar sincronización con un segundo iPhone.
- [ ] Generar las seis capturas de `APP_STORE_SCREENSHOTS.md`.
- [x] Completar privacidad, clasificación por edades, disponibilidad y contacto de revisión.
- [ ] Confirmar cifrado de exportación y completar la declaración DSA.
- [ ] Seleccionar la compilación aprobada de TestFlight.
- [ ] Enviar a App Review únicamente tras una revisión final de la ficha.
- [ ] Elegir publicación manual para comprobar el resultado antes de hacerla pública.
