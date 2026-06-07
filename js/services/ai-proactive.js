// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-proactive.js
//  Inteligencia proactiva — la IA detecta patrones y te avisa.
//  · Briefing diario (resumen al abrir)
//  · Alertas inteligentes (patrones, hitos, oportunidades)
//  · Seguimiento de metas (memoria entre sesiones)
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── BRIEFING DIARIO ──────────────────────────────────────────

/**
 * Genera un briefing rápido al abrir la app.
 * Se muestra en el hero del asistente como frase contextual.
 * @param {object} c - contexto de buildContext
 * @returns {string|null}
 */
function aiBriefing(c) {
  if (!c) return null;
  var parts = [];

  // Estado general
  if (c.diasTrab > 0) {
    parts.push('Este mes llevás ' + fCOP(c.totalCOP) + ' en ' + c.diasTrab + ' turnos.');
  } else {
    parts.push('Aún no tenés turnos este mes. ¿Arrancamos?');
  }

  // Proyección
  if (c.proy && c.proy > 0) {
    var vsSalario = c.salario > 0 ? ((c.proy / c.salario - 1) * 100) : 0;
    parts.push('Al cierre proyectás ' + fCOP(c.proy) +
      (Math.abs(vsSalario) > 5 ? ' (' + (vsSalario > 0 ? '+' : '') + vsSalario.toFixed(0) + '% vs tu salario).' : '.'));
  }

  // Hoy
  if (c.turnosHoy > 0) {
    parts.push('Hoy llevás ' + fCOP(c.copHoy) + ' en ' + fDur(c.minsHoy) + '.');
  }

  // Alerta de racha
  if (c.rachaActual >= 5) {
    parts.push('Llevás ' + c.rachaActual + ' días seguidos. ¿Un descanso?');
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

// ─── ALERTAS INTELIGENTES ─────────────────────────────────────

/**
 * Detecta patrones y genera alertas proactivas.
 * @param {object} c - contexto
 * @returns {string|null}
 */
function aiAlerts(c) {
  if (!c || c.diasTrab === 0) return null;
  var alerts = [];

  // Alerta: viernes + debajo del promedio → oportunidad fin de semana
  var ahora = c.ahora || new Date();
  var diaSemana = ahora.getDay();
  if (diaSemana === 5 && c.pctSalario < 70) {
    alerts.push('📅 Hoy es viernes. Si trabajás sábado y domingo, podrías sumar ≈' +
      fCOP(c.prom * 2.5) + ' extra este fin de semana (con recargos dominicales del 75%).');
  }

  // Alerta: cerca del límite legal
  if (c.hrsSemanales > 40) {
    alerts.push('⚖️ Vas ' + c.hrsSemanales.toFixed(1) + 'h esta semana. El límite legal es 44h. ' +
      'Si pasás de 44h, asegurate de que te paguen las extras (25% a 75% según horario).');
  }

  // Alerta: mes casi terminado, lejos de la meta
  var diasRest = c.diasRestantes || 0;
  if (diasRest <= 5 && c.pctSalario < 80 && c.diasTrab > 0) {
    alerts.push('⏰ Quedan solo ' + diasRest + ' días del mes y vas al ' + c.pctSalario.toFixed(0) +
      '% de tu salario. Necesitás ≈' + fCOP((c.salario - c.totalCOP) / Math.max(1, diasRest)) + '/día para llegar al 100%.');
  }

  // Alerta: mañana es festivo
  var manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  if (typeof esFest === 'function' && esFest(manana)) {
    alerts.push('⛪ ¡Mañana es festivo! Si trabajás, cada hora vale 75% más. Un turno de 8h te daría ≈' +
      fCOP(c.vh * 8 * 1.75) + ' en vez de ' + fCOP(c.vh * 8) + '.');
  }

  // Alerta: superaste tu mejor marca
  if (c.totalCOP > 0 && c.totalCOP > c.totalCOPMesPasado && c.totalCOPMesPasado > 0) {
    var diff = c.totalCOP - c.totalCOPMesPasado;
    alerts.push('🎉 ¡Ya superaste el mes pasado por ' + fCOP(diff) + '! Y todavía faltan ' + diasRest + ' días.');
  }

  return alerts.length > 0 ? '\n\n🔔 **Alertas**\n' + alerts.join('\n\n') : null;
}

// ─── SEGUIMIENTO DE METAS ─────────────────────────────────────

/**
 * Guarda una meta financiera para seguimiento.
 * @param {number} amount - monto de la meta
 */
function aiSetGoal(amount) {
  if (!amount || amount <= 0) return;
  try {
    var goals = leer('mt_goals', []);
    goals.push({ amount: amount, date: new Date().toISOString(), reached: false });
    grabar('mt_goals', goals);
  } catch (_) {}
}

/**
 * Verifica metas guardadas y devuelve estado.
 * @param {object} c - contexto
 * @returns {string|null}
 */
function aiCheckGoals(c) {
  if (!c) return null;
  var goals;
  try { goals = leer('mt_goals', null); } catch (_) { return null; }
  if (!goals || !goals.length) return null;

  var resp = '\n\n🎯 **Tus metas**\n';
  var activeGoals = 0;

  for (var i = 0; i < goals.length; i++) {
    var g = goals[i];
    if (g.reached) continue;
    activeGoals++;
    var falta = Math.max(0, g.amount - c.totalCOP);
    var pct = g.amount > 0 ? Math.min(100, (c.totalCOP / g.amount) * 100) : 0;
    resp += '• Meta ' + (i + 1) + ': ' + fCOP(g.amount) + ' — vas ' + pct.toFixed(0) + '%';
    if (falta <= 0) {
      resp += ' ✅ ¡Cumplida!';
      g.reached = true;
    } else {
      var diasFaltan = c.prom > 0 ? Math.ceil(falta / c.prom) : 0;
      resp += ' (te faltan ≈' + fCOP(falta) + ', ≈' + diasFaltan + ' días)';
    }
    resp += '\n';
  }

  // Guardar metas actualizadas (marcar cumplidas)
  if (activeGoals > 0) {
    try { grabar('mt_goals', goals); } catch (_) {}
  }

  return activeGoals > 0 ? resp : null;
}

// ─── INTEGRACIÓN ──────────────────────────────────────────────

/**
 * Orquesta todas las capacidades proactivas.
 * Se llama desde aiEnhancedRespond para enriquecer respuestas.
 * @param {object} c - contexto
 * @param {string} intent - intent NLP
 * @returns {string}
 */
function aiProactive(c, intent) {
  if (!c) return '';
  var parts = [];

  // Alertas solo en respuestas principales
  if (intent === 'total_ganado' || intent === 'stats' || intent === 'hoy') {
    var alerts = aiAlerts(c);
    if (alerts) parts.push(alerts);
  }

  // Metas en respuestas de ingresos
  if (intent === 'total_ganado' || intent === 'stats') {
    var goals = aiCheckGoals(c);
    if (goals) parts.push(goals);
  }

  return parts.join('');
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiBriefing = aiBriefing;
window.aiAlerts = aiAlerts;
window.aiSetGoal = aiSetGoal;
window.aiCheckGoals = aiCheckGoals;
window.aiProactive = aiProactive;

console.log('[MT] ai-proactive.js cargado — inteligencia proactiva ✓');
