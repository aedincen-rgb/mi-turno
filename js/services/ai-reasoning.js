// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-reasoning.js
//  Capa 4: Reasoning Engine — Analiza datos, detecta patrones,
//  compara períodos, identifica anomalías y genera hallazgos.
//  No inventa. No estima sin base. Todo hallazgo cita su fuente.
//  100% offline · ES5 · sin dependencias externas.
//
//  Responsabilidades:
//    · Analizar tendencias (↑↓→)
//    · Comparar períodos (mes vs mes, semana vs semana)
//    · Detectar anomalías e inconsistencias
//    · Calcular variaciones porcentuales
//    · Identificar causas probables (basadas en datos)
//    · Priorizar hallazgos por relevancia
// ════════════════════════════════════════════════════════════════

// ─── TIPOS DE HALLAZGOS ───────────────────────────────────────
var AI_FINDING_TYPES = {
  TREND_UP: { icon: '📈', label: 'Tendencia al alza', severity: 'positive' },
  TREND_DOWN: { icon: '📉', label: 'Tendencia a la baja', severity: 'warning' },
  TREND_FLAT: { icon: '➡️', label: 'Estable', severity: 'neutral' },
  ANOMALY: { icon: '⚠️', label: 'Anomalía detectada', severity: 'high' },
  MILESTONE: { icon: '🎯', label: 'Hito alcanzado', severity: 'positive' },
  RISK: { icon: '🔴', label: 'Riesgo', severity: 'high' },
  OPPORTUNITY: { icon: '💡', label: 'Oportunidad', severity: 'positive' },
  COMPARISON: { icon: '📊', label: 'Comparativa', severity: 'neutral' },
  INSIGHT: { icon: '🔍', label: 'Hallazgo', severity: 'neutral' },
  LEGAL: { icon: '⚖️', label: 'Legal', severity: 'medium' }
};

// ─── MOTOR PRINCIPAL ──────────────────────────────────────────

/**
 * Analiza el DataBag recolectado y genera hallazgos estructurados.
 *
 * @param {object} bag - DataBag del Collector
 * @param {object} ctx - Contexto completo del usuario
 * @param {Array} conversationHistory - Historial reciente de conversación
 * @returns {object} { findings: Array, summary: string, confidence: number }
 */
function aiReason(bag, ctx, conversationHistory) {
  var findings = [];
  var confidence = 0.85; // base

  // 0. Evaluar fuentes disponibles antes de interpretar números.
  var sourceFindings = _aiAnalyzeSources(bag, ctx);
  findings = findings.concat(sourceFindings.findings);
  confidence -= sourceFindings.penalty;

  // 1. Analizar tendencias si hay datos de cálculo
  if (bag.collected.getCalc) {
    var calcFindings = _aiAnalyzeCalcTrends(ctx);
    findings = findings.concat(calcFindings);
  }

  // 2. Analizar desglose de recargos
  if (bag.collected.analyzeBreakdown) {
    var breakdownFindings = _aiAnalyzeBreakdownDeep(ctx);
    findings = findings.concat(breakdownFindings);
  }

  // 3. Comparar con mes anterior — usa los campos reales de buildContext
  if (ctx.totalCOPMesPasado && ctx.totalCOPMesPasado > 0) {
    var compareFindings = _aiComparePeriods(ctx);
    findings = findings.concat(compareFindings);
  }

  // 4. Detectar anomalías
  if (bag.collected.auditShifts) {
    var auditResult = bag.collected.auditShifts;
    if (auditResult && typeof auditResult === 'string' && auditResult.indexOf('⚠️') >= 0) {
      findings.push({
        type: 'ANOMALY',
        text: auditResult,
        source: 'auditShifts',
        priority: 9
      });
      confidence -= 0.05;
    } else if (auditResult && auditResult.text) {
      findings.push({
        type: auditResult.severity === 'high' ? 'ANOMALY' : 'RISK',
        text: auditResult.text,
        source: 'auditShifts',
        priority: auditResult.severity === 'high' ? 9 : 7,
        data: { auditType: auditResult.type }
      });
      confidence -= 0.03;
    }
  }

  // 4b. Detección local ligera si el auditor no fue invocado.
  if (!bag.collected.auditShifts && ctx && ctx.turnosAll && ctx.turnosAll.length) {
    findings = findings.concat(_aiDetectShiftOutliers(ctx.turnosAll));
  }

  // 5. Analizar eficiencia
  if (bag.collected.analyzeEfficiency && ctx.eficiencia) {
    var effFindings = _aiAnalyzeEfficiencyDeep(ctx);
    findings = findings.concat(effFindings);
  }

  // 6. Ordenar por salience (prioridad + sorpresa: a igual prioridad, el de
  //    mayor desvío va primero — content selection de data-to-text).
  findings = aiRankFindings(findings);

  // 7. Limitar a 5 hallazgos máximo (no abrumar)
  var topFindings = findings.slice(0, 5);

  // 8. Generar resumen ejecutivo
  var summary = _aiBuildExecutiveSummary(topFindings, ctx);

  return {
    findings: topFindings,
    summary: summary,
    confidence: Math.max(0.3, Math.min(1.0, confidence)),
    totalFindings: findings.length,
    topFindings: topFindings
  };
}

// ─── ANÁLISIS DE FUENTES ─────────────────────────────────────

function _aiAnalyzeSources(bag, ctx) {
  var findings = [];
  var penalty = 0;
  var sources = bag && bag.sources ? bag.sources : {};
  var collected = bag && bag.collected ? bag.collected : {};
  var remote = collected.getSupabaseSnapshot;

  if (remote && remote.available) {
    findings.push({
      type: 'INSIGHT',
      text:
        'Datos verificados contra Supabase: ' +
        ((remote.turnos && remote.turnos.length) || 0) +
        ' turnos remotos y perfil de salario consultado.',
      source: 'supabase.snapshot',
      priority: 3,
      data: { remoteTurnos: (remote.turnos && remote.turnos.length) || 0 }
    });
  } else if (remote && !remote.available) {
    penalty += 0.08;
    findings.push({
      type: 'INSIGHT',
      text:
        'No pude validar Supabase ahora (' +
        (remote.reason || 'sin detalle') +
        '). Usé los datos locales disponibles en este dispositivo.',
      source: 'local.fallback',
      priority: 4
    });
  } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
    penalty += 0.1;
  }

  for (var k in sources) {
    if (Object.prototype.hasOwnProperty.call(sources, k) && sources[k] === 'cache') {
      penalty += 0.02;
    }
  }

  if (bag && bag.meta && bag.meta.errorCount > 0) {
    penalty += Math.min(0.2, bag.meta.errorCount * 0.05);
  }

  return { findings: findings, penalty: penalty };
}

function _aiDetectShiftOutliers(turnosAll) {
  var findings = [];
  var durations = [];
  var i;

  for (i = 0; i < turnosAll.length; i++) {
    if (!turnosAll[i].fin) continue;
    var mins = (new Date(turnosAll[i].fin) - new Date(turnosAll[i].inicio)) / 60000;
    if (mins > 0) durations.push(mins);
  }

  if (durations.length < 4) return findings;

  for (i = 0; i < durations.length; i++) {
    if (durations[i] > 16 * 60 || aiIsOutlier(durations[i], durations)) {
      findings.push({
        type: 'ANOMALY',
        text:
          'Detecté un turno atípico de ' +
          (durations[i] / 60).toFixed(1) +
          'h. Conviene revisar si la hora de cierre está correcta.',
        source: 'turnos.outlier',
        priority: 8,
        data: { durationMins: durations[i] }
      });
      break;
    }
  }

  return findings;
}

// ─── ANÁLISIS DE TENDENCIAS ───────────────────────────────────

function _aiAnalyzeCalcTrends(ctx) {
  var f = [];
  if (!ctx || ctx.diasTrab === 0) return f;

  // Ritmo vs meta salarial
  var ritmoEsperado = (ctx.diaActual / ctx.diasMes) * 100;
  var pctActual = ctx.pctSalario || 0;

  if (pctActual >= ritmoEsperado * 1.15) {
    f.push({
      type: 'TREND_UP',
      text:
        'Vas ' +
        (pctActual - ritmoEsperado).toFixed(0) +
        '% por encima del ritmo esperado para el día ' +
        ctx.diaActual +
        '. Si mantenés este ritmo, cerrarías el mes en ' +
        fCOP(ctx.proy) +
        '.',
      source: 'calc.trend',
      priority: 8,
      data: { actual: pctActual, esperado: ritmoEsperado, proyeccion: ctx.proy }
    });
  } else if (pctActual < ritmoEsperado * 0.85 && ctx.diaActual > 5) {
    f.push({
      type: 'TREND_DOWN',
      text:
        'Vas ' +
        (ritmoEsperado - pctActual).toFixed(0) +
        '% por debajo del ritmo. Necesitarías ' +
        fCOP(ctx.proy) +
        ' al cierre, pero al ritmo actual proyectás ' +
        fCOP(ctx.prom * ctx.diasMes || 0) +
        '.',
      source: 'calc.trend',
      priority: 7,
      data: { actual: pctActual, esperado: ritmoEsperado }
    });
  }

  // Días trabajados vs días del mes
  var pctDiasTrab = (ctx.diasTrab / ctx.diaActual) * 100;
  if (pctDiasTrab > 90 && ctx.diaActual > 10) {
    f.push({
      type: 'RISK',
      text:
        'Has trabajado ' +
        ctx.diasTrab +
        ' de los últimos ' +
        ctx.diaActual +
        ' días (' +
        pctDiasTrab.toFixed(0) +
        '%). Considerá tomar un descanso para evitar fatiga.',
      source: 'calc.dias',
      priority: 6
    });
  }

  return f;
}

// ─── ANÁLISIS PROFUNDO DE RECARGOS ────────────────────────────

function _aiAnalyzeBreakdownDeep(ctx) {
  var f = [];
  if (!ctx || !ctx.bd) return f;

  var bd = ctx.bd;
  var totalCOP = ctx.totalCOP || 0;

  // Porcentaje que viene de recargos vs tarifa plana
  var ordCOP = ((bd.diurnaOrd || {}).cop || 0) + ((bd.noctOrd || {}).cop || 0);
  var recargoCOP = totalCOP - ordCOP;
  var pctRecargo = totalCOP > 0 ? (recargoCOP / totalCOP) * 100 : 0;

  if (pctRecargo > 40) {
    f.push({
      type: 'INSIGHT',
      text:
        'El ' +
        pctRecargo.toFixed(0) +
        '% de tus ingresos vienen de recargos (nocturnos, festivos, extras). Estás maximizando bien los beneficios legales.',
      source: 'breakdown.recargo',
      priority: 5,
      data: { pctRecargo: pctRecargo }
    });
  } else if (pctRecargo < 10 && ctx.diasTrab > 5) {
    f.push({
      type: 'OPPORTUNITY',
      text:
        'Solo el ' +
        pctRecargo.toFixed(0) +
        '% de tus ingresos vienen de recargos. Si trabajaras 8h un domingo, ganarías ≈' +
        fCOP(ctx.vh * 8 * 1.75) +
        ' extra (75% más que un día normal).',
      source: 'breakdown.recargo',
      priority: 6,
      data: { pctRecargo: pctRecargo, valorDomingo: ctx.vh * 8 * 1.75 }
    });
  }

  // Categoría dominante
  var maxCat = null;
  var maxCOP = 0;
  for (var k in bd) {
    if (bd[k] && bd[k].cop > maxCOP) {
      maxCOP = bd[k].cop;
      maxCat = k;
    }
  }
  if (maxCat && RC[maxCat] && maxCOP > totalCOP * 0.5) {
    f.push({
      type: 'INSIGHT',
      text:
        'Tu principal fuente de ingreso es ' +
        RC[maxCat].label.toLowerCase() +
        ' (' +
        ((maxCOP / totalCOP) * 100).toFixed(0) +
        '% del total).',
      source: 'breakdown.dominante',
      priority: 4,
      data: { categoria: maxCat, pct: (maxCOP / totalCOP) * 100 }
    });
  }

  return f;
}

// ─── COMPARATIVA DE PERÍODOS ──────────────────────────────────

function _aiComparePeriods(ctx) {
  var f = [];
  if (!ctx || !(ctx.totalCOPMesPasado > 0)) return f;

  var copActual = ctx.totalCOP || 0;
  var copPasado = ctx.totalCOPMesPasado || 0;
  var minsActual = ctx.totalMins || 0;
  var minsPasado = ctx.totalMinsMesPasado || 0;

  // Variación en ingresos
  var varCOP = copPasado > 0 ? ((copActual - copPasado) / copPasado) * 100 : 0;
  var varMins = minsPasado > 0 ? ((minsActual - minsPasado) / minsPasado) * 100 : 0;

  if (Math.abs(varCOP) > 10) {
    var fType = varCOP > 0 ? 'TREND_UP' : 'TREND_DOWN';
    f.push({
      type: fType,
      text:
        'Comparado con el mes pasado: ' +
        (varCOP > 0
          ? 'ganaste ' + fCOP(copActual - copPasado) + ' más'
          : 'ganaste ' + fCOP(copPasado - copActual) + ' menos') +
        ' (' +
        Math.abs(varCOP).toFixed(0) +
        '% de ' +
        (varCOP > 0 ? 'aumento' : 'disminución') +
        '). ' +
        'Tus horas variaron ' +
        (varMins > 0 ? '+' : '') +
        varMins.toFixed(0) +
        '%.',
      source: 'comparison.mes',
      priority: 8,
      data: { varCOP: varCOP, varMins: varMins, copActual: copActual, copPasado: copPasado }
    });
  }

  // Eficiencia mes actual vs pasado
  var efActual = minsActual > 0 ? copActual / (minsActual / 60) : 0;
  var efPasado = minsPasado > 0 ? copPasado / (minsPasado / 60) : 0;
  var varEf = efPasado > 0 ? ((efActual - efPasado) / efPasado) * 100 : 0;

  if (Math.abs(varEf) > 15) {
    f.push({
      type: varEf > 0 ? 'OPPORTUNITY' : 'INSIGHT',
      text:
        'Tu valor por hora ' +
        (varEf > 0 ? 'subió' : 'bajó') +
        ' ' +
        Math.abs(varEf).toFixed(0) +
        '% respecto al mes pasado (' +
        fCOP(efActual) +
        '/h vs ' +
        fCOP(efPasado) +
        '/h). ' +
        (varEf > 0
          ? 'Estás eligiendo mejores horarios con más recargos.'
          : 'El mes pasado tuviste más horas con recargo. Considerá trabajar más festivos o nocturnos.'),
      source: 'comparison.eficiencia',
      priority: 6,
      data: { varEf: varEf, efActual: efActual, efPasado: efPasado }
    });
  }

  return f;
}

// ─── ANÁLISIS DE EFICIENCIA ───────────────────────────────────

function _aiAnalyzeEfficiencyDeep(ctx) {
  var f = [];
  if (!ctx || ctx.diasTrab === 0) return f;

  // COP/hora vs valor hora base
  var vhBase = ctx.vh || ctx.salario / 240;
  var efRelativa = vhBase > 0 ? (ctx.eficiencia || 0) / vhBase : 0;

  if (efRelativa > 1.5) {
    f.push({
      type: 'MILESTONE',
      text:
        'Tu valor por hora real (' +
        fCOP(ctx.eficiencia) +
        '/h) es ' +
        ((efRelativa - 1) * 100).toFixed(0) +
        '% mayor que tu valor hora base (' +
        fCOP(vhBase) +
        '/h). ¡Excelente aprovechamiento de recargos!',
      source: 'efficiency.ratio',
      priority: 7,
      data: { efRelativa: efRelativa, eficiencia: ctx.eficiencia, vhBase: vhBase }
    });
  }

  // Mejor día vs promedio
  if (ctx.mejor && ctx.prom) {
    var ratioMejor = ctx.mejor.cop / ctx.prom;
    if (ratioMejor > 2.5) {
      f.push({
        type: 'INSIGHT',
        text:
          'Tu mejor día (' +
          fCOP(ctx.mejor.cop) +
          ') fue ' +
          ratioMejor.toFixed(1) +
          'x tu promedio. ¿Ese día trabajaste en festivo o hiciste horas extra? Identificar qué lo hizo bueno te ayuda a repetirlo.',
        source: 'efficiency.mejor',
        priority: 5
      });
    }
  }

  return f;
}

// ─── RESUMEN EJECUTIVO ────────────────────────────────────────

function _aiBuildExecutiveSummary(findings, ctx) {
  if (!findings || findings.length === 0) {
    return 'Sin hallazgos destacables en este análisis.';
  }

  var positives = 0,
    warnings = 0;
  for (var i = 0; i < findings.length; i++) {
    var sev =
      findings[i].type && AI_FINDING_TYPES[findings[i].type]
        ? AI_FINDING_TYPES[findings[i].type].severity
        : 'neutral';
    if (sev === 'positive') positives++;
    else if (sev === 'warning' || sev === 'high') warnings++;
  }

  var summary = '';
  if (positives > warnings) {
    summary = '✅ En general, tus números van bien. ';
  } else if (warnings > positives) {
    summary = '⚠️ Hay algunos puntos que requieren atención. ';
  } else {
    summary = '📊 Análisis mixto. ';
  }

  summary += positives + ' indicadores positivos, ' + warnings + ' advertencias.';

  if (positives > 0) summary += ' ¡Buen trabajo!';
  if (warnings > 0) summary += ' Revisá los detalles abajo.';

  return summary;
}

// ─── UTILIDADES ────────────────────────────────────────────────

/**
 * Calcula variación porcentual entre dos valores.
 */
function aiVarPct(actual, anterior) {
  if (!anterior || anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}

/**
 * Detecta si un valor es atípico (z-score > 2 en una serie simple).
 */
function aiIsOutlier(val, serie) {
  if (!serie || serie.length < 3) return false;
  var sum = 0;
  for (var i = 0; i < serie.length; i++) sum += serie[i];
  var avg = sum / serie.length;
  var sumSq = 0;
  for (var j = 0; j < serie.length; j++) sumSq += Math.pow(serie[j] - avg, 2);
  var std = Math.sqrt(sumSq / serie.length);
  if (std === 0) return false;
  return Math.abs(val - avg) / std > 2;
}

/**
 * Salience: ordena hallazgos por prioridad + "sorpresa" (magnitud del
 * desvío). El bonus está acotado a <1 a propósito: la prioridad (entera)
 * SIEMPRE domina entre niveles (un ANOMALY=9 no baja de un RISK=7), y la
 * sorpresa solo decide a IGUAL prioridad — el hallazgo con mayor variación
 * va primero. Es content selection de data-to-text, sin reordenar de más.
 */
function aiRankFindings(findings) {
  if (!findings || !findings.length) return findings || [];
  function surprise(f) {
    var d = f && f.data ? f.data : null;
    if (!d) return 0;
    var keys = ['varCOP', 'varEf', 'pct', 'deviation', 'magnitude', 'varMins'];
    var max = 0;
    for (var i = 0; i < keys.length; i++) {
      var v = d[keys[i]];
      if (typeof v === 'number' && Math.abs(v) > max) max = Math.abs(v);
    }
    return Math.min(0.9, max / 100);
  }
  return findings.slice().sort(function (a, b) {
    return (b.priority || 5) + surprise(b) - ((a.priority || 5) + surprise(a));
  });
}

window.aiReason = aiReason;
window.aiVarPct = aiVarPct;
window.aiIsOutlier = aiIsOutlier;
window.aiRankFindings = aiRankFindings;
console.log('[MT] ai-reasoning.js cargado — Reasoning Engine ✓');
