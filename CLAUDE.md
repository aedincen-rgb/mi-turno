# Mi Turno — guía para agentes

App PWA de cálculo de nómina para trabajadores por turnos en Colombia. Vanilla JS sin build, React via CDN UMD, Supabase como backend.

## Stack

- **Frontend**: vanilla JavaScript ES5-flavored, React 18 (UMD globals: `React`, `ReactDOM`), `h = React.createElement` (no JSX, no transpilación).
- **Persistencia local**: `localStorage` via `leer()`/`grabar()` (en `js/utils/storage.js`).
- **Backend**: Supabase (auth + Postgres + Realtime). Project ID: `yrpqvmqmchsxpotytxiy`.
- **PWA**: Service Worker (`sw.js`) con precache estricto. Cada archivo nuevo necesita registro manual ahí.
- **Deploy**: Vercel (auto-deploy desde `master`).
- **i18n**: español, mezcla tú/vos (vos en frases emocionales, tú en setup formal). UI en español argentino/colombiano.

## Convenciones de código (NO romper)

- Usar `var`, NUNCA `let`/`const` (excepto en `sw.js`/`init.js` que sí usan `const`).
- Usar `function (x) { return ... }`, NUNCA arrow functions (`x => ...`) — rompe la consistencia con el codebase y v37 ya tuvo que revertir una.
- Usar `h(tag, props, ...children)`, NUNCA JSX.
- Sin emojis en código a menos que el usuario los pida explícitamente para UX.
- Comentarios solo cuando el **porqué** no es obvio; nunca explicar **qué** hace el código.

## Carga de scripts

- Todo es global (`window.*`). Orden de `<script>` en `index.html` importa.
- Al agregar un archivo nuevo: hay que ponerlo en **`index.html`** Y en **el array `appResources` de `sw.js`** (precache). Si falta en sw.js, falla offline. Hay un linter rudimentario en `scripts/check.sh`.

## Versionado (las 3 fuentes de verdad)

Tres archivos tienen que decir lo mismo en cada release:

| Archivo | Línea |
|---|---|
| `js/config/globals.js` | `var MT_APP_VERSION = 'vNN';` |
| `sw.js` | `const CACHE = 'mt-vNN';` |
| `version.json` | `"v": "vNN"` |

**Usá siempre `scripts/bump.sh NN "Label"` para bumpear** — el sed sincroniza las 3. Hacerlo a mano causó el bug del bucle nuclear infinito en v28 (sw.js iba a v28, globals.js seguía en v27, el detector de reload fantasma loopeaba). `scripts/check.sh` aborta si están desincronizados.

## Datos: qué es local-only vs nube

| Dato | Local | Nube | Notas |
|---|---|---|---|
| Turnos cerrados | `mt_t_<uid>` *(via `dk(uid,"t")`)* | `public.turnos` | Realtime ✓ |
| Turno activo | `mt_a_<uid>` *(via `dk(uid,"a")`)* | `public.turno_activo` | Realtime ✓ (v39) |
| Salario base | `mt_s_<uid>` *(via `dk(uid,"s")`)* | `public.perfiles.salario_base` | Local manda si `sc=true` (v27) |
| Flag salario configurado | `mt_sc_<uid>` *(via `dk(uid,"sc")`)* | — | Local-only por device |
| PIN | `mt_pin_<uid>` | `public.pin_lookup` | PK=pin, UNIQUE(user_id). **Upsert SIEMPRE con `{onConflict:'user_id'}`** (v36) |
| Email | — | `auth.users.email` + `pin_lookup.user_email` + `perfiles.email` | Cambiar email requiere update en cascada (v36) |
| Password | — | `auth.users` | Solo online |
| Profile name (alias "pipe") | `mt_pname_<uid>` *(via `dk(uid,"pname")`)* | — | Local-only por device (v30) |
| Profile photo | `mt_photo_<uid>` *(via `dk(uid,"photo")`)* | — | Local-only, JPEG 240×240 base64 (v30) |
| Prefs (quincenaMode, etc.) | `mt_prefs_<uid>` *(via `dk(uid,"prefs")`)* | — | Local-only |
| Sesión actual | `mt_sess` | — | Limpia en logout (preserva PIN+offline cache) |
| Marcador "device conocido" | `mt_last_user` | — | Habilita FastPinScreen (v37) |
| Sesión offline cacheada | `mt_offline_<base64(email)>` | — | Para login sin red |
| Password offline | `mt_pass_<base64(email)>` | — | PBKDF2-SHA256 + salt random (v49). Schema `{v,s,h}`. Verificación legacy plaintext para migración suave |

## Flujo de sync (offline-first)

```
Usuario hace acción
  → setX local (UI instantánea)
  → queueAction(uid, type, payload)         [sync-queue.js]
  → _scheduleFlush(uid)                     [debounce 250ms]
  → processQueue(uid)                       [IN_FLIGHT guard]
  → supaXxx() helpers                       [supabase.js]
  → Realtime channel del propio user_id dispara
  → otros devices reciben → cargarDatos() → setX
```

**Contrato crítico**: `queueAction()` MUST trigger eventual `processQueue()`. Sin el `_scheduleFlush` la cola se estancaba (v40 fix — bug que persistió varias releases porque atacaba el síntoma equivocado).

**Realtime**: solo habilitado para `turno_activo` y `turnos` (publication `supabase_realtime`). Para agregar otra tabla:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.<tabla>;
ALTER TABLE public.<tabla> REPLICA IDENTITY FULL;
```

## Schemas de Supabase

```
auth.users           (uid PK)              ← fuente de verdad de email + password
public.perfiles      (id PK = uid)         email, salario_base, updated_at
public.pin_lookup    (pin PK)              user_id UNIQUE, user_email
public.turnos        (id PK)               user_id, inicio, fin
public.turno_activo  (user_id PK)          id, inicio
```

**Lookups por `user_id` siempre, NUNCA por `user_email`** — el email es mutable. Hubo un bug donde el lookup por email durante una transición de email regeneraba el PIN encima del real (v36 fix).

**RLS aplicado (v46)**: `public.config`, `public.Empleados` y `public.user_config` son tablas legacy huérfanas (sin referencias en el código). Tienen RLS habilitado con deny-all (sin policies). Si necesitás resucitar alguna, agregar policy explícita. NO eliminar la RLS.

**Hardening adicional aplicado (v46)**:
- `cleanup_old_pin_for_user` y `update_pin_lookup_updated_at`: `SET search_path = pg_catalog, public` (previene hijacking de funciones por usuarios con permisos en otros esquemas)
- `handle_new_user`: revocado `EXECUTE` para `anon, authenticated, public` — sigue ejecutándose como trigger pero no es callable vía REST RPC

**Pendiente (toggle dashboard, no SQL)**: `auth_leaked_password_protection` desactivado. Activar en Auth Settings → Password Strength si se desea bloquear passwords filtradas (HaveIBeenPwned).

## Patrón OTP local (v35)

Cambios de PIN/correo/password en `ManageAccountModal` y el reset en `ForgotPinModal` siguen este patrón:

1. **confirm**: validar credenciales actuales
2. **preparando**: 15s con barra de progreso (friction implícita, no decir "validación humana")
3. **codigo**: revelar 6 dígitos generados con `crypto.getRandomValues`, usuario reescribe
4. **(opcional) newpin**: solo en forgot-pin, 2 fases (ingresar + confirmar)

El código nunca sale del dispositivo. Si necesitás replicarlo, los estilos están en `css/modals/misc.css` (`.otp-prep-*`, `.otp-reveal*`).

## Cosas que ya rompieron y por qué

| Versión | Bug | Causa | Lección |
|---|---|---|---|
| v28 | App no montaba React, pantalla blanca | `init.js` reemplazado por copia del SW | Verificar que el render entrypoint exista antes de mergear |
| v28→v29 | Bucle nuclear infinito de reloads | Las 3 versiones desincronizadas | Usar `scripts/bump.sh` siempre |
| v33→v34 | "Buenos días" en AI vs "Buenas noches" en Historial a la misma hora | Dos cálculos de saludo independientes | Un único `_saludoHora()` compartido |
| v35→v36 | Cambiar PIN tiraba 23505 o creaba filas duplicadas | `upsert` sin `onConflict` y PK=pin | `{onConflict:'user_id'}` siempre |
| v36 | Cambiar email dejaba `pin_lookup.user_email` viejo → regeneración de PIN encima del real | Lookup por email frágil | Lookup siempre por `user_id` |
| v37→v39→v40 | "Iniciar turno" en device A no aparecía en device B | `queueAction` solo guardaba en localStorage, nunca llamaba `processQueue` | El sync queue debe flushear inmediato (debounced), no solo en boot/online |
| v34 | Arrow function en `sync-queue.js` | Inconsistencia con el codebase ES5 | `function(){}` siempre |
| v67 | Experimento de accesibilidad rompió el layout (pantalla blanca/desencaje) | Tocaba CSS estructural y creaba archivos a11y no registrados en `sw.js` | A11y se agrega vía atributos ARIA + HTML semántico, **nunca** reescribiendo CSS de layout. Preservar `className`, solo cambiar el `tag` o añadir props ARIA |

## Accesibilidad (WCAG 2.1 AA)

La app pasa auditoría **axe-core** con **0 violaciones** en las 6 pantallas (reglas `wcag2a/2aa/21a/21aa`). Patrones establecidos (v71):

- **Tags semánticos**: `<section>`/`<main>` con `aria-label` por tab, `<h1>`/`<h2>` con jerarquía.
- **Modales**: `role="dialog"` + `aria-modal="true"` + `aria-label`.
- **Toggles**: `role="switch"` + `aria-checked` + `aria-label` con estado ("activado/desactivado").
- **Listas tappables** (filas de turno): `role="button"` + `aria-label` con contexto completo hablado.
- **Stats numéricos** en `<div>`: requieren `role="img"` para que `aria-label` sea válido (un `div` genérico **prohíbe** `aria-label` → `aria-prohibited-attr`).
- **Live regions**: `aria-live="polite"` (chat), `role="alert"`+`aria-live="assertive"` (errores), `role="status"` (turno activo, progreso PIN).
- **Inputs**: `aria-label` aunque la etiqueta visual viva en un hermano.
- **Contraste**: `--muted` = `#646b7d` (5.3:1). NO volver a `#7a8294` (reprueba AA).
- **Viewport**: NO reponer `user-scalable=no`/`maximum-scale` en `index.html` (bloquea zoom, WCAG 1.4.4).

**Reglas de oro**: cambiar `div`→`section`/`main` preserva el `className` (CSS intacto). Íconos decorativos → `aria-hidden="true"`. Nunca poner `aria-label` en un `div` sin `role`.

## Cómo testear cambios

1. `scripts/check.sh` — parse + version drift + smoke + verificación de precache.
2. `npm run test:smoke` — solo el smoke (más rápido).
3. `npm run test:e2e` — Playwright en Chromium + WebKit móvil (motor de iOS Safari).
   - Local requiere `npx playwright install --with-deps chromium webkit` la primera vez.
   - En CI corre automático en cada PR vía `.github/workflows/e2e.yml`.
4. Para sync cross-device real: abrir Chrome + Safari con la **misma cuenta**, hacer la acción, esperar < 1 s.
5. `npm run test:a11y` — auditoría axe-core (WCAG 2.1 A/AA) sobre las 6 pantallas vía `tests/a11y.mjs`. Bloquea el SW e inyecta React local (el CDN se bloquea en sandbox). Sale con código 1 si hay **cualquier** violación. Criterio: **0 violaciones** o no se mergea.

Si CI falla, los artifacts (videos del navegador en el momento del bug) están en la pestaña "Artifacts" del workflow run en GitHub Actions.

## Helpers útiles

- `leer(key, fallback)` / `grabar(key, val)` / `borrarKey(key)` — wrappers de localStorage con try/catch
- `dk(uid, suffix)` → `'mt_' + suffix + '_' + uid` ⚠️ **key primero, uid último** (no invertir)
- `haptic()` — feedback táctil iOS
- `fCOP(n)` — formato moneda colombiana
- `fDur(mins)` — `"2h 30m"` desde minutos
- `esFest(date)` — ¿es día festivo en CO?
- `doCalc(turnos, activo, ahora, vh)` — el calculador central
- `isOnline()` / `onOnline(fn)` — estado de red
- `withTimeout(promise, ms, label)` — para promesas de red
- `_saludoHora(date)` — saludo compartido (AI + Historial)
- `_aiNombrePersonal({session})` — alias del usuario (perfil o email)
- `window._mtHardReset()` — nuclear: limpia caches + SW + reload
- `aiClassifyIntent(text, conv, ctx)` — clasificador NLP (v77)
- `aiAnalyzeMood(text, ctx)` — detección de tono emocional (v77)
- `aiResetConv()` — resetea el estado conversacional (v95)
- `backupExport()` / `backupImport(cb)` — respaldo/restauración (v96)
- `onboardingDone()` / `onboardingMarkDone()` — flag de tour guiado (v98)
- `_connState()` → `{ k, t }` — estado real de conexión a Supabase (v84)
- `revealConn()` — toggle del banner de conexión (v89, DOM directo)

## Cosas a evitar

- ❌ `let` / `const` en JS de app (sí en `sw.js`/`init.js`)
- ❌ Arrow functions
- ❌ JSX
- ❌ Optional chaining (`?.`) — rompe en Android <80 (v76 fix)
- ❌ Destructuring de arrays (`var [a,b] = ...`) — usar `var s = ...; var a = s[0]` (v76 fix)
- ❌ `transform: translateZ(0)` en contenedores de scroll — crea containing block que rompe `position:fixed` (v94 fix)
- ❌ `contain: paint` en overlays — recorta bottom sheets y banners (v93 fix)
- ❌ `display: none` en `<input type="file">` — `.click()` no funciona (v91 fix)
- ❌ `overflow: hidden` en contenedores de avatar con badge flotante (v79 fix)
- ❌ Crear archivos `*.md` sin pedido explícito
- ❌ Crear archivos nuevos sin agregarlos a `index.html` Y `sw.js`
- ❌ Bumpear versión manual (usar `scripts/bump.sh`)
- ❌ Upsert en `pin_lookup` sin `{onConflict: 'user_id'}`
- ❌ Lookup por `user_email` (usar `user_id`)
- ❌ Pushear a `master` sin pasar `scripts/check.sh`
- ❌ Habilitar RLS en `config` / `Empleados` sin definir policies antes
- ❌ Poner `aria-label` en un `div` sin `role` (usar `role="img"`/`group`)
- ❌ Reponer `user-scalable=no` en el viewport (bloquea zoom, WCAG 1.4.4)
- ❌ Tocar CSS de layout "por accesibilidad" (rompió v67) — solo ARIA + tags semánticos
- ❌ Usar estado React para overlays que pueden ir a document.body — usar DOM directo (v89 fix)

## Comandos rápidos

```bash
scripts/bump.sh 42 "Label de la release"   # bumpear las 3 versiones
scripts/check.sh                           # validar sintaxis + version drift
scripts/build.sh                           # build de producción (56 JS → 1)
git push origin master                     # deploy automático en Vercel
```

---

## Lecciones incorporadas (v76–v98)

Registradas durante la sesión del 3 de junio de 2026 con DeepSeek v4 Pro + Copilot en VS Code.

| Versión | Lección |
|---|---|
| v76 | Optional chaining (`?.`) y destructuring rompen en Android gama baja. ES5 estricto. |
| v76 | Auxilio de transporte debe usar constante global (`AUX_TRANSPORTE_2026`), nunca hardcodeado. |
| v79 | `overflow: hidden` en avatar recorta el badge de cámara. Usar `overflow: visible`. |
| v84 | El LED de conexión debe reflejar el estado real de Supabase (Realtime status), no solo `navigator.onLine`. |
| v87 | `position: fixed` no funciona dentro de contenedores con `transform`, `backdrop-filter` o `will-change`. Renderizar overlays como siblings, no como children. |
| v89 | Para overlays críticos que se rompen con React state + re-render, usar DOM directo (`document.createElement` + `appendChild`). |
| v91 | `<input type="file">` con `display: none` no responde a `.click()` en muchos navegadores. Usar `position:absolute;opacity:0`. |
| v91 | Imágenes con `position:absolute;inset:0` dentro de botones necesitan `pointer-events:none`. |
| v93 | `contain: paint` en overlays recorta bottom sheets y banners. No usar en contenedores de modales. |
| v94 | `transform: translateZ(0)` en el scroll container crea un containing block que rompe TODOS los `position: fixed` descendientes. **Nunca usar en `.scr`.** |
| v95 | El estado conversacional del NLP debe resetearse al limpiar el chat (`/limpiar` → `aiResetConv()`). |
| v96 | El respaldo de datos debe validar estructura (`app === 'mi-turno'`) antes de restaurar. |
| v97 | Un build script sin tooling (`cat` en orden) reduce 56 requests a 1 sin complejidad. |
| v98 | El onboarding debe usar `localStorage` flag para no repetirse. Spotlight via `getBoundingClientRect()` + ring animado. |
