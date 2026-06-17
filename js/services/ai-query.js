// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-query.js
//  Motor de consultas estructuradas sobre los datos del usuario.
//  Estilo asistente de base de datos: entiende filtros (día de la
//  semana, festivos, mes puntual) + métricas (plata, horas, turnos),
//  consulta la tabla local de turnos y calcula con doCalc (el mismo
//  calculador legal de toda la app — nunca estima).
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── DICCIONARIO DE DATOS ─────────────────────────────────────
var AI_QUERY_DICT = {
  weekdays: {
    domingo: 0,
    domingos: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sabados: 6
  },
  months: {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11
  },
  weekdayLabels: ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'],
  weekdaySingular: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  monthLabels: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ],
  monthShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
};

function _aiqNorm(s) {
  var t = (s || '').toLowerCase();
  try {
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (_) {}
  return t;
}

// Métrica de la última consulta exitosa. Los follow-ups elípticos
// ("¿y los sábados?") la heredan para mantener el hilo del tema.
var _aiqLastMetric = null;

// ─── RANGO DE FECHAS ─────────────────────────────────────────
// Detecta un rango: "del 10 al 15 de junio", "entre el 1 y el 15",
// "del 28 de diciembre al 5 de enero", "primera/segunda quincena [de mes]".
// Devuelve { from, to, label } (to a fin del día) o null. Mismo criterio
// de año que la fecha puntual: un mes nombrado en el futuro se asume del
// año pasado, y los pares cruzados (dic→ene) resuelven el salto de año solos.
function _aiqParseDateRange(t, ahora) {
  var meses = AI_QUERY_DICT.monthLabels;
  var monthAlt = meses.join('|');
  var hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  function mkDate(day, mo) {
    var y = ahora.getFullYear();
    if (new Date(y, mo, day) > hoy0) y = y - 1;
    return new Date(y, mo, day);
  }
  function finDelDia(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  // Quincenas: "primera quincena de junio", "segunda quincena"
  var mq = t.match(
    new RegExp('(primera|segunda|1ra|2da|1a|2a)\\s+quincena(?:\\s+de\\s+(' + monthAlt + '))?')
  );
  if (mq) {
    var moQ = mq[2] != null ? AI_QUERY_DICT.months[mq[2]] : ahora.getMonth();
    var yQ = ahora.getFullYear();
    if (new Date(yQ, moQ, 1) > hoy0) yQ = yQ - 1;
    var primera = /^(primera|1ra|1a)/.test(mq[1]);
    var ultDia = new Date(yQ, moQ + 1, 0).getDate();
    var lblQ =
      'la ' +
      (primera ? 'primera' : 'segunda') +
      ' quincena de ' +
      meses[moQ] +
      (yQ !== ahora.getFullYear() ? ' de ' + yQ : '');
    return {
      from: new Date(yQ, moQ, primera ? 1 : 16),
      to: finDelDia(new Date(yQ, moQ, primera ? 15 : ultDia)),
      label: lblQ
    };
  }

  // Cruzado: "del 28 de diciembre al 5 de enero"
  var mCross = t.match(
    new RegExp(
      '(?:del?|desde)\\s+(\\d{1,2})\\s+de\\s+(' +
        monthAlt +
        ')\\s+(?:al?|hasta|a)\\s+(\\d{1,2})\\s+de\\s+(' +
        monthAlt +
        ')'
    )
  );
  if (mCross) {
    var d1c = parseInt(mCross[1], 10);
    var mo1c = AI_QUERY_DICT.months[mCross[2]];
    var d2c = parseInt(mCross[3], 10);
    var mo2c = AI_QUERY_DICT.months[mCross[4]];
    if (d1c >= 1 && d1c <= 31 && d2c >= 1 && d2c <= 31) {
      return {
        from: mkDate(d1c, mo1c),
        to: finDelDia(mkDate(d2c, mo2c)),
        label: 'del ' + d1c + ' de ' + meses[mo1c] + ' al ' + d2c + ' de ' + meses[mo2c]
      };
    }
  }

  // Mismo mes: "del 10 al 15 de junio", "entre el 1 y el 15"
  var mSame = t.match(
    new RegExp(
      '(?:del?|desde|entre)\\s+(?:el\\s+)?(\\d{1,2})\\s+(?:al?|hasta|y|a)\\s+(?:el\\s+)?(\\d{1,2})(?:\\s+de\\s+(' +
        monthAlt +
        '))?'
    )
  );
  if (mSame) {
    var d1s = parseInt(mSame[1], 10);
    var d2s = parseInt(mSame[2], 10);
    if (d1s >= 1 && d1s <= 31 && d2s >= 1 && d2s <= 31) {
      var moS = mSame[3] != null ? AI_QUERY_DICT.months[mSame[3]] : ahora.getMonth();
      var lo = Math.min(d1s, d2s);
      var hi = Math.max(d1s, d2s);
      return {
        from: mkDate(lo, moS),
        to: finDelDia(mkDate(hi, moS)),
        label: 'del ' + lo + ' al ' + hi + ' de ' + meses[moS]
      };
    }
  }

  return null;
}

// ─── FECHA DE CALENDARIO ESPECÍFICA ──────────────────────────
// Detecta una fecha puntual escrita de varias formas: "14 de junio",
// "el 14 de junio de 2025", "14/06", "14-06-2025", "el 14" (día del mes).
// Devuelve un Date (a medianoche) o null. Sin año explícito, si la fecha
// cae en el futuro respecto a hoy se asume el año/mes anterior — la gente
// pregunta por días que ya trabajó, no por los que vienen.
function _aiqParseSpecificDate(t, ahora) {
  var hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  function resolverAno(mo, day, yr) {
    var y = yr;
    if (!y) {
      y = ahora.getFullYear();
      if (new Date(y, mo, day) > hoy0) y = y - 1;
    }
    return new Date(y, mo, day);
  }

  // 1) Día + mes por nombre: "14 de junio", "14 junio", "3 de mayo de 2025"
  var reName = new RegExp(
    '\\b(\\d{1,2})\\s+(?:de\\s+)?(' +
      AI_QUERY_DICT.monthLabels.join('|') +
      ')\\b(?:\\s+(?:de\\s+|del\\s+)?(\\d{4}))?'
  );
  var mName = t.match(reName);
  if (mName) {
    var dN = parseInt(mName[1], 10);
    var moN = AI_QUERY_DICT.months[mName[2]];
    if (dN >= 1 && dN <= 31 && moN != null) {
      return resolverAno(moN, dN, mName[3] ? parseInt(mName[3], 10) : null);
    }
  }

  // 2) Formato numérico: "14/06", "14-06-2025", "14/6/25"
  var mNum = t.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (mNum) {
    var dD = parseInt(mNum[1], 10);
    var moD = parseInt(mNum[2], 10) - 1;
    if (dD >= 1 && dD <= 31 && moD >= 0 && moD <= 11) {
      var yrD = mNum[3] ? parseInt(mNum[3], 10) : null;
      if (yrD && yrD < 100) yrD += 2000;
      return resolverAno(moD, dD, yrD);
    }
  }

  // 3) Solo el día: "el 14", "el día 14" → mes actual, o el pasado si aún
  //    no llegó ese día este mes. Con guarda para no comerse "el 14%",
  //    "el 14 de mis turnos", "el 14 dias".
  var mDay = t.match(/\bel\s+(?:dia\s+)?(\d{1,2})\b/);
  if (mDay) {
    var after = t.slice(mDay.index + mDay[0].length);
    if (/^\s*(%|por ciento|dias?|horas?|turnos?|semanas?|meses|mil|millon)/.test(after)) {
      return null;
    }
    var dDay = parseInt(mDay[1], 10);
    if (dDay >= 1 && dDay <= 31) {
      var cand = new Date(ahora.getFullYear(), ahora.getMonth(), dDay);
      if (cand > hoy0) return new Date(ahora.getFullYear(), ahora.getMonth() - 1, dDay);
      return cand;
    }
  }

  return null;
}

// ─── PARSER ──────────────────────────────────────────────────
// Devuelve null si la pregunta no es una consulta de datos con un
// filtro que los intents clásicos no cubren. Solo reclama preguntas
// con filtro explícito: día de semana, festivos, fin de semana o mes
// puntual por nombre. (hoy/ayer/semana/mes ya los cubren los intents.)
// opts.topic: tema actual de la conversación — habilita follow-ups
// elípticos sin verbo de datos ("¿y en mayo?") cuando se viene
// hablando de finanzas o tiempo.
function aiQueryParse(question, opts) {
  var t = _aiqNorm(question);
  if (!t) return null;

  // Preguntas de conocimiento, no de datos
  if (
    t.indexOf('que es') >= 0 ||
    t.indexOf('recargo') >= 0 ||
    t.indexOf('porcentaje') >= 0 ||
    t.indexOf('cuanto vale') >= 0 ||
    t.indexOf('cuanto paga') >= 0 ||
    t.indexOf('me pagan') >= 0
  ) {
    return null;
  }

  // Acciones (correo, compartir) e hipotéticos (simulación) tienen
  // sus propios intents — el motor de consultas no los reclama
  if (/(correo|email|envia|enviar|reporte|informe|whatsapp|comparte|compartir)/.test(t)) {
    return null;
  }
  if (/(ganaria|si trabajo|si trabajara|simul)/.test(t)) {
    return null;
  }

  // Verbo/sustantivo de datos: sin esto no es consulta a la tabla.
  // Excepción: pregunta elíptica corta ("¿y los sábados?") cuando el
  // tema actual de la conversación ya es de datos — hereda el hilo.
  var hasDataWord =
    /\b(gane|ganado|ganancia|ganancias|trabaje|trabajado|hice|tuve|llevo|sume|acumule|cobre|cobrado|saque|recibi|recogi|junte|plata|dinero|horas|turnos|cuanto|cuantos|cuantas)\b/.test(
      t
    );
  var TEMAS_DATOS = { dinero: 1, tiempo: 1, comparativa: 1, patrones: 1, finanzas: 1 };
  var temaDatos = !!(opts && opts.topic && TEMAS_DATOS[opts.topic]);
  var esEliptica = temaDatos && t.length <= 32 && /^[¿¡\s]*y\b/.test(t);
  if (!hasDataWord && !esEliptica) return null;

  var filters = [];
  var labelParts = [];

  // Filtro: día de la semana
  var weekday = null;
  var weekdayWord = null;
  for (var w in AI_QUERY_DICT.weekdays) {
    if (new RegExp('\\b' + w + '\\b').test(t)) {
      weekday = AI_QUERY_DICT.weekdays[w];
      weekdayWord = w;
      break;
    }
  }

  // Filtro: fin de semana
  var finde = /fin(es)? de semana/.test(t) || /\bfindes?\b/.test(t);

  // Filtro: festivos trabajados
  var festivo = /festiv/.test(t);

  // Filtro: mes puntual por nombre
  var month = null;
  for (var m in AI_QUERY_DICT.months) {
    if (new RegExp('\\b' + m + '\\b').test(t)) {
      month = AI_QUERY_DICT.months[m];
      break;
    }
  }

  var ahora = new Date();

  // Rango de fechas ("del 10 al 15 de junio", "primera quincena"). Se
  // detecta ANTES que la fecha puntual: "del 10 al 15 de junio" contiene
  // "15 de junio" y si no, el parser puntual se quedaría con ese día suelto.
  var dateRange = _aiqParseDateRange(t, ahora);

  // Fecha de calendario puntual ("14 de junio", "14/06", "el 14"). Es
  // exclusiva: si la hay, manda sobre los demás filtros (la palabra del mes
  // ya no debe filtrar el mes entero, ni el día de semana, etc.).
  var specificDate = dateRange ? null : _aiqParseSpecificDate(t, ahora);
  if (dateRange || specificDate) {
    weekday = null;
    weekdayWord = null;
    finde = false;
    festivo = false;
    month = null;
  }

  if (weekday === null && !finde && !festivo && month === null && !specificDate && !dateRange) {
    return null;
  }

  if (dateRange) {
    var rgFrom = dateRange.from;
    var rgTo = dateRange.to;
    filters.push(function (d) {
      return d >= rgFrom && d <= rgTo;
    });
    labelParts.push(dateRange.label);
  } else if (specificDate) {
    var sdKey = specificDate.toDateString();
    filters.push(function (d) {
      return d.toDateString() === sdKey;
    });
    var sdLabel =
      'el ' + specificDate.getDate() + ' de ' + AI_QUERY_DICT.monthLabels[specificDate.getMonth()];
    if (specificDate.getFullYear() !== ahora.getFullYear()) {
      sdLabel += ' de ' + specificDate.getFullYear();
    }
    labelParts.push(sdLabel);
  }

  if (weekday !== null) {
    // Singular + "pasado/último": solo la ocurrencia más reciente.
    // lunes/martes/miércoles/jueves/viernes son invariantes (terminan en
    // "s" pero son singulares); solo domingos/sabados son plural explícito.
    var plural = weekdayWord === 'domingos' || weekdayWord === 'sabados';
    var puntual = !plural && /\b(pasado|ultimo)\b/.test(t);
    if (puntual) {
      var ref = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      do {
        ref.setDate(ref.getDate() - 1);
      } while (ref.getDay() !== weekday);
      var refKey = ref.toDateString();
      filters.push(function (d) {
        return d.toDateString() === refKey;
      });
      labelParts.push(
        'el ' +
          AI_QUERY_DICT.weekdaySingular[weekday] +
          ' pasado (' +
          ref.getDate() +
          ' ' +
          AI_QUERY_DICT.monthShort[ref.getMonth()] +
          ')'
      );
    } else {
      var wd = weekday;
      filters.push(function (d) {
        return d.getDay() === wd;
      });
      labelParts.push('los ' + AI_QUERY_DICT.weekdayLabels[weekday]);
    }
  }

  if (finde && weekday === null) {
    filters.push(function (d) {
      return d.getDay() === 0 || d.getDay() === 6;
    });
    labelParts.push('los fines de semana');
  }

  if (festivo) {
    if (typeof esFest !== 'function') return null;
    filters.push(function (d) {
      return esFest(d);
    });
    labelParts.push(weekday === null && !finde ? 'los festivos' : 'en festivo');
  }

  if (month !== null) {
    // Mes futuro respecto al actual → se asume el del año pasado
    var year = month > ahora.getMonth() ? ahora.getFullYear() - 1 : ahora.getFullYear();
    var mo = month;
    filters.push(function (d) {
      return d.getMonth() === mo && d.getFullYear() === year;
    });
    var mLabel = AI_QUERY_DICT.monthLabels[month];
    if (year !== ahora.getFullYear()) mLabel += ' ' + year;
    labelParts.push(labelParts.length ? 'de ' + mLabel : 'en ' + mLabel);
  }

  // Filtro: período relativo explícito ("este mes", "mes pasado", "esta
  // semana", "semana pasada"). Acota los filtros primarios — sin esto,
  // "¿cuántos festivos trabajé este mes?" contaba todo el historial.
  if (month === null && !specificDate && !dateRange) {
    var lunes = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    if (/este mes|del mes|en el mes/.test(t)) {
      filters.push(function (d) {
        return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
      });
      labelParts.push('de este mes');
    } else if (/mes pasado|mes anterior/.test(t)) {
      var mesPas = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      filters.push(function (d) {
        return d.getMonth() === mesPas.getMonth() && d.getFullYear() === mesPas.getFullYear();
      });
      labelParts.push('del mes pasado');
    } else if (/esta semana/.test(t)) {
      filters.push(function (d) {
        return d >= lunes;
      });
      labelParts.push('de esta semana');
    } else if (/semana pasada|semana anterior/.test(t)) {
      var lunesPas = new Date(lunes);
      lunesPas.setDate(lunes.getDate() - 7);
      filters.push(function (d) {
        return d >= lunesPas && d < lunes;
      });
      labelParts.push('de la semana pasada');
    }
  }

  // Métrica principal (decide la frase de apertura). Los follow-ups
  // elípticos sin métrica explícita heredan la de la consulta anterior.
  var metric = null;
  if (/(\bhoras?\b|trabaj)/.test(t) && !/\b(gane|ganado|plata|dinero)\b/.test(t)) metric = 'horas';
  if (/\bturnos|veces|cuantos dias|cuantas veces\b/.test(t)) metric = 'turnos';
  if (/\b(gane|ganado|ganancia|plata|dinero)\b/.test(t)) metric = 'plata';
  if (!metric) metric = esEliptica && _aiqLastMetric ? _aiqLastMetric : 'plata';
  _aiqLastMetric = metric;

  return { filters: filters, label: labelParts.join(' '), metric: metric };
}

// ─── EJECUTOR ────────────────────────────────────────────────
// Filtra la tabla de turnos y calcula con el calculador legal real.
function aiQueryRun(query, turnosAll, ctx) {
  if (!query || !query.filters || !query.filters.length) return null;

  var vh = (ctx && ctx.vh) || 0;
  var todos = turnosAll || [];
  var rows = [];
  var i, j;

  for (i = 0; i < todos.length; i++) {
    var turno = todos[i];
    if (!turno || !turno.fin) continue;
    var d = new Date(turno.inicio);
    if (isNaN(d.getTime())) continue;
    var pasa = true;
    for (j = 0; j < query.filters.length; j++) {
      if (!query.filters[j](d)) {
        pasa = false;
        break;
      }
    }
    if (pasa) rows.push(turno);
  }

  var consultados = 0;
  for (i = 0; i < todos.length; i++) {
    if (todos[i] && todos[i].fin) consultados++;
  }

  if (rows.length === 0) {
    return (
      '🔎 Consulté tus ' +
      consultados +
      ' turnos registrados y no encontré ninguno ' +
      query.label +
      '. Si creés que falta alguno, revisá el tab **Historial**.'
    );
  }

  var calc =
    typeof doCalc === 'function'
      ? doCalc(rows, null, new Date(), vh)
      : { totalMins: 0, totalCOP: 0 };

  // Días distintos y rango de fechas
  var diasVistos = {};
  var minD = null;
  var maxD = null;
  for (i = 0; i < rows.length; i++) {
    var dd = new Date(rows[i].inicio);
    diasVistos[dd.toDateString()] = true;
    if (!minD || dd < minD) minD = dd;
    if (!maxD || dd > maxD) maxD = dd;
  }
  var nDias = 0;
  for (var k in diasVistos) {
    if (Object.prototype.hasOwnProperty.call(diasVistos, k)) nDias++;
  }

  var rango = minD.getDate() + ' ' + AI_QUERY_DICT.monthShort[minD.getMonth()];
  if (maxD.toDateString() !== minD.toDateString()) {
    rango += ' – ' + maxD.getDate() + ' ' + AI_QUERY_DICT.monthShort[maxD.getMonth()];
  }

  var lead;
  if (query.metric === 'horas') {
    lead = 'Trabajaste **' + fDur(calc.totalMins) + '** ' + query.label + '.';
  } else if (query.metric === 'turnos') {
    lead =
      'Registraste **' +
      rows.length +
      ' turno' +
      (rows.length === 1 ? '' : 's') +
      '** ' +
      query.label +
      ' (' +
      nDias +
      ' día' +
      (nDias === 1 ? '' : 's') +
      ' distinto' +
      (nDias === 1 ? '' : 's') +
      ').';
  } else {
    lead = 'Ganaste **' + fCOP(calc.totalCOP) + '** ' + query.label + '.';
  }

  var detalle =
    '\n\n• Turnos: ' +
    rows.length +
    ' (' +
    nDias +
    ' día' +
    (nDias === 1 ? '' : 's') +
    ')\n• Horas: ' +
    fDur(calc.totalMins) +
    '\n• Total: ' +
    fCOP(calc.totalCOP) +
    '\n• Promedio por turno: ' +
    fCOP(rows.length > 0 ? calc.totalCOP / rows.length : 0);

  if (vh <= 0) {
    detalle += '\n\n⚠️ Configurá tu salario base en **Ajustes** para ver los valores en pesos.';
  }

  var evidencia =
    '\n\n📊 _Consulté ' +
    consultados +
    ' turnos de tu historial · ' +
    rows.length +
    (rows.length === 1 ? ' coincide (' : ' coinciden (') +
    rango +
    ')';
  var syncLabel = typeof aiSyncStateLabel === 'function' && ctx ? aiSyncStateLabel(ctx.uid) : '';
  if (syncLabel) evidencia += ' · ' + syncLabel;
  evidencia += '_';

  return '🔎 ' + lead + detalle + evidencia;
}

// ─── COMPARADOR DE PERÍODOS ──────────────────────────────────
// "compará junio con mayo", "junio vs mayo", "este mes contra marzo".
// Detecta dos períodos (mes por nombre o "este mes"/"mes pasado") y los
// confronta con el calculador legal real. Devuelve string o null.
function aiQueryCompare(question, turnosAll, ctx) {
  var t = _aiqNorm(question);
  if (!t) return null;
  // Disparador explícito de comparación
  if (!/\bvs\b|versus|compar|contra/.test(t)) return null;

  var ahora = new Date();

  function resolverMes(mo) {
    var y = ahora.getFullYear();
    if (mo > ahora.getMonth()) y = y - 1; // mes nombrado futuro → año pasado
    return { mo: mo, yr: y, label: AI_QUERY_DICT.monthLabels[mo] };
  }

  // Recolectar candidatos de período con su posición en el texto
  var cands = [];
  for (var name in AI_QUERY_DICT.months) {
    if (!Object.prototype.hasOwnProperty.call(AI_QUERY_DICT.months, name)) continue;
    var idx = t.search(new RegExp('\\b' + name + '\\b'));
    if (idx >= 0) {
      var r = resolverMes(AI_QUERY_DICT.months[name]);
      cands.push({ pos: idx, mo: r.mo, yr: r.yr, label: r.label });
    }
  }
  var iEste = t.search(/este mes|mes actual/);
  if (iEste >= 0) {
    cands.push({ pos: iEste, mo: ahora.getMonth(), yr: ahora.getFullYear(), label: 'este mes' });
  }
  var iPas = t.search(/mes pasado|mes anterior/);
  if (iPas >= 0) {
    var mp = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    cands.push({ pos: iPas, mo: mp.getMonth(), yr: mp.getFullYear(), label: 'el mes pasado' });
  }

  if (cands.length < 2) return null;
  cands.sort(function (a, b) {
    return a.pos - b.pos;
  });
  var A = cands[0];
  var B = cands[1];
  // Evitar comparar un período consigo mismo
  if (A.mo === B.mo && A.yr === B.yr) return null;

  var todos = turnosAll || [];
  var vh = (ctx && ctx.vh) || 0;

  function totalesDe(p) {
    var rows = [];
    for (var i = 0; i < todos.length; i++) {
      var tn = todos[i];
      if (!tn || !tn.fin) continue;
      var d = new Date(tn.inicio);
      if (isNaN(d.getTime())) continue;
      if (d.getMonth() === p.mo && d.getFullYear() === p.yr) rows.push(tn);
    }
    var calc =
      typeof doCalc === 'function'
        ? doCalc(rows, null, new Date(), vh)
        : { totalMins: 0, totalCOP: 0 };
    return { cop: calc.totalCOP, mins: calc.totalMins, turnos: rows.length };
  }

  var ta = totalesDe(A);
  var tb = totalesDe(B);

  function periodoLinea(p, tot) {
    return (
      '• **' +
      p.label.charAt(0).toUpperCase() +
      p.label.slice(1) +
      '**: ' +
      fCOP(tot.cop) +
      ' · ' +
      fDur(tot.mins) +
      ' · ' +
      tot.turnos +
      ' turno' +
      (tot.turnos === 1 ? '' : 's')
    );
  }

  var dif = ta.cop - tb.cop;
  var resumen;
  if (ta.cop === 0 && tb.cop === 0) {
    resumen = 'No tengo turnos registrados en ninguno de los dos períodos.';
  } else if (dif === 0) {
    resumen = 'Quedaron iguales: mismo total en ambos períodos.';
  } else {
    var mayor = dif > 0 ? A : B;
    var menorCop = dif > 0 ? tb.cop : ta.cop;
    var absD = Math.abs(dif);
    var pct = menorCop > 0 ? (absD / menorCop) * 100 : 0;
    resumen =
      'Ganaste **' +
      fCOP(absD) +
      '** más en **' +
      mayor.label +
      '**' +
      (pct > 0 ? ' (▲ ' + pct.toFixed(0) + '%)' : '') +
      '.';
  }

  var out =
    '🔎 **' +
    A.label.charAt(0).toUpperCase() +
    A.label.slice(1) +
    ' vs ' +
    B.label +
    '**\n\n' +
    periodoLinea(A, ta) +
    '\n' +
    periodoLinea(B, tb) +
    '\n\n' +
    resumen;

  if (vh <= 0) {
    out += '\n\n⚠️ Configurá tu salario base en **Ajustes** para ver los valores en pesos.';
  }
  return out;
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiQueryParse = aiQueryParse;
window.aiQueryRun = aiQueryRun;
window.aiQueryCompare = aiQueryCompare;
// Reutilizado por el editor de turnos (ai.js) para resolver "14 de junio".
window.aiParseSpecificDate = _aiqParseSpecificDate;
window.AI_QUERY_DICT = AI_QUERY_DICT;

console.log('[MT] ai-query.js cargado — motor de consultas a datos ✓');
