# Mi Turno · Colombia

**Nómina inteligente para trabajadores por turnos.**

Mi Turno calcula automáticamente el salario real de cada turno aplicando todos los recargos de ley colombiana: nocturno, dominical, festivo, horas extra y sus combinaciones (ej. hora extra nocturna dominical). Funciona como PWA instalable, es 100% offline-first, y sincroniza en tiempo real entre dispositivos.

---

## ¿Qué problema resuelve?

Los trabajadores por turnos en Colombia (salud, seguridad, logística, manufactura) pierden entre el 20 % y el 40 % de su salario real por no conocer o no poder calcular los recargos a los que tienen derecho. Las liquidaciones manuales en Excel generan errores. Mi Turno automatiza ese cálculo según la **Ley 2101/2021** y el **CST Arts. 168–171**.

---

## Stack y decisiones técnicas

| Capa | Tecnología | Por qué |
|---|---|---|
| UI | React 18 (UMD/CDN) | Sin transpilación; carga directa en el browser |
| Renderizado | `h = React.createElement` (sin JSX) | Compatible con ES5 sin build step |
| Estilo | CSS modular (38 archivos) | Un archivo por responsabilidad; edición quirúrgica |
| Estado | `localStorage` via `leer()`/`grabar()` | Offline-first; datos disponibles sin red |
| Backend | Supabase (Auth + Postgres + Realtime) | BaaS gestionado; Realtime para sync cross-device |
| Deploy | Vercel (auto-deploy desde `master`) | Zero-config; CDN edge global |
| Offline | Service Worker con precache estricto | Instalación y uso sin conexión |
| Tests | Playwright (Chromium + WebKit) + smoke tests | Cubre iOS Safari y Android Chrome |

**Decisión deliberada:** no hay build tools (no Webpack, no Vite). El proyecto corre directamente desde HTML/JS/CSS. Esto reduce la fricción de onboarding a cero y mantiene el stack auditable línea a línea.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / PWA                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Inicio  │  │ Análisis │  │Asistente │  │  Historial   │   │
│  │ home.js  │  │dashboard │  │assistant │  │  history.js  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └─────────────┴──────────────┴────────────────┘          │
│                            │                                    │
│                     app-main.js  ←  root.js  ←  init.js        │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │                     SERVICIOS                             │ │
│  │  calculator.js · data.js · supabase.js · ai.js            │ │
│  │  sync-queue.js · session-sync.js · export-*.js            │ │
│  └──────────────┬──────────────────────────┬─────────────────┘ │
│                 │                          │                    │
│          localStorage                Service Worker            │
│          (offline-first)             (precache + sync)         │
└─────────────────│──────────────────────────│───────────────────┘
                  │                          │
          ┌───────▼──────────────────────────▼────────┐
          │              SUPABASE                      │
          │  Auth · Postgres · Realtime · Edge Fns     │
          └────────────────────────────────────────────┘
```

### Flujo de datos offline-first

```
Acción del usuario
  │
  ├─→ Actualiza localStorage (UI instantánea, sin esperar red)
  │
  ├─→ queueAction(uid, type, payload)        [sync-queue.js]
  │         │
  │         └─→ _scheduleFlush(uid)           [debounce 250 ms]
  │                   │
  │                   └─→ processQueue(uid)   [con IN_FLIGHT guard]
  │                             │
  │                             └─→ supaXxx() helpers  [supabase.js]
  │
  └─→ Realtime channel recibe el cambio
            │
            └─→ otros dispositivos → cargarDatos() → render
```

---

## Esquema de base de datos (Supabase)

```sql
auth.users           (uid PK)
  └─ fuente de verdad para email y contraseña

public.perfiles      (id PK = uid, email, salario_base, updated_at)
public.pin_lookup    (pin PK, user_id UNIQUE, user_email)
public.turnos        (id PK, user_id, inicio, fin, pago)
public.turno_activo  (user_id PK, id, inicio)
public.email_logs    (id PK, user_id, to_email, format, status, ...)
```

**Invariantes de seguridad:**
- Lookups siempre por `user_id`, nunca por `user_email` (el email es mutable).
- Upsert en `pin_lookup` siempre con `{ onConflict: 'user_id' }`.
- RLS activo en todas las tablas activas; tablas legacy con deny-all explícito.

---

## Estructura del proyecto

```
mi-turno-BETA/
├── index.html              Punto de entrada (carga ~80 archivos en orden)
├── sw.js                   Service Worker (split cache shell/CDN)
├── version.json            Fuente de verdad de versión para updates
├── manifest.json           PWA manifest (nombre, iconos, tema)
│
├── css/                    38 archivos CSS modulares
│   ├── base/               Variables, reset, tipografía, backgrounds
│   ├── layout/             Header, hero-card, progress-bar, botón acción
│   ├── components/         Buttons, cards, inputs, switches, dashboard, chat
│   ├── modals/             Overlays, bottom-sheets, time-picker, splash
│   └── animations/         @keyframes centralizados
│
├── js/                     39 archivos JS (ES5 + globals window.*)
│   ├── config/             react-init, env, viewport-fix, globals
│   ├── utils/              storage, format, haptic, network, festivos,
│   │                       time, validation, otp, password-hash, uuid, icons
│   ├── services/           supabase, calculator, data, ai, sync-queue,
│   │                       session-sync, export-files, export-email,
│   │                       ai-history, ai-greeting, quincena
│   ├── tabs/               home, dashboard, assistant, history, config
│   ├── modals/             auth-forms, pin-setup, manage-account,
│   │                       export-report, email-compose, splash,
│   │                       diagnostico, asignar-pins, usuarios
│   └── app/                auth-screen, fast-pin-screen, app-main,
│                           root, sw-register, init
│
├── supabase/
│   └── functions/
│       ├── send-report/    Edge Function: enruta reportes al admin para reenvío
│       └── send-pin/       Edge Function: envío de PIN por email
│
├── tests/
│   ├── smoke.cjs           Tests de funciones puras (calculator, format, etc.)
│   └── e2e/                Playwright: boot, flujo invitado (Chromium + WebKit)
│
└── scripts/
    ├── bump.sh             Sincroniza versión en las 3 fuentes (globals/sw/version.json)
    └── check.sh            Valida sintaxis, versiones y precache antes de push
```

---

## Convenciones de código

El proyecto usa **ES5 deliberadamente** para compatibilidad con la gama de dispositivos Android de gama baja más comunes en el segmento objetivo.

```javascript
// ✅ Correcto
var total = turnos.map(function (t) { return t.pago; });
var dk = function (uid, k) { return 'mt_' + k + '_' + uid; };

// ❌ No usar en archivos js/
const total = turnos.map(t => t.pago);
```

| Regla | Motivo |
|---|---|
| `var` siempre | Consistencia; no `let`/`const` salvo en `sw.js` / `init.js` |
| Sin arrow functions | Historial: revertir arrows rompió v37 |
| `h(tag, props, ...children)` | React sin JSX; no transpilación |
| Sin emojis en código | Salvo que el diseño lo requiera explícitamente |
| Sin comentarios de "qué" | Solo comentarios de "por qué" cuando no es obvio |

---

## Variables globales clave

| Variable | Tipo | Descripción |
|---|---|---|
| `SUPA` | Supabase client | Cliente autenticado; `null` si no hay red |
| `CLOUD_MODE` | boolean | `true` cuando hay sesión activa en Supabase |
| `MT_APP_VERSION` | string | `'vNN'` — versión en runtime |
| `window.__mtTurnoActivo` | boolean | El SW lo lee para diferir updates durante un turno |
| `leer(key, fallback)` | fn | `localStorage.getItem` con try/catch |
| `grabar(key, val)` | fn | `localStorage.setItem` con try/catch |
| `dk(uid, suffix)` | fn | Genera `'mt_<suffix>_<uid>'` — clave de storage |
| `doCalc(turnos, activo, ahora, vh)` | fn | Calculador central de nómina |
| `fCOP(n)` | fn | Formatea número como moneda COP |
| `fDur(mins)` | fn | `"2h 30m"` desde minutos |
| `esFest(date)` | fn | ¿Es día festivo en Colombia? |
| `_mtHardReset()` | fn | Nuclear: borra caches + SW + recarga |

---

## Versionado

Tres fuentes de verdad que **siempre** deben estar sincronizadas:

| Archivo | Línea |
|---|---|
| `js/config/globals.js` | `var MT_APP_VERSION = 'vNN';` |
| `sw.js` | `const SHELL_CACHE = 'mt-shell-vNN';` |
| `version.json` | `"v": "vNN"` |

```bash
# Siempre bumpear con el script — nunca manualmente
scripts/bump.sh 59 "Descripción del cambio"

# Validar antes de cualquier push
scripts/check.sh
```

La desincronización entre estas tres fuentes causó el **bucle infinito de reloads en v28**. El script previene que vuelva a ocurrir.

---

## Desarrollo local

```bash
# Servir la app
npm run dev          # python3 http.server en :8000
# o
npm run serve        # http-server en :8000

# Lint + formato
npm run lint
npm run format

# Tests
npm run test:smoke   # rápido, sin browser
npm run test:e2e     # Playwright (requiere: npx playwright install --with-deps chromium webkit)

# Validación completa pre-push
scripts/check.sh
```

---

## Deploy

El proyecto hace auto-deploy en **Vercel** al pushear a `master`. No hay paso de build: Vercel sirve los archivos estáticos directamente.

```bash
git push origin master   # → Vercel detecta el push → deploy en ~30s
```

El `vercel.json` configura:
- Headers de seguridad (`X-Frame-Options: DENY`, `X-Content-Type-Options`, etc.)
- Cache inmutable para assets (`/css`, `/js`, `/img`) — 1 año
- `no-store` para `sw.js`, `version.json` e `index.html` — siempre frescos
- Rewrite `/*` → `/index.html` para soporte de rutas SPA

---

## Service Worker y updates

El SW usa **split cache**:
- `mt-shell-vNN` — archivos de la app (se invalida en cada release)
- `mt-cdn-v1` — librerías CDN (~1 MB: React, Supabase, jsPDF, etc.) — sobrevive entre releases

Los updates son **silenciosos**: el nuevo SW instala en background y se activa la próxima vez que el usuario vuelve al foreground. Sin toasts, sin pantallas de recarga. Si hay un turno activo, el update se difiere hasta que termine.

---

## Edge Functions (Supabase)

| Función | Disparador | Qué hace |
|---|---|---|
| `send-report` | POST autenticado | Envía el reporte (PDF/Excel) al admin para reenvío manual al usuario |
| `send-pin` | POST autenticado | Envía el PIN de acceso por email |

Las funciones validan JWT, aplican rate limiting (10 req/hora por usuario) y registran cada envío en `public.email_logs`.

---

## Licencia

MIT — ver `package.json`.
