// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/voice-agent.js
//  Agente de voz completo — entiende contexto y ejecuta acciones.
//  +30 comandos de voz para controlar toda la app sin manos.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── CATÁLOGO DE COMANDOS ─────────────────────────────────────
// Cada comando tiene: patterns (array de frases), action (tipo),
// y handler (función que ejecuta la acción).

var VOICE_COMMANDS = [
  // ═══ NAVEGACIÓN ═══
  {
    id: 'nav_home',
    patterns: ['ir a inicio', 'ir al inicio', 'inicio', 'home', 'pantalla principal', 'volver al inicio'],
    action: 'navigate',
    tab: 'home'
  },
  {
    id: 'nav_dashboard',
    patterns: ['ir a análisis', 'ir a analisis', 'análisis', 'analisis', 'dashboard', 'estadísticas', 'estadisticas', 'ver análisis', 'ver analisis', 'mis números', 'mis numeros'],
    action: 'navigate',
    tab: 'dashboard'
  },
  {
    id: 'nav_ai',
    patterns: ['ir a asistente', 'asistente', 'chat', 'ia', 'inteligencia artificial', 'hablar con ia', 'abrir chat'],
    action: 'navigate',
    tab: 'ai'
  },
  {
    id: 'nav_history',
    patterns: ['ir a historial', 'historial', 'historia', 'turnos anteriores', 'ver historial', 'mis turnos'],
    action: 'navigate',
    tab: 'history'
  },
  {
    id: 'nav_config',
    patterns: ['ir a ajustes', 'ajustes', 'configuración', 'configuracion', 'settings', 'opciones', 'configurar'],
    action: 'navigate',
    tab: 'config'
  },

  // ═══ TURNOS ═══
  {
    id: 'start_turno',
    patterns: ['iniciar turno', 'empezar turno', 'comenzar turno', 'arrancar turno', 'marcar entrada', 'fichar entrada', 'empezar a trabajar', 'iniciar jornada', 'abrir turno', 'nuevo turno'],
    action: 'startTurno'
  },
  {
    id: 'stop_turno',
    patterns: ['finalizar turno', 'terminar turno', 'cerrar turno', 'marcar salida', 'fichar salida', 'acabar turno', 'salir del trabajo', 'terminar jornada', 'cerrar jornada'],
    action: 'stopTurno'
  },

  // ═══ CONSULTAS RÁPIDAS ═══
  {
    id: 'ask_month',
    patterns: ['cuánto gané este mes', 'cuanto gane este mes', 'total del mes', 'mis ganancias del mes', 'ingresos del mes', 'cuánto llevo este mes', 'cuanto llevo este mes'],
    action: 'ask',
    query: '¿Cuánto gané este mes?'
  },
  {
    id: 'ask_today',
    patterns: ['cuánto gané hoy', 'cuanto gane hoy', 'hoy cuánto gané', 'hoy cuanto gane', 'resumen de hoy', 'cómo me fue hoy', 'como me fue hoy'],
    action: 'ask',
    query: '¿Cuánto gané hoy?'
  },
  {
    id: 'ask_yesterday',
    patterns: ['cuánto gané ayer', 'cuanto gane ayer', 'ayer cuánto gané', 'ayer cuanto gane', 'cómo me fue ayer', 'como me fue ayer', 'y ayer'],
    action: 'ask',
    query: '¿Cuánto gané ayer?'
  },
  {
    id: 'ask_projection',
    patterns: ['proyección', 'proyeccion', 'cuánto voy a ganar', 'cuanto voy a ganar', 'proyección al cierre', 'proyeccion al cierre', 'cuánto al final del mes', 'cuanto al final del mes', 'estimado del mes'],
    action: 'ask',
    query: 'Proyección al cierre'
  },
  {
    id: 'ask_hours',
    patterns: ['cuántas horas llevo', 'cuantas horas llevo', 'cuántas horas trabajé', 'cuantas horas trabaje', 'horas trabajadas', 'horas totales', 'tiempo trabajado'],
    action: 'ask',
    query: '¿Cuántas horas llevo?'
  },
  {
    id: 'ask_week',
    patterns: ['cómo voy esta semana', 'como voy esta semana', 'resumen de la semana', 'esta semana', 'cuánto esta semana', 'cuanto esta semana'],
    action: 'ask',
    query: '/semana'
  },
  {
    id: 'ask_stats',
    patterns: ['resumen rápido', 'resumen rapido', 'stats', 'estadísticas', 'estadisticas', 'dame los números', 'dame los numeros', 'cómo voy', 'como voy', 'balance'],
    action: 'ask',
    query: '/stats'
  },

  // ═══ COMPARATIVAS ═══
  {
    id: 'compare_month',
    patterns: ['comparar con mes pasado', 'vs mes pasado', 'versus mes pasado', 'contra mes pasado', 'mes anterior', 'cómo voy vs mes pasado', 'como voy vs mes pasado', 'diferencia con mes pasado'],
    action: 'ask',
    query: '¿VS mes pasado?'
  },
  {
    id: 'compare_week',
    patterns: ['comparar con semana pasada', 'vs semana pasada', 'versus semana pasada', 'semana anterior', 'cómo voy vs semana pasada', 'como voy vs semana pasada'],
    action: 'ask',
    query: '¿VS semana pasada?'
  },
  {
    id: 'trend',
    patterns: ['tendencia', 'evolución', 'evolucion', 'histórico', 'historico', 'últimos meses', 'ultimos meses', 'cómo he mejorado', 'como he mejorado', 'progreso'],
    action: 'ask',
    query: '/tendencia'
  },

  // ═══ SIMULACIONES ═══
  {
    id: 'simulate_extra',
    patterns: ['simular horas extra', 'cuánto si trabajo más', 'cuanto si trabajo mas', 'y si hago más horas', 'y si hago mas horas', 'simular extra'],
    action: 'ask',
    query: '¿Cuánto si trabajo 4h más?'
  },
  {
    id: 'simulate_night',
    patterns: ['simular nocturnas', 'cuánto si hago nocturnas', 'cuanto si hago nocturnas', 'solo turnos de noche', 'simular noche'],
    action: 'ask',
    query: '¿Cuánto ganaría si solo hago nocturnas?'
  },
  {
    id: 'goal',
    patterns: ['cuánto falta para', 'cuanto falta para', 'meta de', 'para llegar a', 'cuánto necesito para', 'cuanto necesito para', 'cuánto debo trabajar para', 'cuanto debo trabajar para'],
    action: 'ask',
    query: null // se procesa abajo con el número
  },

  // ═══ ACCIONES ═══
  {
    id: 'export_pdf',
    patterns: ['exportar pdf', 'descargar pdf', 'bajar pdf', 'generar pdf', 'crear pdf', 'exportar reporte pdf', 'informe pdf', 'guardar como pdf'],
    action: 'function',
    fn: function (ctx) {
      if (!ctx || !ctx.turnos || !ctx.turnos.length) return { type: 'error', msg: 'No hay turnos para exportar. Registrá algunos primero.' };
      if (!window.jspdf) return { type: 'error', msg: 'Librería PDF no disponible. Recargá la app.' };
      try {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF();
        var ahora = new Date();
        var mes = ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        var calc = ctx.calc || { totalCOP: 0, totalMins: 0, bd: {} };
        var sal = ctx.salario || 0;

        doc.setFontSize(18);
        doc.text('Mi Turno · Reporte', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Periodo: ' + mes, 14, 27);
        doc.text('Generado: ' + ahora.toLocaleString('es-CO'), 14, 32);
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('Resumen del mes', 14, 44);
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text('Total: ' + (typeof fCOP === 'function' ? fCOP(calc.totalCOP) : '$' + calc.totalCOP), 14, 52);
        doc.text('Horas: ' + (typeof fDur === 'function' ? fDur(calc.totalMins) : (calc.totalMins / 60).toFixed(1) + 'h'), 14, 58);
        if (sal > 0) {
          doc.text('Salario: ' + (typeof fCOP === 'function' ? fCOP(sal) : '$' + sal) + ' · Avance: ' + ((calc.totalCOP / sal) * 100).toFixed(1) + '%', 14, 64);
        }

        var bd = calc.bd || {};
        var rows = [];
        var keys = Object.keys(bd);
        for (var k = 0; k < keys.length; k++) {
          if (bd[keys[k]].mins > 0) {
            var rc = (typeof RC !== 'undefined' && RC[keys[k]]) ? RC[keys[k]] : { label: keys[k], factor: 1 };
            rows.push([rc.label, typeof fDur === 'function' ? fDur(bd[keys[k]].mins) : '', 'x' + rc.factor.toFixed(2), typeof fCOP === 'function' ? fCOP(bd[keys[k]].cop) : '']);
          }
        }
        if (rows.length > 0 && typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: 72,
            head: [['Tipo', 'Horas', 'Factor', 'Pago']],
            body: rows,
            headStyles: { fillColor: [91, 134, 229], textColor: [255, 255, 255], fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            theme: 'striped'
          });
        }

        var filename = 'mi-turno-' + ahora.toISOString().slice(0, 10) + '.pdf';
        doc.save(filename);
        return { type: 'success', msg: '📄 PDF descargado: ' + filename };
      } catch (e) {
        return { type: 'error', msg: 'Error al generar PDF. Probá desde Historial > Exportar.' };
      }
    }
  },
  {
    id: 'export_excel',
    patterns: ['exportar excel', 'descargar excel', 'bajar excel', 'generar excel', 'crear excel', 'exportar reporte excel', 'informe excel', 'guardar como excel', 'hoja de cálculo', 'hoja de calculo'],
    action: 'function',
    fn: function (ctx) {
      if (!ctx || !ctx.turnos || !ctx.turnos.length) return { type: 'error', msg: 'No hay turnos para exportar. Registrá algunos primero.' };
      if (!window.XLSX) return { type: 'error', msg: 'Librería Excel no disponible. Recargá la app.' };
      try {
        var turnos = ctx.turnos || [];
        var ahora = new Date();
        var wb = window.XLSX.utils.book_new();
        var detalle = [];
        for (var i = 0; i < turnos.length; i++) {
          var t = turnos[i];
          var ini = new Date(t.inicio), fin = new Date(t.fin);
          detalle.push({
            Fecha: ini.toLocaleDateString('es-CO'),
            Entrada: ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            Salida: fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            Duracion: typeof fDur === 'function' ? fDur(Math.round((fin - ini) / 60000)) : '',
            Horas: Number(((fin - ini) / 3600000).toFixed(2))
          });
        }
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(detalle), 'Turnos');
        var filename = 'mi-turno-' + ahora.toISOString().slice(0, 10) + '.xlsx';
        window.XLSX.writeFile(wb, filename);
        return { type: 'success', msg: '📊 Excel descargado: ' + filename };
      } catch (e) {
        return { type: 'error', msg: 'Error al generar Excel. Probá desde Historial > Exportar.' };
      }
    }
  },
  {
    id: 'send_email',
    patterns: ['enviar por correo', 'mandar por correo', 'enviar reporte', 'mandar reporte', 'enviar email', 'enviar mail', 'correo electrónico', 'correo electronico', 'enviar a mi jefe'],
    action: 'ask',
    query: 'Envía mi reporte por correo'
  },

  // ═══ CONFIGURACIÓN ═══
  {
    id: 'dark_mode',
    patterns: ['modo oscuro', 'activar modo oscuro', 'poner oscuro', 'tema oscuro', 'dark mode', 'fondo negro', 'cambiar a oscuro', 'noche'],
    action: 'function',
    fn: function () {
      try {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (typeof grabar === 'function') grabar('mt_theme', 'dark');
        return { type: 'success', msg: '🌙 Modo oscuro activado' };
      } catch (_) {
        return { type: 'error', msg: 'No se pudo cambiar el tema' };
      }
    }
  },
  {
    id: 'light_mode',
    patterns: ['modo claro', 'activar modo claro', 'poner claro', 'tema claro', 'light mode', 'fondo blanco', 'cambiar a claro', 'día', 'dia'],
    action: 'function',
    fn: function () {
      try {
        document.documentElement.setAttribute('data-theme', 'light');
        if (typeof grabar === 'function') grabar('mt_theme', 'light');
        return { type: 'success', msg: '☀️ Modo claro activado' };
      } catch (_) {
        return { type: 'error', msg: 'No se pudo cambiar el tema' };
      }
    }
  },
  {
    id: 'toggle_theme',
    patterns: ['cambiar tema', 'alternar tema', 'invertir tema', 'cambiar modo'],
    action: 'function',
    fn: function () {
      try {
        var cur = document.documentElement.getAttribute('data-theme');
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        if (typeof grabar === 'function') grabar('mt_theme', next);
        return { type: 'success', msg: (next === 'dark' ? '🌙' : '☀️') + ' Tema cambiado a ' + (next === 'dark' ? 'oscuro' : 'claro') };
      } catch (_) {
        return { type: 'error', msg: 'No se pudo cambiar el tema' };
      }
    }
  },

  // ═══ MODO MANOS LIBRES ═══
  {
    id: 'hands_free_on',
    patterns: ['activar manos libres', 'modo manos libres', 'conversación por voz', 'conversacion por voz', 'hablar sin tocar', 'empezar a escuchar', 'escuchar siempre'],
    action: 'local',
    handler: function (ctx) {
      if (ctx.setAutoRead) ctx.setAutoRead(true);
      if (ctx.setHandsFree) ctx.setHandsFree(true);
      return '🔊 Modo manos libres activado. Te escucho. Decí "ayuda de voz" para ver todo lo que podés hacer.';
    }
  },
  {
    id: 'hands_free_off',
    patterns: ['desactivar manos libres', 'silencio', 'dejar de escuchar', 'modo normal', 'salir de manos libres', 'apagar micrófono', 'apagar microfono'],
    action: 'local',
    handler: function (ctx) {
      if (ctx.setHandsFree) ctx.setHandsFree(false);
      if (ctx.setAutoRead) ctx.setAutoRead(false);
      return '🔇 Modo manos libres desactivado.';
    }
  },
  {
    id: 'voice_help',
    patterns: ['ayuda de voz', 'qué puedo decir', 'que puedo decir', 'comandos de voz', 'qué sabes hacer con voz', 'que sabes hacer con voz', 'lista de comandos', 'ayuda por voz'],
    action: 'local',
    handler: function () {
      return '🎙 **Comandos de voz disponibles:**\n\n' +
        '🗣 **Navegar:** "ir a inicio", "ir a análisis", "ir a ajustes"\n' +
        '⏱ **Turnos:** "iniciar turno", "finalizar turno"\n' +
        '💰 **Consultar:** "cuánto gané hoy", "cuánto gané ayer", "cuánto gané este mes"\n' +
        '📊 **Comparar:** "vs mes pasado", "vs semana pasada", "tendencia"\n' +
        '🔮 **Simular:** "simular horas extra", "cuánto falta para 2 millones"\n' +
        '📧 **Exportar:** "exportar pdf", "enviar por correo"\n' +
        '🌙 **Tema:** "modo oscuro", "modo claro"\n' +
        '🎙 **Control:** "activar manos libres", "silencio", "ayuda de voz"\n\n' +
        '💡 También podés preguntar cualquier cosa en lenguaje natural.';
    }
  },
  {
    id: 'read_aloud',
    patterns: ['léeme', 'leeme', 'leer en voz alta', 'decime', 'dime', 'contame', 'cuentame', 'cuéntame'],
    action: 'ask',
    query: null // passthrough: envía el texto completo a la IA
  },

  // ═══ LOGROS ═══
  {
    id: 'achievements',
    patterns: ['mis logros', 'ver logros', 'insignias', 'qué logros tengo', 'que logros tengo', 'mis medallas'],
    action: 'ask',
    query: '/logros'
  },

  // ═══ SALUD ═══
  {
    id: 'health_check',
    patterns: ['cómo estoy de salud', 'como estoy de salud', 'estoy cansado', 'estoy agotado', 'ritmo de trabajo', 'cómo está mi salud', 'como esta mi salud', 'burnout', 'fatiga'],
    action: 'ask',
    query: '/salud'
  },

  // ═══ INFO APP ═══
  {
    id: 'app_version',
    patterns: ['qué versión es esta', 'que version es esta', 'versión de la app', 'version de la app', 'qué versión tengo', 'que version tengo'],
    action: 'local',
    handler: function () {
      return '📱 Mi Turno ' + (typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : '') + ' · Colombia, 100% offline.';
    }
  },
  {
    id: 'connection_status',
    patterns: ['estoy conectado', 'hay conexión', 'hay conexion', 'estado de conexión', 'estado de conexion', 'cómo está la conexión', 'como esta la conexion', 'internet'],
    action: 'ask',
    query: '¿Estoy conectado a Supabase?'
  }
];

// ─── MOTOR DE DETECCIÓN ───────────────────────────────────────

/**
 * Busca un comando de voz que coincida con el texto hablado.
 * @param {string} text - texto transcrito del micrófono
 * @returns {object|null} comando encontrado o null
 */
function voiceDetect(text) {
  if (!text) return null;
  var t = text.toLowerCase().trim();

  // Primero buscar coincidencias exactas o parciales en el catálogo
  for (var i = 0; i < VOICE_COMMANDS.length; i++) {
    var cmd = VOICE_COMMANDS[i];
    for (var j = 0; j < cmd.patterns.length; j++) {
      var pat = cmd.patterns[j];
      if (t.indexOf(pat) >= 0) {
        // Caso especial: comandos con número (meta)
        if (cmd.id === 'goal') {
          var num = _extractNumber(t);
          if (num && num > 0) {
            return {
              id: cmd.id,
              action: cmd.action,
              query: '/meta ' + num
            };
          }
          // Si no hay número, preguntar cuál es la meta
          return {
            id: cmd.id,
            action: 'local',
            handler: function () { return '¿De cuánto es tu meta? Decime un número, por ejemplo: "meta de 2 millones".'; }
          };
        }
        // Passthrough: enviar el texto completo
        if (cmd.action === 'ask' && cmd.query === null) {
          return { id: cmd.id, action: 'ask', query: text };
        }
        return {
          id: cmd.id,
          action: cmd.action,
          tab: cmd.tab,
          query: cmd.query,
          fn: cmd.fn,
          handler: cmd.handler
        };
      }
    }
  }
  return null;
}

/**
 * Ejecuta un comando de voz detectado.
 * @param {object} cmd - comando de voiceDetect
 * @param {object} ctx - contexto { setHandsFree, setAutoRead, props, etc. }
 * @returns {object} { type: 'navigate'|'ask'|'action'|'local'|'error', ... }
 */
function voiceExecute(cmd, ctx) {
  if (!cmd) return null;

  switch (cmd.action) {
    case 'navigate':
      if (ctx.onNavigate) ctx.onNavigate(cmd.tab, null);
      return { type: 'navigate', tab: cmd.tab };

    case 'startTurno':
      if (ctx.onStartTurno) ctx.onStartTurno();
      else if (ctx.onNavigate) ctx.onNavigate('home', 'start');
      return { type: 'navigate', tab: 'home', sub: 'start' };

    case 'stopTurno':
      if (ctx.onStopTurno) ctx.onStopTurno();
      else if (ctx.onNavigate) ctx.onNavigate('home', 'stop');
      return { type: 'navigate', tab: 'home', sub: 'stop' };

    case 'ask':
      return { type: 'ask', query: cmd.query };

    case 'function':
      try {
        var result = cmd.fn();
        return result;
      } catch (e) {
        return { type: 'error', msg: 'Error al ejecutar: ' + (e.message || 'desconocido') };
      }

    case 'local':
      try {
        var msg = typeof cmd.handler === 'function' ? cmd.handler(ctx) : cmd.handler;
        return { type: 'local', msg: msg };
      } catch (e) {
        return { type: 'error', msg: 'Error: ' + (e.message || 'desconocido') };
      }

    default:
      return null;
  }
}

// ─── HELPERS ──────────────────────────────────────────────────

function _extractNumber(text) {
  var cleaned = text.replace(/\./g, '').replace(/,/g, '');
  // Buscar patrones como "2 millones", "2000000", "2.5 millones"
  var millonMatch = cleaned.match(/(\d+\.?\d*)\s*millones?/);
  if (millonMatch) return parseFloat(millonMatch[1]) * 1000000;
  var milMatch = cleaned.match(/(\d+)\s*mil/);
  if (milMatch) return parseInt(milMatch[1], 10) * 1000;
  var numMatch = cleaned.match(/(\d{5,})/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return null;
}

// ─── EXPORT ──────────────────────────────────────────────────
window.VOICE_COMMANDS = VOICE_COMMANDS;
window.voiceDetect = voiceDetect;
window.voiceExecute = voiceExecute;

console.log('[MT] voice-agent.js cargado — ' + VOICE_COMMANDS.length + ' comandos de voz');
