# Finanzas - App web para celular

App sencilla para registrar ingresos, gastos y analizar finanzas por día, semana, mes y año.

## Qué incluye

- Registro rápido de gastos.
- Registro rápido de ingresos.
- Resumen de saldo actual estimado.
- Filtros por semana, mes, año y todo el historial.
- Análisis por día, semana, mes y año.
- Gráfica de gastos del periodo.
- Clasificación de gastos e ingresos.
- Sugerencias automáticas de ahorro.
- Exportación e importación de respaldo JSON.
- Exportación e importación CSV para migrar datos.
- Instalable en celular como PWA.

## Importante sobre sincronización

Esta versión está pensada para subirla rápido a GitHub Pages y no usa servidor ni base de datos.
Los datos se guardan en el navegador del celular mediante `localStorage`.

Eso significa:

- Si registras en tu celular, se guarda en tu celular.
- Si tu pareja registra en su celular, se guarda en el suyo.
- Para mantener ambos datos juntos sin backend, usen `Exportar respaldo` e `Importar`.

Para sincronización automática entre ambos celulares, la siguiente versión debe conectarse a Firebase, Supabase o Google Sheets como base de datos.

## Cómo subir a GitHub Pages

1. Crea un repositorio en GitHub. Ejemplo: `finanzas-pareja`.
2. Sube todos los archivos de esta carpeta al repositorio.
3. En GitHub, entra a `Settings > Pages`.
4. En `Build and deployment`, selecciona `Deploy from a branch`.
5. Selecciona la rama `main` y la carpeta `/root`.
6. Guarda.
7. GitHub generará una URL similar a: `https://tuusuario.github.io/finanzas-pareja/`.

## Cómo instalar en celular

### Android / Chrome

1. Abre la URL de GitHub Pages.
2. Toca los tres puntos de Chrome.
3. Selecciona `Agregar a pantalla principal`.

### iPhone / Safari

1. Abre la URL en Safari.
2. Toca Compartir.
3. Selecciona `Agregar a inicio`.

## Cómo migrar datos anteriores desde Google Sheets

1. Abre tu Google Sheet anterior.
2. Ve a la pestaña donde estén los movimientos.
3. Descarga o exporta como CSV.
4. En la app, ve a `Ajustes > Importar JSON o CSV`.
5. Selecciona el archivo CSV.

La app intenta reconocer columnas como:

- `fecha` o `date`
- `tipo` o `type`
- `cantidad`, `monto` o `amount`
- `categoria`, `clasificacion`, `origen` o `category`
- `nota`, `descripcion` o `note`

## Estructura

```text
finanzas-pareja-app/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── assets/
│   └── icon.svg
└── README.md
```

## Siguiente mejora recomendada

Conectar la app a una base de datos para que ambos celulares compartan la misma información en tiempo real.
