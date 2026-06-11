// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-semantic.js
//  Motor de búsqueda semántica TF-IDF + Cosine Similarity.
//  Rescata preguntas que el keyword matching no encontró.
//  100% offline · 0 dependencias · ~10ms por consulta.
// ════════════════════════════════════════════════════════════════
/* global AI_APP_KB, AI_KNOWLEDGE, aiKnowledgeSearch, aiAppKBSearch */

function _semStem(w) {
  if (w.length <= 3) return w;
  if (w.slice(-2) === 'es') w = w.slice(0, -2);
  else if (w.slice(-1) === 's' && w.slice(-2, -1) !== 'e') w = w.slice(0, -1);
  if (w.slice(-1) === 'a' || w.slice(-1) === 'o') w = w.slice(0, -1);
  if (w.slice(-2) === 'ar' || w.slice(-2) === 'er' || w.slice(-2) === 'ir') w = w.slice(0, -2);
  if (w.slice(-4) === 'ando' || w.slice(-4) === 'iendo') w = w.slice(0, -4);
  if (w.slice(-3) === 'ado' || w.slice(-3) === 'ido') w = w.slice(0, -3);
  if (w.slice(-3) === 'ito' || w.slice(-3) === 'ita') w = w.slice(0, -3);
  if (w.slice(-5) === 'ísimo' || w.slice(-5) === 'ísima') w = w.slice(0, -5);
  return w;
}

function _semTokenize(text) {
  var t = (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡?!;:,.()[\]"'«»\u201c\u201d\u2018\u2019]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  var words = t.split(' ');
  var stop = {
    de: 1,
    la: 1,
    que: 1,
    el: 1,
    en: 1,
    los: 1,
    las: 1,
    del: 1,
    se: 1,
    un: 1,
    una: 1,
    lo: 1,
    por: 1,
    con: 1,
    no: 1,
    su: 1,
    para: 1,
    es: 1,
    al: 1,
    como: 1,
    mas: 1,
    pero: 1,
    sus: 1,
    le: 1,
    ya: 1,
    muy: 1,
    esto: 1,
    esta: 1,
    este: 1,
    entre: 1,
    cuando: 1,
    todo: 1,
    ser: 1,
    son: 1,
    hay: 1,
    esa: 1,
    ese: 1,
    eso: 1,
    tan: 1,
    te: 1,
    me: 1,
    mi: 1,
    tu: 1,
    si: 1,
    ha: 1,
    he: 1,
    va: 1,
    fue: 1,
    era: 1,
    cada: 1,
    otro: 1,
    otra: 1,
    otros: 1,
    otras: 1,
    poco: 1,
    mucho: 1,
    muchos: 1,
    donde: 1,
    cual: 1,
    tiene: 1,
    hacer: 1,
    puedo: 1,
    puede: 1,
    puedes: 1,
    entonces: 1,
    oiga: 1,
    venga: 1,
    mire: 1,
    listo: 1,
    hagale: 1,
    dale: 1,
    claro: 1,
    obvio: 1,
    eh: 1,
    ah: 1,
    uy: 1,
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
    ni: 1
  };
  var tokens = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (!w || w.length < 2) continue;
    if (stop[w]) continue;
    tokens.push(_semStem(w));
  }
  return tokens;
}

function _semBuildVocab(docs) {
  var vocab = {};
  var idx = 0;
  for (var i = 0; i < docs.length; i++) {
    var tokens = docs[i].tokens;
    for (var j = 0; j < tokens.length; j++) {
      var t = tokens[j];
      if (!(t in vocab)) {
        vocab[t] = idx;
        idx++;
      }
    }
  }
  return vocab;
}

function _semTF(tokens, vocab) {
  var tf = {};
  var total = tokens.length;
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    var idx = vocab[t];
    if (idx !== undefined) tf[idx] = (tf[idx] || 0) + 1;
  }
  var keys = Object.keys(tf);
  for (var k = 0; k < keys.length; k++) {
    tf[keys[k]] = tf[keys[k]] / total;
  }
  return tf;
}

function _semIDF(docs, vocab) {
  var N = docs.length;
  var idf = {};
  var vocabKeys = Object.keys(vocab);
  for (var i = 0; i < vocabKeys.length; i++) {
    var term = vocabKeys[i];
    var idx = vocab[term];
    var df = 0;
    for (var j = 0; j < docs.length; j++) {
      if (docs[j].tf[idx] !== undefined) df++;
    }
    idf[idx] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}

function _semTFIDF(tf, idf, vocabSize) {
  var vec = new Array(vocabSize);
  for (var i = 0; i < vocabSize; i++) vec[i] = 0;
  var keys = Object.keys(tf);
  for (var k = 0; k < keys.length; k++) {
    var idx = parseInt(keys[k], 10);
    vec[idx] = tf[idx] * (idf[idx] || 1);
  }
  return vec;
}

function _semCosine(a, b) {
  var dot = 0,
    magA = 0,
    magB = 0;
  for (var i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA === 0 || magB === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

var _semanticIndex = null;

function _semanticGetIndex() {
  if (_semanticIndex) return _semanticIndex;
  var docs = [];
  if (typeof AI_APP_KB !== 'undefined' && Array.isArray(AI_APP_KB)) {
    for (var i = 0; i < AI_APP_KB.length; i++) {
      var entry = AI_APP_KB[i];
      var allText = (entry.q || []).join(' ') + ' ' + (entry.a || '');
      docs.push({
        source: 'app',
        index: i,
        text: allText,
        tokens: _semTokenize(allText),
        answer: entry.a,
        questions: entry.q || []
      });
    }
  }
  if (typeof AI_KNOWLEDGE !== 'undefined' && AI_KNOWLEDGE) {
    var kbKeys = Object.keys(AI_KNOWLEDGE);
    for (var k = 0; k < kbKeys.length; k++) {
      var key = kbKeys[k];
      var answer = AI_KNOWLEDGE[key];
      var cleanText = answer
        .replace(/\*\*/g, '')
        .replace(/[#\-•]/g, ' ')
        .replace(/\n/g, ' ');
      docs.push({
        source: 'knowledge',
        key: key,
        text: cleanText,
        tokens: _semTokenize(cleanText),
        answer: answer,
        questions: [key]
      });
    }
  }
  if (docs.length === 0) return null;
  var vocab = _semBuildVocab(docs);
  var vocabSize = Object.keys(vocab).length;
  for (var d = 0; d < docs.length; d++) {
    docs[d].tf = _semTF(docs[d].tokens, vocab);
  }
  var idf = _semIDF(docs, vocab);
  for (var d2 = 0; d2 < docs.length; d2++) {
    docs[d2].idf = idf;
    docs[d2].vector = _semTFIDF(docs[d2].tf, idf, vocabSize);
  }
  _semanticIndex = { docs: docs, vocab: vocab, vocabSize: vocabSize, idf: idf };
  return _semanticIndex;
}

function aiSemanticSearch(query, threshold) {
  if (!query) return null;
  var th = threshold || 0.08;
  var index = _semanticGetIndex();
  if (!index || !index.docs || index.docs.length === 0) return null;
  var queryTokens = _semTokenize(query);
  if (queryTokens.length === 0) return null;
  var queryTF = {};
  for (var i = 0; i < queryTokens.length; i++) {
    var t = queryTokens[i];
    var idx = index.vocab[t];
    if (idx !== undefined) queryTF[idx] = (queryTF[idx] || 0) + 1;
  }
  var queryVec = _semTFIDF(queryTF, index.idf, index.vocabSize);
  var bestDoc = null;
  var bestScore = -1;
  for (var d = 0; d < index.docs.length; d++) {
    var doc = index.docs[d];
    var score = _semCosine(queryVec, doc.vector);
    if (doc.source === 'app' && doc.questions) {
      var qLower = query
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      for (var q = 0; q < doc.questions.length; q++) {
        if (qLower.indexOf(doc.questions[q]) >= 0) {
          score = Math.max(score, 0.65);
          break;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
    }
  }
  if (bestDoc && bestScore >= th)
    return { answer: bestDoc.answer, score: bestScore, source: bestDoc.source };
  return null;
}

function aiBestSearch(query) {
  if (!query) return null;
  if (typeof aiKnowledgeSearch === 'function') {
    var kw = aiKnowledgeSearch(query);
    if (kw) return kw;
  }
  if (typeof aiAppKBSearch === 'function') {
    var app = aiAppKBSearch(query);
    if (app) return app;
  }
  var sem = aiSemanticSearch(query);
  if (sem) return sem.answer;
  return null;
}

window.aiSemanticSearch = aiSemanticSearch;
window.aiBestSearch = aiBestSearch;
window._semanticGetIndex = _semanticGetIndex;

console.log('[MT] ai-semantic.js cargado — búsqueda semántica TF-IDF ✓');
