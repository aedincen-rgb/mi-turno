# AI_ROUTE_MAP · cómo viaja una pregunta por la IA de Mi Turno

> Auditoría del flujo **real** del asistente (no del flujo teórico de `ARCHITECTURE.md`).
> Estado: `v338`, 25 de junio de 2026. Escrito como paso previo a cualquier refactor:
> primero entender qué responde qué, antes de mover nada.

## 0. TL;DR del hallazgo

No hay "dos cerebros en paralelo". Hay **un solo punto de entrada**
(`aiAnswer`) y **una sola función núcleo** (`_aiAnswerCore`) que es una **cascada
larga de guards con `return` temprano**. Lo que se siente como "se pisa la
información" es que **varios guards distintos pueden reclamar la misma pregunta** y
**gana el que está primero en la cascada**, no el más apropiado. La "capa moderna"
(router → collector → reasoning → responder) **no es un competidor de alto nivel**:
vive adentro de `aiEnhancedRespond` como un sub-paso (`_aiRunAgentPass`) que solo
corre para ciertos intents. El problema real es **orden + solapamiento de guards**,
no arquitectura paralela.

## 1. Por dónde entra una pregunta

| Call site | Llamada | Notas |
|---|---|---|
| `js/tabs/assistant.js:1470` | `await Promise.resolve(aiAnswer(q, aiState))` | Entrada real del usuario. |
| `js/modals/error-viewer.js:139` | `aiAnswer(devQuery, {...})` | Modo admin/diagnóstico. |

**Solo 2 call sites.** La fachada única ya existe de facto: `aiAnswer`.

```
assistant.js
  → aiAnswer(question, state)            [ai.js:5326]  fachada delgada
      → _aiAnswerCore(question, state)   [ai.js:3185]  el "cerebro" (cascada)
      → _polish(resp)                    [ai.js:5365]  humanizar → referring → focusClose → verifyNumbers
```

`aiAnswer` ya hace de wrapper: resuelve Promesas (rutas async del agente) y aplica
el pulido de voz una sola vez para todas las rutas. **No es el cerebro; `_aiAnswerCore` lo es.**

## 2. La cascada de `_aiAnswerCore` (orden real de decisión)

Cada paso es `var r = handler(...); if (r) return r;`. **El primero que matchea, gana.**

| # | Guard | Función | Dominio | Riesgo de pisar |
|---|---|---|---|---|
| 1 | Edición de turno por chat | `_aiShiftEditIntent` | app_action | Bajo (muy específico) |
| 2 | Verificador "¿me pagan bien?" | `_aiAuditIntent` | legal | Medio (señal "pago") |
| 3 | Optimizador de ingresos | `_aiOptimizarIntent` | simulation | Bajo |
| 4 | Explicabilidad "¿cómo calculaste?" | `_aiExplainIntent` | help/payroll | **Alto**: va ANTES del atajo "cómo"→ayuda |
| 5 | Desprendible PDF | `_aiDesprendibleIntent` | app_action | Bajo |
| 6 | Financiero/laboral alta señal | `_aiFinancieroIntent` | payroll/legal | **Alto**: captura "sueldo", "plata" antes que NLP |
| 7 | Atajo "cómo ..." → ayuda | `aiHelpAnswer` (string match) | help | **Alto**: secuestra cualquier "cómo X" |
| 8 | Máquina de estados (vacaciones) | inline | conversation | Bajo (solo si flujo activo) |
| 9 | Modo desarrollador | inline (admin) | help | Bajo (gated por isAdmin) |
| 10 | Memoria episódica "¿de qué hablamos?" | `aiEpisodes*` | conversation | Bajo |
| 11 | Comparación de períodos | `aiQueryCompare` | payroll(data) | Medio |
| 12 | **Consulta estructurada a datos** | `aiQueryParse`+`aiQueryRun` | payroll(data) | **Alto**: compite con intents de datos del NLP |
| 13 | Referencias contextuales "¿y la quincena pasada?" | inline | payroll(data) | Medio |
| 14 | Out-of-scope (declinar) | `_aiIsOutOfScope` | guard | Correcto: gatea antes del NLP |
| 15 | **Clasificador NLP** | `aiClassifyIntent` → `_aiDispatchNLP` | todos | Centro real de ruteo |
| 16 | Follow-up a sugerencia | `aiCheckFollowUp` → `_aiDispatchNLP` | conversation | Medio |
| 17 | Slash commands | inline | app_action | Bajo (explícito) |
| 18 | Fallback clásico + búsqueda | `aiBestSearch`/`aiKnowledgeSearch` (4542) | legal/help | **Alto**: duplica knowledge del NLP |
| 19 | Señales sueltas | `_aiSignalRoute` → `_aiDispatchNLP` | todos | Último recurso |
| 20 | Chips de desambiguación / genérico | inline | fallback | Correcto |

**Lectura clave:** los datos de plata/horas/fechas pueden responderse en el paso
**6** (financiero), el **12** (aiQuery) o el **15** (`_aiDispatchNLP`: `total_ganado`,
`hoy`, `ayer`, `horas_trabajadas`, `valor_hora`…). Tres dueños para la misma
pregunta, decididos por orden.

## 3. Qué funciones pueden responder DIRECTO (sin pasar por NLP)

Estas cortan la cascada antes del clasificador (pasos 1–14):

- `_aiShiftEditIntent`, `_aiAuditIntent`, `_aiOptimizarIntent`, `_aiExplainIntent`,
  `_aiDesprendibleIntent`, `_aiFinancieroIntent` — todas en `ai.js`.
- `aiHelpAnswer(q)` vía el atajo string "cómo ...".
- `aiQueryCompare`, `aiQueryParse`/`aiQueryRun` (`ai-query.js`).
- Máquina de estados de `aiGetConversation()`.

## 4. Quién clasifica intención

- `aiClassifyIntent(question, conv, ctx)` → `ai-nlp.js`. Devuelve
  `{intent, topic, confidence, score, margin, secondIntent}`.
- Umbral de despacho: `confidence ≥ 0.5` **o** (`confidence ≥ 0.35` y `margin ≥ 1`).
- Empate fuerte (`score ≥ 4`, `margin === 0`) → pregunta de desambiguación.
- `_aiSignalRoute(t, ent)` (`ai.js`) — captador de señales de dominio, **último
  recurso** antes del genérico.

## 5. Quién consulta DATOS reales del usuario

| Capa | Función | Fuente |
|---|---|---|
| Query estructurada | `aiQueryRun` (`ai-query.js`) | `state.turnosAll`, `doCalc` |
| Dispatch por intent | handlers de datos en `_aiDispatchNLP` (`ai.js`) | `buildContext(state)` + `doCalc` |
| Pipeline del agente | `aiCollectData` (`ai-collector.js`) | local / Supabase / CPU |
| Cálculo central | `doCalc` (`calculator.js`) | **oráculo único de plata** |

Todo número de plata canónico se ancla a `doCalc`. `aiVerifyNumbers` (en `_polish`)
verifica el claim "llevás $X" contra `state.calc`.

## 6. Quién genera el TEXTO final

```
_aiDispatchNLP(intent) → texto base / {text, action, chart, actions}
   → aiEnhancedRespond(...)            [ai-enhanced.js]  enriquece
       → (para intents del agente) _aiRunAgentPass:
            aiRouteTools  → ai-router.js
            aiCollectData → ai-collector.js
            aiReason      → ai-reasoning.js   (salience, anomalías, comparación)
            aiGenerateResponse → ai-responder.js
       → aiNextChips (continuidad v334), aiDeliberate (v323)
_polish (en aiAnswer): aiHumanizar → aiReferring → aiFocusClose → aiVerifyNumbers
```

La "capa moderna" (router/collector/reasoning/responder) **es una hoja**, no un
flujo de nivel superior. Se invoca desde `aiEnhancedRespond` → `_aiRunAgentPass`
(`ai-enhanced.js:1129`) para los intents que lo ameritan (financieros/agénticos).

## 7. Dónde hay DUPLICIDAD real (rutas competidoras)

| # | Tema | Responsables que compiten | Síntoma |
|---|---|---|---|
| D1 | **Datos plata/horas/fechas** | `_aiFinancieroIntent` (6) · `aiQueryParse` (12) · intents de datos en `_aiDispatchNLP` (15) | "cuánto gané ayer" puede salir por aiQuery o por intent `ayer`; el orden decide |
| D2 | **Conceptos legales** | `aiBestSearch`/`aiKnowledgeSearch` en ai.js:1557, 1662, 4542 · tool en `ai-router.js:65` · wrapper `ai-semantic.js:298` | misma definición legal generable desde 4-5 sitios |
| D3 | **Ayuda / navegación** | atajo "cómo" (7) · `aiHelpAnswer` · intents `ayuda_app`/`ayuda_navegacion` (`_aiDispatchNLP`) | "cómo exporto" puede ir por atajo string o por intent |
| D4 | **Explicabilidad vs ayuda** | `_aiExplainIntent` (4) corre ANTES del atajo "cómo" (7) | dependencia frágil de orden |
| D5 | **Estado conversacional** | `_aiLastNlp` · `_aiLastFin` · `aiQueryLastCard()` · `conv.stateMachine` · `ai-memory.js` | "último" tema vive en varios lugares |
| D6 | **Financiero** | `_aiFinancieroIntent` (6, router canónico) · intents `ahorro`/`optimizador`/`presupuesto`… en `_aiDispatchNLP` | resuelto parcialmente en v314 (rutas crudas) pero la frontera sigue difusa |

## 8. Rutas que se pueden pisar (matriz de prioridad sugerida)

Cuando varios dominios matchean, la **prioridad correcta** (aún NO forzada por código,
solo emergente del orden de la cascada) debería ser:

1. **Acción con confirmación** (editar/cerrar turno) — modifica datos.
2. **Legal / pago injusto** — caso sensible (a alguien le pagan mal).
3. **Datos reales con anclaje temporal** (ayer/hoy/mes/quincena) → `aiQuery`/intent de datos.
   - ⚠️ knowledge/legal **no** debe ganarle a una pregunta con anclaje temporal.
4. **Simulación / hipotético** ("si meto 4 noches") → advisor/simulador.
5. **Concepto legal** sin anclaje temporal → knowledge.
6. **Ayuda de uso** → help.
7. **Emocional / bienestar** → conversation.
8. **Fallback** → señales → desambiguación.

## 9. Candidatos a `@deprecated` (NO borrar todavía — ver §10)

| Candidato | Por qué | Reemplazo propuesto |
|---|---|---|
| Bloque knowledge del fallback clásico (`ai.js:4542`) | Duplica D2; knowledge ya es tool del router | Una sola ruta knowledge declarada en el registry |
| Atajo string "cómo ..." (`ai.js:3225`) | Duplica D3/D4 con intents de ayuda | Intent `ayuda_*` con prioridad declarada |
| Múltiples llamadas a `aiBestSearch`/`aiKnowledgeSearch` en `ai.js` | D2 disperso | Centralizar en collector/router |
| Estado "último" disperso (D5) | Difícil de razonar | Un solo `aiLastTrace()` + estado conversacional único |

## 10. Reglas de seguridad para tocar esto

- **No borrar lógica hasta que pruebas golden demuestren paridad.** La IA está en
  100/100 de benchmark y 22/22 de cobertura (`npm run test:benchmark`,
  `npm run test:coverage`). Cualquier cambio se valida contra eso ANTES de mergear.
- **No tocar `calculator.js`/`doCalc` ni las constantes legales** (`globals.js`:
  `RC`, `getHSEM`, `getRecargoFestivo`, `getInicioNocturno`, `rcFactor`). El ruteo
  cambia; el cálculo no.
- **Antes de mover un guard de la cascada, mapear qué frases caen en él hoy** y
  agregarlas a las golden.
- **Adaptadores antes que borrar**: si un guard se centraliza, dejar la función vieja
  llamando a la nueva (façade) hasta retirar.
- **ES5 estricto** (`var`, `function(){}`, sin `?.`, sin destructuring) — ver `CLAUDE.md`.
- **Archivo nuevo** (ej. `ai-intents-registry.js`, `ai-orchestrator.js`): registrar en
  `app.html` **y** `sw.js` (`appResources`) **y** declarar globals en `eslint.config.js`.

## 11. Cómo se prueba un cambio de ruteo

```bash
npm run test:benchmark   # intent accuracy, OOS, groundedness — debe quedar 100/100
npm run test:coverage    # cada capacidad alcanzable por frase natural — 22/22
npm run test:smoke       # funciones puras (incluye ai-reasoning, ai-conversation)
./scripts/check.sh       # parse + version + registro app.html/sw.js
```

Para rutas que pasan por `aiEnhancedRespond` (agente), validar en navegador con
`npm run test:ai-browser` — el smoke (vm parcial de Node) enriquece distinto.

## 12. Veredicto de arquitectura

- La **fachada única ya existe** (`aiAnswer`). No hace falta inventarla.
- El **registro declarativo de intenciones** (un `AI_INTENT_REGISTRY` con dominio +
  prioridad + ruta + offline) es la pieza que **falta** y la de mayor retorno: hoy la
  prioridad es implícita (orden físico de la cascada), frágil y difícil de razonar.
- El **orquestador** debería ser una **reorganización de `_aiAnswerCore` guiada por el
  registry**, no un reemplazo desde cero. Riesgo controlado = mover decisiones de
  "orden de cascada" a "prioridad declarada", un guard a la vez, con golden de por medio.
