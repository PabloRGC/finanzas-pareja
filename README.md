# Finanzas - App V3 Metas

App web/PWA para GitHub Pages enfocada en control compartido de ingresos, gastos, análisis financiero y metas de ahorro.

## Archivos

Sube estos archivos a la raíz del repositorio de GitHub Pages:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`
- `.nojekyll`

## Actualizar sin perder datos

Esta versión conserva la misma llave de almacenamiento local: `finanzasPareja.v1`.
Si ya usaban la versión anterior en el mismo link de GitHub Pages, al reemplazar archivos no deberían perder movimientos.

No borres datos del sitio en Chrome si quieres conservar la información local.

## Nota importante

La información se guarda localmente en el navegador del dispositivo. Si dos personas usan celulares distintos, cada celular guarda su propia información. Para sincronización real entre ambos celulares se necesitaría conectar una base de datos o Google Sheets como backend.


## Nota V3.2
Corrige un error de inicio que podía impedir que los botones respondieran en algunos dispositivos después de actualizar desde versiones anteriores. Mantiene la misma llave de almacenamiento para conservar movimientos y metas.


## Cambios V3.2

- Se agregó acceso visible a Ajustes desde la barra inferior.
- Se agregó tarjeta de Saldo inicial en Inicio.
- Se agregó botón rápido para editar saldo inicial sin buscarlo en la app.
- Se conserva la misma llave de almacenamiento local para no perder movimientos ni metas.
