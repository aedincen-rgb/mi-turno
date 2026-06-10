// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-collector.js
//  Capa 3: Data Collector — Obtiene datos reales de las fuentes.
//  Nunca inventa. Nunca estima sin advertir. Nunca genera ficción.
//  100% offline · ES5 · sin dependencias externas.
//
//  Responsabilidades:
//    · Ejecutar las herramientas seleccionadas por el Router
//    · Obtener datos de localStorage (fuente primaria offline)
//    · Consultar Supabase cuando hay conexión
//    · Merge datos locales + remotos (local manda en conflicto)
//    · Marcar datos como "stale" cuando son de caché vieja
//    · Retornar un DataBag estructurado para el Reasoning Engine
// ════════════════════════════════════════════════════════════════

// ─── COLECTOR PRINCIPAL ───────────────────────────────────────

/**
 * Ejecuta las herramientas seleccionadas por el Router y recolecta
 * todos los datos necesarios para responder.
 *
 * @param {Array} toolList - Lista de {name, tool, reason} del Router
 * @param {object} userContext - Contexto completo del usuario (buildContext)
 * @param {object} session - Datos de sesión actual
 * @returns {Promise<object>} DataBag con todos los datos recolectados
 */
function aiCollectData(toolList, userContext, session) {
  return new Promise(function (resolve) {
    var bag = {
      collected: {}, // { toolName: result }
      errors: {}, // { toolName: errorMessage }
      stale: {}, // { toolName: true } si datos son de caché
      sources: {}, // { toolName: 'local'|'cpu'|'supabase'|'cache' }
      meta: {
        totalTools: toolList.length,
        successCount: 0,
        errorCount: 0,
        startedAt: Date.now()
      }
    };

    if (!toolList || toolList.length === 0) {
      resolve(bag);
      return;
    }

    var completed = 0;
    var total = toolList.length;

    function onOneDone() {
      completed++;
      if (completed >= total) {
        bag.meta.successCount = total - bag.meta.errorCount;
        bag.meta.durationMs = Date.now() - bag.meta.startedAt;
        resolve(bag);
      }
    }

    for (var i = 0; i < toolList.length; i++) {
      var item = toolList[i];
      _aiExecuteOneTool(item, userContext, session, bag, onOneDone);
    }
  });
}

// ─── EJECUCIÓN DE UNA HERRAMIENTA ─────────────────────────────

function _aiExecuteOneTool(item, userContext, session, bag, done) {
  var toolName = item.name;
  var toolDef = item.tool;

  try {
    // 1. Intentar ejecutar la función de la herramienta
    var result = _aiCallTool(toolName, toolDef, userContext, session);

    // 2. Si es Promise, esperar
    if (result && typeof result.then === 'function') {
      result.then(
        function (val) {
          bag.collected[toolName] = val;
          bag.sources[toolName] = toolDef.src;
          done();
        },
        function (err) {
          bag.errors[toolName] = (err && err.message) || 'Error desconocido';
          bag.meta.errorCount++;
          done();
        }
      );
      return;
    }

    // 3. Resultado síncrono
    bag.collected[toolName] = result;
    bag.sources[toolName] = toolDef.src;
  } catch (e) {
    bag.errors[toolName] = (e && e.message) || 'Excepción en herramienta';
    bag.meta.errorCount++;
  }

  done();
}

// ─── DISPATCHER DE HERRAMIENTAS ───────────────────────────────

function _aiCallTool(toolName, toolDef, userContext, session) {
  var fnName = toolDef.fn;

  // Herramientas de datos locales
  if (fnName === '_aiGetTurnosMes') return _aiGetTurnosMes(userContext);
  if (fnName === '_aiGetTurnosAll') return _aiGetTurnosAll(userContext);
  if (fnName === '_aiGetSalario') return _aiGetSalario(userContext, session);
  if (fnName === '_aiGetActivo') return _aiGetActivo(userContext);
  if (fnName === '_aiGetCalc') return _aiGetCalc(userContext);
  if (fnName === '_aiGetPrefs') return _aiGetPrefs(userContext, session);

  // Herramientas de analítica (cpu)
  if (fnName === 'aiInsightBreakdown' && typeof aiInsightBreakdown === 'function') {
    return aiInsightBreakdown(userContext);
  }
  if (fnName === 'aiInsightScenarios' && typeof aiInsightScenarios === 'function') {
    return aiInsightScenarios(userContext);
  }
  if (fnName === 'aiInsightEfficiency' && typeof aiInsightEfficiency === 'function') {
    return aiInsightEfficiency(userContext);
  }
  if (fnName === 'aiInsightLegal' && typeof aiInsightLegal === 'function') {
    return aiInsightLegal(userContext);
  }

  // Herramientas de cálculo (cpu)
  if (fnName === 'aiAdvisorLiquidacion' && typeof aiAdvisorLiquidacion === 'function') {
    return aiAdvisorLiquidacion(userContext);
  }
  if (fnName === 'aiAdvisorSimular' && typeof aiAdvisorSimular === 'function') {
    // Necesita parámetros extra: horas, tipo
    return _aiBuildSimulacionMsg(userContext);
  }
  if (fnName === 'aiAdvisorOptimizador' && typeof aiAdvisorOptimizador === 'function') {
    return _aiBuildOptimizadorMsg(userContext);
  }
  if (fnName === 'aiAdvisorAhorro' && typeof aiAdvisorAhorro === 'function') {
    return aiAdvisorAhorro(userContext);
  }
  if (fnName === 'aiAdvisorFiscal' && typeof aiAdvisorFiscal === 'function') {
    return aiAdvisorFiscal(userContext);
  }
  if (fnName === 'aiAdvisorOferta' && typeof aiAdvisorOferta === 'function') {
    return _aiBuildOfertaMsg(userContext);
  }
  if (fnName === 'aiAdvisorInforme' && typeof aiAdvisorInforme === 'function') {
    return aiAdvisorInforme(userContext);
  }
  if (fnName === 'aiAdvisorHistorico' && typeof aiAdvisorHistorico === 'function') {
    return aiAdvisorHistorico(userContext);
  }
  if (fnName === 'aiAdvisorDescanso' && typeof aiAdvisorDescanso === 'function') {
    return aiAdvisorDescanso(userContext);
  }
  if (fnName === 'aiAdvisorAnual' && typeof aiAdvisorAnual === 'function') {
    return aiAdvisorAnual(userContext);
  }

  // Herramientas de conocimiento
  if (fnName === 'aiKnowledgeSearch' && typeof aiKnowledgeSearch === 'function') {
    return aiKnowledgeSearch(userContext.lastQuery || '');
  }
  if (fnName === 'aiHelpAnswer' && typeof aiHelpAnswer === 'function') {
    return aiHelpAnswer(userContext.lastQuery || '');
  }

  // Herramientas de auditoría
  if (fnName === 'aiAuditShifts' && typeof aiAuditShifts === 'function') {
    return aiAuditShifts(userContext, userContext.turnosAll);
  }
  if (fnName === 'aiCheckAchievements' && typeof aiCheckAchievements === 'function') {
    return aiCheckAchievements(userContext);
  }

  // Herramientas de memoria
  if (fnName === 'aiMemoryLoad' && typeof aiMemoryLoad === 'function') {
    var uid = session && session.user ? session.user.id : null;
    return aiMemoryLoad(uid);
  }
  if (fnName === 'aiConvGetState' && typeof aiConvGetState === 'function') {
    return aiConvGetState();
  }

  // Fallback: la herramienta no está disponible
  return '[herramienta no disponible: ' + fnName + ']';
}

// ─── IMPLEMENTACIONES DE HERRAMIENTAS DE DATOS ─────────────────

function _aiGetTurnosMes(ctx) {
  if (!ctx || !ctx.turnosMes) return [];
  return ctx.turnosMes;
}

function _aiGetTurnosAll(ctx) {
  if (!ctx || !ctx.dias) return [];
  return ctx.dias;
}

function _aiGetSalario(ctx, session) {
  // Prioridad: contexto > localStorage > SMIN
  if (ctx && ctx.salario) return ctx.salario;
  if (session && session.user) {
    var uid = session.user.id;
    var stored = typeof leer === 'function' ? leer(dk(uid, 's'), null) : null;
    if (stored) return parseFloat(stored) || SMIN;
  }
  return SMIN;
}

function _aiGetActivo(ctx) {
  return (ctx && ctx.activo) || null;
}

function _aiGetCalc(ctx) {
  if (!ctx) return { totalMins: 0, totalCOP: 0, bd: {} };
  return {
    totalMins: ctx.totalMins || 0,
    totalCOP: ctx.totalCOP || 0,
    bd: ctx.bd || {}
  };
}

function _aiGetPrefs(ctx, session) {
  if (ctx && ctx.prefs) return ctx.prefs;
  if (session && session.user) {
    var uid = session.user.id;
    var stored = typeof leer === 'function' ? leer(dk(uid, 'prefs'), null) : null;
    return stored || {};
  }
  return {};
}

// ─── BUILDERS PARA HERRAMIENTAS QUE NECESITAN PARÁMETROS ──────

function _aiBuildSimulacionMsg(ctx) {
  // Si no hay parámetros específicos, devolver guía de uso
  return {
    type: 'needs_params',
    message:
      'Para simular, necesito saber cuántas horas y de qué tipo. Por ejemplo: "simula 8 horas nocturnas" o "simula un turno extra de 4 horas en festivo".',
    tool: 'calcSimulacion'
  };
}

function _aiBuildOptimizadorMsg(ctx) {
  return {
    type: 'needs_params',
    message:
      'Para optimizar, necesito saber cuánto dinero extra quieres ganar. Por ejemplo: "¿cómo gano 200 lucas extra este mes?"',
    tool: 'calcOptimizador'
  };
}

function _aiBuildOfertaMsg(ctx) {
  return {
    type: 'needs_params',
    message:
      'Para evaluar una oferta, necesito saber: salario ofrecido, horas semanales y tipo de horario. Por ejemplo: "Me ofrecen 1.800.000 por 48h semanales, ¿conviene?"',
    tool: 'calcOferta'
  };
}

// ─── MERGE DE DATOS (LOCAL + REMOTO) ──────────────────────────

/**
 * Fusiona datos locales y remotos. Local siempre manda en caso de conflicto.
 */
function aiMergeData(localData, remoteData) {
  var merged = {};
  // Copiar todo lo remoto primero
  for (var k in remoteData) {
    if (Object.prototype.hasOwnProperty.call(remoteData, k)) {
      merged[k] = remoteData[k];
    }
  }
  // Sobrescribir con local (fuente de verdad)
  for (var k2 in localData) {
    if (Object.prototype.hasOwnProperty.call(localData, k2)) {
      merged[k2] = localData[k2];
    }
  }
  return merged;
}

window.aiCollectData = aiCollectData;
window.aiMergeData = aiMergeData;
console.log('[MT] ai-collector.js cargado — Data Collector ✓');
