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
  if (c.proy && c.proy > 0 && c.salario >= 500000) {
    var vsSalario = (c.proy / c.salario - 1) * 100;
    // Clampear a ±300% para evitar porcentajes absurdos por salario mal configurado
    vsSalario = Math.max(-300, Math.min(300, vsSalario));
    parts.push(
      'Al cierre proyectás ' +
        fCOP(c.proy) +
        (Math.abs(vsSalario) > 5
          ? ' (' + (vsSalario > 0 ? '+' : '') + vsSalario.toFixed(0) + '% vs tu salario).'
          : '.')
    );
  } else if (c.proy && c.proy > 0) {
    parts.push('Al cierre proyectás ' + fCOP(c.proy) + '.');
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
    alerts.push(
      '📅 Hoy es viernes. Si trabajás sábado y domingo, podrías sumar ≈' +
        fCOP(c.prom * 2.5) +
        ' extra este fin de semana (con recargos dominicales del 75%).'
    );
  }

  // Alerta: cerca del límite legal
  if (c.hrsSemanales > 40) {
    alerts.push(
      '⚖️ Vas ' +
        c.hrsSemanales.toFixed(1) +
        'h esta semana. El límite legal es 44h. ' +
        'Si pasás de 44h, asegurate de que te paguen las extras (25% a 75% según horario).'
    );
  }

  // Alerta: mes casi terminado, lejos de la meta
  var diasRest = c.diasRestantes || 0;
  if (diasRest <= 5 && c.pctSalario < 80 && c.diasTrab > 0) {
    alerts.push(
      '⏰ Quedan solo ' +
        diasRest +
        ' días del mes y vas al ' +
        c.pctSalario.toFixed(0) +
        '% de tu salario. Necesitás ≈' +
        fCOP((c.salario - c.totalCOP) / Math.max(1, diasRest)) +
        '/día para llegar al 100%.'
    );
  }

  // Alerta: mañana es festivo
  var manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  if (typeof esFest === 'function' && esFest(manana)) {
    alerts.push(
      '⛪ ¡Mañana es festivo! Si trabajás, cada hora vale 75% más. Un turno de 8h te daría ≈' +
        fCOP(c.vh * 8 * 1.75) +
        ' en vez de ' +
        fCOP(c.vh * 8) +
        '.'
    );
  }

  // Alerta: superaste tu mejor marca
  if (c.totalCOP > 0 && c.totalCOP > c.totalCOPMesPasado && c.totalCOPMesPasado > 0) {
    var diff = c.totalCOP - c.totalCOPMesPasado;
    alerts.push(
      '🎉 ¡Ya superaste el mes pasado por ' +
        fCOP(diff) +
        '! Y todavía faltan ' +
        diasRest +
        ' días.'
    );
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
    if (!goals || !goals.length) goals = [];
    // Dedup: si ya existe una meta activa por el mismo monto, refrescar su
    // fecha en vez de apilar duplicados (pedir "2 millones" dos veces creaba
    // dos metas idénticas y el seguimiento las contaba doble).
    for (var i = 0; i < goals.length; i++) {
      if (!goals[i].reached && goals[i].amount === amount) {
        goals[i].date = new Date().toISOString();
        grabar('mt_goals', goals);
        return;
      }
    }
    goals.push({ amount: amount, date: new Date().toISOString(), reached: false });
    grabar('mt_goals', goals);
  } catch (_) {}
}

/**
 * Línea proactiva corta sobre la meta activa más reciente, para mostrar
 * al volver a la app sin que el usuario la pida. Devuelve '' si no hay
 * meta activa o si no hay datos suficientes.
 * @param {object} c - contexto de buildContext
 * @returns {string}
 */
function aiGoalStatusLine(c) {
  if (!c) return '';
  var goals;
  try {
    goals = leer('mt_goals', null);
  } catch (_) {
    return '';
  }
  if (!goals || !goals.length) return '';

  // Tomar la meta activa más reciente (última agregada sin cumplir)
  var g = null;
  for (var i = goals.length - 1; i >= 0; i--) {
    if (!goals[i].reached) {
      g = goals[i];
      break;
    }
  }
  if (!g || !g.amount) return '';

  var falta = Math.max(0, g.amount - c.totalCOP);
  if (falta <= 0) {
    return '🎯 ¡Llegaste a tu meta de ' + fCOP(g.amount) + '! Vas en ' + fCOP(c.totalCOP) + '. 🙌';
  }
  var pct = g.amount > 0 ? Math.min(100, (c.totalCOP / g.amount) * 100) : 0;
  var linea =
    '🎯 Tu meta de ' +
    fCOP(g.amount) +
    ': vas al ' +
    pct.toFixed(0) +
    '%, te faltan ' +
    fCOP(falta) +
    '.';
  if (c.prom > 0) {
    var diasFaltan = Math.ceil(falta / c.prom);
    linea += ' A tu ritmo, ≈' + diasFaltan + (diasFaltan === 1 ? ' día.' : ' días.');
  }
  return linea;
}

/**
 * Verifica metas guardadas y devuelve estado.
 * @param {object} c - contexto
 * @returns {string|null}
 */
function aiCheckGoals(c) {
  if (!c) return null;
  var goals;
  try {
    goals = leer('mt_goals', null);
  } catch (_) {
    return null;
  }
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
    try {
      grabar('mt_goals', goals);
    } catch (_) {}
  }

  return activeGoals > 0 ? resp : null;
}

// ─── HIGIENE DE DATOS ─────────────────────────────────────────
// Detecta datos sospechosos que ensucian el cálculo de nómina: turno
// activo olvidado abierto, turnos exageradamente largos, solapamientos.
// Devuelve texto para anteponer/anexar, o '' si todo está sano.
var _AI_HYG_MES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic'
];

function _aiHygFecha(ms) {
  var d = new Date(ms);
  return d.getDate() + ' ' + _AI_HYG_MES[d.getMonth()];
}

function aiDataHygiene(c) {
  if (!c) return '';
  var avisos = [];

  // 1. Turno activo abierto demasiado tiempo (>16h) → probable olvido
  if (c.tieneActivo && c.minutosEnTurnoActual > 16 * 60) {
    avisos.push(
      '⏱️ Tu turno lleva **' +
        fDur(c.minutosEnTurnoActual) +
        '** abierto. ¿Te olvidaste de cerrarlo? Podés finalizarlo en **Inicio** ' +
        'o decirme la hora real de salida.'
    );
  }

  // Normalizar turnos cerrados a intervalos válidos, ordenados por inicio
  var ivs = [];
  var todos = c.turnosAll || [];
  for (var i = 0; i < todos.length; i++) {
    var tn = todos[i];
    if (!tn || !tn.fin) continue;
    var ini = new Date(tn.inicio).getTime();
    var fin = new Date(tn.fin).getTime();
    if (isNaN(ini) || isNaN(fin) || fin <= ini) continue;
    ivs.push({ ini: ini, fin: fin });
  }
  ivs.sort(function (a, b) {
    return a.ini - b.ini;
  });

  // 2. Turno sospechosamente largo (>16h) — solo el primero, sin abrumar
  for (var j = 0; j < ivs.length; j++) {
    var dur = (ivs[j].fin - ivs[j].ini) / 60000;
    if (dur > 16 * 60) {
      avisos.push(
        '🔎 El turno del **' +
          _aiHygFecha(ivs[j].ini) +
          '** duró **' +
          fDur(Math.round(dur)) +
          '** — ¿seguro? Si fue un error de registro, corregilo en **Historial**.'
      );
      break;
    }
  }

  // 3. Solapamientos (dos turnos que se pisan en el tiempo) — inflan horas
  for (var k = 1; k < ivs.length; k++) {
    if (ivs[k].ini < ivs[k - 1].fin) {
      avisos.push(
        '⚠️ Hay turnos que se solapan (' +
          _aiHygFecha(ivs[k - 1].ini) +
          ' y ' +
          _aiHygFecha(ivs[k].ini) +
          '). Eso puede inflar tus horas y tu pago. Revisalos en **Historial**.'
      );
      break;
    }
  }

  if (!avisos.length) return '';
  return '\n\n🩺 **Revisión de datos**\n' + avisos.slice(0, 2).join('\n\n');
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

  // Higiene de datos: en resúmenes y al consultar ingresos/horas, donde un
  // dato sucio distorsiona lo que el usuario está viendo.
  if (
    intent === 'total_ganado' ||
    intent === 'stats' ||
    intent === 'horas_trabajadas' ||
    intent === 'consulta_datos'
  ) {
    var hyg = aiDataHygiene(c);
    if (hyg) parts.push(hyg);
  }

  return parts.join('');
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiBriefing = aiBriefing;
window.aiAlerts = aiAlerts;
window.aiSetGoal = aiSetGoal;
window.aiCheckGoals = aiCheckGoals;
window.aiGoalStatusLine = aiGoalStatusLine;
window.aiDataHygiene = aiDataHygiene;
window.aiProactive = aiProactive;

console.log('[MT] ai-proactive.js cargado — inteligencia proactiva ✓');
