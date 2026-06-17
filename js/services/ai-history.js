// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-history.js
//  Historial de conversación del asistente + formato Markdown ligero.
//  Extraído de tabs/assistant.js en v48 (refactor por tamaño).
// ════════════════════════════════════════════════════════════════

// ── Historial de conversación, persistido por usuario ──────────
function _getAiKey(uid) {
  return 'mt_ai_his_' + (uid || 'guest');
}

function _aiLoadHistory(uid) {
  try {
    var s = localStorage.getItem(_getAiKey(uid));
    return s ? JSON.parse(s) : [];
  } catch (_) {
    return [];
  }
}

function _aiSaveHistory(uid, msgs) {
  if (!uid) return;
  try {
    // Solo las últimas 30 entradas; las acciones pendientes no se persisten.
    var trim = msgs.slice(-30).map(function (m) {
      if (m.action) return { role: m.role, content: m.content, _actionDone: true };
      return m;
    });
    localStorage.setItem(_getAiKey(uid), JSON.stringify(trim));
  } catch (_) {
    /* almacenamiento lleno o no disponible */
  }
}

function _aiClearHistory(uid) {
  try {
    localStorage.removeItem(_getAiKey(uid));
  } catch (e) {}
}

// ── Markdown ligero → HTML para las burbujas de la IA ──────────
// Formato inline (negrita, código, cursiva) — se usa en líneas y celdas.
function _aiInline(s) {
  return String(s)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code style="padding:1px 6px;border-radius:6px;background:var(--accent-dim);color:var(--accent);font-size:0.92em">$1</code>'
    )
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// ¿La línea es el separador de una tabla markdown?  |---|:--:|---|
function _aiEsSepTabla(line) {
  return /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(line) && line.indexOf('|') >= 0;
}

function _aiCeldas(line) {
  var s = line.trim();
  if (s.charAt(0) === '|') s = s.slice(1);
  if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
  return s.split('|').map(function (c) {
    return c.trim();
  });
}

function _aiTabla(header, filas) {
  var th = header
    .map(function (c) {
      return '<th scope="col">' + _aiInline(c) + '</th>';
    })
    .join('');
  var tb = filas
    .map(function (r) {
      var tds = r
        .map(function (c) {
          return '<td>' + _aiInline(c) + '</td>';
        })
        .join('');
      return '<tr>' + tds + '</tr>';
    })
    .join('');
  return (
    '<div class="asistente-tabla-wrap"><table class="asistente-tabla"><thead><tr>' +
    th +
    '</tr></thead><tbody>' +
    tb +
    '</tbody></table></div>'
  );
}

function _aiFormat(text) {
  var lines = String(text).split('\n');
  var html = '';
  var prevTipo = null;
  var i = 0;
  while (i < lines.length) {
    var line = lines[i];
    // Tabla: una fila con | seguida de una fila separadora.
    if (line.indexOf('|') >= 0 && i + 1 < lines.length && _aiEsSepTabla(lines[i + 1])) {
      var header = _aiCeldas(line);
      i += 2;
      var filas = [];
      while (i < lines.length && lines[i].indexOf('|') >= 0 && lines[i].trim() !== '') {
        filas.push(_aiCeldas(lines[i]));
        i++;
      }
      html += _aiTabla(header, filas);
      prevTipo = 'bloque';
      continue;
    }
    // Línea normal (incluye el separador horizontal ---).
    var esHr = /^---$/.test(line.trim());
    var contenido = esHr
      ? '<hr style="border:none;border-top:1px solid var(--border);margin:8px 0;opacity:0.5">'
      : _aiInline(line);
    if (html !== '' && prevTipo === 'linea') html += '<br>';
    html += contenido;
    prevTipo = esHr ? 'bloque' : 'linea';
    i++;
  }
  return html;
}

// ─── EXPORT ──────────────────────────────────────────────────
window._aiLoadHistory = _aiLoadHistory;
window._aiSaveHistory = _aiSaveHistory;
window._aiClearHistory = _aiClearHistory;
window._aiFormat = _aiFormat;
