# Mi Turno

[![Version](https://img.shields.io/badge/version-v338-blue.svg)](version.json)
[![CI](https://github.com/aedincen-rgb/mi-turno-BETA/actions/workflows/e2e.yml/badge.svg)](https://github.com/aedincen-rgb/mi-turno-BETA/actions/workflows/e2e.yml)
[![PWA](https://img.shields.io/badge/PWA-offline--first-5B86E5.svg)](manifest.json)

Mi Turno es una PWA para trabajadores por turnos en Colombia. Registra turnos,
calcula ingresos con recargos colombianos, funciona sin conexión, sincroniza con
Supabase cuando hay sesión y expone un asistente IA contextual para consultar
ingresos, proyecciones, descanso, reportes y ayuda de uso.

La versión actual publicada en `version.json` es `v338`
(`tarjeta nativa de desglose que reemplaza las tablas que se rompían en móvil`).

Hitos recientes: cálculo **date-aware** de la Reforma Laboral (Ley 2466/2025),
asesor financiero/legal por tiers (prestaciones, verificador "¿me pagan bien?",
explicabilidad y alertas de cumplimiento), motor de continuidad conversacional y
un benchmark formal de NLU con detección de fuera de dominio.

## Documentación principal

| Documento | Para qué sirve |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Onboarding técnico completo: arquitectura, integraciones, datos, IA, PWA, deploy y reglas de operación. |
| [`CLAUDE.md`](CLAUDE.md) | Guía operativa para agentes y mantenedores que van a tocar código. Incluye decisiones históricas y cosas que no se deben romper. |
| [`sql/migrations/README.md`](sql/migrations/README.md) | Registro de migraciones SQL aplicadas a Supabase. |

Si un ingeniero nuevo tiene que entender el proyecto, debe leer este README y
luego `ARCHITECTURE.md`.

## Qué hace la app

- Controla turnos cerrados y un turno activo en curso.
- Calcula horas ordinarias, nocturnas, dominicales, festivas y extras.
- Aplica la reducción de jornada de la Ley 2101/2021 por fecha mediante
  `getHSEM(fecha)`.
- Aplica la Reforma Laboral (Ley 2466/2025) de forma **date-aware**: cada turno
  se paga con el recargo vigente a su fecha (dominical/festivo 75→80→90→100% y
  jornada nocturna desde las 19:00 a partir del 25-dic-2025), vía
  `getRecargoFestivo(fecha)`, `getInicioNocturno(fecha)` y `rcFactor(rk, fecha)`.
- Permite trabajar offline con persistencia local y cola de sincronización.
- Sincroniza turnos, turno activo, salario y PIN con Supabase cuando hay sesión.
- Exporta reportes PDF/XLSX localmente y puede enviarlos por correo usando una
  Edge Function.
- Incluye login con Supabase Auth, PIN rápido, sesión offline cacheada y modo
  invitado.
- Incluye asistente IA local y contextual, con proxy opcional a Gemini en una
  Edge Function para casos conversacionales.
- Incluye un asesor financiero/legal por tiers: prestaciones, verificador de pago
  justo, explicabilidad del cálculo, alertas de cumplimiento y simuladores, todo
  anclado a las cifras reales de `doCalc`.
- Es instalable como PWA y actualiza el service worker de forma silenciosa.

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | HTML estático, CSS modular, JavaScript global ES5-style | No hay bundler en el flujo normal. |
| UI | React 18 UMD | Se usa `h = React.createElement`; no JSX ni transpilación. |
| Persistencia local | `localStorage` | Wrappers `leer`, `grabar`, `borrarKey`; claves `mt_*`. |
| Backend | Supabase Auth, Postgres, Realtime, Edge Functions | Proyecto `yrpqvmqmchsxpotytxiy`. |
| Correo | Resend desde Edge Functions | API key solo en secretos de Supabase. |
| IA remota opcional | Gemini 2.0 Flash Lite desde `ai-chat` | La API key nunca sale al navegador. |
| PWA | `manifest.json`, `sw.js`, Cache API | Split cache para shell y CDN. |
| Hosting | Vercel | Auto-deploy desde `master`. |
| Pruebas | Node smoke, Playwright, axe-core | CI corre smoke + E2E en Chromium y WebKit. |

## Entradas y rutas

| Ruta/archivo | Rol |
|---|---|
| `/` -> `index.html` | Landing pública. |
| `/app` -> `app.html` | Aplicación PWA. |
| `/*` -> `app.html` | Rewrite SPA definido en `vercel.json`. |
| `/health` -> `health.json` | Health check estático. |
| `/version.json` | Fuente pública de versión para actualizaciones. |

El manifest usa `start_url: "/app"`, así que la PWA instalada abre la aplicación,
no la landing.

## Desarrollo local

```bash
npm install
npm run dev
```

Luego abrir `http://localhost:8000/app.html`.

Comandos útiles:

```bash
npm run lint              # ESLint en js/**/*.js
npm run format:check      # Prettier sin escribir
npm run test:smoke        # pruebas puras sin navegador
npm run test:e2e          # Playwright
npm run test:a11y         # auditoría WCAG con axe-core
npm run test:coverage     # cobertura funcional del asistente IA
npm run test:benchmark    # benchmark de NLU (intent, OOS, groundedness)
./scripts/check.sh        # gate pre-push del proyecto
```

La primera vez que se corren E2E puede hacer falta:

```bash
npx playwright install --with-deps chromium webkit
```

## Arquitectura resumida

```text
app.html
  -> config + utils + services globales
  -> Root
      -> AuthScreen / FastPinScreen / AppMain
          -> tabs: Home, Dashboard, Assistant, History, Config, Sync Queue

localStorage
  -> fuente inmediata para UI offline
  -> mt_sync_queue por usuario

Supabase
  -> Auth
  -> Postgres: perfiles, turnos, turno_activo, pin_lookup, email_logs
  -> Realtime: turnos y turno_activo
  -> Edge Functions: send-report, send-pin, ai-chat

Service Worker
  -> precache shell local
  -> cache persistente para CDN
  -> actualización silenciosa diferida si hay turno activo
```

El detalle está en [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Datos y sincronización

La app es offline-first. Toda acción importante actualiza primero el estado local
para que la UI responda de inmediato. Si existe sesión de Supabase y hay red, la
acción también se encola en `mt_sync_queue` y se procesa con un debounce corto.

Flujo base:

```text
acción de usuario
  -> escritura local
  -> queueAction(uid, actionType, payload)
  -> processQueue(uid)
  -> helper Supabase correspondiente
  -> Realtime notifica otros dispositivos
  -> cargarDatos(uid) mezcla nube + local
```

El contrato crítico es que un archivo nuevo de JS debe registrarse en `app.html`
y en `sw.js`. `scripts/check.sh` valida esa regla.

## Integraciones externas

| Integración | Dónde vive | Uso |
|---|---|---|
| Supabase SDK local | `js/lib/supabase.min.js` | Auth, Postgres y Realtime. |
| Supabase Edge Functions | `supabase/functions/*` | Envío de PIN, reportes y proxy de IA. |
| Resend | `send-report`, `send-pin` | Correo transaccional autenticado. |
| Gemini | `supabase/functions/ai-chat` | Chat/extracción remota sin exponer secreto. |
| React/ReactDOM CDN | `app.html`, `sw.js` | UI sin build. |
| jsPDF, AutoTable, XLSX CDN | `app.html`, `sw.js` | Exportación local PDF/XLSX. |
| Chart.js local | `js/lib/chart.min.js` | Gráficos del dashboard. |
| Web APIs | navegador | Service Worker, Cache API, Notifications, Badge API, Web Share, Speech APIs cuando están disponibles. |

## Base de datos

Tablas centrales:

| Tabla | Propósito | Seguridad |
|---|---|---|
| `perfiles` | Email y salario base por usuario. | RLS por `auth.uid() = id`. |
| `turnos` | Turnos cerrados. | RLS por `auth.uid() = user_id`. |
| `turno_activo` | Turno en curso, uno por usuario. | RLS por `auth.uid() = user_id`. |
| `pin_lookup` | PIN de 4 dígitos y vínculo a usuario. | RLS por `auth.uid() = user_id`; `pin` PK y `user_id` único. |
| `email_logs` | Auditoría y rate limit de correos. | Usada por Edge Functions. |
| `error_logs` | Errores de runtime. | Migración registrada. |

Las migraciones están en `sql/migrations/` y se aplican manualmente desde el SQL
Editor de Supabase, en orden numérico.

## Asistente IA

El asistente no depende de un LLM para operar. Tiene una cadena local con:

- NLP y clasificación de intención.
- Ruteo por señales multi-dominio (`ai.js`, v317).
- Router de herramientas (`ai-router.js`).
- Colector de datos local/Supabase (`ai-collector.js`).
- Motor de razonamiento con salience y verificación anclada (`ai-reasoning.js`).
- Generador de respuesta con evidencias (`ai-responder.js`).
- Asesor financiero/legal por tiers (`ai-advisor.js`, `ai-knowledge.js`): cálculo
  date-aware de la Ley 2466/2025, prestaciones, verificador de pago justo,
  explicabilidad y alertas de cumplimiento.
- Motor de continuidad conversacional (`ai-conversation.js`, v334): chips de
  "profundizar + abrir" con cobertura, anti-repetición y dosificación.
- Módulos de memoria, conversación, conocimiento, auditoría, asesoría,
  logros, voz, calendario, ayuda y psicología.

La calidad de la IA se mide con un benchmark formal de NLU
(`npm run test:benchmark`, metodología CheckList + CLINC150): accuracy de intent,
invarianza ante paráfrasis, detección de fuera de dominio y groundedness contra
`doCalc`. Baseline objetivo: 100/100 sin regresiones.

`ai-chat` existe como proxy remoto seguro hacia Gemini para respuesta libre o
extracción estructurada, pero el flujo principal de cálculo y datos se mantiene
anclado al motor local para no inventar cifras.

## PWA y actualizaciones

`sw.js` usa dos caches:

- `mt-shell-v338`: archivos propios de la app. Cambia en cada release.
- `mt-cdn-v2`: librerías CDN. Sobrevive entre releases salvo cambio de URL.

El registro en `js/app/sw-register.js` busca actualizaciones en background. Si
hay un service worker nuevo, lo aplica cuando el usuario vuelve al foreground o
por fallback tras un tiempo. Si hay turno activo, difiere la actualización para
no interrumpir el registro.

## Release y producción

Flujo estándar:

```bash
./scripts/check.sh
npm run test:e2e
git push origin master
```

Vercel despliega automáticamente desde `master`.

Para cambiar versión:

```bash
./scripts/bump.sh 339 "Label de la release"
```

Ese script sincroniza:

- `js/config/globals.js`
- `sw.js`
- `version.json`

El build optimizado es opcional:

```bash
./scripts/build.sh
```

Genera `dist/` concatenando CSS y JS en el orden exacto esperado. El flujo normal
de Vercel no requiere ese build.

## Reglas de mantenimiento

- Mantener JavaScript de app en estilo compatible con ES5: `var`, funciones
  clásicas, sin JSX, sin optional chaining.
- No agregar archivos JS sin registrarlos en `app.html` y `sw.js`.
- No bumpear versiones a mano.
- No consultar usuarios por email mutable cuando exista `user_id`.
- No romper RLS ni agregar tablas sin policies.
- No tocar CSS estructural para arreglar accesibilidad. Preferir semántica HTML
  y atributos ARIA preservando `className`.
- No publicar secretos en cliente. Resend y Gemini viven en Edge Functions.
- Correr `scripts/check.sh` antes de push.
