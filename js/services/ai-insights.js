// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-insights.js
//  Motor de análisis financiero profundo — la IA "piensa" más.
//  Genera narrativa, contexto legal, proyecciones múltiples y
//  recomendaciones personalizadas basadas en los datos del usuario.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── ANÁLISIS DE PATRONES ─────────────────────────────────────

/**
 * Analiza el desglose de recargos y devuelve narrativa enriquecida.
 * @param {object} c - contexto de buildContext
 * @returns {string}
 */
function aiInsightBreakdown(c) {
  if (!c || !c.bd) return '';
  var parts = [];
  var bd = c.bd;

  // Horas nocturnas
  var noctMins =
    ((bd.noctOrd || {}).mins || 0) +
    ((bd.extraNoct || {}).mins || 0) +
    ((bd.noctFest || {}).mins || 0) +
    ((bd.extraFestNoct || {}).mins || 0);
  if (noctMins > 0) {
    var noctPct = c.totalMins > 0 ? (noctMins / c.totalMins) * 100 : 0;
    parts.push(
      '🌙 **' +
        (noctPct > 40 ? 'Alta carga nocturna' : 'Horas nocturnas') +
        ':** ' +
        fDur(noctMins) +
        ' (' +
        noctPct.toFixed(0) +
        '% del total). ' +
        (noctPct > 40
          ? 'La ley no pone límite a las horas nocturnas, pero estudios recomiendan no superar el 50% para preservar la salud. Cada hora nocturna te rinde 35% más que una diurna.'
          : 'Las horas nocturnas pagan 35% extra. Si aumentaras un 10% tus horas de noche, ganarías aproximadamente ' +
            fCOP(c.totalCOP * 0.035) +
            ' adicionales este mes.')
    );
  }

  // Horas festivas
  var festMins =
    ((bd.diurnaFest || {}).mins || 0) +
    ((bd.noctFest || {}).mins || 0) +
    ((bd.extraFestDiur || {}).mins || 0) +
    ((bd.extraFestNoct || {}).mins || 0);
  if (festMins > 0) {
    var _Df = c.ahora || new Date();
    var _feD = Math.round(getRecargoFestivo(_Df) * 100); // 80 hoy (Ley 2466/2025)
    var _feN = Math.round((rcFactor('noctFest', _Df) - 1) * 100); // 115
    parts.push(
      '⛪ **Festivos trabajados:** ' +
        fDur(festMins) +
        ' en ' +
        (c.festDiasCount || 0) +
        ' día(s). ' +
        'El recargo festivo es del ' +
        _feD +
        '% (diurno) o ' +
        _feN +
        '% (nocturno). ' +
        'Por ley, el trabajo en domingo o festivo debe compensarse con descanso o pago doble. ' +
        'Cada festivo trabajado suma aproximadamente ' +
        fCOP(((c.salario || 0) / 30) * getRecargoFestivo(_Df)) +
        ' extra sobre un día normal.'
    );
  }

  // Horas extra
  var extraMins =
    ((bd.extraDiurna || {}).mins || 0) +
    ((bd.extraNoct || {}).mins || 0) +
    ((bd.extraFestDiur || {}).mins || 0) +
    ((bd.extraFestNoct || {}).mins || 0);
  if (extraMins > 0) {
    parts.push(
      '➕ **Horas extra:** ' +
        fDur(extraMins) +
        '. ' +
        'El CST limita las horas extra a 2 por día y 12 por semana. ' +
        (extraMins / 60 > 12
          ? '⚠️ Ya superaste el límite semanal de 12h extra. Verificá que tu empleador esté cumpliendo con los descansos obligatorios.'
          : 'Aún tenés margen: podrías hacer hasta ' +
            (12 - extraMins / 60).toFixed(0) +
            'h extra más esta semana sin exceder el límite legal.')
    );
  }

  // Días ordinarios
  var ordMins = ((bd.diurnaOrd || {}).mins || 0) + ((bd.noctOrd || {}).mins || 0);
  if (c.totalMins > 0) {
    var ordPct = (ordMins / c.totalMins) * 100;
    parts.push(
      '📊 **Composición:** ' +
        ordPct.toFixed(0) +
        '% ordinario, ' +
        (100 - ordPct).toFixed(0) +
        '% con recargo. ' +
        (ordPct > 85
          ? 'Casi todo tu ingreso es tarifa plana. Si buscás maximizar, intentá trabajar más domingos o noches — cada uno paga entre 35% y 110% extra.'
          : 'Buena mezcla de recargos. Estás aprovechando los beneficios de la ley para maximizar tu ingreso.')
    );
  }

  return parts.length > 0 ? '\n\n📋 **Análisis de tus recargos**\n' + parts.join('\n\n') : '';
}

// ─── PROYECCIONES MÚLTIPLES ───────────────────────────────────

/**
 * Genera escenarios optimista, realista y pesimista.
 * @param {object} c - contexto
 * @returns {string}
 */
function aiInsightScenarios(c) {
  if (!c || c.diasTrab === 0) return '';
  var diasRestantes = c.diasRestantes || 0;
  if (diasRestantes <= 0) return '';

  var promDiario = c.prom || c.totalCOP / Math.max(1, c.diasTrab);
  var promHoras = c.promHoras || c.totalMins / Math.max(1, c.diasTrab) / 60;

  // Escenarios
  var optimista = c.totalCOP + promDiario * 1.3 * diasRestantes;
  var realista = c.proy || c.totalCOP + promDiario * diasRestantes;
  var pesimista = c.totalCOP + promDiario * 0.5 * Math.max(1, diasRestantes - 3);

  var resp = '\n\n🔮 **Proyecciones al cierre**\n';

  resp +=
    '• ☀️ **Optimista:** ' +
    fCOP(optimista) +
    ' — Si mantenés el ritmo y metés horas extra o festivos.\n';
  resp += '• 📊 **Realista:** ' + fCOP(realista) + ' — A tu ritmo actual sin cambios.\n';
  resp += '• 🌧 **Pesimista:** ' + fCOP(pesimista) + ' — Si trabajás menos días o reducís horas.\n';

  // Días necesarios para llegar al salario base
  var falta = Math.max(0, (c.salario || 0) - c.totalCOP);
  if (falta > 0 && promDiario > 0) {
    var diasParaMeta = Math.ceil(falta / promDiario);
    resp +=
      '\n🎯 Para alcanzar tu salario base de ' +
      fCOP(c.salario) +
      ', necesitás ≈ ' +
      diasParaMeta +
      ' día(s) más a tu ritmo actual.\n';
    if (promHoras > 0) {
      var horasDiarias = promHoras;
      resp +=
        'Si hicieras ' +
        (horasDiarias + 2).toFixed(0) +
        'h en vez de ' +
        horasDiarias.toFixed(1) +
        'h por día, llegarías en ≈ ' +
        Math.ceil(falta / (c.copPorHoraReal * (horasDiarias + 2))) +
        ' días.\n';
    }
  }

  return resp;
}

// ─── ANÁLISIS DE EFICIENCIA ───────────────────────────────────

/**
 * Analiza la eficiencia: mejor día, peor día, día óptimo para trabajar.
 * @param {object} c - contexto
 * @returns {string}
 */
function aiInsightEfficiency(c) {
  if (!c || !c.dias || c.dias.length === 0) return '';
  var dias = c.dias;
  var mejor = dias.reduce(function (a, b) {
    return b.cop > a.cop ? b : a;
  }, dias[0]);
  var peor = dias.reduce(function (a, b) {
    return b.cop < a.cop ? b : a;
  }, dias[0]);

  var resp = '\n\n⚡ **Eficiencia**\n';

  // Mejor día
  if (mejor && mejor.fecha) {
    resp +=
      '• 🏆 **Mejor día:** ' +
      _formatFecha(mejor.fecha) +
      ' — ' +
      fCOP(mejor.cop) +
      ' en ' +
      fDur(mejor.mins) +
      '\n';
  }

  // Peor día
  if (peor && peor.fecha && peor.fecha !== (mejor ? mejor.fecha : '')) {
    resp +=
      '• 📉 **Día más bajo:** ' +
      _formatFecha(peor.fecha) +
      ' — ' +
      fCOP(peor.cop) +
      ' en ' +
      fDur(peor.mins) +
      '\n';
  }

  // COP por hora
  if (c.copPorHoraReal && c.vh) {
    var eficienciaPct = (c.copPorHoraReal / c.vh - 1) * 100;
    resp +=
      '• 💵 **Valor hora efectivo:** ' +
      fCOP(c.copPorHoraReal) +
      ' (' +
      (eficienciaPct >= 0 ? '+' : '') +
      eficienciaPct.toFixed(0) +
      '% sobre la base)\n';
    if (eficienciaPct > 20) {
      resp += '  ¡Excelente! Tus recargos están potenciando tu hora en más del 20%.\n';
    } else if (eficienciaPct < 5) {
      resp +=
        '  Tus recargos son bajos. Considerá turnos nocturnos o festivos para aumentar este número.\n';
    }
  }

  // Día más rentable de la semana (por patrón)
  if (c.bestDowInfo && c.bestDowInfo.count > 0) {
    var dowNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var bestDia = c.bestDowInfo.dia;
    resp +=
      '• 📅 **Día más rentable:** ' +
      dowNames[bestDia] +
      ' (promedio ' +
      fCOP(c.bestDowInfo.cop / Math.max(1, c.bestDowInfo.count)) +
      '/día)\n';
    if (bestDia === 0) {
      resp +=
        '  Los domingos pagan recargo del ' +
        Math.round(getRecargoFestivo(c.ahora || new Date()) * 100) +
        '%. Trabajar domingos es la forma más rápida de aumentar tu ingreso.\n';
    }
  }

  return resp;
}

// ─── CONTEXTO LEGAL ────────────────────────────────────────────

/**
 * Agrega contexto legal relevante según los datos del usuario.
 * @param {object} c - contexto
 * @returns {string}
 */
function aiInsightLegal(c) {
  if (!c) return '';
  var parts = [];

  // Verificar horas semanales
  if (c.hrsSemanales && c.hrsSemanales > 44) {
    parts.push(
      '⚖️ **Jornada semanal:** ' +
        c.hrsSemanales.toFixed(1) +
        'h. ' +
        'La Ley 2101 de 2021 establece un máximo de 44h/semana para 2026. ' +
        'Si estás superando este límite de forma habitual, tu empleador debe pagar las horas extra correspondientes.'
    );
  }

  // Verificar racha de días
  if (c.rachaActual >= 6) {
    parts.push(
      '⚠️ **Racha de ' +
        c.rachaActual +
        ' días:** La ley exige al menos 1 día de descanso por cada 6 trabajados (Art. 77 CST). ' +
        'Si no te dan ese descanso, te corresponde pago doble por el día trabajado de más.'
    );
  }

  // Auxilio de transporte
  var auxilioAplicable = (c.salario || 0) <= SMIN * 2;
  if (auxilioAplicable) {
    var auxDiario = AUX_TRANSPORTE_2026 / 30;
    parts.push(
      '🚌 **Auxilio de transporte:** Tenés derecho a $' +
        AUX_TRANSPORTE_2026.toLocaleString() +
        ' mensuales ' +
        '(≈$' +
        auxDiario.toFixed(0) +
        '/día). Esto aplica si ganás hasta 2 SMMLV. Activá esta opción en Ajustes > Preferencias.'
    );
  }

  // Prestaciones
  if (c.totalCOP > 0) {
    var prestEst = c.totalCOP * 0.218;
    parts.push(
      '💰 **Prestaciones estimadas:** ≈' +
        fCOP(prestEst) +
        ' (21.8% sobre bruto — incluye prima, cesantías, vacaciones e intereses). ' +
        'Este es un estimado. El cálculo exacto depende de tu contrato y antigüedad.'
    );
  }

  return parts.length > 0 ? '\n\n⚖️ **Contexto legal**\n' + parts.join('\n\n') : '';
}

// ─── RECOMENDACIONES PERSONALIZADAS ───────────────────────────

/**
 * Genera recomendaciones accionables basadas en los datos.
 * @param {object} c - contexto
 * @returns {string}
 */
function aiInsightRecommendations(c) {
  if (!c || c.diasTrab === 0) return '';
  var tips = [];

  // Si el % del salario es bajo
  if (c.pctSalario < 40 && c.diasRestantes > 5) {
    tips.push(
      '💡 Vas al ' +
        c.pctSalario.toFixed(0) +
        '% de tu salario base. Para llegar al 100%, necesitás ≈' +
        fCOP((c.salario - c.totalCOP) * 1.1) +
        ' más. Probá trabajar fines de semana o noches — pagan entre 35% y ' +
        Math.round(getRecargoFestivo(c.ahora || new Date()) * 100) +
        '% extra.'
    );
  }

  // Si casi no tiene recargos
  var hasNocturno =
    (c.bd && c.bd.noctOrd && c.bd.noctOrd.mins > 0) ||
    (c.bd && c.bd.extraNoct && c.bd.extraNoct.mins > 0);
  var hasFestivo =
    (c.bd && c.bd.diurnaFest && c.bd.diurnaFest.mins > 0) ||
    (c.bd && c.bd.noctFest && c.bd.noctFest.mins > 0);
  if (!hasNocturno && !hasFestivo && c.diasTrab > 3) {
    tips.push(
      '🌙 No has trabajado turnos nocturnos ni festivos este mes. Si hicieras 8h nocturnas una vez por semana, sumarías ≈' +
        fCOP(c.vh * 8 * 0.35 * 4) +
        ' extra al mes (35% de recargo).'
    );
  }

  // Si la racha es larga
  if (c.rachaActual >= 5) {
    tips.push(
      '🧘 Llevás ' +
        c.rachaActual +
        ' días sin descanso. Considerá tomarte un día libre — tu productividad y salud lo agradecerán. La ley además te protege.'
    );
  }

  // Optimización de horario
  if (c.copPorHoraReal && c.vh && c.copPorHoraReal < c.vh * 1.1 && c.diasTrab > 3) {
    tips.push(
      '📊 Tu valor hora efectivo es ' +
        fCOP(c.copPorHoraReal) +
        ', apenas un ' +
        ((c.copPorHoraReal / c.vh - 1) * 100).toFixed(0) +
        '% sobre la base. Si movieras el 20% de tus horas a horario nocturno, ganarías ≈' +
        fCOP(c.totalCOP * 0.07) +
        ' extra sin trabajar más horas.'
    );
  }

  return tips.length > 0 ? '\n\n💡 **Recomendaciones**\n' + tips.join('\n\n') : '';
}

// ─── ANÁLISIS COMPLETO ────────────────────────────────────────

/**
 * Genera un análisis financiero completo con todas las secciones.
 * Se inyecta en las respuestas de la IA cuando el usuario pide análisis.
 * @param {object} c - contexto de buildContext
 * @param {string} intent - intent NLP
 * @returns {string} texto adicional para la respuesta
 */
function aiInsightFull(c, intent) {
  if (!c || c.diasTrab === 0) return '';

  // Esta función solo se llama desde aiEnhancedRespond cuando _verboso=true,
  // pero se refuerza acá: solo intents de análisis explícito generan el bloque completo.
  var sections = [];

  if (intent === 'analisis' || intent === 'informe_completo' || intent === 'distribucion') {
    sections.push(aiInsightBreakdown(c));
    sections.push(aiInsightEfficiency(c));
    sections.push(aiInsightScenarios(c));
    sections.push(aiInsightLegal(c));
    sections.push(aiInsightRecommendations(c));
  } else if (intent === 'total_ganado' || intent === 'stats' || intent === 'proyeccion') {
    // En modo verboso, mostrar eficiencia + escenarios (sin legal/recomendaciones que son muy largas)
    sections.push(aiInsightEfficiency(c));
    sections.push(aiInsightScenarios(c));
  } else if (intent === 'comparativa_mes' || intent === 'comparativa_semana') {
    sections.push(aiInsightEfficiency(c));
  }

  return sections
    .filter(function (s) {
      return s && s.length > 0;
    })
    .join('\n');
}

// ─── HELPERS ──────────────────────────────────────────────────

function _formatFecha(fechaISO) {
  var d = new Date(fechaISO + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiInsightBreakdown = aiInsightBreakdown;
window.aiInsightScenarios = aiInsightScenarios;
window.aiInsightEfficiency = aiInsightEfficiency;
window.aiInsightLegal = aiInsightLegal;
window.aiInsightRecommendations = aiInsightRecommendations;
window.aiInsightFull = aiInsightFull;

console.log('[MT] ai-insights.js cargado — motor de análisis financiero profundo');
