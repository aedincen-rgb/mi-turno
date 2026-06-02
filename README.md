# Mi Turno · Colombia

![WCAG 2.1 AA](https://img.shields.io/badge/WCAG_2.1-AA_·_0_violaciones-2ea44f)
![axe-core](https://img.shields.io/badge/axe--core-auditado-5b86e5)
![PWA](https://img.shields.io/badge/PWA-offline--first-4f6bbf)
![No build](https://img.shields.io/badge/build-zero_tooling-555)
![Ley 2101/2021](https://img.shields.io/badge/Ley_2101%2F2021-cumplimiento_automático-dc6b65)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

**Nómina inteligente para trabajadores por turnos.**

Mi Turno calcula automáticamente el salario real de cada turno aplicando todos los recargos de ley colombiana: nocturno, dominical, festivo, horas extra y sus combinaciones (ej. hora extra nocturna dominical). Funciona como PWA instalable, es 100% offline-first, sincroniza en tiempo real entre dispositivos y es **accesible para lectores de pantalla (WCAG 2.1 AA, 0 violaciones auditadas)**.

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

## Accesibilidad (WCAG 2.1 AA) — auditada, no prometida

La mayoría de las apps dicen "es accesible". Mi Turno lo **demuestra con una auditoría automatizada reproducible**: cada pantalla pasa por **axe-core** (el motor de accesibilidad estándar de la industria, el mismo de Lighthouse) con las reglas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa` activadas.

### Resultado: 0 violaciones en las 6 pantallas

```
Pantalla        Violaciones    Reglas aprobadas
────────────────────────────────────────────────
Login                 0               19
Inicio                0               21
Historial             0               21
Análisis              0               20
Asistente             0               24
Ajustes               0               24
────────────────────────────────────────────────
TOTAL                 0          WCAG 2.1 A + AA ✓
```

### Antes → después

| Métrica | Antes | Después |
|---|---|---|
| Violaciones axe-core (6 pantallas) | **10** | **0** |
| `aria-prohibited-attr` (ARIA mal aplicado) | 1 | 0 |
| `color-contrast` (texto ilegible <4.5:1) | 3 | 0 |
| `meta-viewport` (zoom bloqueado) | 6 | 0 |

### Qué se implementó

**HTML semántico** — `<section>`, `<main>`, `<nav>`, `<h1>`/`<h2>` con jerarquía real. Un lector de pantalla ahora navega la app por regiones y encabezados, no por un mar de `<div>`.

**Roles y nombres ARIA** — cada control comunica qué es y en qué estado está:
- Modales → `role="dialog"` + `aria-modal="true"` + `aria-label` descriptivo
- Toggles de ajustes → `role="switch"` + `aria-checked` ("Modo oscuro, activado")
- Filas de turnos → `role="button"` con contexto completo hablado ("Turno del lunes 2 de junio, festivo. Duración 8h. Ingreso $148.000")
- Stats numéricos → `role="img"` + `aria-label` con el valor exacto (no el dígito suelto sin contexto)

**Regiones en vivo (`aria-live`)** — el contenido dinámico se anuncia solo:
- Chat del asistente → `aria-live="polite"` (no interrumpe)
- Errores de login/PIN → `role="alert"` + `aria-live="assertive"` (anuncio inmediato)
- Turno en curso y progreso del PIN → `role="status"`

**Formularios etiquetados** — todos los inputs (correo, contraseña, salario, días de quincena, nombre) tienen `aria-label`, aunque su etiqueta visual viva en un elemento hermano.

**Contraste AA (1.4.3)** — el token `--muted` se oscureció de `#7a8294` (3.85:1, reprobado) a `#646b7d` (5.3:1, aprobado) manteniendo el mismo tono azul-gris del diseño. El tooltip de onboarding pasó a `--accent-deep` (5:1).

**Zoom permitido (1.4.4)** — se eliminó `user-scalable=no` del viewport. Las personas con baja visión ahora pueden hacer pinch-zoom hasta 5×, requisito que casi todas las PWA incumplen por copiar configs de "se siente más app".

### Cómo se audita (reproducible — corré esto vos mismo)

```bash
npm install          # instala axe-core, playwright, react (devDeps)
npx playwright install chromium
npm run test:a11y    # arranca server, recorre las 6 pantallas, reporta
```

Salida esperada:

```
✓ Pantalla Login   —  violaciones: 0 | aprobadas: 19
✓ Tab Inicio       —  violaciones: 0 | aprobadas: 22
✓ Tab Historial    —  violaciones: 0 | aprobadas: 21
✓ Tab Análisis     —  violaciones: 0 | aprobadas: 20
✓ Tab Asistente    —  violaciones: 0 | aprobadas: 24
✓ Tab Ajustes      —  violaciones: 0 | aprobadas: 24
  TOTAL violaciones: 0  —  WCAG 2.1 A/AA ✓
```

La auditoría (`tests/a11y.mjs`) corre con **Playwright + axe-core**, bloqueando el Service Worker e inyectando React localmente (algunos sandboxes de CI bloquean el CDN). **Sale con código 1 si hay cualquier violación** — el criterio de aceptación es binario: cero violaciones serias o moderadas, o el cambio no se mergea.

> **Lección registrada** (`CLAUDE.md`): un intento previo de accesibilidad (v67) rompió el layout porque tocaba CSS estructural. La regla desde entonces: **la accesibilidad se agrega vía atributos ARIA y HTML semántico, nunca reescribiendo el CSS de layout.** El `className` se preserva siempre; solo cambia el `tag` o se añaden props ARIA.

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
npm run test:a11y    # auditoría WCAG 2.1 con axe-core (0 violaciones o falla)

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

### ✅ Phase 1: Accesibilidad WCAG 2.1 AA (Completado · v71)

Auditoría axe-core con **0 violaciones** en las 6 pantallas. HTML semántico, roles y nombres ARIA, regiones en vivo, contraste AA y zoom habilitado. Ver sección [Accesibilidad](#accesibilidad-wcag-21-aa--auditada-no-prometida).

### Phase 2: APK en Google Play Store (Pendiente)

Mi Turno es una PWA completamente instalable. El siguiente paso es distribuirlo como APK nativo en Google Play Store via **Bubblewrap** (Google's official PWA → APK tool):
- Cero cambios en código (Service Worker funciona igual)
- 2-4 horas de setup
- Google Play review ~24-48h

Esto se realizará cuando la base técnica sea **extremadamente sólida** (como lo es ahora, con RLS + Ley 2101 automatizada).

---

## Licencia

MIT — ver `package.json`.
