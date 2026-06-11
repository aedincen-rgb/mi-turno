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

// ─── PARSER ──────────────────────────────────────────────────
// Devuelve null si la pregunta no es una consulta de datos con un
// filtro que los intents clásicos no cubren. Solo reclama preguntas
// con filtro explícito: día de semana, festivos, fin de semana o mes
// puntual por nombre. (hoy/ayer/semana/mes ya los cubren los intents.)
function aiQueryParse(question) {
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

  // Verbo/sustantivo de datos: sin esto no es consulta a la tabla
  var hasDataWord =
    /\b(gane|ganado|ganancia|trabaje|trabajado|hice|tuve|llevo|sume|acumule|plata|dinero|horas|turnos|cuanto|cuantos|cuantas)\b/.test(
      t
    );
  if (!hasDataWord) return null;

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

  if (weekday === null && !finde && !festivo && month === null) return null;

  var ahora = new Date();

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

  // Métrica principal (decide la frase de apertura)
  var metric = 'plata';
  if (/(\bhoras?\b|trabaj)/.test(t) && !/\b(gane|ganado|plata|dinero)\b/.test(t)) metric = 'horas';
  if (/\bturnos|veces|cuantos dias|cuantas veces\b/.test(t)) metric = 'turnos';

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

// ─── EXPORT ──────────────────────────────────────────────────
window.aiQueryParse = aiQueryParse;
window.aiQueryRun = aiQueryRun;
window.AI_QUERY_DICT = AI_QUERY_DICT;

console.log('[MT] ai-query.js cargado — motor de consultas a datos ✓');
