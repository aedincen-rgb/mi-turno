// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-shared.js
//  Motor compartido: NLP helpers, buildContext, formato
//  100% offline · sin dependencias externas
// ════════════════════════════════════════════════════════════════

// ─── NLP HELPERS ───────────────────────────────────────────────

function _aiNorm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿¡?!;:()[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _aiHas(t) {
  for (var i = 1; i < arguments.length; i++) {
    if (t.indexOf(arguments[i]) >= 0) return true;
  }
  return false;
}

function _aiAll(t, arr) {
  for (var i = 0; i < arr.length; i++) if (t.indexOf(arr[i]) < 0) return false;
  return true;
}

function _aiNum(t) {
  var clean = t.replace(/\./g, '').replace(/,/g, '.');
  var m = clean.match(/(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);
  var w = {
    cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciseis: 16, veinte: 20, treinta: 30
  };
  for (var k in w) {
    if (t.indexOf(k) >= 0) return w[k];
  }
  return null;
}

// ─── HELPERS DE FORMATO ────────────────────────────────────────

var _DOW = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function _fechaLarga(fechaISO) {
  var d = new Date(fechaISO + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function _bdLines(bd) {
  return Object.keys(bd)
    .filter(function (k) { return bd[k].mins > 0; })
    .map(function (k) {
      return '• ' + RC[k].label + ': ' + fCOP(bd[k].cop) + ' (' + fDur(bd[k].mins) + ')';
    })
    .join('\n');
}

function _trend(curr, prev) {
  if (prev <= 0) return curr > 0 ? '+∞%' : 'sin cambio';
  var pct = ((curr - prev) / prev) * 100;
  var sig = pct >= 0 ? '+' : '';
  return sig + pct.toFixed(1) + '%';
}

// ─── VARIANTES EMPÁTICAS ──────────────────────────────────────

// Elige aleatoriamente entre varias frases para que no sea repetitivo
function _pick() {
  var arr = arguments.length > 1 ? Array.from(arguments) : arguments[0];
  return arr[Math.floor(Math.random() * arr.length)];
}

function _empathyLow() {
  return _pick([
    'Ánimo, estos días tranquilos también hacen parte del ritmo.',
    'No te preocupes, el mes sigue y vienen mejores jornadas.',
    'Tranquilo, todo suma. Los turnos buenos llegarán.',
    'Cada turno cuenta, aunque sea ligero. ¡Sigue adelante!'
  ]);
}

function _empathyHigh() {
  return _pick([
    '¡Vaya ritmo! Sigue así que vas imparable.',
    'Excelente jornada, se nota tu dedicación.',
    '¡Qué manera de trabajar! Sigue así y llegarás lejos.',
    'Impresionante, estás dando todo. No olvides descansar también.'
  ]);
}

function _empathyRacha(racha) {
  if (racha >= 6) return _pick([
    'Ojo, llevar ' + racha + ' días seguidos es pesado. Tu cuerpo te lo va a cobrar si no descansas.',
    racha + ' días consecutivos es una marca increíble, pero el descanso también es productivo.',
    'Eres una máquina, pero hasta las máquinas necesitan mantenimiento. ¡Descansa un día!'
  ]);
  if (racha >= 3) return _pick([
    'Buen ritmo, ' + racha + ' días seguidos. Vas muy bien.',
    racha + ' días al hilo, vas en buena racha. Sigue así.'
  ]);
  return '';
}

function _empathyFatiga(hrsSemanales) {
  if (hrsSemanales > 55) return _pick([
    'Alerta: estás muy por encima de las 46h semanales. Prioriza tu salud.',
    'Cuidado, tu carga semanal es muy alta. Revisa si puedes equilibrar tus turnos.'
  ]);
  if (hrsSemanales > 46) return _pick([
    'Ya superaste las 46h semanales. Todo lo que sigue son horas extras, pero cuida el desgaste.',
    'Vas más allá de la jornada máxima legal. Bien por los recargos, pero no descuides el descanso.'
  ]);
  return '';
}

// ─── CONSTRUCCIÓN DE CONTEXTO ──────────────────────────────────

function buildContext(state) {
  var ahora = new Date();
  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  var diaActual = ahora.getDate();
  var vh = state.vh || 0;
  var salario = state.salario || SMIN;

  var turnosMes = (state.turnos || []).filter(function (t) {
    return new Date(t.inicio) >= iniMes && t.fin;
  });
  var turnosAll = state.turnosAll || state.turnos || [];

  // ── Mes actual ──
  var dias = calcPorDia(turnosMes, vh);
  var totalMins = state.calc.totalMins,
    totalCOP = state.calc.totalCOP;
  var diasTrab = dias.length;
  var prom = diasTrab > 0 ? totalCOP / diasTrab : 0;
  var promHoras = diasTrab > 0 ? totalMins / diasTrab / 60 : 0;
  var mejor = dias.length > 0 ? dias.reduce(function (a, b) { return b.cop > a.cop ? b : a; }, dias[0]) : null;
  var peor = dias.length > 0 ? dias.reduce(function (a, b) { return b.cop < a.cop ? b : a; }, dias[0]) : null;
  var festTrab = dias.filter(function (d) { return d.fest; });
  var bd = state.calc.bd;
  var _get = function(k, p) { return (bd[k] || {})[p] || 0; };

  var nocturnasMins = _get('noctOrd', 'mins') + _get('extraNoct', 'mins') + 
    _get('noctFest', 'mins') + _get('extraFestNoct', 'mins');
  var nocturnasCOP = _get('noctOrd', 'cop') + _get('extraNoct', 'cop') + 
    _get('noctFest', 'cop') + _get('extraFestNoct', 'cop');
  var festMins = _get('diurnaFest', 'mins') + _get('noctFest', 'mins') + 
    _get('extraFestDiur', 'mins') + _get('extraFestNoct', 'mins');
  var festCOP = _get('diurnaFest', 'cop') + _get('noctFest', 'cop') + 
    _get('extraFestDiur', 'cop') + _get('extraFestNoct', 'cop');
  var extraMins = _get('extraDiurna', 'mins') + _get('extraNoct', 'mins') + 
    _get('extraFestDiur', 'mins') + _get('extraFestNoct', 'mins');
  var extraCOP = _get('extraDiurna', 'cop') + _get('extraNoct', 'cop') + 
    _get('extraFestDiur', 'cop') + _get('extraFestNoct', 'cop');

  var diurnaOrdMins = _get('diurnaOrd', 'mins'),
    diurnaOrdCOP = _get('diurnaOrd', 'cop');

  var proy = diasTrab > 0 ? (totalCOP / diaActual) * diasMes : 0;
  var pctSalario = salario > 0 ? (totalCOP / salario) * 100 : 0;
  var falta = Math.max(0, salario - totalCOP);
  var horasParaMeta = vh > 0 ? falta / vh : 0;

  // ── Mes pasado ──
  var iniMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  var finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  finMesPasado.setHours(23, 59, 59, 999);
  var turnosMesPasado = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= iniMesPasado && d <= finMesPasado && t.fin;
  });
  var calcMesPasado = turnosMesPasado.length > 0
    ? doCalc(turnosMesPasado, null, finMesPasado, vh)
    : { totalMins: 0, totalCOP: 0, bd: {} };
  var diasTrabMesPasado = calcPorDia(turnosMesPasado, vh).length;

  // ── Semana actual ──
  var iniSemana = semLun(ahora);
  var turnosSemana = turnosMes.filter(function (t) { return new Date(t.inicio) >= iniSemana; });
  var diasSemana = calcPorDia(turnosSemana, vh);
  var totalCOPSemana = diasSemana.reduce(function (a, d) { return a + d.cop; }, 0);
  var totalMinsSemana = diasSemana.reduce(function (a, d) { return a + d.mins; }, 0);

  // ── Semana pasada ──
  var iniSemPas = new Date(iniSemana);
  iniSemPas.setDate(iniSemana.getDate() - 7);
  var finSemPas = new Date(iniSemana);
  finSemPas.setMilliseconds(-1);
  var turnosSemPas = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= iniSemPas && d <= finSemPas && t.fin;
  });
  var diasSemPas = calcPorDia(turnosSemPas, vh);
  var totalCOPSemPas = diasSemPas.reduce(function (a, d) { return a + d.cop; }, 0);
  var totalMinsSemPas = diasSemPas.reduce(function (a, d) { return a + d.mins; }, 0);

  // ── Hoy / Ayer ──
  var hoyIni = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  var ayerIni = new Date(hoyIni);
  ayerIni.setDate(hoyIni.getDate() - 1);
  var turnosHoy = turnosMes.filter(function (t) { return new Date(t.inicio) >= hoyIni; });
  var turnosAyer = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= ayerIni && d < hoyIni && t.fin;
  });
  var diasHoy = calcPorDia(turnosHoy, vh);
  var diasAyer = calcPorDia(turnosAyer, vh);
  var copHoy = diasHoy.reduce(function (a, d) { return a + d.cop; }, 0);
  var minsHoy = diasHoy.reduce(function (a, d) { return a + d.mins; }, 0);
  var copAyer = diasAyer.reduce(function (a, d) { return a + d.cop; }, 0);
  var minsAyer = diasAyer.reduce(function (a, d) { return a + d.mins; }, 0);

  // ── Turno más largo / corto ──
  var tLargo = null, tCorto = null;
  turnosMes.forEach(function (t) {
    var dur = (new Date(t.fin) - new Date(t.inicio)) / 60000;
    if (dur <= 0) return;
    if (!tLargo || dur > tLargo.dur) tLargo = { t: t, dur: dur };
    if (!tCorto || dur < tCorto.dur) tCorto = { t: t, dur: dur };
  });

  // ── Patrón día de semana ──
  var dowMins = [0, 0, 0, 0, 0, 0, 0], dowCOP = [0, 0, 0, 0, 0, 0, 0], dowCount = [0, 0, 0, 0, 0, 0, 0];
  dias.forEach(function (d) {
    var dt = new Date(d.fecha + 'T12:00:00');
    var dow = (dt.getDay() + 6) % 7;
    dowMins[dow] += d.mins || 0;
    dowCOP[dow] += d.cop;
    dowCount[dow]++;
  });
  var bestDow = 0, worstDow = -1;
  for (var i = 1; i < 7; i++) {
    if (dowCOP[i] > dowCOP[bestDow]) bestDow = i;
    if (dowCOP[i] > 0 && (worstDow < 0 || dowCOP[i] < dowCOP[worstDow])) worstDow = i;
  }
  if (worstDow < 0) worstDow = 0;

  // ── Próximos festivos ──
  var festSet = getColombianHolidays(ahora.getFullYear());
  var proxFests = [];
  var probe = new Date(ahora);
  probe.setHours(0, 0, 0, 0);
  probe.setDate(probe.getDate() + 1);
  for (var n = 0; n < 366 && proxFests.length < 5; n++) {
    var key = probe.getFullYear() + '-' + probe.getMonth() + '-' + probe.getDate();
    if (festSet.has(key) && probe.getDay() !== 0) proxFests.push(new Date(probe));
    probe.setDate(probe.getDate() + 1);
    if (probe.getFullYear() !== ahora.getFullYear()) break;
  }

  // ── Velocidad efectiva ──
  var copPorHoraReal = totalMins > 0 ? totalCOP / (totalMins / 60) : vh;

  // ── Racha ──
  var rachaActual = 0;
  var probeR = new Date(ahora);
  for (var k = 0; k < diasMes; k++) {
    var keyR = probeR.getFullYear() + '-' +
      String(probeR.getMonth() + 1).padStart(2, '0') + '-' +
      String(probeR.getDate()).padStart(2, '0');
    var trabajado = dias.some(function (d) { return d.fecha === keyR; });
    if (trabajado) rachaActual++;
    else if (rachaActual > 0) break;
    probeR.setDate(probeR.getDate() - 1);
  }

  // ── Liquidación ──
  var diasMesEfectivos = Math.max(1, diaActual);
  var estPrima = (salario * diasMesEfectivos) / 360;
  var estCesantias = (salario * diasMesEfectivos) / 360;
  var estIntereses = (estCesantias * diasMesEfectivos * 0.12) / 360;
  var estVacaciones = (salario * diasMesEfectivos) / 720;
  var estTransporte = totalCOP > (SMIN * 2) ? 0 : (182140 * diasMesEfectivos / 30);
  var totalLiq = estPrima + estCesantias + estIntereses + estVacaciones + estTransporte;
  var deducciones = totalCOP * 0.08;
  var sueldoNeto = totalCOP - deducciones + estTransporte;

  // ── Bienestar ──
  var hrsSemanales = (totalMins / 60) / (diaActual / 7);
  var alertaFatiga = hrsSemanales > 48 || rachaActual >= 6;

  var diasRestantes = diasMes - diaActual;

  return {
    ahora: ahora,
    diasMes: diasMes,
    diaActual: diaActual,
    diasRestantes: diasRestantes,
    salario: salario,
    vh: vh,
    turnosMes: turnosMes,
    dias: dias,
    totalMins: totalMins,
    totalCOP: totalCOP,
    diasTrab: diasTrab,
    prom: prom,
    promHoras: promHoras,
    mejor: mejor,
    peor: peor,
    bd: bd,
    diurnaOrdMins: diurnaOrdMins,
    diurnaOrdCOP: diurnaOrdCOP,
    nocturnasMins: nocturnasMins,
    nocturnasCOP: nocturnasCOP,
    festMins: festMins,
    festCOP: festCOP,
    festTrab: festTrab,
    extraMins: extraMins,
    extraCOP: extraCOP,
    proy: proy,
    pctSalario: pctSalario,
    falta: falta,
    horasParaMeta: horasParaMeta,
    totalCOPMesPasado: calcMesPasado.totalCOP || 0,
    totalMinsMesPasado: calcMesPasado.totalMins || 0,
    diasMesPasado: diasTrabMesPasado,
    totalCOPSemana: totalCOPSemana,
    totalMinsSemana: totalMinsSemana,
    diasSemanaCount: diasSemana.length,
    totalCOPSemPas: totalCOPSemPas,
    totalMinsSemPas: totalMinsSemPas,
    diasSemPasCount: diasSemPas.length,
    copHoy: copHoy,
    minsHoy: minsHoy,
    turnosHoy: turnosHoy.length,
    copAyer: copAyer,
    minsAyer: minsAyer,
    turnosAyer: turnosAyer.length,
    tLargo: tLargo,
    tCorto: tCorto,
    dowMins: dowMins,
    dowCOP: dowCOP,
    dowCount: dowCount,
    bestDow: bestDow,
    worstDow: worstDow,
    proxFests: proxFests,
    copPorHoraReal: copPorHoraReal,
    rachaActual: rachaActual,
    totalLiq: totalLiq,
    estPrima: estPrima,
    estCesantias: estCesantias,
    estVacaciones: estVacaciones,
    estTransporte: estTransporte,
    deducciones: deducciones,
    sueldoNeto: sueldoNeto,
    burnout: alertaFatiga,
    hrsSemanales: hrsSemanales,
    // Variables contextuales para empatía
    _empathyLow: _empathyLow,
    _empathyHigh: _empathyHigh,
    _empathyRacha: _empathyRacha,
    _empathyFatiga: _empathyFatiga,
    _pick: _pick
  };
}
