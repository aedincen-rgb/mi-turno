// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-financial.js
//  IA de Análisis Financiero y Laboral (todos los usuarios)
//  Turnos · Recargos · Liquidación · Proyecciones · Salud laboral
//  100% offline
// ════════════════════════════════════════════════════════════════

// ─── RESPUESTAS CORTAS ESTRATÉGICAS ────────────────────────────

function aiFinancialAnswer(question, state, c) {
  var t = _aiNorm(question);
  var isAdmin = state.session && state.session.isAdmin;

  // ── 1. SALUDOS ──
  if (_aiHas(t, 'hola', 'buenas', 'buen dia', 'buen día', 'buenas tardes', 
    'buenas noches', 'saludos', 'que tal', 'qué tal', 'hey', 'oye', 'como estas',
    'cómo estás', 'como está', 'cómo está')) {
    var saluditos = [
      '¡Hola! 👋 ¿En qué puedo ayudarte hoy con tus turnos y finanzas?',
      '¡Qué bueno tenerte por acá! ¿Necesitas revisar tus números o tienes alguna duda?',
      '¡Hola! Aquí estoy listo para ayudarte con tu análisis de turnos. ¿Qué prefieres ver?',
      '¡Saludos! Cuéntame, ¿quieres saber algo sobre tu salario, recargos o proyecciones?'
    ];
    return _pick(saluditos);
  }

  if (_aiHas(t, 'gracias', 'gracias', 'muchas gracias', 'te agradezco', 'thanks',
    'thank you')) {
    return _pick([
      '¡Con gusto! Siempre que necesites, aquí estoy.',
      'Para eso estoy. ¿Alguna otra consulta?',
      '¡Un placer! Vuelve cuando quieras revisar tus números.',
      'De nada. Recuerda que puedes preguntarme sobre turnos, salario, recargos, liquidación o proyecciones.',
      '¡A la orden! Cuida bien tu descanso y sigue trabajando duro. 💪'
    ]);
  }

  // ── 2. ESTADO ACTUAL / ESTADÍSTICAS PRINCIPALES ──
  if (_aiHas(t, 'como voy', 'como vamos', 'resumen', 'balance', 'como esta mi mes',
    'cómo voy', 'cómo vamos', 'cómo está mi mes')) {
    var resp = '📊 **Resumen del mes:**\n\n';
    resp += '💰 Ganado: **' + fCOP(c.totalCOP) + '**\n';
    resp += '⏱ ' + fDur(c.totalMins) + ' trabajados\n';
    resp += '📅 ' + c.diasTrab + ' días de ' + c.diaActual + '\n';
    resp += '📈 Promedio/día: ' + fCOP(c.prom) + '\n';
    if (c.pctSalario > 0) resp += '🎯 ' + c.pctSalario.toFixed(1) + '% del salario\n';
    resp += '\n' + _empatiaFinanciera(c);
    return resp;
  }

  // ── 3. CUÁNTO GANÉ / VALOR HORA ──
  if (_aiHas(t, 'cuanto gane', 'cuánto gané', 'cuanto he ganado', 'total', 'cuanto llevo',
    'cuanto dinero', 'cuánto dinero', 'cuanto gano', 'valor') && 
    !_aiHas(t, 'proxim', 'proyec', 'estim')) {
    var resp = '';
    if (c.diasTrab === 0) {
      resp = _pick([
        'Aún no has registrado turnos este mes. ¡Inicia uno desde la pantalla de inicio cuando comiences a trabajar!',
        'Este mes no hay datos todavía. Cuando inicies un turno, vuelvo a calcular todo al instante.',
        'Todavía no hay turnos registrados para este mes. ¿Quieres saber cómo empezar?'
      ]);
    } else {
      resp = '💰 **Llevas ganado:** ' + fCOP(c.totalCOP) + '\n';
      if (c.diasTrab > 1) {
        resp += '📊 Promedio/día: ' + fCOP(c.prom) + '\n';
      }
      resp += '⏱ Total: ' + fDur(c.totalMins) + '\n';
      if (c.copPorHoraReal > 0) {
        resp += '⚡ Velocidad efectiva: ' + fCOP(c.copPorHoraReal) + '/hora\n';
      }
      resp += '\n' + _empatiaFinanciera(c);
    }
    return resp;
  }

  // ── 4. PROYECCIÓN ──
  if (_aiHas(t, 'proyect', 'proyec', 'estimacion', 'estim', 'cuanto terminare', 
    'cuánto terminaré', 'cuanto voy a ganar')) {
    if (c.diasTrab === 0) {
      return _pick([
        'Aún no tengo suficiente data para proyectar. Registra algunos turnos y vuelvo a calcular.',
        'Necesito al menos un turno registrado para hacer una proyección confiable.'
      ]);
    }
    var proyB = c.proy;
    var proyA = c.proy * 1.1;
    var proyC = c.proy * 0.9;
    var resp = '📈 **Proyección estimada:**\n\n';
    resp += '⚠️ Esperado: **' + fCOP(proyB) + '**\n';
    resp += '🔺 Optimista: ' + fCOP(proyA) + '\n';
    resp += '🔻 Conservador: ' + fCOP(proyC) + '\n\n';
    if (proyB >= c.salario) {
      resp += '✅ ¡Vas por buen camino para superar el salario!';
    } else {
      resp += '💪 Te faltan ' + fCOP(c.falta) + ' para llegar al salario.';
      if (c.horasParaMeta > 0) {
        resp += ' ~' + fDur(c.horasParaMeta * 60) + ' más al ritmo actual.';
      }
    }
    return resp;
  }

  // ── 5. LIQUIDACIÓN ──
  if (_aiHas(t, 'liquidacion', 'liquidación', 'prestacione', 'prima', 'cesantias',
    'cesantías', 'vacaciones', 'indemnizacion', 'indemnización', 'despido', 
    'finiquito')) {
    var resp = '🧾 **Liquidación estimada (proporcional):**\n\n';
    resp += '🎁 Prima: ' + fCOP(c.estPrima) + '\n';
    resp += '🏦 Cesantías: ' + fCOP(c.estCesantias) + '\n';
    resp += '📈 Intereses cesantías: ' + fCOP(c.estIntereses) + '\n';
    resp += '🏖 Vacaciones: ' + fCOP(c.estVacaciones) + '\n';
    if (c.estTransporte > 0) {
      resp += '🚌 Auxilio transporte: ' + fCOP(c.estTransporte) + '\n';
    }
    resp += '\n**Total prestaciones:** ' + fCOP(c.totalLiq) + '\n\n';
    if (c.totalCOP > 0) {
      resp += '💰 **Sueldo neto aprox:** ' + fCOP(c.sueldoNeto) + ' (con 8% deducciones)\n';
    }
    resp += '\n*Cálculo aproximado basado en la Ley 2101/2021 y tus turnos actuales.*';
    return resp;
  }

  // ── 6. LEY LABORAL ──
  if (_aiHas(t, 'ley', 'ley 2101', 'jornada max', 'horas maximas', 'maximo horas',
    'legal', 'derecho', 'permiso', 'descanso obligatorio', 'dominical obligatorio')) {
    var resp = '⚖️ **Lo que dice la ley laboral colombiana:**\n\n';
    resp += '**Ley 2101 de 2021**: Reducción progresiva de la jornada máxima:\n';
    resp += '• 2023-2025: 47h/semana\n';
    resp += '• 2025-2026: **46h/semana** (¡es ahora!)\n';
    resp += '• Hasta 42h en 2026+\n\n';
    resp += '**Datos clave:**\n';
    resp += '• HSEM = 46h semanales máximas\n';
    resp += '• Recargo nocturno: 35%\n';
    resp += '• Extra diurna: 25%\n';
    resp += '• Extra nocturna: 75%\n';
    resp += '• Dominical/festivo: 75%\n';
    resp += '• Descanso obligatorio: mínimo 1 día a la semana\n\n';
    resp += '📌 *Para asesoría legal específica, consulta a un abogado laboral.*';
    return resp;
  }

  // ── 7. DOMINGOS / FESTIVOS (recargos) ──
  if (_aiHas(t, 'recargo', 'domingo', 'recargo dominical', 'recargo festivo',
    'nocturno', 'nocturna', 'porcentaje recargo', 'cuanto pagan', 'factor')) {
    var lines = ['📋 **Desglose de recargos:**'];
    for (var k in RC) {
      if (RC[k].mins > 0 || true) {
        var mins = (c.bd[k] || {}).mins || 0;
        var cop = (c.bd[k] || {}).cop || 0;
        var icono = k.indexOf('Fest') >= 0 ? '🔴' : k.indexOf('Noct') >= 0 ? '🌙' : '☀️';
        var extraInfo = (RC[k].factor * 100).toFixed(0) + '%';
        if (k === 'diurnaOrd') extraInfo = 'base 100%';
        lines.push(icono + ' **' + RC[k].label + '** → ' + extraInfo +
          (mins > 0 ? ' | Llevas: ' + fCOP(cop) + ' (' + fDur(mins) + ')' : ''));
      }
    }
    return lines.join('\n');
  }

  // ── 8. AHORRO / METAS ──
  if (_aiHas(t, 'ahorro', 'ahorrar', 'ahorrado', 'meta', 'objetivo', 'cuanto necesito',
    'cuanto falta', 'quiero ganar')) {
    var args = question.split(/\s+/);
    var num = null;
    for (var i = 0; i < args.length; i++) {
      var p = parseFloat(args[i].replace(/\./g, '').replace(/,/g, '.'));
      if (p > 1000) { num = p; break; }
    }
    if (num && c.totalCOP > 0) {
      var pct = (c.totalCOP / num) * 100;
      var falta = num - c.totalCOP;
      var diasFalta = c.prom > 0 ? falta / c.prom : 0;
      var resp = '🎯 **Meta: ' + fCOP(num) + '**\n\n';
      resp += '✅ Llevas: ' + fCOP(c.totalCOP) + ' (' + pct.toFixed(1) + '%)\n';
      resp += '📊 Te falta: ' + fCOP(falta) + '\n';
      if (diasFalta > 0 && diasFalta < 365) {
        resp += '⏱ Aprox. ' + Math.ceil(diasFalta) + ' días al ritmo actual\n';
      }
      if (pct >= 100) resp += '\n🎉 ¡Ya superaste tu meta!';
      return resp;
    }
    return 'Para ayudarte con una meta, dime cuánto quieres ganar en total. Por ejemplo: "Quiero ganar 3.000.000"';
  }

  // ── 9. HOY ──
  if (_aiHas(t, 'hoy', 'este turno', 'turno actual')) {
    if (c.turnosHoy === 0) {
      return _pick([
        'Hoy no has registrado turnos aún. ¿Ya empezaste tu jornada?',
        'No hay registros para hoy. Recuerda iniciar tu turno desde la pantalla de inicio.',
        'Hoy aún no hay datos. ¿Quieres que te recuerde cómo iniciar un turno?'
      ]);
    }
    var resp = '📅 **Hoy (' + _fechaLarga(c.ahora.toISOString().split('T')[0]) + '):**\n\n';
    resp += '💰 ' + fCOP(c.copHoy) + '\n';
    resp += '⏱ ' + fDur(c.minsHoy) + '\n';
    resp += '📋 ' + c.turnosHoy + ' turno(s)\n';
    if (c.bd) {
      var hLines = _bdLines(c.bd);
      if (hLines) resp += '\n' + hLines;
    }
    return resp;
  }

  // ── 10. AYER ──
  if (_aiHas(t, 'ayer', 'dia anterior', 'día anterior')) {
    if (c.turnosAyer === 0) {
      return 'Ayer no registraste turnos. Fue un día de descanso, espero hayas recargado energías.';
    }
    var ad = new Date(c.ahora);
    ad.setDate(ad.getDate() - 1);
    var ayerStr = ad.toISOString().split('T')[0];
    var resp = '📅 **Ayer (' + _fechaLarga(ayerStr) + '):**\n\n';
    resp += '💰 ' + fCOP(c.copAyer) + '\n';
    resp += '⏱ ' + fDur(c.minsAyer) + '\n';
    resp += '📋 ' + c.turnosAyer + ' turno(s)\n';
    if (c.totalCOPMesPasado > 0) {
      resp += '\n📊 Tendencia respecto al mes pasado: ' + _trend(c.totalCOP, c.totalCOPMesPasado);
    }
    return resp;
  }

  // ── 11. SEMANA ──
  if (_aiHas(t, 'semana', 'esta semana')) {
    if (c.diasSemanaCount === 0) {
      return 'Esta semana no hay registros todavía. ¿Qué tal va tu semana?';
    }
    var resp = '📅 **Esta semana:**\n\n';
    resp += '💰 ' + fCOP(c.totalCOPSemana) + '\n';
    resp += '⏱ ' + fDur(c.totalMinsSemana) + '\n';
    resp += '📋 ' + c.diasSemanaCount + ' día(s)\n';
    if (c.diasSemPasCount > 0) {
      resp += '\n📊 vs semana pasada: ' + _trend(c.totalCOPSemana, c.totalCOPSemPas);
    }
    return resp;
  }

  // ── 12. COMPARATIVA (vs mes pasado) ──
  if (_aiHas(t, 'compar', 'vs mes pasado', 'respecto al mes anterior', 'comparacion',
    'comparación')) {
    if (c.totalCOPMesPasado === 0) return 'No hay datos del mes pasado para comparar.';
    var resp = '📊 **Comparativa mensual:**\n\n';
    resp += '**Este mes:** ' + fCOP(c.totalCOP) + ' (' + fDur(c.totalMins) + ', ' + c.diasTrab + ' días)\n';
    resp += '**Mes pasado:** ' + fCOP(c.totalCOPMesPasado) + ' (' + fDur(c.totalMinsMesPasado) + ', ' + c.diasMesPasado + ' días)\n';
    var trend = _trend(c.totalCOP, c.totalCOPMesPasado);
    resp += '\n📈 Tendencia: **' + trend + '**\n';
    var promEste = c.diasTrab > 0 ? c.totalCOP / c.diasTrab : 0;
    var promPas = c.diasMesPasado > 0 ? c.totalCOPMesPasado / c.diasMesPasado : 0;
    resp += 'Promedio/día: ' + fCOP(promEste) + ' vs ' + fCOP(promPas);
    return resp;
  }

  // ── 13. TURNO MÁS LARGO / CORTO ──
  if (_aiHas(t, 'mas largo', 'más largo', 'más corto', 'mas corto', 'turno mas',
    'turno más', 'extremo', 'record')) {
    var resp = '';
    if (c.tLargo) {
      resp += '🏆 **Turno más largo:** ' + fDur(c.tLargo.dur) + '\n';
      resp += '   📍 ' + _fechaLarga(c.tLargo.t.inicio.split('T')[0]) + '\n';
    }
    if (c.tCorto) {
      resp += '⚡ **Turno más corto:** ' + fDur(c.tCorto.dur) + '\n';
      resp += '   📍 ' + _fechaLarga(c.tCorto.t.inicio.split('T')[0]) + '\n';
    }
    if (!resp) resp = 'No hay suficientes datos para determinar extremos.';
    return resp;
  }

  // ── 14. PATRONES ──
  if (_aiHas(t, 'patron', 'patrón', 'día que más', 'dia que mas', 'mejor día',
    'peor día', 'mejor dia', 'peor dia')) {
    if (c.dowCount[c.bestDow] === 0) return 'Aún no hay suficientes turnos para detectar patrones.';
    var resp = '📊 **Patrones semanales:**\n\n';
    resp += '📈 **Mejor día:** ' + _DOW[c.bestDow] + ' → ' + fCOP(c.dowCOP[c.bestDow]) + '\n';
    if (c.worstDow >= 0 && c.worstDow !== c.bestDow) {
      resp += '📉 **Día más tranquilo:** ' + _DOW[c.worstDow] + ' → ' + fCOP(c.dowCOP[c.worstDow]) + '\n';
    }
    resp += '\n📋 Desglose:\n';
    for (var i = 0; i < 7; i++) {
      if (c.dowCount[i] > 0) {
        resp += '• ' + _DOW[i] + ': ' + fCOP(c.dowCOP[i]) + ' (' + c.dowCount[i] + ' turnos)\n';
      }
    }
    if (c.copPorHoraReal > 0) {
      resp += '\n⚡ **Consejo:** Si quieres optimizar, apunta a trabajar ' + _DOW[c.bestDow] + ' que es donde mejor rinde tu hora (promedio ' + fCOP(c.dowCOP[c.bestDow] / Math.max(1, c.dowCount[c.bestDow])) + '/día).';
    }
    return resp;
  }

  // ── 15. RACHA ──
  if (_aiHas(t, 'racha', 'dias seguidos', 'días seguidos', 'cuantos días', 
    'cuántos días', 'llevo trabajando', 'dias consecutivos', 'días consecutivos')) {
    if (c.rachaActual === 0) return 'Hoy no estás trabajando, así que la racha está en cero. ¡Disfruta el descanso!';
    var resp = '🔥 **Racha actual:** ' + c.rachaActual + ' día(s) consecutivos trabajando.\n\n';
    resp += c._empathyRacha(c.rachaActual);
    return resp;
  }

  // ── 16. PRÓXIMOS FESTIVOS ──
  if (_aiHas(t, 'proximos festivos', 'próximos festivos', 'festivos', 'feriados',
    'puente', 'que sigue')) {
    var resp = '📅 **Próximos festivos:**\n\n';
    if (c.proxFests.length === 0) {
      resp += 'No hay más festivos este año calendario.';
    } else {
      c.proxFests.forEach(function(f) {
        var fStr = f.toISOString().split('T')[0];
        resp += '• ' + f.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) + '\n';
      });
      resp += '\n💡 *Recuerda que los festivos pagan recargo del 75% sobre la hora ordinaria.*';
    }
    return resp;
  }

  // ── 17. NOCTURNAS / EXTRAS ──
  if (_aiHas(t, 'nocturna', 'nocturno', 'trabajo noche', 'turnos noche')) {
    if (c.nocturnasMins === 0) return 'No has hecho turnos nocturnos este mes.';
    var resp = '🌙 **Turnos nocturnos (9pm - 6am):**\n\n';
    resp += '💰 Total nocturnas: ' + fCOP(c.nocturnasCOP) + '\n';
    resp += '⏱ ' + fDur(c.nocturnasMins) + '\n';
    var pctDelTotal = c.totalCOP > 0 ? (c.nocturnasCOP / c.totalCOP) * 100 : 0;
    resp += '📊 Representa el ' + pctDelTotal.toFixed(1) + '% de tus ganancias totales\n';
    if (c.bd) {
      var nLines = _bdLines({
        noctOrd: c.bd.noctOrd || { mins: 0, cop: 0 },
        extraNoct: c.bd.extraNoct || { mins: 0, cop: 0 },
        noctFest: c.bd.noctFest || { mins: 0, cop: 0 },
        extraFestNoct: c.bd.extraFestNoct || { mins: 0, cop: 0 }
      });
      if (nLines) resp += '\n' + nLines;
    }
    return resp;
  }

  if (_aiHas(t, 'extra', 'extras', 'horas extra')) {
    if (c.extraMins === 0) return 'No has hecho horas extras este mes.';
    var resp = '⏰ **Horas extras:**\n\n';
    resp += '💰 Total extras: ' + fCOP(c.extraCOP) + '\n';
    resp += '⏱ ' + fDur(c.extraMins) + '\n';
    var pctDelTotalE = c.totalCOP > 0 ? (c.extraCOP / c.totalCOP) * 100 : 0;
    resp += '📊 Representa el ' + pctDelTotalE.toFixed(1) + '% de tus ganancias totales\n';
    if (c.bd) {
      var eLines = _bdLines({
        extraDiurna: c.bd.extraDiurna || { mins: 0, cop: 0 },
        extraNoct: c.bd.extraNoct || { mins: 0, cop: 0 },
        extraFestDiur: c.bd.extraFestDiur || { mins: 0, cop: 0 },
        extraFestNoct: c.bd.extraFestNoct || { mins: 0, cop: 0 }
      });
      if (eLines) resp += '\n' + eLines;
    }
    return resp;
  }

  // ── 18. SALUD / BIENESTAR ──
  if (_aiHas(t, 'salud', 'salud', 'fatiga', 'burnout', 'desgaste', 'estres', 'estrés',
    'agotado', 'descanso', 'descansar', 'recomendacion', 'recomendación')) {
    var resp = '❤️‍🩹 **Bienestar laboral:**\n\n';
    resp += '📊 Horas semanales estimadas: ' + c.hrsSemanales.toFixed(1) + 'h\n';
    resp += '🔥 Racha actual: ' + c.rachaActual + ' día(s)\n\n';
    if (c.burnout) {
      resp += '⚠️ **Alerta:** Tu carga laboral está en niveles altos. Recomiendo:\n';
      resp += '• Tomar al menos 1 día de descanso completo\n';
      resp += '• No exceder 46h semanales de forma constante\n';
      resp += '• Hidratarte bien durante los turnos\n';
      resp += '• Si puedes, alterna turnos diurnos y nocturnos\n';
    } else {
      resp += '✅ Tus niveles de carga están dentro de rangos saludables. ¡Sigue así!\n';
      resp += 'Recuerda mantener un equilibrio y tomar pausas activas.';
    }
    return resp;
  }

  // ── 19. EMAIL ──
  if (_aiIsEmailIntent(t)) {
    return _aiBuildEmail(question, t, c, state);
  }

  // ── 20. AYUDA FALLBACK ──
  if (_aiHas(t, 'ayuda', 'help', 'que sabes', 'qué sabes', 'que puedes', 'qué puedes',
    'que preguntar', 'sugerencia', 'comandos')) {
    return '🤖 **Habilidades del Asistente Financiero:**\n\n' +
      '• "¿Cómo voy?" → Resumen del mes\n' +
      '• "¿Cuánto he ganado?" → Total acumulado\n' +
      '• "¿Proyección?" → Estimación fin de mes\n' +
      '• "¿Liquidación?" → Prima, cesantías, vacaciones\n' +
      '• "¿Recargos?" → Desglose de porcentajes\n' +
      '• "¿Esta semana?" → Resumen semanal\n' +
      '• "¿Hoy / ayer?" → Turnos del día\n' +
      '• "¿Racha?" → Días consecutivos\n' +
      '• "¿Patrón?" → Mejor/peor día\n' +
      '• "¿Salud?" → Bienestar laboral\n' +
      '• "¿Festivos?" → Próximos feriados\n' +
      '• "¿Meta X?" → Progreso hacia objetivo\n\n' +
      '✨ + Soporte técnico para administradores.';
  }

  // ── 21. FALLBACK ──
  return '';
}

// ─── DETECCIÓN DE EMAIL ───────────────────────────────────────

function _aiIsEmailIntent(t) {
  return _aiHas(t, 'email', 'correo', 'escribe un correo', 'redacta', 'carta',
    'notificacion', 'notificación', 'comunicado', 'enviar correo', 'reporte',
    'oficio', 'solicitud', 'escribe una carta') || 
    _aiAll(t, ['escribe']) || 
    _aiAll(t, ['redacta']) ||
    _aiHas(t, 'notificar', 'informar', 'queja', 'renuncia', 'excusa', 'justificacion');
}

function _aiBuildEmail(raw, t, c, state) {
  var empresa = 'la empresa';
  var motivo = 'laboral';
  var nombre = state.session ? state.session.name || 'el trabajador' : 'el trabajador';

  if (_aiHas(t, 'renuncia', 'dimision', 'dimisión')) {
    return {
      action: 'composeEmail',
      subject: 'Carta de Renuncia Voluntaria',
      body: ['A quien corresponda,', '',
        'Por medio de la presente, yo, ' + nombre + ', identificado con cédula de ciudadanía, ' +
        'presento mi renuncia voluntaria e irrevocable al cargo que actualmente desempeño en ' +
        'la empresa, agradeciendo la oportunidad laboral brindada.',
        '',
        'Solicito comedidamente se me expida la liquidación de prestaciones sociales ' +
        'conforme a la ley, así como el certificado laboral correspondiente.',
        '',
        'Cordialmente,',
        nombre].join('\n'),
      to: 'empresa@correo.com'
    };
  }

  if (_aiHas(t, 'excusa', 'justificacion', 'justificación', 'falta', 'inasistencia',
    'no pude asistir')) {
    return {
      action: 'composeEmail',
      subject: 'Justificación de Inasistencia',
      body: ['A quien corresponda,', '',
        'Yo, ' + nombre + ', me permito informar que no pude asistir a mi jornada laboral ' +
        'el día de hoy por motivos de salud/familiares. Adjunto la documentación correspondiente.',
        '',
        'Quedo atento a las indicaciones para ponerme al día con mis responsabilidades.',
        '',
        'Atentamente,',
        nombre].join('\n'),
      to: 'empresa@correo.com'
    };
  }

  if (_aiHas(t, 'queja', 'reclamo')) {
    return {
      action: 'composeEmail',
      subject: 'Formal Complaint / Reclamo',
      body: ['A quien corresponda,', '',
        'Por medio de la presente, yo, ' + nombre + ', deseo manifestar mi inconformidad ' +
        'respecto a...',
        '',
        'Solicito se revise mi caso y se me brinde una solución a la brevedad posible.',
        '',
        'Atentamente,',
        nombre].join('\n'),
      to: 'empresa@correo.com'
    };
  }

  // Email genérico
  return {
    action: 'composeEmail',
    subject: 'Comunicado Laboral',
    body: ['A quien corresponda,', '',
      'Por medio de la presente, yo, ' + nombre + ', me permito informar/comunicar lo siguiente:',
      '',
      '(Escribe aquí tu mensaje)',
      '',
      'Quedo atento a su respuesta.',
      '',
      'Cordialmente,',
      nombre].join('\n'),
    to: 'empresa@correo.com'
  };
}

// ─── EMPATÍA FINANCIERA ────────────────────────────────────────

function _empatiaFinanciera(c) {
  var partes = [];
  
  if (c.diasTrab === 0) return '';
  
  // Empatía por fatiga
  var fat = c._empathyFatiga(c.hrsSemanales);
  if (fat) partes.push(fat);
  
  // Empatía por racha
  var rac = c._empathyRacha(c.rachaActual);
  if (rac) partes.push(rac);
  
  // Empatía por rendimiento
  var prom = c.totalCOP / c.diasTrab;
  if (prom > c.salario / 15) {
    partes.push(c._empathyHigh());
  } else if (prom < c.salario / 25) {
    partes.push(c._empathyLow());
  }
  
  return partes.join('\n\n') + (partes.length > 0 ? '\n\n💡 *¿Algo más que quieras saber?*' : '');
}
