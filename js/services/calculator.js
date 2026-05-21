// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/calculator.js
//  Motor de cálculo de turnos y recargos
// ════════════════════════════════════════════════════════════════

// NOTA: El objeto RC ya está definido globalmente en js/config/globals.js
// No se debe re-definir aquí para evitar sobrescribir la configuración.

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
    var nextBoundary = new Date(current.getTime());
    if (current.getHours() < 6) nextBoundary.setHours(6, 0, 0, 0);
    else if (current.getHours() < 21) nextBoundary.setHours(21, 0, 0, 0);
    else {
      nextBoundary.setDate(nextBoundary.getDate() + 1);
      nextBoundary.setHours(6, 0, 0, 0);
    }
    var chunkEnd = new Date(Math.min(nextBoundary.getTime(), fin.getTime()));
    var minsInChunk = (chunkEnd - current) / 60000;
    if (minsInChunk > 0) {
      var isNight = current.getHours() >= 21 || current.getHours() < 6;
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

function doCalc(turnos, activo, ahoraRef, vh) {
  var todos = activo
    ? turnos.concat([{ id: activo.id, inicio: activo.inicio, fin: ahoraRef.toISOString() }])
    : turnos.slice();
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
    var mOrd = HSEM * 60;
    ts.forEach(function (t) {
      var ini = new Date(t.inicio),
        fin = new Date(t.fin || ahoraRef);
      if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || fin <= ini) return;
      var cats = calcCats(ini, fin, mOrd);
      Object.keys(cats).forEach(function (rk) {
        var m = cats[rk];
        if (m > 0) {
          var c = (m / 60) * vh * RC[rk].factor;
          bd[rk].mins += m;
          bd[rk].cop += c;
          tMins += m;
          tCOP += c;
        }
      });
      var ord = cats.diurnaOrd + cats.noctOrd + cats.diurnaFest + cats.noctFest;
      mOrd = Math.max(0, mOrd - ord);
    });
  });
  return { totalMins: tMins, totalCOP: tCOP, bd: bd };
}

function calcPorDia(turnos, vh) {
  var dias = {};
  turnos.forEach(function (t) {
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
    var cats = calcCats(ini, fin, HSEM * 60);
    Object.keys(cats).forEach(function (rk) {
      var m = cats[rk];
      if (m > 0) {
        dias[k].mins += m;
        dias[k].cop += (m / 60) * vh * RC[rk].factor;
      }
    });
    dias[k].turnos++;
  });
  return Object.values(dias).sort(function (a, b) {
    return a.fecha.localeCompare(b.fecha);
  });
}
