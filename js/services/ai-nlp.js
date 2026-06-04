// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-nlp.js
//  Motor NLP mejorado — v76
//  Comprensión de lenguaje natural en español colombiano.
//  100% offline · ES5 · sin dependencias externas.
//
//  Capacidades:
//    · Clasificación de intenciones por puntaje ponderado
//    · Stemming español simplificado
//    · Stop words + tokenización
//    · Similitud de Jaccard para matching difuso
//    · Tolerancia a typos (Levenshtein para palabras cortas)
//    · Estado conversacional multi-turno
//    · Detección de tono emocional (empatía contextual)
// ════════════════════════════════════════════════════════════════

// ─── STOP WORDS ESPAÑOL ───────────────────────────────────────
var AI_STOP = {
  a: 1,
  ante: 1,
  bajo: 1,
  cabe: 1,
  con: 1,
  contra: 1,
  de: 1,
  del: 1,
  desde: 1,
  durante: 1,
  en: 1,
  entre: 1,
  hacia: 1,
  hasta: 1,
  mediante: 1,
  para: 1,
  por: 1,
  según: 1,
  sin: 1,
  sobre: 1,
  tras: 1,
  el: 1,
  la: 1,
  los: 1,
  las: 1,
  un: 1,
  una: 1,
  unos: 1,
  unas: 1,
  lo: 1,
  le: 1,
  les: 1,
  se: 1,
  su: 1,
  sus: 1,
  mi: 1,
  mis: 1,
  tu: 1,
  tus: 1,
  yo: 1,
  me: 1,
  te: 1,
  nos: 1,
  os: 1,
  que: 1,
  cual: 1,
  cuales: 1,
  quien: 1,
  quienes: 1,
  cuyo: 1,
  cuya: 1,
  donde: 1,
  cuando: 1,
  como: 1,
  cuanto: 1,
  cuanta: 1,
  cuantos: 1,
  es: 1,
  son: 1,
  fue: 1,
  era: 1,
  está: 1,
  esta: 1,
  estoy: 1,
  hay: 1,
  tiene: 1,
  tengo: 1,
  hacer: 1,
  ser: 1,
  estar: 1,
  más: 1,
  mas: 1,
  menos: 1,
  muy: 1,
  tan: 1,
  tanto: 1,
  poco: 1,
  sí: 1,
  si: 1,
  no: 1,
  ya: 1,
  aún: 1,
  aun: 1,
  solo: 1,
  sólo: 1,
  todo: 1,
  toda: 1,
  algo: 1,
  nada: 1,
  cada: 1,
  otro: 1,
  otra: 1,
  pero: 1,
  porque: 1,
  pues: 1,
  aunque: 1,
  asi: 1,
  así: 1,
  ahora: 1,
  hoy: 1,
  ayer: 1,
  mañana: 1,
  siempre: 1,
  nunca: 1,
  bueno: 1,
  buena: 1,
  mal: 1,
  malo: 1,
  mejor: 1,
  peor: 1,
  puede: 1,
  puedo: 1,
  puedes: 1,
  podria: 1,
  podrías: 1,
  quisiera: 1,
  dame: 1,
  di: 1,
  dime: 1,
  decir: 1,
  saber: 1,
  quiero: 1,
  necesito: 1,
  porfa: 1,
  porfi: 1,
  gracias: 1,
  hola: 1,
  buenas: 1,
  buenos: 1,
  o: 1,
  y: 1,
  e: 1,
  ni: 1,
  al: 1
};

// ─── STEMMING ESPAÑOL SIMPLIFICADO ─────────────────────────────
// Reduce palabras a su raíz aproximada para mejorar matching.
// No es un stemmer completo (Porter), pero cubre los sufijos
// más comunes en el dominio de nómina y conversación.
function aiStem(w) {
  if (w.length <= 3) return w;
  // Plurales
  if (w.slice(-2) === 'es') w = w.slice(0, -2);
  else if (w.slice(-1) === 's' && w.slice(-2, -1) !== 'e') w = w.slice(0, -1);
  // Verbos comunes: gerundios y participios
  if (w.slice(-4) === 'ando' || w.slice(-4) === 'iendo') w = w.slice(0, -4);
  else if (w.slice(-3) === 'ado' || w.slice(-3) === 'ido') w = w.slice(0, -3);
  // Diminutivos coloquiales colombianos
  if (w.slice(-4) === 'ito ' || w.slice(-4) === 'ita ') w = w.slice(0, -4);
  else if (w.slice(-3) === 'ito' || w.slice(-3) === 'ita') w = w.slice(0, -3);
  // Superlativos
  if (w.slice(-5) === 'ísimo' || w.slice(-5) === 'ísima') w = w.slice(0, -5);
  // Verbos conjugados comunes (-ar, -er, -ir)
  if (w.length > 5) {
    if (w.slice(-2) === 'ar' || w.slice(-2) === 'er' || w.slice(-2) === 'ir') {
      // No reducir si es palabra corta tipo "dar", "ser", "ir"
    }
  }
  return w;
}

// ─── TOKENIZACIÓN ──────────────────────────────────────────────
// Convierte texto en array de stems, filtrando stop words
function aiTokenize(text) {
  var raw = (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[¿¡?!;:,.()[\]"'\u201c\u201d\u2018\u2019]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  var words = raw.split(' ');
  var tokens = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (!w || w.length < 2) continue;
    if (AI_STOP[w]) continue;
    tokens.push(aiStem(w));
  }
  return tokens;
}

// ─── SIMILITUD DE JACCARD ─────────────────────────────────────
// Compara dos conjuntos de tokens. Valor entre 0 y 1.
function aiJaccard(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  var intersection = 0;
  var union = {};
  for (var i = 0; i < tokensA.length; i++) {
    union[tokensA[i]] = 1;
  }
  for (var j = 0; j < tokensB.length; j++) {
    if (union[tokensB[j]]) {
      intersection++;
      union[tokensB[j]] = 2; // marcado como compartido
    } else {
      union[tokensB[j]] = 1;
    }
  }
  // Contar unión real
  var unionCount = 0;
  for (var k in union) {
    if (Object.prototype.hasOwnProperty.call(union, k)) unionCount++;
  }
  return unionCount > 0 ? intersection / unionCount : 0;
}

// ─── DISTANCIA LEVENSHTEIN ────────────────────────────────────
// Tolerancia a typos para palabras cortas (≤5 caracteres)
function aiLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  var m = a.length;
  var n = b.length;
  var d = [];
  for (var i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (var j = 0; j <= n; j++) {
    d[0][j] = j;
  }
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // borrar
        d[i][j - 1] + 1, // insertar
        d[i - 1][j - 1] + cost // reemplazar
      );
    }
  }
  return d[m][n];
}

// ¿Coincide con tolerancia de 1 error para palabras cortas?
function aiFuzzyMatch(word, target) {
  if (word === target) return true;
  if (Math.abs(word.length - target.length) > 1) return false;
  if (word.length <= 5 && aiLevenshtein(word, target) <= 1) return true;
  return false;
}

// ─── DICCIONARIO DE SINÓNIMOS ────────────────────────────────
// Expande términos a su forma canónica para mejorar matching
var AI_SYNONYMS = {
  plata: 'dinero',
  billete: 'dinero',
  lucas: 'dinero',
  guita: 'dinero',
  cobro: 'pago',
  cobre: 'pago',
  sueldo: 'salario',
  nomina: 'salario',
  laburo: 'trabajo',
  chamba: 'trabajo',
  camello: 'trabajo',
  jornada: 'turno',
  descanso: 'descansar',
  pausa: 'descansar',
  reposo: 'descansar',
  cansado: 'fatiga',
  agotado: 'fatiga',
  reventado: 'fatiga',
  mamado: 'fatiga',
  rendir: 'productividad',
  rendimiento: 'productividad',
  finde: 'fin de semana',
  findesemana: 'fin de semana',
  'finde semana': 'fin de semana',
  feriado: 'festivo',
  festividad: 'festivo',
  proye: 'proyeccion',
  proyecto: 'proyeccion',
  estimado: 'proyeccion',
  comparar: 'comparativa',
  comparacion: 'comparativa',
  diferencia: 'comparativa',
  vs: 'comparativa',
  versus: 'comparativa',
  resumen: 'total',
  balance: 'total',
  cuentas: 'total',
  numeros: 'total',
  estadisticas: 'stats',
  datos: 'stats',
  info: 'stats',
  envio: 'email',
  correo: 'email',
  mandar: 'email',
  reporte: 'email',
  informe: 'email',
  jefe: 'email',
  empresa: 'email',
  admin: 'email',
  salud: 'bienestar',
  bien: 'bienestar',
  sano: 'bienestar',
  consejo: 'tip',
  recomendacion: 'tip',
  sugerencia: 'tip',
  aconsejar: 'tip',
  ahorrar: 'ahorro',
  meta: 'ahorro',
  objetivo: 'ahorro',
  llegar: 'ahorro',
  falta: 'ahorro',
  'cuanto falta': 'ahorro'
};

function aiExpandSynonym(w) {
  return AI_SYNONYMS[w] || w;
}

// ─── INTENTS ──────────────────────────────────────────────────
// Cada intent tiene:
//   id: identificador único
//   keywords: array de [palabra, peso]
//   context: opcional, array de keywords que deben estar en
//            el estado conversacional previo
// Los pesos: 3 = muy específico, 2 = relevante, 1 = débil
var AI_INTENTS = [
  // ── Conversacionales ──
  {
    id: 'saludo',
    kw: [
      ['hola', 3],
      ['holi', 3],
      ['buen dia', 3],
      ['buenos dias', 3],
      ['buenas tardes', 3],
      ['buenas noches', 3],
      ['que tal', 3],
      ['como vas', 3],
      ['como va', 3],
      ['hey', 3],
      ['alo', 3],
      ['saludo', 3],
      ['buenas', 3]
    ]
  },
  {
    id: 'despedida',
    kw: [
      ['adios', 3],
      ['chao', 3],
      ['hasta luego', 3],
      ['nos vemos', 3],
      ['bye', 3],
      ['me voy', 3],
      ['hasta pronto', 3]
    ]
  },
  {
    id: 'agradecimiento',
    kw: [
      ['gracias', 3],
      ['genial', 3],
      ['excelente', 3],
      ['perfecto', 3],
      ['que bien', 3],
      ['buenisimo', 3],
      ['buen trabajo', 3],
      ['gracias totales', 3]
    ]
  },
  {
    id: 'identidad',
    kw: [
      ['quien eres', 3],
      ['que eres', 3],
      ['como te llamas', 3],
      ['nombre', 2],
      ['quien sos', 3],
      ['que haces', 2],
      ['para que servis', 3],
      ['para que sirves', 3]
    ]
  },
  {
    id: 'capacidades',
    kw: [
      ['que sabes hacer', 3],
      ['que podes hacer', 3],
      ['que puedes hacer', 3],
      ['capacidades', 3],
      ['skills', 3],
      ['funciones', 3],
      ['que sabes', 3]
    ]
  },

  // ── Nómina / Dinero ──
  {
    id: 'total_ganado',
    kw: [
      ['cuanto gane', 3],
      ['cuanto gané', 3],
      ['cuanto he ganado', 3],
      ['cuanto llevo', 3],
      ['total ganado', 3],
      ['total mes', 3],
      ['ingreso', 2],
      ['cuanto dinero', 3],
      ['cuanta plata', 3],
      ['cuanto cobro', 3],
      ['cuanto cobre', 3],
      ['balance', 2],
      ['resumen', 2],
      ['mis numeros', 3]
    ]
  },
  {
    id: 'hoy',
    kw: [
      ['hoy', 3],
      ['este dia', 3],
      ['que tal hoy', 3],
      ['como me fue hoy', 3],
      ['cuanto hoy', 3],
      ['dia de hoy', 3]
    ]
  },
  {
    id: 'ayer',
    kw: [
      ['ayer', 3],
      ['dia anterior', 3],
      ['como me fue ayer', 3],
      ['cuanto ayer', 3],
      ['y ayer', 3]
    ]
  },
  {
    id: 'proyeccion',
    kw: [
      ['proyeccion', 3],
      ['proyectar', 3],
      ['cuanto al final', 3],
      ['al cierre', 3],
      ['estimado', 2],
      ['cuanto voy a ganar', 3],
      ['fin de mes', 2],
      ['cuanto al terminar', 3],
      ['al final del mes', 3]
    ]
  },
  {
    id: 'horas_trabajadas',
    kw: [
      ['cuantas horas', 3],
      ['horas trabajadas', 3],
      ['tiempo trabajado', 3],
      ['total horas', 3],
      ['cuanto tiempo', 2],
      ['horas totales', 3]
    ]
  },
  {
    id: 'promedio',
    kw: [
      ['promedio', 3],
      ['media', 2],
      ['promedio por turno', 3],
      ['promedio diario', 3],
      ['cuanto gano por dia', 3],
      ['por turno', 2],
      ['por dia', 2]
    ]
  },

  // ── Comparativas ──
  {
    id: 'comparativa_mes',
    kw: [
      ['mes pasado', 3],
      ['vs mes', 3],
      ['comparar mes', 3],
      ['mejor que mes', 3],
      ['peor que mes', 3],
      ['vs el mes', 3],
      ['comparativa', 2],
      ['diferencia con', 2],
      ['contra mes', 3]
    ]
  },
  {
    id: 'comparativa_semana',
    kw: [
      ['semana pasada', 3],
      ['vs semana', 3],
      ['esta semana', 3],
      ['comparar semana', 3],
      ['semana anterior', 3]
    ]
  },

  // ── Días específicos ──
  {
    id: 'mejor_dia',
    kw: [
      ['mejor dia', 3],
      ['dia mas productivo', 3],
      ['dia que mas gane', 3],
      ['dia que mas gané', 3],
      ['record', 2],
      ['mejor jornada', 3],
      ['tope', 2]
    ]
  },
  {
    id: 'peor_dia',
    kw: [
      ['peor dia', 3],
      ['dia mas bajo', 3],
      ['dia que menos', 3],
      ['jornada mas corta', 3]
    ]
  },
  {
    id: 'turno_largo',
    kw: [
      ['turno mas largo', 3],
      ['jornada mas larga', 3],
      ['turno largo', 2],
      ['maxima duracion', 3]
    ]
  },
  {
    id: 'turno_corto',
    kw: [
      ['turno mas corto', 3],
      ['turno mas breve', 3],
      ['jornada corta', 3],
      ['minima duracion', 3]
    ]
  },

  // ── Rachas y patrones ──
  {
    id: 'racha',
    kw: [
      ['racha', 3],
      ['dias seguidos', 3],
      ['dias consecutivos', 3],
      ['cuantos dias sin parar', 3],
      ['seguidos', 2]
    ]
  },
  {
    id: 'distribucion',
    kw: [
      ['distribucion', 3],
      ['porcentaje', 2],
      ['desglose', 3],
      ['donde va', 3],
      ['por categoria', 3],
      ['como se reparte', 3]
    ]
  },
  {
    id: 'velocidad',
    kw: [
      ['velocidad', 3],
      ['cop por hora', 3],
      ['cuanto gano por hora', 3],
      ['ritmo', 2],
      ['tasa', 2],
      ['eficiencia', 2]
    ]
  },

  // ── Simulación ──
  {
    id: 'simulacion',
    kw: [
      ['si trabajo', 3],
      ['si hago', 3],
      ['si meto', 3],
      ['cuanto si', 3],
      ['cuanto ganaria', 3],
      ['cuanto ganaría', 3],
      ['horas mas', 3],
      ['adicional', 2],
      ['extra', 2],
      ['simular', 3],
      ['que pasaria', 3],
      ['que pasaría', 3]
    ]
  },

  // ── Festivos ──
  {
    id: 'festivos',
    kw: [
      ['festivo', 3],
      ['festivos', 3],
      ['proximo festivo', 3],
      ['proximos festivos', 3],
      ['cuando es festivo', 3],
      ['feriado', 3],
      ['feriados', 3],
      ['que dias son festivos', 3]
    ]
  },

  // ── Bienestar / Fatiga ──
  {
    id: 'bienestar',
    kw: [
      ['cansado', 3],
      ['fatiga', 3],
      ['descanso', 2],
      ['bienestar', 3],
      ['salud', 3],
      ['agotado', 3],
      ['reventado', 3],
      ['mamado', 3],
      ['estres', 3],
      ['estresado', 3],
      ['burnout', 3],
      ['como estoy', 2]
    ]
  },

  // ── Liquidación ──
  {
    id: 'liquidacion',
    kw: [
      ['liquidacion', 3],
      ['liquidación', 3],
      ['prestaciones', 3],
      ['neto', 2],
      ['cuanto me liquidan', 3],
      ['cesantias', 3],
      ['cesantías', 3],
      ['prima', 2],
      ['vacaciones', 2],
      ['descuento', 2],
      ['deduccion', 2],
      ['deducción', 2],
      ['salario neto', 3]
    ]
  },

  // ── Ley / Normativa ──
  {
    id: 'ley',
    kw: [
      ['ley', 3],
      ['normativa', 3],
      ['jornada maxima', 3],
      ['jornada máxima', 3],
      ['horas legales', 3],
      ['cuantas horas permite', 3],
      ['limite', 2],
      ['legal', 2],
      ['2101', 3],
      ['cst', 3],
      ['codigo laboral', 3]
    ]
  },

  // ── Ahorro / Meta ──
  {
    id: 'ahorro',
    kw: [
      ['ahorro', 3],
      ['ahorrar', 3],
      ['meta', 2],
      ['objetivo', 2],
      ['cuanto necesito', 3],
      ['cuanto debo trabajar', 3],
      ['cuantas horas para', 3],
      ['cuanto falta para', 3],
      ['para llegar a', 3]
    ]
  },

  // ── Email ──
  {
    id: 'email',
    kw: [
      ['enviar', 2],
      ['correo', 3],
      ['email', 3],
      ['mandar', 2],
      ['reporte', 3],
      ['informe', 3],
      ['jefe', 2],
      ['empresa', 2],
      ['admin', 2],
      ['envia', 3],
      ['envia mi', 3],
      ['enviame', 3]
    ]
  },
  {
    id: 'correo_formal',
    kw: [
      ['redacta', 3],
      ['redactar', 3],
      ['correo formal', 3],
      ['carta', 2],
      ['escribi', 3],
      ['escribe', 3],
      ['componer', 3],
      ['borrador', 3]
    ]
  },

  // ── WhatsApp Share ──
  {
    id: 'whatsapp_share',
    kw: [
      ['whatsapp', 3],
      ['compartir whatsapp', 3],
      ['compartir por whatsapp', 3],
      ['enviar whatsapp', 3],
      ['mandar whatsapp', 3],
      ['whats', 2]
    ]
  },

  // ── Ayuda ──
  {
    id: 'ayuda_app',
    kw: [
      ['como usar', 3],
      ['como funciona', 3],
      ['como inicio', 3],
      ['como registrar', 3],
      ['tutorial', 3],
      ['guia', 3],
      ['guía', 3],
      ['explicame', 3],
      ['explicame', 3],
      ['no entiendo', 3]
    ]
  },

  // ── Ayuda de navegación (ai-help.js) ──
  {
    id: 'ayuda_navegacion',
    kw: [
      ['como hago para', 3],
      ['como se hace', 3],
      ['donde esta', 3],
      ['dónde está', 3],
      ['donde encuentro', 3],
      ['dónde encuentro', 3],
      ['como puedo', 3],
      ['como cambio', 3],
      ['como configuro', 3],
      ['como exporto', 3],
      ['como envio', 3],
      ['como borro', 3],
      ['como descargo', 3],
      ['como activo', 3],
      ['como recupero', 3],
      ['como cierro', 3],
      ['como respaldo', 3],
      ['como restauro', 3],
      ['como inicio sesion', 3],
      ['explicame como', 3],
      ['explicame cómo', 3],
      ['enseñame', 3],
      ['guíame', 3],
      ['pasos para', 3],
      ['que hago para', 3],
      ['donde se hace', 3],
      ['donde toco', 3],
      ['como accedo', 3],
      ['donde miro', 3],
      ['necesito ayuda', 3],
      ['no se como', 3],
      ['no sé cómo', 3]
    ]
  },

  // ── Stats rápido ──
  {
    id: 'stats',
    kw: [
      ['stats', 3],
      ['estadisticas', 3],
      ['estadísticas', 3],
      ['datos rapidos', 3],
      ['datos rápidos', 3],
      ['resumen rapido', 3],
      ['resumen rápido', 3],
      ['cifras', 3]
    ]
  }
];

// ─── ESTADO CONVERSACIONAL ────────────────────────────────────
var _aiConv = {
  lastIntent: null,
  lastTopic: null,
  turnCount: 0,
  contextHints: [],
  askedFollowUp: false
};

function aiGetConv() {
  return _aiConv;
}

function aiResetConv() {
  _aiConv.lastIntent = null;
  _aiConv.lastTopic = null;
  _aiConv.turnCount = 0;
  _aiConv.contextHints = [];
  _aiConv.askedFollowUp = false;
}

// ─── CLASIFICADOR DE INTENCIONES ─────────────────────────────
// Analiza el texto y devuelve { intent, score, confidence, tokens }
// score: puntaje bruto del mejor intent
// confidence: score normalizado (0-1) considerando cantidad de tokens
function aiClassify(text, convState, userContext) {
  var tokens = aiTokenize(text);
  if (!tokens.length) {
    return { intent: null, score: 0, confidence: 0, tokens: tokens, topic: null };
  }

  // Expandir sinónimos en los tokens
  var expandedTokens = tokens.map(function (t) {
    return aiExpandSynonym(t);
  });

  var bestIntent = null;
  var bestScore = 0;
  var secondScore = 0;

  // Evaluar cada intent contra los tokens expandidos
  for (var i = 0; i < AI_INTENTS.length; i++) {
    var intent = AI_INTENTS[i];
    var score = 0;
    var maxPossible = 0;
    var textStr = ' ' + text.toLowerCase() + ' ';

    for (var j = 0; j < intent.kw.length; j++) {
      var kw = intent.kw[j][0];
      var weight = intent.kw[j][1];
      maxPossible += weight;

      // Buscar la keyword completa (frase) en el texto original
      if (textStr.indexOf(' ' + kw + ' ') >= 0) {
        score += weight * 1.5; // bonus por frase exacta
      } else {
        // Buscar palabras individuales de la keyword en los tokens expandidos
        var kwWords = kw.split(' ');
        var kwMatchCount = 0;
        for (var w = 0; w < kwWords.length; w++) {
          var kwStem = aiStem(kwWords[w]);
          for (var t = 0; t < expandedTokens.length; t++) {
            if (expandedTokens[t] === kwStem || aiFuzzyMatch(expandedTokens[t], kwStem)) {
              kwMatchCount++;
              break;
            }
          }
        }
        // Puntaje proporcional a cuántas palabras de la keyword matchearon
        if (kwMatchCount > 0) {
          score += weight * (kwMatchCount / kwWords.length) * 0.7;
        }
      }
    }

    // Bonus por contexto conversacional
    if (convState && convState.lastTopic) {
      var topicBonus = _aiTopicBonus(intent.id, convState.lastTopic);
      score += topicBonus;
    }

    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestIntent = intent;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // Calcular confianza: diferencia entre el mejor y el segundo,
  // normalizada por el puntaje máximo posible
  var margin = bestScore - secondScore;
  var confidence =
    bestScore > 0 ? Math.min(1, (bestScore / 9) * (0.5 + margin / (bestScore + 0.01))) : 0;

  // Si hay un intent por contexto conversacional que es muy probable
  if (!bestIntent && convState && convState.lastIntent) {
    confidence = 0.15;
    bestIntent = { id: 'contexto', kw: [] };
  }

  return {
    intent: bestIntent ? bestIntent.id : null,
    score: bestScore,
    confidence: confidence,
    tokens: tokens,
    topic: bestIntent ? _aiIntentTopic(bestIntent.id) : null
  };
}

// ─── MAPEO INTENT → TOPIC ────────────────────────────────────
function _aiIntentTopic(intentId) {
  var map = {
    saludo: 'conversacion',
    despedida: 'conversacion',
    agradecimiento: 'conversacion',
    identidad: 'conversacion',
    capacidades: 'conversacion',
    total_ganado: 'dinero',
    hoy: 'dinero',
    ayer: 'dinero',
    proyeccion: 'dinero',
    horas_trabajadas: 'tiempo',
    promedio: 'dinero',
    comparativa_mes: 'comparativa',
    comparativa_semana: 'comparativa',
    mejor_dia: 'patrones',
    peor_dia: 'patrones',
    turno_largo: 'patrones',
    turno_corto: 'patrones',
    racha: 'patrones',
    distribucion: 'patrones',
    velocidad: 'patrones',
    simulacion: 'dinero',
    festivos: 'informacion',
    bienestar: 'salud',
    liquidacion: 'dinero',
    ley: 'informacion',
    ahorro: 'dinero',
    email: 'accion',
    correo_formal: 'accion',
    ayuda_app: 'informacion',
    stats: 'dinero'
  };
  return map[intentId] || 'general';
}

// ─── BONUS POR CONTEXTO ──────────────────────────────────────
// Si el usuario preguntó sobre dinero y luego dice "¿y ayer?",
// el intent "ayer" recibe bonus porque sigue en contexto dinero
function _aiTopicBonus(intentId, lastTopic) {
  var topic = _aiIntentTopic(intentId);
  if (topic === lastTopic && topic !== 'conversacion') return 2;
  if (topic === 'dinero' && lastTopic === 'comparativa') return 1;
  if (topic === 'comparativa' && lastTopic === 'dinero') return 1;
  if (topic === 'patrones' && lastTopic === 'dinero') return 1;
  return 0;
}

// ─── DETECCIÓN DE TONO EMOCIONAL ─────────────────────────────
// Analiza el texto y el contexto del usuario para ajustar
// el nivel de empatía en la respuesta.
// Devuelve { mood, intensity, hints }
function aiDetectMood(text, userContext) {
  var t = (text || '').toLowerCase();
  var mood = 'neutral';
  var intensity = 0;
  var hints = [];

  // Señales de frustración / cansancio
  var frustKW = [
    'cansado',
    'cansada',
    'agotado',
    'agotada',
    'reventado',
    'mamado',
    'mamada',
    'estresado',
    'estresada',
    'mal',
    'fatal',
    'horrible',
    'no puedo mas',
    'no doy mas',
    'hasta aqui',
    'hasta aquí',
    'rendido',
    'rendida',
    'duro',
    'pesado'
  ];
  var positiveKW = [
    'bien',
    'genial',
    'excelente',
    'feliz',
    'contento',
    'contenta',
    'motivado',
    'motivada',
    'animado',
    'animada',
    'bacan',
    'bacano',
    'chevere',
    'chévere',
    'buenisimo',
    'orgulloso',
    'orgullosa'
  ];
  var worriedKW = [
    'preocupado',
    'preocupada',
    'inseguro',
    'insegura',
    'duda',
    'confundido',
    'confundida',
    'no se',
    'no sé',
    'ayuda',
    'auxilio',
    'socorro'
  ];

  for (var i = 0; i < frustKW.length; i++) {
    if (t.indexOf(frustKW[i]) >= 0) {
      mood = 'frustrado';
      intensity += 2;
      hints.push('fatiga');
      break;
    }
  }
  for (var j = 0; j < worriedKW.length; j++) {
    if (t.indexOf(worriedKW[j]) >= 0) {
      if (mood === 'neutral') mood = 'preocupado';
      intensity += 1;
      hints.push('inseguridad');
      break;
    }
  }
  for (var k = 0; k < positiveKW.length; k++) {
    if (t.indexOf(positiveKW[k]) >= 0) {
      if (mood === 'neutral' || mood === 'preocupado') mood = 'positivo';
      intensity += 1;
      hints.push('motivacion');
      break;
    }
  }

  // Contexto del usuario: racha larga sin descanso
  if (userContext && userContext.rachaActual >= 7) {
    if (mood === 'neutral') mood = 'frustrado';
    intensity += 1;
    hints.push('racha_larga');
  }
  // Contexto: hora de madrugada
  if (userContext && userContext.ahora) {
    var h = new Date(userContext.ahora).getHours();
    if (h >= 0 && h < 5) {
      intensity += 1;
      hints.push('madrugada');
    }
  }
  // Contexto: burnout
  if (userContext && userContext.burnout) {
    intensity += 2;
    hints.push('burnout');
    if (mood === 'neutral') mood = 'frustrado';
  }

  return { mood: mood, intensity: Math.min(intensity, 5), hints: hints };
}

// ─── VARIANTES DE RESPUESTA EMPÁTICA ─────────────────────────
// Prefijos y sufijos que se añaden según el tono emocional
var AI_EMPATHY = {
  frustrado: {
    prefixes: [
      'Te escucho. ',
      'Qué duro, parce. ',
      'Uff, te entiendo. ',
      'Fuerza con eso. ',
      'No es fácil, lo sé. ',
      'Ánimo, que ya pasaste varias así. '
    ],
    suffixes: [
      ' ¿Querés que veamos cuándo fue tu último descanso?',
      ' Si necesitás bajar el ritmo, tus números igual están bien.',
      ' Cuidate, ¿vale? Que la máquina también necesita pausa.',
      ' Estoy acá para lo que necesités.'
    ]
  },
  positivo: {
    prefixes: [
      '¡Qué energía! ',
      'Esa es la actitud. ',
      'Me encanta leerte así. ',
      '¡Vamos por más! ',
      'Qué bueno verte con ese ánimo. '
    ],
    suffixes: [
      ' ¡Seguí así que vas volando! 🚀',
      ' Esos números van a estar lindos este mes.',
      ' ¿Vamos por un récord?'
    ]
  },
  preocupado: {
    prefixes: [
      'Tranqui, vamos por partes. ',
      'No te preocupés, todo tiene solución. ',
      'Respirá hondo, acá estoy. ',
      'Vamos a resolverlo juntos. '
    ],
    suffixes: [
      ' ¿Querés que te explique algo en específico?',
      ' Decime qué necesitás y te ayudo.',
      ' No hay pregunta tonta, preguntá con confianza.'
    ]
  },
  neutral: {
    prefixes: ['', 'Dale, ', 'A ver, ', 'Mirá, '],
    suffixes: ['', ' ¿Algo más en lo que te pueda ayudar?', ' ✦']
  }
};

function aiPickEmpathy(prefixes) {
  return prefixes[Math.floor(Math.random() * prefixes.length)];
}

// ─── RESPUESTA CONVERSACIONAL (FALLBACK) ──────────────────────
// Cuando ninguna intención tiene suficiente confianza,
// se genera una respuesta conversacional genérica pero cálida
function aiConversationalFallback(text, userContext) {
  var t = (text || '').toLowerCase();
  var mood = aiDetectMood(text, userContext);

  // Si el texto es muy corto, es probable que sea un intento de charla
  if (t.length < 10) {
    var cortas = [
      'Contame más, ¿qué querés saber?',
      'No te entendí bien. ¿Me lo decís de otra forma?',
      'Podés preguntarme de tu salario, tus horas, tus recargos... lo que necesités.',
      'Estoy acá. ¿En qué te puedo ayudar?'
    ];
    return (
      aiPickEmpathy(
        mood.mood === 'neutral' ? AI_EMPATHY.neutral.prefixes : AI_EMPATHY[mood.mood].prefixes
      ) + cortas[Math.floor(Math.random() * cortas.length)]
    );
  }

  // Respuesta más completa para textos largos que no matchean
  var generales = [
    'Mmm, no estoy seguro de haber entendido bien. Te cuento lo que sí puedo responder:\n\n📊 **Tu mes:** cuánto ganaste, cuántas horas, proyección al cierre\n📈 **Comparativas:** vs mes pasado, vs semana pasada\n🔮 **Simulaciones:** "¿cuánto si trabajo 4h más?"\n📅 **Festivos:** próximos, cuántos caen este mes\n🧘 **Bienestar:** cómo está tu ritmo, si necesitás descanso\n📧 **Reportes:** "enviá mi reporte por correo"\n\n💡 Probá con cualquiera de esas, ¡o preguntame con tus palabras!',
    'Perdón, no capté bien la pregunta. Pero no te vayás — puedo ayudarte con:\n\n• Tu salario del mes y proyección\n• Comparativas con meses o semanas anteriores\n• Simulaciones de horas extra\n• Próximos festivos\n• Consejos de descanso\n• Envío de reportes por email\n\n¿Por dónde le damos?',
    'Uy, me perdí un poco. ¿Me lo preguntás de otra manera? Mientras tanto, te tiro ideas de lo que sé hacer:\n\n💰 Calcular tus ingresos con recargos\n📊 Comparar semanas y meses\n🎯 Proyectar al cierre del mes\n📅 Ver próximos festivos\n📧 Enviar reportes\n\n¿Cuál te sirve?'
  ];

  var prefix = '';
  if (mood.mood !== 'neutral') {
    prefix = aiPickEmpathy(AI_EMPATHY[mood.mood].prefixes);
  }

  return prefix + generales[Math.floor(Math.random() * generales.length)];
}

// ─── SEGUIMIENTO CONVERSACIONAL ──────────────────────────────
// Sugiere una pregunta de seguimiento según el último intent
function aiSuggestFollowUp(lastIntent, userContext) {
  var followUps = {
    total_ganado: [
      '¿Querés ver la comparativa con el mes pasado?',
      '¿Te muestro la proyección al cierre?',
      '¿Vemos cómo vas vs tu meta?'
    ],
    hoy: [
      '¿Y ayer cómo te fue?',
      '¿Querés comparar con tu mejor día?',
      '¿Vemos la proyección al cierre del mes?'
    ],
    comparativa_mes: [
      '¿Querés ver también la comparativa semanal?',
      '¿Te muestro tu mejor día del mes?',
      '¿Calculamos cuánto te falta para la meta?'
    ],
    bienestar: [
      '¿Querés ver cuándo fue tu último día libre?',
      '¿Te muestro tu racha actual?',
      '¿Revisamos tus horas semanales?'
    ],
    proyeccion: [
      '¿Querés simular cuánto ganarías con horas extra?',
      '¿Vemos tu distribución de recargos?',
      '¿Te muestro cuánto te falta para la meta?'
    ],
    default: [
      '¿Necesitás algo más?',
      '¿Querés que profundice en algo?',
      '¿Te ayudo con otra cosa?',
      '¿Alguna otra duda?'
    ]
  };

  var opts = followUps[lastIntent] || followUps['default'];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── API PÚBLICA ─────────────────────────────────────────────
// Funciones expuestas como globales (window.*) para que ai.js las use

// Clasificar intención de un mensaje
function aiClassifyIntent(text, convState, userContext) {
  return aiClassify(text, convState || _aiConv, userContext || {});
}

// Obtener/actualizar estado conversacional
function aiGetConversation() {
  return _aiConv;
}

function aiUpdateConversation(intent, topic) {
  _aiConv.lastIntent = intent;
  _aiConv.lastTopic = topic;
  _aiConv.turnCount++;
}

// Detectar tono emocional
function aiAnalyzeMood(text, userContext) {
  return aiDetectMood(text, userContext);
}

// Obtener prefijo/sufijo empático
function aiEmpatheticPrefix(mood) {
  var m = mood || 'neutral';
  var entry = AI_EMPATHY[m] || AI_EMPATHY['neutral'];
  return aiPickEmpathy(entry.prefixes);
}

function aiEmpatheticSuffix(mood) {
  var m = mood || 'neutral';
  var entry = AI_EMPATHY[m] || AI_EMPATHY['neutral'];
  return aiPickEmpathy(entry.suffixes);
}

// Respuesta conversacional de fallback
function aiFallbackResponse(text, userContext) {
  return aiConversationalFallback(text, userContext);
}

// Sugerir seguimiento
function aiFollowUp(lastIntent, userContext) {
  return aiSuggestFollowUp(lastIntent, userContext);
}

// Tokenizar (útil para debug)
function aiDebugTokens(text) {
  return aiTokenize(text);
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] ai-nlp.js cargado — NLP mejorado v76');
