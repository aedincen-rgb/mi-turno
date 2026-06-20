# Arquitectura de Mi Turno

Este documento está escrito para que un ingeniero nuevo entienda cómo funciona
Mi Turno en producción, qué integraciones existen, dónde vive cada pieza y qué
reglas no conviene romper.

Estado revisado: `v317`, 20 de junio de 2026.

## 1. Resumen ejecutivo

Mi Turno es una PWA estática con React UMD y JavaScript global. No usa bundler en
el flujo normal. El navegador carga `app.html`, ejecuta scripts en orden fijo,
monta `Root`, resuelve sesión y muestra la app. La app persiste primero en
`localStorage`, sincroniza con Supabase cuando hay sesión válida y conserva una
cola offline por usuario para no perder cambios.

La arquitectura privilegia:

- Operación offline.
- Cálculo local auditable.
- Compatibilidad con Android/iOS de gama baja.
- Cero secretos en cliente.
- Deploy simple en Vercel.
- Service worker con cache estricto.
- IA local contextual, con proxy remoto opcional.

## 2. Mapa de runtime

```text
Navegador
  app.html
    config/
    utils/
    services/
    tabs/
    modals/
    app/

React UMD
  Root
    AuthScreen
    FastPinScreen
    AppMain
      Home
      Dashboard
      Assistant
      History
      Config
      SyncQueue

Persistencia local
  localStorage mt_*
  Cache API desde sw.js

Backend
  Supabase Auth
  Supabase Postgres
  Supabase Realtime
  Supabase Edge Functions

Servicios externos
  Resend
  Gemini
  CDNJS / jsDelivr / Google Fonts
```

## 3. Entrypoints

| Archivo/ruta | Función |
|---|---|
| `index.html` | Landing pública. Puede redirigir a `/app` si detecta sesión previa. |
| `app.html` | Aplicación principal. Contiene el orden real de CSS, librerías y scripts locales. |
| `privacy.html` | Política de privacidad. |
| `manifest.json` | Instalación PWA. `start_url` apunta a `/app`. |
| `sw.js` | Service worker, precache, cache split y estrategia de fetch. |
| `version.json` | Versión pública consultada por el runtime y el SW. |
| `vercel.json` | Headers, redirección de dominio beta, rewrites y caché HTTP. |

`vercel.json` reescribe `/app` y el fallback `/(.*)` hacia `app.html`. La raíz
sigue siendo `index.html`.

## 4. Secuencia de arranque

1. `app.html` carga CSS y librerías.
2. `js/config.js` define configuración pública de Supabase.
3. `theme-boot.js` aplica tema temprano para evitar flash visual.
4. `react-init.js` expone `React`, `ReactDOM`, hooks y `h`.
5. `env.js` calcula flags de entorno como iOS, Safari y PWA standalone.
6. `globals.js` define versión, constantes legales, recargos y stubs de boot.
7. `utils/*` expone almacenamiento, formato, red, festivos, validación y helpers.
8. `services/supabase-init.js` inicializa el cliente Supabase si hay config válida.
9. `services/*` registra cálculo, datos, backup, exportación, IA y demás servicios.
10. `tabs/*` y `modals/*` registran componentes React globales.
11. `app/root.js` decide si mostrar auth, PIN rápido o aplicación.
12. `app/init.js` valida dependencias mínimas y monta `Root` en `#root`.
13. `app/sw-register.js` registra el service worker tras `load`.

El orden de scripts es parte de la arquitectura. No hay import/export ni módulo
loader para la app principal.

## 5. Organización del repositorio

```text
.
├── app.html                  Aplicación PWA
├── index.html                Landing
├── sw.js                     Service Worker
├── version.json              Versión pública
├── vercel.json               Hosting, headers y rewrites
├── css/                      CSS modular por base/layout/components/modals
├── js/
│   ├── app/                  Root, pantallas top-level, SW register, init
│   ├── config/               React aliases, entorno, viewport, constantes
│   ├── lib/                  Librerías self-hosted
│   ├── modals/               Modales React
│   ├── services/             Supabase, datos, cálculo, IA, backup, export
│   ├── tabs/                 Tabs de la app
│   └── utils/                Helpers transversales
├── sql/migrations/           Migraciones SQL manuales
├── supabase/functions/       Edge Functions Deno
├── tests/                    Smoke, E2E, a11y y cobertura IA
├── scripts/                  check, bump, build, TWA
└── .github/workflows/e2e.yml CI
```

Hay 129 archivos locales bajo `js/` y `css/`. Esa fragmentación es intencional
para mantener el proyecto auditable sin build obligatorio.

## 6. Estilo técnico

La app principal usa JavaScript global con estilo ES5 por compatibilidad y por
historial del proyecto:

- `var` en vez de `let`/`const`, salvo `sw.js` y algunos entrypoints controlados.
- `function (...) { ... }` en vez de arrow functions.
- `h(tag, props, children)` en vez de JSX.
- No optional chaining ni destructuring en archivos de app.
- Los componentes se registran como símbolos globales.

Supabase Edge Functions sí son TypeScript/Deno y pueden usar sintaxis moderna.

## 7. Modelo de datos local

El wrapper de almacenamiento vive en `js/utils/storage.js`. Las claves de usuario
se construyen con `dk(uid, suffix)` como `mt_<suffix>_<uid>`.

| Dato | Clave local | Notas |
|---|---|---|
| Turnos cerrados | `mt_t_<uid>` | Array validado antes de usarse. |
| Turno activo | `mt_a_<uid>` | Objeto único o `null`. |
| Salario base | `mt_s_<uid>` | Fuente local puede mandar si `sc=true`. |
| Salario configurado | `mt_sc_<uid>` | Flag local por dispositivo. |
| PIN | `mt_pin_<uid>` | PIN rápido local. |
| Nombre visible | `mt_pname_<uid>` | Local-only. |
| Foto perfil | `mt_photo_<uid>` | Local-only, base64. |
| Preferencias | `mt_prefs_<uid>` | Local-only. |
| Sesión app | `mt_session` | Sesión actual de Mi Turno. |
| Último usuario | `mt_last_user` | Habilita FastPinScreen. |
| Sesión offline | `mt_offline_<base64(email)>` | Login offline. |
| Password offline | `mt_pass_<base64(email)>` | PBKDF2-SHA256 con migración legacy. |
| Cola sync | `mt_sync_queue` | Objeto por UID. |
| Onboarding | `mt_onboarding_done` | Evita repetir tour. |

## 8. Modelo de datos en Supabase

Tablas core confirmadas en `sql/migrations/`:

| Tabla | Columnas principales | Uso |
|---|---|---|
| `perfiles` | `id`, `email`, `salario_base`, `updated_at` | Perfil y salario base. |
| `turnos` | `id`, `user_id`, `inicio`, `fin` | Turnos cerrados. |
| `turno_activo` | `user_id`, `id`, `inicio` | Turno en curso. |
| `pin_lookup` | `pin`, `user_id`, `user_email`, timestamps | Resolución de PIN por usuario. |
| `email_logs` | usuario, destino, formato, estado | Auditoría y rate limit de correos. |
| `error_logs` | errores de runtime | Diagnóstico. |

Todas las tablas de usuario usan RLS. La regla base es que el usuario autenticado
solo puede gestionar filas donde `auth.uid()` coincide con `id` o `user_id`.

Realtime está habilitado en `turnos` y `turno_activo` mediante la publication
`supabase_realtime`.

## 9. Supabase client

`js/services/supabase-init.js` crea `SUPA` con:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`
- `storage: safeStorage`
- `storageKey: "mt-supabase-auth"`
- `flowType: "pkce"`

En iOS Safari ajusta `fetch` con `cache: "no-store"` para evitar respuestas
viejas en autenticación.

La variable `CLOUD_MODE` no significa simplemente "existe cliente". Significa que
la app considera viable usar nube. `__cloudReady` y `__cloudRecheck` hacen una
consulta real a `perfiles` para distinguir caché de sesión, error de red y error
permanente de auth.

## 10. Flujo offline-first

### Lectura

`cargarDatos(uid, pinOnly)` en `js/services/data.js`:

1. Lee local: turnos, activo y salario.
2. Si no hay nube, no hay Supabase o es PIN-only, devuelve local.
3. Si hay nube, llama `supaSyncDown(uid)` con timeout.
4. Filtra datos remotos por `uid` para evitar mezclar usuarios.
5. Mezcla turnos remotos con turnos locales que no estén en remoto.
6. Resuelve conflicto de salario: si `mt_sc_<uid>` está en `true`, local manda.
7. Escribe el resultado en local.

### Escritura

El patrón correcto es:

```text
actualizar estado local
grabar localStorage
queueAction(uid, actionType, payload)
```

`queueAction` vive en `js/tabs/sync-queue.js`. Aunque el archivo esté en `tabs/`,
conceptualmente es un servicio compartido.

### Procesamiento de cola

`processQueue(uid)`:

- No corre sin UID, sin red, sin `CLOUD_MODE` o sin `SUPA`.
- Usa guard `IN_FLIGHT` por usuario.
- Antes de escribir, valida sesión con `SUPA.auth.getSession()`.
- Si no hay sesión, desactiva `CLOUD_MODE` y conserva la cola.
- Ejecuta acciones contra helpers de `supabase.js`.
- Descarta errores permanentes controlados.
- Reintenta errores transitorios hasta `MAX_SYNC_RETRIES = 5`.
- Reagenda otro intento en 5 segundos si quedan acciones.

Acciones soportadas:

- `insertTurno`
- `updateTurno`
- `setActivo`
- `deleteTurno`
- `deleteAllTurnos`
- `setSalario`
- `updatePinLookup`
- `propagateEmail`

## 11. Realtime

`supaSubscribeUser(uid, onChange)` en `js/services/supabase.js` abre canales para:

- `turno_activo`
- `turnos`

Ambos filtran por `user_id`. El callback dispara recarga local mediante
`cargarDatos` en el flujo de UI. La suscripción maneja backoff, estado global de
Realtime y resuscripción forzada con `_mtForceResubscribe`.

No se debe activar Realtime en una tabla nueva sin:

1. RLS correcto.
2. Publication configurada.
3. Estrategia de merge local/remoto.
4. Prueba cross-device.

## 12. Autenticación y sesiones

Componentes principales:

- `AuthScreen`: login, registro, modo invitado y recuperación.
- `FastPinScreen`: desbloqueo por PIN para usuario conocido.
- `Root`: orquestación de sesión, auth state de Supabase y limpieza.
- `session-sync.js`: consistencia de sesión entre tabs.

Modos:

| Modo | Qué permite |
|---|---|
| Supabase Auth | Nube, Realtime, Edge Functions y sincronización cross-device. |
| PIN rápido | Reingreso local a usuario conocido, con restauración de tokens cuando existe. |
| Offline cache | Acceso sin red con sesión/password cacheados localmente. |
| Invitado | Uso local sin nube. |

`Root` escucha `SIGNED_IN`, `TOKEN_REFRESHED` y `SIGNED_OUT`. En eventos de auth
válidos, intenta `processQueue(uid)` para vaciar cambios pendientes.

## 13. Cálculo de nómina

La lógica legal vive principalmente en:

- `js/config/globals.js`: constantes, `RC`, `getHSEM(fecha)`, salario mínimo y
  auxilio de transporte 2026.
- `js/utils/festivos.js`: festivos colombianos.
- `js/utils/time.js`: funciones de tiempo y jornada.
- `js/services/calculator.js`: `doCalc(turnos, activo, ahora, vh)`.
- `js/services/quincena.js`: cortes de quincena.
- `js/services/ai-advisor.js`: simuladores y asesoría financiera/laboral.

`getHSEM(fecha)` aplica la reducción gradual de la Ley 2101/2021 por fecha:

- 47h desde 2023-06-15.
- 46h desde 2024-06-15.
- 45h desde 2025-06-15.
- 44h desde 2026-07-15.
- 42h desde 2027-07-01.

Los recargos están centralizados en `RC`. Cualquier cambio legal debe actualizar
ese mapa, los tests smoke y la documentación correspondiente.

## 14. UI y componentes

`AppMain` conserva el estado principal:

- turnos
- turno activo
- salario
- fecha/hora actual
- tab activa
- preferencias
- estado de red/sync

Las tabs viven en `js/tabs/`:

- `home.js`
- `dashboard.js`
- `assistant.js`
- `history.js`
- `config.js`
- `sync-queue.js`

Los modales viven en `js/modals/`. Hay modales para PIN, cuenta, diagnóstico,
exportación, onboarding, usuarios y recuperación.

CSS está separado por intención:

- `css/base/`
- `css/layout/`
- `css/components/`
- `css/modals/`
- `css/animations/`

La accesibilidad se mantiene con tags semánticos y ARIA, no reescribiendo layout.

## 15. Asistente IA

La IA está diseñada como sistema local con varias capas. La función remota
`ai-chat` existe, pero no es la fuente primaria para cálculos personales.

### Capas locales

| Capa | Archivos | Función |
|---|---|---|
| Normalización y NLP | `ai-synonyms.js`, `ai-semantic.js`, `ai-query.js`, `ai-episodes.js`, `ai-nlp.js` | Entender intención, señales, entidades y contexto conversacional. |
| Core clásico | `ai.js` | `buildContext`, rutas financieras, señalización v317 y fallback. |
| Enriquecimiento | `ai-enhanced.js`, `ai-engage.js`, `ai-conversation.js`, `gender-lang.js` | Pulir tono, seguimiento, memoria conversacional y estilo. |
| Herramientas | `ai-router.js`, `ai-collector.js` | Seleccionar y ejecutar herramientas locales, CPU o Supabase. |
| Razonamiento | `ai-reasoning.js`, `ai-insights.js`, `ai-auditor.js` | Hallazgos, anomalías, tendencias, comparación y evidencia. |
| Respuesta | `ai-responder.js` | Respuesta final, acciones rápidas, fuentes y prevención de repetición. |
| Dominio | `ai-advisor.js`, `ai-knowledge.js`, `ai-help.js`, `ai-app-kb.js`, `ai-calendar.js` | Laboral, legal, uso de app, simulación y fechas. |
| Experiencia | `ai-history.js`, `ai-memory.js`, `ai-greeting.js`, `ai-proactive.js`, `ai-psychology.js`, `ai-achievements.js`, `voice-agent.js`, `audio-sfx.js` | Historial, memoria, voz, logros, proactividad y apoyo. |

### Flujo conceptual

```text
mensaje usuario
  -> normalización
  -> clasificación / señalización
  -> buildContext(state)
  -> aiRouteTools(intent, ctx, online)
  -> aiCollectData(tools, ctx, session)
  -> aiReason(bag, ctx, history)
  -> aiGenerateResponse(reasoning, intent, ctx, bag, convLevel)
  -> AssistantTab renderiza texto, tarjetas y acciones
```

### v317: captador de señales multi-dominio

El cambio clave de v317 es no depender solo de listas exhaustivas de frases. La
ruta `_aiSignalRoute(t, ent)` detecta señales sueltas y decide qué dominio debe
atenderlas:

- plata e ingresos
- pago injusto o recargos legales
- bienestar y fatiga
- ayuda de la app
- datos por periodo

La prioridad importa. Por ejemplo, "me pagan mal el recargo" debe ir a legal
aunque contenga una señal de pago/plata.

### IA remota

`supabase/functions/ai-chat/index.ts` llama a Gemini 2.0 Flash Lite con dos
modos:

- `chat`: respuesta libre con `APP_KNOWLEDGE`.
- `extract`: extractor JSON de intención y parámetros.

El cliente nunca recibe `GEMINI_API_KEY`.

## 16. Exportación y correo

Exportación local:

- `js/services/export-files.js`
- `js/modals/export-report.js`
- jsPDF, AutoTable y XLSX desde CDN con SRI en `app.html`.

Correo:

- `js/services/export-email.js` invoca Edge Functions.
- `send-report` envía PDF/XLSX con Resend.
- `send-pin` envía PIN por Resend.

Ambas funciones:

- Requieren JWT.
- Validan payload.
- Aplican límite de 10 correos por usuario por hora usando `email_logs`.
- Registran éxito/fallo.
- Usan `RESEND_API_KEY` y `RESEND_FROM_EMAIL` desde secretos de Supabase.

## 17. Service worker

`sw.js` tiene dos caches:

| Cache | Contenido | Invalidación |
|---|---|---|
| `mt-shell-v317` | Archivos propios de app, CSS, JS, iconos, manifest, version. | Cambia en cada release. |
| `mt-cdn-v2` | React, ReactDOM, jsPDF, AutoTable, XLSX. | Solo cambia si cambian URLs CDN. |

Estrategia:

- Install: fetch con `cache: "reload"` para shell y CDN si no existe.
- Activate: borra caches viejos, habilita navigation preload y reclama clientes.
- Fetch: ignora Supabase y métodos no GET.
- Shell crítico: network-first con fallback a cache.
- Assets: cache-first.

`js/app/sw-register.js` maneja updates silenciosos:

- `reg.update()` en load, online y cambios de visibilidad.
- Captura versión destino desde `version.json`.
- Aplica `SKIP_WAITING` cuando el usuario vuelve al foreground.
- Difiere actualización si hay turno activo.
- Tiene hard reset expuesto como `window._mtHardReset()`.

## 18. Hosting y headers

`vercel.json` configura:

- Redirección 301 desde `mi-turno-beta.vercel.app` a `https://miturno.one`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- CSP restrictiva con Supabase, CDNJS, jsDelivr y Google Fonts.
- Cache immutable de un año para `/css`, `/js`, `/img` e iconos.
- `no-store` para `index.html` y `version.json`.
- `must-revalidate` para `sw.js`.
- Rewrite `/app` y fallback hacia `app.html`.

## 19. Edge Functions

| Función | Archivo | Propósito | Secretos |
|---|---|---|---|
| `send-report` | `supabase/functions/send-report/index.ts` | Enviar reporte PDF/XLSX por correo. | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. |
| `send-pin` | `supabase/functions/send-pin/index.ts` | Enviar PIN por correo. | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. |
| `ai-chat` | `supabase/functions/ai-chat/index.ts` | Proxy seguro a Gemini para chat/extracción. | `GEMINI_API_KEY`. |

Las funciones usan CORS abierto porque la autenticación real ocurre con JWT y
Supabase Auth. No poner secrets en `js/config.js`.

## 20. Pruebas y CI

Scripts relevantes:

| Comando | Qué valida |
|---|---|
| `./scripts/check.sh` | Parse de JS, JSON válido, versión sincronizada, registro en `app.html`/`sw.js`, smoke. |
| `npm run test:smoke` | Funciones puras en Node. |
| `npm run test:e2e` | Playwright. |
| `npm run test:a11y` | axe-core WCAG 2.1 A/AA. |
| `npm run test:ai-browser` | Pruebas de IA en navegador. |
| `npm run test:coverage` | Frases naturales que deben alcanzar capacidades IA. |
| `npm run lint` | ESLint sobre `js/**/*.js`. |
| `npm run format:check` | Prettier check. |

CI (`.github/workflows/e2e.yml`) corre en cada push/PR a `master`:

1. `npm ci --no-audit --no-fund`
2. `npm run test:smoke`
3. `npx playwright install --with-deps chromium webkit`
4. sanity check con `python3 -m http.server`
5. `npm run test:e2e -- --reporter=list`
6. upload de artifacts de Playwright

## 21. Build opcional

El flujo normal no compila. Vercel sirve archivos estáticos.

`./scripts/build.sh` existe para una variante optimizada:

- Genera `dist/`.
- Copia assets estáticos.
- Concatena CSS local en `dist/app.css`.
- Concatena JS local en `dist/app.js`.
- Mantiene el orden de `app.html`.

No se debe commitear `dist/` salvo que se cambie explícitamente la estrategia de
deploy.

## 22. Versionado

Tres fuentes deben estar sincronizadas:

| Archivo | Valor |
|---|---|
| `js/config/globals.js` | `var MT_APP_VERSION = 'vNN';` |
| `sw.js` | `const SHELL_CACHE = 'mt-shell-vNN';` |
| `version.json` | `"v": "vNN"` |

Usar:

```bash
./scripts/bump.sh 318 "Label de la release"
```

No editar esas tres fuentes a mano. Una desincronización puede disparar reloads
fantasma o dejar usuarios con shell viejo.

## 23. Checklist para cambios

### Si agregas un JS

1. Crear el archivo en `js/...`.
2. Agregar `<script>` en `app.html` en el orden correcto.
3. Agregar el path en `sw.js` dentro de `appResources`.
4. Si define global nuevo, revisar `eslint.config.js`.
5. Correr `./scripts/check.sh`.

### Si agregas una tabla Supabase

1. Crear migración `sql/migrations/NNN_nombre.sql`.
2. Usar SQL idempotente.
3. Activar RLS.
4. Definir policies explícitas.
5. Agregar `UNDO` comentado.
6. Actualizar `sql/migrations/README.md`.
7. Documentar merge/sync si participa en offline-first.

### Si agregas una Edge Function

1. Crear `supabase/functions/<name>/index.ts`.
2. Validar JWT si opera sobre datos de usuario.
3. No exponer secrets al cliente.
4. Definir CORS.
5. Validar payload y tamaño.
6. Registrar auditoría si produce efectos externos.
7. Documentar variables de entorno requeridas.

### Si cambias IA

1. Verificar que la capacidad sea alcanzable por frase natural.
2. No inventar cifras que no vengan de `doCalc`, contexto o datos recolectados.
3. Mantener fallback local si Supabase o red fallan.
4. Correr `npm run test:coverage`.
5. Para rutas de navegador, validar con `npm run test:ai-browser`.

### Si cambias PWA/cache

1. Bump con `scripts/bump.sh`.
2. Actualizar `appResources` si cambia asset local.
3. Revisar `CDN_CACHE` solo si cambian URLs externas.
4. Correr `./scripts/check.sh`.
5. Probar update con `window._mtCheckUpdate(true)` o hard reset controlado.

## 24. Invariantes que no se deben romper

- `dk(uid, suffix)` produce `mt_<suffix>_<uid>`. No invertir el orden.
- La fuente de verdad para usuario es `user_id`, no email.
- `pin_lookup` debe usar `onConflict: "user_id"` cuando se hace upsert.
- `queueAction()` debe terminar disparando un flush eventual.
- `processQueue()` no debe escribir en Supabase sin sesión válida.
- `cargarDatos()` no debe sobrescribir local con remoto vacío cuando RLS/auth falla.
- `app.html` y `sw.js` deben conocer cada JS local nuevo.
- `sw.js`, `globals.js` y `version.json` deben tener la misma versión.
- El service worker no debe interceptar requests de Supabase.
- Los secretos viven en Supabase, nunca en cliente.
- La accesibilidad se ajusta con semántica/ARIA sin romper layout.

## 25. Diagnóstico rápido

| Síntoma | Revisar |
|---|---|
| Pantalla blanca | Consola, orden de scripts, `app/init.js`, dependencia global faltante. |
| Cambio local no aparece en otro device | `mt_sync_queue`, sesión Supabase, `processQueue`, Realtime. |
| LED de nube queda ámbar | `CLOUD_MODE`, `CLOUD_ERROR`, `__cloudRecheck`, sesión expirada. |
| Usuario ve versión vieja | `version.json`, `SHELL_CACHE`, `sw-register.js`, caches del navegador. |
| E2E falla en CI pero local pasa | Artifacts de Playwright, WebKit móvil, CDN bloqueado, service worker. |
| IA responde fallback genérico | Clasificación NLP, `_aiSignalRoute`, cobertura en `tests/ai-coverage.mjs`. |
| Correo no sale | JWT, `email_logs`, rate limit, secrets Resend, respuesta de Edge Function. |

## 26. Operación de producción

Release estándar:

```bash
./scripts/check.sh
npm run test:e2e
git push origin master
```

Validación post-deploy:

1. Abrir `https://miturno.one/version.json` y confirmar versión.
2. Abrir `/app` en navegación limpia.
3. Validar login o modo invitado.
4. Registrar y cerrar un turno de prueba si aplica.
5. Probar recarga offline si el cambio tocó SW/cache.
6. Revisar GitHub Actions.

El dominio canónico es `https://miturno.one`.
