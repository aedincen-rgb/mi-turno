// ════════════════════════════════════════════════════════════════
//  MI TURNO · ai-intents-registry.js
//  REGISTRO DECLARATIVO de intenciones de la IA. Fuente de verdad única
//  de: dominio, prioridad, ruta canónica, ejemplos, palabras clave,
//  herramientas, handler preferido, rutas prohibidas y capacidades.
//
//  ⚠️ NO está cableado al runtime todavía (fase segura 1-3 del refactor).
//  Se carga como global `AI_INTENT_REGISTRY` para que tests/golden y un
//  futuro `ai-orchestrator.js` puedan consultarlo. Mientras tanto, el
//  ruteo real sigue viviendo en _aiAnswerCore (ver AI_ROUTE_MAP.md).
//
//  ES5 estricto (var / function), sin dependencias. Cero efecto en runtime.
// ════════════════════════════════════════════════════════════════

// DOMINIOS: payroll | legal | help | app_action | conversation | wellbeing | simulation
// RUTAS:    query | knowledge | help | calculator | advisor | action | conversation | fallback
//
// PRIORIDAD (mayor gana ante conflicto). Escala alineada con AI_ROUTE_MAP §8:
//   90 acción con confirmación (modifica datos)
//   80 legal / pago injusto (caso sensible)
//   70 datos reales con anclaje temporal (ayer/hoy/mes/quincena)
//   60 simulación / hipotético
//   50 concepto legal sin anclaje
//   40 ayuda de uso
//   30 conversación / bienestar
//   10 fallback

var AI_INTENT_REGISTRY = [
  // ── Acciones (modifican datos → confirmación) ──────────────────
  {
    id: 'editar_turno',
    domain: 'app_action',
    priority: 90,
    route: 'action',
    examples: [
      'registrá un turno ayer de 8 a 4',
      'borrá el turno del 14',
      'corregí la hora del turno'
    ],
    keywords: ['registra', 'agrega', 'borra', 'elimina', 'corrige', 'edita', 'turno'],
    tools: ['doCalc'],
    preferredHandler: '_aiShiftEditIntent',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: false,
    needsRealData: true,
    offline: true,
    confirms: true
  },
  {
    id: 'iniciar_turno',
    domain: 'app_action',
    priority: 90,
    route: 'action',
    examples: ['iniciá un turno', 'empezar turno ahora'],
    keywords: ['iniciar', 'empezar', 'arrancar', 'turno'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: false,
    needsRealData: false,
    offline: true,
    confirms: true
  },
  {
    id: 'cerrar_turno',
    domain: 'app_action',
    priority: 90,
    route: 'action',
    examples: ['cerrá el turno', 'terminar turno', 'olvidé cerrar turno'],
    keywords: ['cerrar', 'terminar', 'finalizar', 'turno'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: false,
    needsRealData: true,
    offline: true,
    confirms: true
  },
  {
    id: 'configurar_salario',
    domain: 'app_action',
    priority: 90,
    route: 'action',
    examples: ['mi salario es 2 millones', 'cómo cambio el salario', 'configurar sueldo'],
    keywords: ['salario', 'sueldo', 'configurar', 'cambiar'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: true
  },
  {
    id: 'navegar_ajustes',
    domain: 'app_action',
    priority: 60,
    route: 'action',
    examples: ['llevame a ajustes', 'abrí configuración'],
    keywords: ['ajustes', 'configuracion', 'settings'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: [],
    allowFollowUp: false,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'navegar_historial',
    domain: 'app_action',
    priority: 60,
    route: 'action',
    examples: ['mostrame el historial', 'ver mis turnos'],
    keywords: ['historial', 'turnos', 'lista'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: [],
    allowFollowUp: false,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'email',
    domain: 'app_action',
    priority: 50,
    route: 'action',
    examples: ['enviame el informe por correo', 'mandame un reporte', 'hazme un informe'],
    keywords: ['enviar', 'correo', 'email', 'informe', 'reporte', 'manda'],
    tools: [],
    preferredHandler: '_aiBuildEmail',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: false,
    confirms: true
  },
  {
    id: 'whatsapp_share',
    domain: 'app_action',
    priority: 50,
    route: 'action',
    examples: ['compartí por whatsapp', 'mandar a whatsapp'],
    keywords: ['whatsapp', 'compartir'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: false,
    needsRealData: true,
    offline: false,
    confirms: false
  },

  // ── Legal / pago injusto (sensible, alta prioridad) ────────────
  {
    id: 'auditoria_pago',
    domain: 'legal',
    priority: 80,
    route: 'advisor',
    examples: ['¿me pagan bien?', 'me pagan mal el recargo', 'creo que me roban en la nómina'],
    keywords: ['pagan bien', 'pagan mal', 'me roban', 'injusto', 'recargo'],
    tools: ['doCalc'],
    preferredHandler: '_aiAuditIntent',
    forbiddenRoutes: ['knowledge', 'query'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'ley',
    domain: 'legal',
    priority: 50,
    route: 'knowledge',
    examples: [
      'qué es recargo nocturno',
      'cuánto vale la hora nocturna',
      'qué dice la ley de festivos'
    ],
    keywords: ['recargo', 'nocturno', 'dominical', 'festivo', 'ley', 'extra', 'jornada'],
    tools: ['aiKnowledgeSearch'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false,
    note: 'NO debe ganarle a una pregunta con anclaje temporal (ayer/hoy/mes).'
  },
  {
    id: 'laboral',
    domain: 'legal',
    priority: 50,
    route: 'knowledge',
    examples: ['cuántas horas son legales por semana', 'derechos laborales'],
    keywords: ['legal', 'derecho', 'jornada', 'maxima', 'semana'],
    tools: ['aiKnowledgeSearch'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'liquidacion',
    domain: 'legal',
    priority: 70,
    route: 'advisor',
    examples: ['calculá mi liquidación', 'cuánto me dan de prestaciones', 'mis cesantías'],
    keywords: ['liquidacion', 'prestaciones', 'cesantias', 'prima', 'vacaciones'],
    tools: ['doCalc', 'aiAdvisorLiquidacion'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'indemnizacion',
    domain: 'legal',
    priority: 70,
    route: 'advisor',
    examples: ['cuánto me dan si me despiden', 'indemnización por despido'],
    keywords: ['despido', 'indemnizacion', 'despiden'],
    tools: ['aiAdvisorIndemnizacion'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'explicabilidad',
    domain: 'legal',
    priority: 50,
    route: 'calculator',
    examples: ['¿cómo lo calculaste?', 'por qué me da ese total', 'explicame el cálculo'],
    keywords: ['como calculaste', 'por que da', 'explicame', 'de donde sale'],
    tools: ['doCalc'],
    preferredHandler: '_aiExplainIntent',
    forbiddenRoutes: ['help', 'knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false,
    note: 'Corre ANTES del atajo "cómo"→ayuda; si no, ayuda lo secuestra.'
  },

  // ── Datos reales con anclaje temporal (query/calculator) ───────
  {
    id: 'total_ganado',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuánto llevo este mes', 'cuánto he ganado', 'cuánta plata hice'],
    keywords: ['cuanto gane', 'cuanto llevo', 'cuanto he ganado', 'plata', 'total'],
    tools: ['doCalc'],
    preferredHandler: 'aiQueryRun|_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'hoy',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuánto gané hoy', 'cuánto hice hoy', 'cuánto llevo hoy'],
    keywords: ['hoy'],
    anchors: ['hoy'],
    tools: ['doCalc'],
    preferredHandler: 'aiQueryRun|_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'ayer',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuánto gané ayer', 'cuánto saqué ayer'],
    keywords: ['ayer'],
    anchors: ['ayer'],
    tools: ['doCalc'],
    preferredHandler: 'aiQueryRun|_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'proyeccion',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuánto voy a ganar este mes', 'proyección del mes'],
    keywords: ['proyeccion', 'voy a ganar', 'fin de mes', 'estimado'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'horas_trabajadas',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuántas horas trabajé', 'cuántas horas llevo este mes'],
    keywords: ['horas', 'trabaje', 'camello', 'camellado'],
    tools: ['doCalc'],
    preferredHandler: 'aiQueryRun|_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'valor_hora',
    domain: 'payroll',
    priority: 70,
    route: 'calculator',
    examples: ['cuánto gano por hora', 'cuánto vale mi hora'],
    keywords: ['por hora', 'valor hora', 'vale la hora', 'vale mi hora'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'quincena',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuánto llevo en la quincena', 'cuánto va de quincena'],
    keywords: ['quincena'],
    anchors: ['quincena'],
    tools: ['doCalc'],
    preferredHandler: 'aiQueryRun',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'comparativa_mes',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['compará con el mes pasado', 'junio vs mayo'],
    keywords: ['comparar', 'mes pasado', 'vs', 'versus'],
    tools: ['doCalc'],
    preferredHandler: 'aiQueryCompare|_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'comparativa_semana',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cómo voy esta semana vs la pasada', 'qué hice la semana pasada'],
    keywords: ['semana pasada', 'esta semana', 'comparar semana'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'mejor_dia',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuál es mi mejor día', 'qué día gano más'],
    keywords: ['mejor dia', 'dia que mas'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'racha',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cómo va mi racha', 'cuántos días seguidos llevo'],
    keywords: ['racha', 'dias seguidos', 'consecutivos'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'festivos',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['cuántos festivos trabajé', 'cuánto gané el domingo'],
    keywords: ['festivo', 'festivos', 'domingo', 'dominical'],
    tools: ['doCalc', 'esFest'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'stats',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['resumen del mes', 'días trabajados este mes', 'mis números'],
    keywords: ['resumen', 'stats', 'numeros', 'dias trabajados'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'tendencia',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['muéstrame la tendencia', 'voy subiendo o bajando'],
    keywords: ['tendencia', 'subiendo', 'bajando', 'evolucion'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'turno_activo',
    domain: 'payroll',
    priority: 70,
    route: 'query',
    examples: ['tengo un turno activo?', 'estoy en turno?'],
    keywords: ['turno activo', 'estoy en turno', 'turno abierto'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: false,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'meta',
    domain: 'payroll',
    priority: 70,
    route: 'calculator',
    examples: ['cuánto me falta para 2 millones', 'meta de 3 millones'],
    keywords: ['meta', 'falta para', 'llegar a'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },

  // ── Simulación / hipotéticos ───────────────────────────────────
  {
    id: 'simulacion',
    domain: 'simulation',
    priority: 60,
    route: 'advisor',
    examples: ['simula 4 horas nocturnas', 'cuánto ganaría con 3 festivos', 'si meto 4 noches'],
    keywords: ['simula', 'simular', 'cuanto ganaria', 'si meto', 'si trabajo'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'optimizador',
    domain: 'simulation',
    priority: 60,
    route: 'advisor',
    examples: ['qué turno me conviene', 'quiero ganar 200 mil extra', 'cómo gano más'],
    keywords: ['me conviene', 'ganar mas', 'extra', 'optimizar'],
    tools: ['doCalc'],
    preferredHandler: '_aiOptimizarIntent',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'ahorro',
    domain: 'simulation',
    priority: 60,
    route: 'advisor',
    examples: ['quiero ahorrar 5 millones en un año', 'plan de ahorro'],
    keywords: ['ahorrar', 'ahorro', 'guardar plata'],
    tools: ['doCalc'],
    preferredHandler: '_aiFinancieroIntent',
    forbiddenRoutes: ['knowledge', 'query'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'planear_vacaciones',
    domain: 'simulation',
    priority: 60,
    route: 'advisor',
    examples: ['planear vacaciones', 'cuánto me dan en vacaciones'],
    keywords: ['vacaciones', 'planear vacaciones'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'presupuesto',
    domain: 'simulation',
    priority: 60,
    route: 'advisor',
    examples: ['cómo reparto mi sueldo', 'hazme un presupuesto'],
    keywords: ['reparto', 'presupuesto', 'distribuir sueldo'],
    tools: ['doCalc', 'aiAdvisorPresupuesto'],
    preferredHandler: '_aiFinancieroIntent',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'comparar_oferta',
    domain: 'simulation',
    priority: 60,
    route: 'advisor',
    examples: ['tengo una oferta de 3 millones', 'me conviene cambiar de trabajo'],
    keywords: ['oferta', 'otro trabajo', 'cambiar de trabajo'],
    tools: ['doCalc', 'aiAdvisorCompararOfertas'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },

  // ── Ayuda de uso ───────────────────────────────────────────────
  {
    id: 'ayuda_app',
    domain: 'help',
    priority: 40,
    route: 'help',
    examples: ['cómo exporto PDF', 'cómo registro un turno', 'cómo funciona la app'],
    keywords: ['como exporto', 'como registro', 'como funciona', 'como hago'],
    tools: ['aiHelpAnswer'],
    preferredHandler: 'aiHelpAnswer',
    forbiddenRoutes: ['knowledge', 'query'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'ayuda_navegacion',
    domain: 'help',
    priority: 40,
    route: 'help',
    examples: ['dónde veo mi historial', 'dónde cambio el tema'],
    keywords: ['donde veo', 'donde esta', 'donde cambio'],
    tools: ['aiHelpAnswer'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'diagnostico_red',
    domain: 'help',
    priority: 40,
    route: 'help',
    examples: ['estoy sin internet', 'por qué no sincroniza', 'no me carga la nube'],
    keywords: ['sin internet', 'no sincroniza', 'no conecta', 'offline', 'nube'],
    tools: ['isOnline', 'aiHelpAnswer'],
    preferredHandler: 'aiHelpAnswer',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },

  // ── Conversación / bienestar ───────────────────────────────────
  {
    id: 'saludo',
    domain: 'conversation',
    priority: 30,
    route: 'conversation',
    examples: ['hola', 'buenas', 'qué más'],
    keywords: ['hola', 'buenas', 'que mas', 'buenos dias'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'despedida',
    domain: 'conversation',
    priority: 30,
    route: 'conversation',
    examples: ['chao', 'nos vemos', 'gracias y adiós'],
    keywords: ['chao', 'adios', 'nos vemos', 'hasta luego'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: false,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'capacidades',
    domain: 'conversation',
    priority: 30,
    route: 'conversation',
    examples: ['qué podés hacer', 'en qué me ayudás', 'qué sabés'],
    keywords: ['que podes hacer', 'que sabes', 'en que ayudas'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'bienestar',
    domain: 'wellbeing',
    priority: 30,
    route: 'conversation',
    examples: ['necesito descansar', 'estoy quemado', 'me siento agotado'],
    keywords: ['descansar', 'quemado', 'burnout', 'agotado'],
    tools: ['doCalc'],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: true,
    offline: true,
    confirms: false
  },
  {
    id: 'queja_fatiga',
    domain: 'wellbeing',
    priority: 30,
    route: 'conversation',
    examples: ['estoy cansado', 'qué cansancio', 'no doy más'],
    keywords: ['cansado', 'cansancio', 'reventado', 'no doy mas'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'estado_animo',
    domain: 'wellbeing',
    priority: 30,
    route: 'conversation',
    examples: ['estoy feliz', 'ando desmotivado'],
    keywords: ['feliz', 'triste', 'desmotivado', 'animo'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },
  {
    id: 'motivacion',
    domain: 'wellbeing',
    priority: 30,
    route: 'conversation',
    examples: ['dame ánimo', 'motivame'],
    keywords: ['animo', 'motivame', 'motivacion'],
    tools: [],
    preferredHandler: '_aiDispatchNLP',
    forbiddenRoutes: ['query', 'knowledge'],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false
  },

  // ── Fallback / fuera de dominio ────────────────────────────────
  {
    id: 'out_of_scope',
    domain: 'conversation',
    priority: 80,
    route: 'fallback',
    examples: ['qué hora es', 'quién ganó el mundial', 'cuál es la capital de francia'],
    keywords: [],
    preferredHandler: '_aiIsOutOfScope',
    forbiddenRoutes: ['query', 'knowledge', 'calculator', 'advisor'],
    allowFollowUp: false,
    needsRealData: false,
    offline: true,
    confirms: false,
    note: 'Gatea ANTES del NLP: declina con gracia, nunca fabrica cifras.'
  },
  {
    id: 'desambiguacion',
    domain: 'conversation',
    priority: 10,
    route: 'fallback',
    examples: ['no sé', 'mmm', 'cualquier cosa'],
    keywords: [],
    preferredHandler: '_aiAnswerCore',
    forbiddenRoutes: [],
    allowFollowUp: true,
    needsRealData: false,
    offline: true,
    confirms: false,
    note: 'Si confianza baja, preguntar aclaración en vez de adivinar.'
  }
];

// ── Helpers de consulta (lectura; sin efectos) ────────────────────
function aiIntentSpec(id) {
  for (var i = 0; i < AI_INTENT_REGISTRY.length; i++) {
    if (AI_INTENT_REGISTRY[i].id === id) return AI_INTENT_REGISTRY[i];
  }
  return null;
}

function aiIntentsByDomain(domain) {
  var out = [];
  for (var i = 0; i < AI_INTENT_REGISTRY.length; i++) {
    if (AI_INTENT_REGISTRY[i].domain === domain) out.push(AI_INTENT_REGISTRY[i]);
  }
  return out;
}

// Resuelve un conflicto entre candidatos por prioridad declarada (mayor gana).
// El futuro orquestador puede usar esto para reemplazar el "orden de cascada"
// implícito por prioridad explícita. NO se usa en runtime todavía.
function aiResolveByPriority(ids) {
  var best = null;
  for (var i = 0; i < ids.length; i++) {
    var s = aiIntentSpec(ids[i]);
    if (s && (!best || s.priority > best.priority)) best = s;
  }
  return best ? best.id : null;
}

if (typeof window !== 'undefined') {
  window.AI_INTENT_REGISTRY = AI_INTENT_REGISTRY;
  window.aiIntentSpec = aiIntentSpec;
  window.aiIntentsByDomain = aiIntentsByDomain;
  window.aiResolveByPriority = aiResolveByPriority;
}
