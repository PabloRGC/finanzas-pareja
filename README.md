# Finanzas Compartidas · V4 Sync

App web/PWA para celular con ingresos, gastos, análisis, metas de ahorro y sincronización entre dos teléfonos usando Firebase Firestore.

## Qué cambió en V4

- Sincronización en la nube para que ambos teléfonos vean los mismos movimientos.
- Registro de gastos e ingresos compartido.
- Metas compartidas con progreso y aportes sugeridos.
- Ajustes compartidos: saldo inicial y meta mensual.
- Conserva modo local si todavía no conectas Firebase.
- Mantiene la misma llave local `finanzasPareja.v1`, para ayudar a conservar los datos anteriores del navegador.

## Antes de actualizar

1. Abre la app actual.
2. Ve a **Ajustes**.
3. Presiona **Exportar respaldo JSON**.
4. Guarda ese archivo por seguridad.

## Subir a GitHub Pages

Reemplaza en tu repositorio los archivos:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`
- `.nojekyll`
- `README.md`

Espera unos minutos y abre de nuevo el mismo link de GitHub Pages.

## Configurar Firebase para compartir entre celulares

### 1. Crear proyecto

1. Entra a Firebase Console.
2. Crea un proyecto nuevo.
3. Agrega una app web.
4. Copia el objeto `firebaseConfig`.

### 2. Activar Authentication anónimo

1. Ve a **Authentication > Sign-in method**.
2. Activa **Anonymous**.

### 3. Crear Firestore

1. Ve a **Firestore Database**.
2. Crea una base de datos.
3. Usa la región que prefieras.

### 4. Reglas recomendadas para esta versión sencilla

En **Firestore Database > Rules**, pega:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /finanzasParejaV4/{groupId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Esto permite acceso solo a usuarios autenticados por la app. Como usamos acceso anónimo, la privacidad depende mucho de que el código de grupo sea difícil de adivinar. Usa un código largo, por ejemplo: `fin-casa-2026-x9k2p7`.

## Dos maneras de conectar la app

### Opción A — Recomendada: dejar Firebase fijo en el código

Abre `index.html`, busca:

```js
const FIREBASE_CONFIG_PRESET = null;
```

Reemplázalo por tu configuración:

```js
const FIREBASE_CONFIG_PRESET = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
};
```

Después sube el archivo actualizado a GitHub. Así ambos celulares solo necesitan poner el mismo **código de grupo**.

### Opción B — Pegar configuración desde la app

En **Ajustes > Sincronización**, pega el objeto `firebaseConfig` en el cuadro de configuración y usa el mismo código de grupo en ambos celulares.

## Cómo migrar sin perder datos

En el primer celular, donde ya tienen los registros:

1. Abre la app actualizada.
2. Ve a **Ajustes > Sincronización**.
3. Genera o escribe un **código de grupo**.
4. Presiona **Conectar sincronización**.
5. Si la nube está vacía, acepta subir los datos de ese celular.
6. También puedes presionar **Subir datos de este celular a la nube**.

En el segundo celular:

1. Abre el mismo link.
2. Ve a **Ajustes > Sincronización**.
3. Usa el mismo código de grupo.
4. Presiona **Conectar sincronización**.
5. Los datos deberían cargarse automáticamente.

## Nota importante

Esta es una versión ligera sin cuentas personales. Para un nivel de seguridad mayor, la siguiente mejora sería usar usuarios con correo/contraseña o Google Sign-In y reglas por miembros autorizados.
