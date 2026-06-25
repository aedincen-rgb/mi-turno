// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/calculator.js
//  Motor de cálculo de turnos y recargos
// ════════════════════════════════════════════════════════════════

// NOTA: El objeto RC ya está definido globalmente en js/config/globals.js
// No se debe re-definir aquí para evitar sobrescribir la configuración.

/**
 * @typedef {Object} CategoriaMinutos
 * @property {number} diurnaOrd     - Minutos ordinarios diurnos (6:00–21:00, día hábil)
 * @property {number} noctOrd       - Minutos ordinarios nocturnos (21:00–6:00, día hábil)
 * @property {number} diurnaFest    - Minutos ordinarios diurnos en festivo/domingo
 * @property {number} noctFest      - Minutos ordinarios nocturnos en festivo/domingo
 * @property {number} extraDiurna   - Minutos extra diurnos
 * @property {number} extraNoct     - Minutos extra nocturnos
 * @property {number} extraFestDiur - Minutos extra diurnos en festivo/domingo
 * @property {number} extraFestNoct - Minutos extra nocturnos en festivo/domingo
 */

/**
 * @typedef {Object} TurnoRegistro
 * @property {string|number} [id]     - ID único del turno
 * @property {string}        inicio  - ISO 8601 datetime de inicio
 * @property {string}        [fin]   - ISO 8601 datetime de fin (omitido si está activo)
 */

/**
 * @typedef {Object} TurnoActivo
 * @property {string|number} id     - ID del turno activo
 * @property {string}        inicio - ISO 8601 datetime de inicio
 */

/**
 * @typedef {Object} DesgloseCategoria
 * @property {number} mins - Minutos acumulados en esta categoría
 * @property {number} cop  - Pesos colombianos (COP) acumulados
 */

/**
 * @typedef {Object.<string, DesgloseCategoria>} BreakdownPorCategoria
 * Mapa donde cada key es una categoría de recargo (diurnaOrd, noctOrd, etc.)
 * y el valor es { mins, cop }.
 */

/**
 * @typedef {Object} ResultadoCalculo
 * @property {number}                totalMins - Minutos totales trabajados
 * @property {number}                totalCOP  - COP totales ganados
 * @property {BreakdownPorCategoria} bd        - Desglose minucioso por categoría
 */

/**
 * @typedef {Object} ResultadoPorTurno
 * @property {Object.<string, {cop: number, mins: number, bd: BreakdownPorCategoria}>} byId
 * @property {number} total - COP totales de todos los turnos
 */

/**
 * @typedef {Object} ResultadoPorDia
 * @property {string}  fecha  - Fecha ISO YYYY-MM-DD
 * @property {number}  mins   - Minutos trabajados ese día
 * @property {number}  cop    - COP ganados ese día
 * @property {boolean} fest   - true si el día es festivo o domingo
 * @property {boolean} noct   - true si el turno incluye horas nocturnas
 * @property {number}  turnos - Cantidad de turnos ese día
 */

/**
 * Clasifica los minutos de un turno en las 8 categorías de recargo.
 *
 * Algoritmo: recorre el turno minuto a minuto (en realidad por bloques
 * limitados por las 6:00, 21:00 y medianoche). En cada bloque determina
 * si es nocturno (21:00–6:00), festivo/dominical, y si ya se agotaron
 * las horas ordinarias disponibles (máx 8 h/día o saldo semanal).
 *
 * @param {Date}   inicio  - Fecha/hora de inicio del turno
 * @param {Date}   fin     - Fecha/hora de fin del turno
 * @param {number} minsOrd - Minutos ordinarios disponibles (min(480, saldo semanal))
 * @returns {CategoriaMinutos} Minutos clasificados en cada categoría
 *
 * @see CST Art. 159 (jornada máxima diaria)
 * @see Ley 2101/2021 (reducción gradual de jornada semanal)
 */
function calcCats(inicio, fin, minsOrd) {
  var cats = {
    diurnaOrd: 0,
    noctOrd: 0,
    diurnaFest: 0,
    noctFest: 0,
    extraDiurna: 0,
    extraNoct: 0,
    extraFestDiur: 0,
    extraFestNoct: 0
  };
  var current = new Date(inicio.getTime());
  var remainingOrd = minsOrd;
  while (current < fin) {
    // Hora de inicio nocturno vigente a la fecha del chunk (Ley 2466/2025:
    // 19:00 desde 25-dic-2025; 21:00 antes). Date-aware para no recalcular
    // turnos viejos con la regla nueva.
    var nightStart = getInicioNocturno(current);
    var nextBoundary = new Date(current.getTime());
    if (current.getHours() < 6) nextBoundary.setHours(6, 0, 0, 0);
    else if (current.getHours() < nightStart) nextBoundary.setHours(nightStart, 0, 0, 0);
    else {
      // Corte en medianoche para re-evaluar estado festivo del nuevo día
      nextBoundary.setDate(nextBoundary.getDate() + 1);
      nextBoundary.setHours(0, 0, 0, 0);
    }
    var chunkEnd = new Date(Math.min(nextBoundary.getTime(), fin.getTime()));
    var minsInChunk = (chunkEnd - current) / 60000;
    if (minsInChunk > 0) {
      var isNight = current.getHours() >= nightStart || current.getHours() < 6;
      var isHoliday = esFest(current);
      var isExtra = remainingOrd <= 0;
      if (!isExtra) {
        if (isHoliday) isNight ? (cats.noctFest += minsInChunk) : (cats.diurnaFest += minsInChunk);
        else isNight ? (cats.noctOrd += minsInChunk) : (cats.diurnaOrd += minsInChunk);
        remainingOrd -= minsInChunk;
      } else {
        if (isHoliday)
          isNight ? (cats.extraFestNoct += minsInChunk) : (cats.extraFestDiur += minsInChunk);
        else isNight ? (cats.extraNoct += minsInChunk) : (cats.extraDiurna += minsInChunk);
      }
    }
    current = chunkEnd;
  }
  return cats;
}

/**
 * Calcula el salario total del período aplicando TODOS los recargos
 * de la ley colombiana: nocturno, dominical, festivo, horas extra y
 * sus combinaciones (ej. hora extra nocturna dominical).
 *
 * Agrupa turnos por semana ISO (lunes a domingo). El límite ordinario
 * es min(8 h/día, saldo semanal según Ley 2101/2021). El que se agote
 * primero determina cuándo empiezan a correr las horas extra.
 *
 * Si hay un turno activo (abierto, sin hora de fin), se usa `ahoraRef`
 * como cierre provisional para proyectar el acumulado en tiempo real.
 *
 * @param {TurnoRegistro[]} turnos   - Array de turnos cerrados
 * @param {TurnoActivo|null} activo  - Turno actualmente activo o null
 * @param {Date}            ahoraRef - Momento de referencia (Date.now() para proyección en vivo)
 * @param {number}          vh       - Valor hora ordinario del trabajador (COP/h)
 * @returns {ResultadoCalculo} Totales y desglose por categoría
 */
function doCalc(turnos, activo, ahoraRef, vh) {
  var todos = activo
    ? turnos.concat([{ id: activo.id, inicio: activo.inicio, fin: ahoraRef.toISOString() }])
    : turnos.slice();
  // Agrupar por semana: el límite ordinario de cada turno es min(8h/día, saldo semanal 46h)
  // Esto cubre tanto el extra diario (CST Art.159) como el límite semanal (Ley 2101/2021)
  var semMap = {};
  todos.forEach(function (t) {
    var ini = new Date(t.inicio);
    if (isNaN(ini.getTime())) return;
    var k = semLun(ini).toISOString().slice(0, 10);
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push(t);
  });
  var tMins = 0,
    tCOP = 0,
    bd = {};
  Object.keys(RC).forEach(function (k) {
    bd[k] = { mins: 0, cop: 0 };
  });
  Object.keys(semMap).forEach(function (kS) {
    var ts = semMap[kS].sort(function (a, b) {
      return new Date(a.inicio) - new Date(b.inicio);
    });
    var semOrd = getHSEM(new Date(kS)) * 60; // saldo semanal según Ley 2101/2021
    ts.forEach(function (t) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin || ahoraRef);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var mOrd = Math.min(8 * 60, semOrd); // el que se agote primero manda
      var cats = calcCats(ini, fin, mOrd);
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          var c = (m / 60) * vh * rcFactor(rk, ini);
          bd[rk].mins += m;
          bd[rk].cop += c;
          tMins += m;
          tCOP += c;
        }
      });
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      semOrd = Math.max(0, semOrd - ord);
    });
  });
  return { totalMins: tMins, totalCOP: tCOP, bd: bd };
}

/**
 * Calcula el ingreso por turno individual respetando el límite semanal.
 *
 * ¡IMPORTANTE! Cada turno recibe su contribución MARGINAL: el primer
 * turno de la semana consume horas ordinarias, los siguientes caen en
 * horas extra. Por eso la suma de todos los turnos COINCIDE con doCalc(),
 * a diferencia de calcular cada turno aislado (que reiniciaría el saldo
 * semanal y subestimaría los recargos).
 *
 * @param {TurnoRegistro[]} turnos - Array de turnos cerrados (ya deben tener fin)
 * @param {number}          vh     - Valor hora ordinario (COP/h)
 * @returns {ResultadoPorTurno} Desglose por turno + total
 */
function doCalcPerTurno(turnos, vh) {
  var byId = {};
  var total = 0;
  var semMap = {};
  turnos.forEach(function (t, idx) {
    var ini = new Date(t.inicio);
    if (isNaN(ini.getTime())) return;
    var k = semLun(ini).toISOString().slice(0, 10);
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push({ t: t, idx: idx });
  });
  Object.keys(semMap).forEach(function (kS) {
    var ts = semMap[kS].sort(function (a, b) {
      return new Date(a.t.inicio) - new Date(b.t.inicio);
    });
    var semOrd = getHSEM(new Date(kS)) * 60;
    ts.forEach(function (item) {
      var t = item.t;
      var ini = new Date(t.inicio),
        fin = new Date(t.fin);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var mOrd = Math.min(8 * 60, semOrd);
      var cats = calcCats(ini, fin, mOrd);
      var bd = {};
      var cop = 0,
        mins = 0;
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          var c = (m / 60) * vh * rcFactor(rk, ini);
          bd[rk] = { mins: m, cop: c };
          cop += c;
          mins += m;
        }
      });
      var key = t.id != null ? t.id : 'idx_' + item.idx;
      byId[key] = { cop: cop, mins: mins, bd: bd };
      total += cop;
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      semOrd = Math.max(0, semOrd - ord);
    });
  });
  return { byId: byId, total: total };
}

/**
 * Desglose diario: cuántos minutos y cuánto dinero se generó cada día.
 *
 * Agrupa turnos por fecha (YYYY-MM-DD) y acumula minutos + COP.
 * También indica si el día fue festivo/dominical y si incluyó horas nocturnas.
 *
 * @param {TurnoRegistro[]} turnos - Array de turnos cerrados
 * @param {number}          vh     - Valor hora ordinario (COP/h)
 * @returns {ResultadoPorDia[]} Array de días ordenados cronológicamente
 */
function calcPorDia(turnos, vh) {
  var dias = {};
  // Mismo enfoque combinado: min(8h/día, saldo semanal 46h)
  var semMap = {};
  turnos.forEach(function (t) {
    var ini = new Date(t.inicio);
    if (isNaN(ini.getTime())) return;
    var k = semLun(ini).toISOString().slice(0, 10);
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push(t);
  });
  Object.keys(semMap).forEach(function (kS) {
    var ts = semMap[kS].sort(function (a, b) {
      return new Date(a.inicio) - new Date(b.inicio);
    });
    var semOrd = getHSEM(new Date(kS)) * 60;
    ts.forEach(function (t) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var k =
        ini.getFullYear() +
        '-' +
        String(ini.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(ini.getDate()).padStart(2, '0');
      if (!dias[k])
        dias[k] = { fecha: k, mins: 0, cop: 0, fest: esFest(ini), noct: esNoct(ini), turnos: 0 };
      var mOrd = Math.min(8 * 60, semOrd);
      var cats = calcCats(ini, fin, mOrd);
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          dias[k].mins += m;
          dias[k].cop += (m / 60) * vh * rcFactor(rk, ini);
        }
      });
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      semOrd = Math.max(0, semOrd - ord);
      dias[k].turnos++;
    });
  });
  return Object.values(dias).sort(function (a, b) {
    return a.fecha.localeCompare(b.fecha);
  });
}
