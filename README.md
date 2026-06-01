# Mi Turno · Colombia

**Nómina inteligente para trabajadores por turnos.**

Mi Turno calcula automáticamente el salario real de cada turno aplicando todos los recargos de ley colombiana: nocturno, dominical, festivo, horas extra y sus combinaciones (ej. hora extra nocturna dominical). Funciona como PWA instalable, es 100% offline-first, y sincroniza en tiempo real entre dispositivos.

---

## ¿Qué problema resuelve?

Los trabajadores por turnos en Colombia (salud, seguridad, logística, manufactura) pierden entre el 20 % y el 40 % de su salario real por no conocer o no poder calcular los recargos a los que tienen derecho. Las liquidaciones manuales en Excel generan errores. Mi Turno automatiza ese cálculo según la **Ley 2101/2021** y el **CST Arts. 168–171**, con cumplimiento automático y auditable.

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
          │  + RLS (Row Level Security)                │
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

## Seguridad: Row Level Security (RLS)

Mi Turno implementa **hardening de RLS** en todas las tablas críticas. Cada operación (SELECT, INSERT, UPDATE, DELETE) requiere que `auth.uid() = user_id`, previniendo que un usuario no autorizado pueda acceder a datos de otro usuario, incluso si logra romper la lógica de aplicación.

### Políticas aplicadas

**`public.turnos`** (Mis turnos registrados)
- `SELECT`: usuario lee solo sus propios turnos
- `INSERT`: usuario crea turnos asociados a su UID
- `UPDATE`: usuario modifica solo sus turnos
- `DELETE`: usuario borra solo sus turnos

**`public.turno_activo`** (Turno en curso)
- `SELECT`: usuario ve solo su turno activo
- `INSERT`: usuario inicia turno bajo su UID
- `UPDATE`: usuario modifica solo su turno activo
- `DELETE`: usuario cierra solo su turno activo

**`public.perfiles`** (Configuración personal)
- `SELECT`: usuario lee solo su perfil
- `UPDATE`: usuario modifica solo su salario_base y email
- (INSERT deshabilitado — solo sistema via trigger)

**`public.pin_lookup`** (Acceso por PIN)
- `SELECT`: usuario verifica solo su PIN
- `INSERT`: usuario crea solo su PIN
- `UPDATE`: usuario actualiza solo su PIN
- `DELETE`: usuario borra solo su PIN

### Defensa en profundidad

La RLS opera **debajo de la lógica de aplicación**, en el nivel de PostgreSQL. Incluso si un atacante:
- Roba el JWT de otro usuario
- Manipula la solicitud HTTP
- Explota un XSS

...el servidor rechaza la solicitud en la capa de base de datos. No hay bypass posible desde la aplicación.

---

## Cumplimiento automático: Ley 2101/2021

Colombia implementó la **Ley 2101 de 2021** para reducir gradualmente la jornada laboral. Mi Turno automatiza este cumplimiento sin código hardcodeado.

### Cronograma oficial (reducción gradual de la jornada)

```
Período                  Jornada máxima semanal
────────────────────────────────────────────────
Hasta 15 junio 2023     48 horas/semana
15 junio 2023 - 14 jun  47 horas/semana
15 junio 2024 - 14 jun  46 horas/semana
15 junio 2025 - 14 jun  45 horas/semana
15 junio 2026 - 30 jun  44 horas/semana
Desde 1 julio 2027      42 horas/semana (meta final)
```

### Implementación dinámica

En lugar de hardcodear el límite (ej. "máximo 46 horas"), Mi Turno **calcula automáticamente el límite según la fecha del turno**:

**`js/config/globals.js`:**
```javascript
function getHSEM(fecha) {
  var d = fecha instanceof Date ? fecha : new Date(fecha);
  if (d >= new Date(2027, 6, 1)) return 42;      // Meta final de la ley
  if (d >= new Date(2026, 6, 15)) return 44;
  if (d >= new Date(2025, 6, 15)) return 45;
  if (d >= new Date(2024, 6, 15)) return 46;
  if (d >= new Date(2023, 6, 15)) return 47;
  return 48;                                     // Estado antes de reforma
}
```

**`js/utils/time.js`:** helper adicional para auditoría
```javascript
function obtenerJornadaMaximaSemanas(fechaTurno) {
  var anio = new Date(fechaTurno).getFullYear();
  if (anio <= 2022) return 48;  // Pre-reforma
  if (anio === 2023) return 47;
  if (anio === 2024) return 46;
  if (anio === 2025) return 45;
  if (anio === 2026) return 44;
  return 42;                     // 2027 en adelante
}
```

**`js/services/calculator.js`:** integración en el cálculo
```javascript
var semOrd = getHSEM(new Date(kS)) * 60;  // límite semanal según Ley 2101/2021
```

### Ventajas

1. **Cumplimiento automático**: cambia el año, la app ajusta la jornada sola
2. **Auditable**: la función está explícita, no oculta en constantes
3. **Mantenible**: si la ley cambia en 2027 o después, un solo cambio actualiza toda la app
4. **Sin errores manuales**: el calculador jamás aplicará un límite obsoleto

### Auditoría

Cualquier auditor laboral puede leer `getHSEM()`, ver que implementa correctamente el cronograma oficial, y verificar que cada cálculo de turno lo aplica.

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
│   │                       (getHSEM() para Ley 2101/2021 aquí)
│   ├── utils/              storage, format, haptic, network, festivos,
│   │                       time (obtenerJornadaMaximaSemanas()),
│   │                       validation, otp, password-hash, uuid, icons
│   ├── services/           supabase (con RLS), calculator (con getHSEM()),
│   │                       data, ai, sync-queue, session-sync,
│   │                       export-files, export-email, ai-history,
│   │                       ai-greeting, quincena
│   ├── tabs/               home, dashboard, assistant, history, config
│   ├── modals/             auth-forms, pin-setup, manage-account,
│   │                       export-report, email-compose, splash,
│   │                       diagnostico, asignar-pins, usuarios
│   └── app/                auth-screen, fast-pin-screen, app-main,
│                           root, sw-register, init
│
├── supabase/
│   └── functions/
│       ├── send-report/    Edge Function: enruta reportes al admin
│       └── send-pin/       Edge Function: envío de PIN por email
│
├── tests/
│   ├── smoke.cjs           Tests de funciones puras (getHSEM, doCalc, etc.)
│   └── e2e/                Playwright: boot, flujo invitado
│
└── scripts/
    ├── bump.sh             Sincroniza versión (globals/sw/version.json)
    └── check.sh            Valida sintaxis, versiones y precache
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
| `HSEM` | number | Límite de jornada actual (desde getHSEM) |
| `window.__mtTurnoActivo` | boolean | El SW lo lee para diferir updates durante un turno |
| `leer(key, fallback)` | fn | `localStorage.getItem` con try/catch |
| `grabar(key, val)` | fn | `localStorage.setItem` con try/catch |
| `dk(uid, suffix)` | fn | Genera `'mt_<suffix>_<uid>'` — clave de storage |
| `doCalc(turnos, activo, ahora, vh)` | fn | Calculador central de nómina (aplica getHSEM) |
| `fCOP(n)` | fn | Formatea número como moneda COP |
| `fDur(mins)` | fn | `"2h 30m"` desde minutos |
| `esFest(date)` | fn | ¿Es día festivo en Colombia? |
| `getHSEM(fecha)` | fn | Jornada máxima según Ley 2101/2021 por fecha |
| `obtenerJornadaMaximaSemanas(fechaTurno)` | fn | Helper auditability para Ley 2101 |
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
npm run test:smoke   # rápido, sin browser (includes getHSEM validation)
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

## Próximos pasos (roadmap)

### Phase 2: APK en Google Play Store (Pendiente)

Mi Turno es una PWA completamente instalable. El siguiente paso es distribuirlo como APK nativo en Google Play Store via **Bubblewrap** (Google's official PWA → APK tool):
- Cero cambios en código (Service Worker funciona igual)
- 2-4 horas de setup
- Google Play review ~24-48h

Esto se realizará cuando la base técnica sea **extremadamente sólida** (como lo es ahora, con RLS + Ley 2101 automatizada).

---

## Licencia

MIT — ver `package.json`.
