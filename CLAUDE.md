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
| Turnos cerrados | `mt_<uid>_t` | `public.turnos` | Realtime ✓ |
| Turno activo | `mt_<uid>_a` | `public.turno_activo` | Realtime ✓ (v39) |
| Salario base | `mt_<uid>_s` | `public.perfiles.salario_base` | Local manda si `sc=true` (v27) |
| Flag salario configurado | `mt_<uid>_sc` | — | Local-only por device |
| PIN | `mt_pin_<uid>` | `public.pin_lookup` | PK=pin, UNIQUE(user_id). **Upsert SIEMPRE con `{onConflict:'user_id'}`** (v36) |
| Email | — | `auth.users.email` + `pin_lookup.user_email` + `perfiles.email` | Cambiar email requiere update en cascada (v36) |
| Password | — | `auth.users` | Solo online |
| Profile name (alias "pipe") | `mt_<uid>_pname` | — | Local-only por device (v30) |
| Profile photo | `mt_<uid>_photo` | — | Local-only, JPEG 240×240 base64 (v30) |
| Prefs (quincenaMode, etc.) | `mt_<uid>_prefs` | — | Local-only |
| Sesión actual | `mt_sess` | — | Limpia en logout (preserva PIN+offline cache) |
| Marcador "device conocido" | `mt_last_user` | — | Habilita FastPinScreen (v37) |
| Sesión offline cacheada | `mt_offline_<base64(email)>` | — | Para login sin red |
| Password offline | `mt_pass_<base64(email)>` | — | ⚠️ plaintext (deuda de seguridad, marcada para refactor) |

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

**RLS pendiente** (advisory de Supabase): `public.config` y `public.Empleados` tienen RLS deshabilitado. No aplicar enable sin definir policies primero (bloquearía todo acceso).

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

## Cómo testear cambios (mientras no haya Playwright)

1. `scripts/check.sh` — parse + version drift check (corre solo en pre-commit si está configurado).
2. Probar en consola del navegador mirando `[SyncQueue]` logs.
3. Para sync entre devices: abrir Chrome + Safari con la **misma cuenta**, hacer la acción, esperar < 1 s.

## Helpers útiles

- `leer(key, fallback)` / `grabar(key, val)` / `borrarKey(key)` — wrappers de localStorage con try/catch
- `dk(uid, suffix)` → `'mt_' + uid + '_' + suffix`
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

## Cosas a evitar

- ❌ `let` / `const` en JS de app (sí en `sw.js`/`init.js`)
- ❌ Arrow functions
- ❌ JSX
- ❌ Crear archivos `*.md` sin pedido explícito
- ❌ Crear archivos nuevos sin agregarlos a `index.html` Y `sw.js`
- ❌ Bumpear versión manual (usar `scripts/bump.sh`)
- ❌ Upsert en `pin_lookup` sin `{onConflict: 'user_id'}`
- ❌ Lookup por `user_email` (usar `user_id`)
- ❌ Pushear a `master` sin pasar `scripts/check.sh`
- ❌ Habilitar RLS en `config` / `Empleados` sin definir policies antes

## Comandos rápidos

```bash
scripts/bump.sh 42 "Label de la release"   # bumpear las 3 versiones
scripts/check.sh                           # validar sintaxis + version drift
git push origin claude/funny-hawking-pac1m # branch de desarrollo
```
