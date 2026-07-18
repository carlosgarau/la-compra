# La compra

## Instalar la lista familiar en iPhone

1. Abrir el enlace familiar completo en Safari.
2. Comprobar que la cabecera indica `Compartida`.
3. Usar `Compartir` > `Añadir a pantalla de inicio`.
4. Abrir el nuevo icono. La app recuperará la familia mediante una cookie segura del propio sitio, aunque iOS mantenga separado el almacenamiento de Safari y el de la app instalada.

Una lista de la compra familiar pensada para usarla con una mano y por voz.

## Qué hace

- Añade varios productos con una sola frase.
- Detecta productos repetidos y pregunta si debe aumentar la cantidad.
- Agrupa automáticamente por familias.
- Guarda por separado lo pedido y lo realmente comprado.
- Al terminar, pregunta la caducidad de los productos más delicados.
- Avisa cuando quedan 3 días y 1 día, pregunta si ya se han consumido y recomienda congelarlos cuando corresponde.
- Recuerda productos que hace tiempo que no se compran.
- Sugiere frutas y verduras que suelen estar de temporada cada mes.
- Funciona sin conexión después de abrirla por primera vez.
- Guarda los datos únicamente en el dispositivo y permite exportar una copia.

## Frases útiles

- “Leche, pan y dos kilos de patatas”.
- “Agrega tomates”.
- “Voy a hacer la compra”.
- “Hazme la lista final que voy a comprar”.
- “¿Qué hay en la lista de la compra?”.
- “Léeme la lista”.
- “He comprado hamburguesas extra que caducan en tres días”.
- “He terminado la compra”.

## Caducidades

Al guardar una compra, la aplicación pregunta la fecha de los productos frescos, la carne, el pescado y los lácteos. Los avisos aparecen en **Ideas** y se repiten al entrar en los tramos de 3 días y 1 día. En el segundo aviso, si el producto admite congelación, propone congelarlo ese mismo día.

La aplicación solicita permiso para mostrar notificaciones y comprueba las fechas al abrirse o volver al primer plano. Desde cada aviso se puede indicar que el producto ya está consumido para dejar de recibir recordatorios.

## Instalación en iPhone

La aplicación debe publicarse primero en una dirección HTTPS. Después:

1. Abre esa dirección en Safari.
2. Pulsa **Compartir**.
3. Elige **Añadir a pantalla de inicio**.
4. Abre **La compra** y acepta el permiso del micrófono la primera vez.

## Uso con Siri

El atajo del iPhone se llama **“Abre la lista de la compra”**. Al invocarlo con Siri, pregunta **“¿Qué quieres hacer?”**, codifica la respuesta dentro de una URL y abre:

`https://carlosgarau.github.io/la-compra/?command=RESPUESTA`

La aplicación interpreta la respuesta al abrirse. Puede añadir productos, leer la lista, mostrarla agrupada para ir tachando o registrar una compra extra con su fecha de caducidad. Si en la compra extra se dicen a la vez el producto y la fecha —por ejemplo, **“He comprado hamburguesas extra que caducan en tres días”**— queda registrada sin tocar la pantalla.

Para probarla en un ordenador, sirve esta carpeta con un servidor web local. Abrir `index.html` directamente no permite todas las funciones del micrófono ni el modo sin conexión.
