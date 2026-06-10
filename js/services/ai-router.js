// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-router.js
//  Capa 2: Tool Router — Decide qué herramientas consultar
//  basado en la intención clasificada y el contexto disponible.
//  100% offline · ES5 · sin dependencias externas.
//
//  Responsabilidades:
//    · Mapear intents → tools necesarias
//    · Decidir fuente de datos (local vs Supabase vs caché)
//    · Priorizar herramientas según disponibilidad de red
//    · Evitar consultas redundantes (cache hit → skip)
// ════════════════════════════════════════════════════════════════

// ─── REGISTRO DE HERRAMIENTAS DISPONIBLES ─────────────────────
var AI_TOOLS = {
  // Herramientas de datos
  getTurnosMes: { src: 'local', fn: '_aiGetTurnosMes', ttl: 30000, desc: 'Turnos del mes actual' },
  getTurnosAll: { src: 'local', fn: '_aiGetTurnosAll', ttl: 60000, desc: 'Todos los turnos' },
  getSalario: { src: 'local', fn: '_aiGetSalario', ttl: 60000, desc: 'Salario base' },
  getActivo: { src: 'local', fn: '_aiGetActivo', ttl: 10000, desc: 'Turno activo' },
  getCalc: { src: 'local', fn: '_aiGetCalc', ttl: 30000, desc: 'Resultado de cálculo' },
  getPrefs: { src: 'local', fn: '_aiGetPrefs', ttl: 60000, desc: 'Preferencias del usuario' },

  // Herramientas de analítica
  analyzeBreakdown: {
    src: 'cpu',
    fn: 'aiInsightBreakdown',
    ttl: 60000,
    desc: 'Desglose de recargos'
  },
  analyzeScenarios: { src: 'cpu', fn: 'aiInsightScenarios', ttl: 60000, desc: 'Proyecciones' },
  analyzeEfficiency: { src: 'cpu', fn: 'aiInsightEfficiency', ttl: 60000, desc: 'Eficiencia' },
  analyzeLegal: { src: 'cpu', fn: 'aiInsightLegal', ttl: 120000, desc: 'Análisis legal' },

  // Herramientas de cálculo
  calcLiquidacion: { src: 'cpu', fn: 'aiAdvisorLiquidacion', ttl: 120000, desc: 'Liquidación' },
  calcSimulacion: { src: 'cpu', fn: 'aiAdvisorSimular', ttl: 60000, desc: 'Simulación' },
  calcOptimizador: { src: 'cpu', fn: 'aiAdvisorOptimizador', ttl: 60000, desc: 'Optimizador' },
  calcAhorro: { src: 'cpu', fn: 'aiAdvisorAhorro', ttl: 60000, desc: 'Ahorro' },
  calcFiscal: { src: 'cpu', fn: 'aiAdvisorFiscal', ttl: 120000, desc: 'Fiscal' },
  calcOferta: { src: 'cpu', fn: 'aiAdvisorOferta', ttl: 60000, desc: 'Evaluar oferta' },
  calcInforme: { src: 'cpu', fn: 'aiAdvisorInforme', ttl: 60000, desc: 'Informe' },
  calcHistorico: { src: 'cpu', fn: 'aiAdvisorHistorico', ttl: 60000, desc: 'Histórico' },
  calcDescanso: { src: 'cpu', fn: 'aiAdvisorDescanso', ttl: 60000, desc: 'Descanso' },
  calcAnual: { src: 'cpu', fn: 'aiAdvisorAnual', ttl: 120000, desc: 'Proyección anual' },

  // Herramientas de conocimiento
  searchKnowledge: {
    src: 'cpu',
    fn: 'aiKnowledgeSearch',
    ttl: 300000,
    desc: 'Base de conocimiento'
  },
  getHelp: { src: 'cpu', fn: 'aiHelpAnswer', ttl: 300000, desc: 'Guías paso a paso' },

  // Herramientas de auditoría
  auditShifts: { src: 'cpu', fn: 'aiAuditShifts', ttl: 60000, desc: 'Auditoría de turnos' },
  checkAchievements: { src: 'cpu', fn: 'aiCheckAchievements', ttl: 60000, desc: 'Logros' },

  // Herramientas de memoria
  getMemory: { src: 'cpu', fn: 'aiMemoryLoad', ttl: 30000, desc: 'Memoria persistente' },
  getConvState: { src: 'cpu', fn: 'aiConvGetState', ttl: 10000, desc: 'Estado conversacional' }
};

// ─── MAPA DE INTENTS → HERRAMIENTAS ────────────────────────────
// Para cada intent, define qué herramientas se necesitan y en qué orden.
var AI_INTENT_TOOLS = {
  total_ganado: { tools: ['getCalc', 'getTurnosMes'], prio: 'data' },
  resumen: {
    tools: ['getCalc', 'getTurnosMes', 'getTurnosAll', 'analyzeBreakdown', 'analyzeEfficiency'],
    prio: 'data'
  },
  proyeccion: { tools: ['getCalc', 'analyzeScenarios'], prio: 'data' },
  distribucion: { tools: ['getCalc', 'analyzeBreakdown'], prio: 'data' },
  horas_trabajadas: { tools: ['getCalc', 'getTurnosMes'], prio: 'data' },
  eficiencia: { tools: ['getCalc', 'analyzeEfficiency'], prio: 'data' },
  mejor_dia: { tools: ['getCalc', 'getTurnosMes'], prio: 'data' },
  peor_dia: { tools: ['getCalc', 'getTurnosMes'], prio: 'data' },

  liquidacion: { tools: ['getCalc', 'getSalario', 'calcLiquidacion'], prio: 'calc' },
  simulacion: { tools: ['getSalario', 'calcSimulacion'], prio: 'calc' },
  optimizador: { tools: ['getSalario', 'getCalc', 'calcOptimizador'], prio: 'calc' },
  ahorro: { tools: ['getCalc', 'calcAhorro'], prio: 'calc' },
  fiscal: { tools: ['getCalc', 'calcFiscal'], prio: 'calc' },
  oferta: { tools: ['getSalario', 'calcOferta'], prio: 'calc' },
  informe: { tools: ['getCalc', 'getTurnosAll', 'calcInforme'], prio: 'calc' },
  historico: { tools: ['getTurnosAll', 'calcHistorico'], prio: 'calc' },

  bienestar: { tools: ['getTurnosMes', 'calcDescanso'], prio: 'data' },
  descanso: { tools: ['getTurnosAll', 'calcDescanso'], prio: 'data' },
  legal: { tools: ['analyzeLegal', 'searchKnowledge'], prio: 'knowledge' },
  stats: { tools: ['getCalc', 'getTurnosMes', 'getTurnosAll', 'analyzeEfficiency'], prio: 'data' },

  iniciar_turno: { tools: [], prio: 'action' },
  finalizar_turno: { tools: ['getActivo'], prio: 'action' },
  configurar_salario: { tools: [], prio: 'action' },

  hola: { tools: ['getCalc', 'getSalario', 'checkAchievements'], prio: 'greeting' },
  ayuda: { tools: ['getHelp'], prio: 'knowledge' },
  conocimiento: { tools: ['searchKnowledge'], prio: 'knowledge' },
  compartir: { tools: ['getCalc', 'getTurnosMes'], prio: 'action' },
  whatsapp_share: { tools: ['getCalc', 'getTurnosMes'], prio: 'action' },
  logros: { tools: ['checkAchievements'], prio: 'data' },
  auditoria: { tools: ['getTurnosAll', 'auditShifts'], prio: 'data' },

  comparar_mes: { tools: ['getTurnosAll', 'getCalc'], prio: 'data' },
  comparar_semana: { tools: ['getTurnosMes', 'getCalc'], prio: 'data' },
  tendencia: { tools: ['getTurnosAll', 'getCalc'], prio: 'data' }
};

// ─── CACHÉ DE RESULTADOS DE HERRAMIENTAS ──────────────────────
var _aiToolCache = {};

/**
 * Decide qué herramientas necesita una intención, filtradas por:
 * - Disponibilidad de red (offline → solo local + cpu)
 * - Frescura del caché (TTL no vencido → skip)
 * - Relevancia contextual (si ya tenemos los datos → skip)
 *
 * @param {string} intent - Intención clasificada
 * @param {object} ctx - Contexto del usuario (buildContext)
 * @param {boolean} isOnline - Si hay conexión
 * @returns {Array<{name:string, tool:object, reason:string}>}
 */
function aiRouteTools(intent, ctx, isOnline) {
  var mapping = AI_INTENT_TOOLS[intent];
  if (!mapping) {
    // Intención desconocida: usar herramientas mínimas
    return [
      { name: 'getCalc', tool: AI_TOOLS.getCalc, reason: 'Contexto mínimo' },
      { name: 'searchKnowledge', tool: AI_TOOLS.searchKnowledge, reason: 'Búsqueda general' }
    ];
  }

  var selected = [];
  var tools = mapping.tools;

  for (var i = 0; i < tools.length; i++) {
    var toolName = tools[i];
    var toolDef = AI_TOOLS[toolName];

    if (!toolDef) continue;

    // 1. Filtrar por disponibilidad de red
    if (toolDef.src === 'supabase' && !isOnline) {
      // En offline, buscar alternativa local
      var localAlt = _aiFindLocalAlt(toolName);
      if (localAlt) {
        selected.push({
          name: localAlt.name,
          tool: localAlt.tool,
          reason: 'offline fallback → ' + localAlt.name
        });
      }
      continue;
    }

    // 2. Verificar caché (TTL)
    var cacheEntry = _aiToolCache[toolName];
    if (cacheEntry && Date.now() - cacheEntry.ts < toolDef.ttl) {
      // Cache fresco, skip
      continue;
    }

    // 3. Verificar si el contexto ya tiene los datos
    if (_aiContextHasData(toolName, ctx)) {
      continue;
    }

    selected.push({ name: toolName, tool: toolDef, reason: 'requerido por intent=' + intent });
  }

  // Si no hay herramientas seleccionadas pero el intent requiere datos,
  // asegurar al menos getCalc como fallback
  if (selected.length === 0 && mapping.prio === 'data') {
    selected.push({
      name: 'getCalc',
      tool: AI_TOOLS.getCalc,
      reason: 'fallback mínimo para intent=' + intent
    });
  }

  return selected;
}

/**
 * Busca alternativa local para una herramienta que requiere Supabase.
 */
function _aiFindLocalAlt(toolName) {
  var alts = {
    getTurnosSupabase: 'getTurnosMes',
    getPerfilSupabase: 'getSalario',
    getMetricsSupabase: 'getCalc'
  };
  var altName = alts[toolName];
  if (altName && AI_TOOLS[altName]) {
    return { name: altName, tool: AI_TOOLS[altName] };
  }
  return null;
}

/**
 * Verifica si el contexto ya contiene los datos que la herramienta proveería.
 * Evita llamadas redundantes.
 */
function _aiContextHasData(toolName, ctx) {
  if (!ctx) return false;
  var checks = {
    getCalc: !!ctx.totalCOP,
    getTurnosMes: !!(ctx.turnosMes && ctx.turnosMes.length > 0),
    getTurnosAll: !!(ctx.dias && ctx.dias.length > 0),
    getSalario: !!ctx.salario,
    getActivo: !!ctx.activo,
    getPrefs: !!ctx.prefs
  };
  return !!checks[toolName];
}

/**
 * Cachea el resultado de una herramienta.
 */
function aiCacheToolResult(toolName, result) {
  _aiToolCache[toolName] = {
    result: result,
    ts: Date.now()
  };
}

/**
 * Invalida el caché de herramientas (forzar refresh).
 */
function aiInvalidateToolCache() {
  _aiToolCache = {};
}

/**
 * Obtiene estadísticas del router para diagnóstico.
 */
function aiRouterStats() {
  var stats = {
    totalTools: Object.keys(AI_TOOLS).length,
    intents: Object.keys(AI_INTENT_TOOLS).length,
    cacheSize: Object.keys(_aiToolCache).length,
    cacheEntries: []
  };
  for (var k in _aiToolCache) {
    stats.cacheEntries.push({ tool: k, age: Date.now() - _aiToolCache[k].ts });
  }
  return stats;
}

window.aiRouteTools = aiRouteTools;
window.aiCacheToolResult = aiCacheToolResult;
window.aiInvalidateToolCache = aiInvalidateToolCache;
window.aiRouterStats = aiRouterStats;
console.log('[MT] ai-router.js cargado — Tool Router ✓');
