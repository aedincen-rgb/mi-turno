// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/calculator.js
//  Motor de cálculo de turnos y recargos
// ════════════════════════════════════════════════════════════════
var RC = {
  diurnaOrd: {
    label: 'Diurna ordinaria',
    short: 'Diur. ord.',
    factor: 1.0,
    color: '#5B86E5',
    bg: 'rgba(82,127,204,0.10)',
    bd: 'rgba(82,127,204,0.22)',
    icon: '☀'
  },
  noctOrd: {
    label: 'Nocturna ordinaria',
    short: 'Noct. ord.',
    factor: 1.35,
    color: '#4F6BBF',
    bg: 'rgba(123,107,217,0.10)',
    bd: 'rgba(123,107,217,0.22)',
    icon: '☾'
  },
  diurnaFest: {
    label: 'Festiva diurna',
    short: 'Fest. diur.',
    factor: 1.75,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.10)',
    bd: 'rgba(217,119,6,0.20)',
    icon: '✦'
  },
  noctFest: {
    label: 'Festiva nocturna',
    short: 'Fest. noct.',
    factor: 2.1,
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.10)',
    bd: 'rgba(220,38,38,0.20)',
    icon: '★'
  },
  extraDiurna: {
    label: 'Extra diurna',
    short: 'Ext. diur.',
    factor: 1.25,
    color: '#0d9488',
    bg: 'rgba(13,148,136,0.10)',
    bd: 'rgba(13,148,136,0.20)',
    icon: '⚡'
  },
  extraNoct: {
    label: 'Extra nocturna',
    short: 'Ext. noct.',
    factor: 1.75,
    color: '#5b21b6',
    bg: 'rgba(91,33,182,0.10)',
    bd: 'rgba(91,33,182,0.20)',
    icon: '⚡'
  },
  extraFestDiur: {
    label: 'Extra fest. diurna',
    short: 'Ext.fest.d.',
    factor: 2.0,
    color: '#059669',
    bg: 'rgba(5,150,105,0.10)',
    bd: 'rgba(5,150,105,0.20)',
    icon: '⚡'
  },
  extraFestNoct: {
    label: 'Extra fest. nocturna',
    short: 'Ext.fest.n.',
    factor: 2.5,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    bd: 'rgba(139,92,246,0.20)',
    icon: '⚡'
  }
};

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
