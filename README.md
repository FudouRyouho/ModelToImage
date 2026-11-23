# ModelToImage

> **Un ZIP con un OBJ. Dos resultados listos para descargar.**
>
> Convertí una escena Wavefront OBJ local en una imagen PNG y un GIF animado de rotación, directamente en tu navegador.

`ZIP OBJ` → `Importación en el navegador` → `Render WebGL` → **PNG + GIF**

Sin cuentas, subidas, almacenamiento de modelos en un servidor ni procesamiento por lotes. Cada ejecución genera ambos resultados.

## Inicio rápido

### Con Docker

```sh
docker compose up --build -d
```

Abrí [http://localhost:8080](http://localhost:8080). Para usar otro puerto, definí `MODELTOIMAGE_PORT`. Para detener la aplicación:

```sh
docker compose down
```

La imagen compila la aplicación de una sola página (SPA) con Node y sirve los archivos estáticos con Nginx. `/healthz` es el endpoint de salud del contenedor; los modelos no se envían al contenedor para procesarlos.

### Desarrollo local

Requiere Node.js 20.19+ o 22.12+.

```sh
npm ci
npm run dev
```

Abrí la URL que muestra Vite, seleccioná un ZIP y, si hace falta, ajustá **Render settings**. Después elegí **Generate PNG + GIF**. Mantené la pestaña abierta hasta que termine el procesamiento.

## Qué podés convertir

Seleccioná un ZIP que contenga:

- Exactamente un archivo `.obj`.
- Opcionalmente, un archivo `.mtl` y sus texturas PNG, JPEG o TGA.

Las rutas de los recursos deben resolverse dentro del ZIP. Se rechazan los archivos y las URL externas. Límites del archivo: **64 MiB comprimidos**, **128 entradas**, **64 MiB por entrada expandida** y **128 MiB expandidos en total**.

## Resultados y ajustes

Cada ejecución genera una imagen PNG y un GIF animado de rotación. Descargalos antes de elegir otro ZIP o salir de la página: los enlaces son URL temporales del navegador, no archivos guardados. Los ajustes se conservan en el almacenamiento local del navegador; los modelos importados y los resultados no.

Usá al menos dos fotogramas enteros, una velocidad de fotogramas positiva y dimensiones enteras positivas. Se requiere compatibilidad con WebGL y suficiente memoria en el navegador.

## Privacidad

El ZIP se lee y se procesa localmente en el navegador. La geometría, las texturas y las imágenes generadas no se suben ni se guardan en un servidor. Al cerrar la pestaña, el trabajo termina y se liberan las URL temporales.

## Verificaciones

```sh
npm test
npm run test:spa
npm run typecheck
npm run lint
npm run format:check
npm run test:docker
```

`test:spa` compila el paquete de producción y comprueba los archivos generados, incluido el archivo de trabajo que utiliza el codificador de GIF. `test:docker` requiere Docker y curl; verifica la página, el endpoint de salud y los recursos estáticos del contenedor. `format:check` valida el formato; ejecutá `npm run format` para aplicarlo. Estas pruebas automatizadas no reemplazan una ejecución en un navegador con WebGL usando tu propio paquete de modelos.

## Recursos de referencia

Los modelos de `public/assets` son muestras de referencia; no se cargan como catálogo. Se incluyen en el contexto de Docker cuando están presentes.
