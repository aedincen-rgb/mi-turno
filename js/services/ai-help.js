// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-help.js
//  Asistente de navegación — sabe guiar al usuario por cada rincón
//  de la app. Responde preguntas tipo "¿cómo hago para...?"
//  con instrucciones paso a paso.
//  100% offline · complementa al asistente de nómina (ai.js).
// ════════════════════════════════════════════════════════════════

// ─── BASE DE CONOCIMIENTO ──────────────────────────────────────
// Cada entrada: { id, title, keywords, steps, related }
// steps: array de strings con instrucciones numeradas
// keywords: array de frases que disparan esta guía
// related: IDs de guías relacionadas

var AI_HELP_GUIDES = [
  // ═══ TURNOS ═══
  {
    id: 'iniciar_turno',
    title: 'Iniciar un turno',
    keywords: ['iniciar turno','como inicio','empezar turno','comenzar turno','arrancar','empezar a trabajar','marcar entrada','fichar'],
    steps: [
      'Abrí la app — ya estás en la pestaña **Inicio**.',
      'Tocá el botón grande que dice **Iniciar**.',
      'Tu turno empieza a contar. El reloj corre en tiempo real.',
      'Podés ver tus ganancias estimadas mientras trabajás.',
      'Cuando termines, tocá **Finalizar** en el mismo botón.'
    ],
    related: ['finalizar_turno', 'configurar_salario']
  },
  {
    id: 'finalizar_turno',
    title: 'Finalizar un turno',
    keywords: ['finalizar turno','terminar turno','cerrar turno','acabar','salir del trabajo','marcar salida'],
    steps: [
      'En la pestaña **Inicio**, tocá el botón **Finalizar**.',
      'Si tu turno duró menos de 1 minuto, no se registra (evita toques accidentales).',
      'Tu turno se guarda automáticamente y aparece en **Historial**.',
      'Los recargos (nocturno, festivo, extra) se calculan solos.'
    ],
    related: ['iniciar_turno', 'ver_historial']
  },

  // ═══ SALARIO ═══
  {
    id: 'configurar_salario',
    title: 'Configurar tu salario',
    keywords: ['configurar salario','poner salario','cambiar salario','ajustar salario','cuanto gano','salario base','sueldo'],
    steps: [
      'Andá a la pestaña **Ajustes** (última de la barra inferior).',
      'Tocá donde dice **Salario base** — se abre un campo para editar.',
      'Ingresá tu salario mensual bruto (sin puntos ni comas, ej: 1750905).',
      'Tocá el botón ✓ para guardar.',
      'Listo. Todos los cálculos de la app usan este valor.'
    ],
    related: ['iniciar_turno', 'modo_quincena']
  },

  // ═══ HISTORIAL ═══
  {
    id: 'ver_historial',
    title: 'Ver tu historial de turnos',
    keywords: ['ver historial','mis turnos','turnos pasados','historial de turnos','lista de turnos','todos mis turnos'],
    steps: [
      'Tocá la pestaña **Historial** (ícono de reloj).',
      'Ahí ves todos tus turnos cerrados, ordenados del más reciente al más viejo.',
      'Cada turno muestra: fecha, hora de entrada/salida, duración e ingreso.',
      'Tocá cualquier turno para ver el detalle con recargos aplicados.'
    ],
    related: ['exportar_datos', 'enviar_reporte']
  },
  {
    id: 'exportar_datos',
    title: 'Exportar tus datos',
    keywords: ['exportar','descargar','pdf','excel','bajar datos','guardar informe','descargar turnos'],
    steps: [
      'Andá a la pestaña **Historial**.',
      'Tocá el botón **Exportar** (ícono de descarga).',
      'Elegí entre **PDF** o **Excel**.',
      'El archivo se descarga automáticamente en tu dispositivo.'
    ],
    related: ['enviar_reporte', 'respaldar_datos']
  },
  {
    id: 'enviar_reporte',
    title: 'Enviar reporte por correo',
    keywords: ['enviar correo','mandar reporte','email','correo electronico','enviar a jefe','enviar a empresa'],
    steps: [
      'Andá a la pestaña **Historial**.',
      'Tocá **Exportar** y elegí el formato (PDF o Excel).',
      'En la ventana que aparece, tocá **Enviar por correo**.',
      'Ingresá el correo de destino y tocá enviar.',
      'El reporte llega con tu nombre, turnos, recargos y totales.'
    ],
    related: ['exportar_datos']
  },
  {
    id: 'borrar_turno',
    title: 'Borrar un turno',
    keywords: ['borrar turno','eliminar turno','quitar turno','borrar historial'],
    steps: [
      'Andá a la pestaña **Historial**.',
      'Deslizá el turno hacia la izquierda o tocá el ícono de basurero.',
      'Confirmá que querés eliminarlo.',
      'El turno se borra de tu dispositivo y de la nube.'
    ],
    related: ['ver_historial']
  },

  // ═══ PERFIL ═══
  {
    id: 'cambiar_foto',
    title: 'Cambiar tu foto de perfil',
    keywords: ['cambiar foto','poner foto','foto perfil','imagen perfil','avatar','fotografia'],
    steps: [
      'Andá a la pestaña **Ajustes**.',
      'Tocá el círculo de la foto (o el ícono 📷).',
      'Seleccioná **Cambiar foto** para elegir una de tu galería.',
      'O tocá **Eliminar foto** para quitarla.',
      'La foto se guarda solo en tu dispositivo, no se sube a la nube.'
    ],
    related: ['cambiar_nombre']
  },
  {
    id: 'cambiar_nombre',
    title: 'Cambiar tu nombre en la app',
    keywords: ['cambiar nombre','poner nombre','editar nombre','apodo','alias','como me llamo'],
    steps: [
      'Andá a la pestaña **Ajustes**.',
      'Tocá tu nombre (al lado del lápiz ✎).',
      'Escribí el nombre o apodo que quieras.',
      'Tocá ✓ para guardar.'
    ],
    related: ['cambiar_foto']
  },

  // ═══ SEGURIDAD ═══
  {
    id: 'configurar_pin',
    title: 'Configurar tu PIN de acceso',
    keywords: ['configurar pin','poner pin','crear pin','codigo acceso','pin acceso','bloquear app'],
    steps: [
      'Andá a la pestaña **Ajustes**.',
      'Buscá la sección **Seguridad** y tocá **PIN de acceso**.',
      'Ingresá un PIN de 4 a 6 dígitos.',
      'Confirmalo una segunda vez.',
      'La próxima vez que entrés, podés usar el PIN en vez de la contraseña.'
    ],
    related: ['cambiar_password', 'recuperar_pin']
  },
  {
    id: 'cambiar_password',
    title: 'Cambiar tu contraseña',
    keywords: ['cambiar contraseña','cambiar password','nueva contraseña','olvide contraseña','resetear password'],
    steps: [
      'Andá a la pestaña **Ajustes**.',
      'Tocá **Gestionar cuenta**.',
      'Seleccioná **Cambiar contraseña**.',
      'Ingresá tu contraseña actual y la nueva.',
      'La nueva contraseña se sincroniza con la nube.'
    ],
    related: ['configurar_pin', 'cerrar_sesion']
  },
  {
    id: 'recuperar_pin',
    title: 'Recuperar tu PIN',
    keywords: ['recuperar pin','olvide pin','perdi pin','no recuerdo pin','pin olvidado'],
    steps: [
      'En la pantalla de acceso rápido, tocá **¿Olvidaste tu PIN?**.',
      'Seguí los pasos: confirmar identidad → esperar → código → nuevo PIN.',
      'El código de verificación nunca sale de tu dispositivo.',
      'Creá un PIN nuevo y confirmalo.'
    ],
    related: ['configurar_pin']
  },
  {
    id: 'cerrar_sesion',
    title: 'Cerrar sesión',
    keywords: ['cerrar sesion','salir','logout','desconectar','cambiar cuenta'],
    steps: [
      'Andá a la pestaña **Ajustes**.',
      'Bajá hasta el final y tocá **Cerrar sesión**.',
      'Tus datos locales se conservan (turnos, salario, preferencias).',
      'Volvés a la pantalla de inicio de sesión.'
    ],
    related: ['respaldar_datos']
  },

  // ═══ DATOS ═══
  {
    id: 'respaldar_datos',
    title: 'Respaldar tus datos',
    keywords: ['respaldar','backup','copia seguridad','guardar datos','no perder datos','salvar datos'],
    steps: [
      'Andá a la pestaña **Ajustes** > sección **Datos**.',
      'Tocá **📦 Respaldar datos**.',
      'Se descarga un archivo .json con todos tus turnos, salario y ajustes.',
      'Guardá ese archivo en un lugar seguro (Drive, correo, etc.).',
      'Si cambiás de celular, usá **📂 Restaurar datos** para recuperar todo.'
    ],
    related: ['restaurar_datos']
  },
  {
    id: 'restaurar_datos',
    title: 'Restaurar un respaldo',
    keywords: ['restaurar','recuperar datos','importar','cargar backup','recuperar backup'],
    steps: [
      'Andá a la pestaña **Ajustes** > sección **Datos**.',
      'Tocá **📂 Restaurar datos**.',
      'Seleccioná el archivo .json de tu respaldo.',
      'Confirmá la restauración — esto reemplazará tus datos actuales.',
      'La app se recarga con todos tus datos recuperados.'
    ],
    related: ['respaldar_datos']
  },

  // ═══ ANÁLISIS ═══
  {
    id: 'entender_dashboard',
    title: 'Entender la pestaña Análisis',
    keywords: ['analisis','dashboard','grafico','kpi','estadisticas','proyeccion','metricas','como voy'],
    steps: [
      'Tocá la pestaña **Análisis** (ícono de gráfico).',
      '**Proyección al cierre:** cuánto ganarías este mes a tu ritmo actual.',
      '**KPIs:** días trabajados, horas totales, promedio por turno, mejor día.',
      '**Gráfico de barras:** ingreso por cada día trabajado.',
      '**Gráfico circular:** distribución por tipo de recargo (diurno, nocturno, festivo, extra).',
      '**Tip:** consejo personalizado según tus datos.'
    ],
    related: ['configurar_salario', 'ver_historial']
  },
  {
    id: 'modo_quincena',
    title: 'Activar el modo quincena',
    keywords: ['quincena','pago quincenal','cada 15 dias','q1','q2','periodo pago'],
    steps: [
      'Andá a la pestaña **Ajustes**.',
      'Activá el switch **Calcular por quincena**.',
      'Configurá los días de inicio de cada quincena (ej: Q1 día 1, Q2 día 16).',
      'En el Dashboard verás tus ingresos separados por Q1 y Q2.',
      'Ideal si te pagan cada 15 días en vez de una vez al mes.'
    ],
    related: ['configurar_salario', 'entender_dashboard']
  },

  // ═══ ASISTENTE ═══
  {
    id: 'usar_asistente',
    title: 'Usar el asistente IA',
    keywords: ['usar asistente','como pregunto','chat','ia','inteligencia artificial','consultar'],
    steps: [
      'Tocá la pestaña **Asistente** (ícono ✦).',
      'Escribí tu pregunta en lenguaje natural. Ejemplos:',
      '• "¿Cuánto gané este mes?"',
      '• "¿Cómo voy vs el mes pasado?"',
      '• "¿Cuándo es el próximo festivo?"',
      '• "Enviá mi reporte por correo"',
      'También podés tocar las categorías precargadas abajo.'
    ],
    related: ['iniciar_turno', 'entender_dashboard']
  },

  // ═══ APARIENCIA ═══
  {
    id: 'modo_oscuro',
    title: 'Activar el modo oscuro',
    keywords: ['modo oscuro','dark mode','tema oscuro','noche','cambiar tema','fondo negro'],
    steps: [
      'Tocá el ícono de luna 🌙 en la esquina superior derecha.',
      'La app cambia a modo oscuro al instante.',
      'Tocá el sol ☀️ para volver a modo claro.',
      'Tu preferencia se guarda automáticamente.'
    ],
    related: []
  },

  // ═══ ACCESIBILIDAD ═══
  {
    id: 'accesibilidad',
    title: 'Usar la app con lector de pantalla',
    keywords: ['accesibilidad','lector pantalla','voiceover','talkback','ciego','discapacidad visual','accesible'],
    steps: [
      'Mi Turno es compatible con VoiceOver (iOS) y TalkBack (Android).',
      'Cada botón, pestaña y tarjeta tiene una etiqueta que el lector lee en voz alta.',
      'Los modales se anuncian como ventanas emergentes.',
      'El chat del asistente se lee automáticamente cuando hay respuesta.',
      'Podés navegar por regiones: Inicio, Análisis, Asistente, Historial, Ajustes.',
      'La app pasa auditoría WCAG 2.1 AA con 0 violaciones.'
    ],
    related: ['usar_asistente']
  }
];

// ─── MOTOR DE BÚSQUEDA ────────────────────────────────────────
// Busca la guía más relevante según la pregunta del usuario.
// Usa puntaje por coincidencia de keywords.

function aiHelpSearch(question) {
  var q = (question || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡?!,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!q) return null;

  var best = null;
  var bestScore = 0;

  for (var i = 0; i < AI_HELP_GUIDES.length; i++) {
    var guide = AI_HELP_GUIDES[i];
    var score = 0;

    for (var j = 0; j < guide.keywords.length; j++) {
      var kw = guide.keywords[j].toLowerCase();
      if (q.indexOf(kw) >= 0) {
        score += kw.length; // keywords más largas pesan más
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = guide;
    }
  }

  return bestScore > 0 ? best : null;
}

// ─── FORMATEAR RESPUESTA ──────────────────────────────────────
// Convierte una guía en texto formateado con pasos numerados
// y guías relacionadas.

function aiHelpFormat(guide) {
  if (!guide) return null;

  var resp = '📖 **' + guide.title + '**\n\n';
  for (var i = 0; i < guide.steps.length; i++) {
    resp += (i + 1) + '. ' + guide.steps[i] + '\n';
  }

  if (guide.related && guide.related.length > 0) {
    resp += '\n🔗 **Relacionado:**\n';
    for (var r = 0; r < guide.related.length; r++) {
      var rel = aiHelpGetById(guide.related[r]);
      if (rel) {
        resp += '• ' + rel.title + '\n';
      }
    }
  }

  return resp;
}

// ─── BUSCAR POR ID ────────────────────────────────────────────
function aiHelpGetById(id) {
  for (var i = 0; i < AI_HELP_GUIDES.length; i++) {
    if (AI_HELP_GUIDES[i].id === id) return AI_HELP_GUIDES[i];
  }
  return null;
}

// ─── LISTAR TODAS LAS GUÍAS ───────────────────────────────────
function aiHelpListAll() {
  var resp = '📚 **Guías disponibles**\n\n';
  var cats = {
    'Turnos': ['iniciar_turno','finalizar_turno'],
    'Salario': ['configurar_salario','modo_quincena'],
    'Historial': ['ver_historial','exportar_datos','enviar_reporte','borrar_turno'],
    'Perfil': ['cambiar_foto','cambiar_nombre'],
    'Seguridad': ['configurar_pin','cambiar_password','recuperar_pin','cerrar_sesion'],
    'Datos': ['respaldar_datos','restaurar_datos'],
    'Análisis': ['entender_dashboard'],
    'Asistente': ['usar_asistente'],
    'Apariencia': ['modo_oscuro'],
    'Accesibilidad': ['accesibilidad']
  };

  for (var cat in cats) {
    if (cats.hasOwnProperty(cat)) {
      resp += '**' + cat + ':**\n';
      for (var i = 0; i < cats[cat].length; i++) {
        var g = aiHelpGetById(cats[cat][i]);
        if (g) resp += '  • ' + g.title + '\n';
      }
      resp += '\n';
    }
  }

  return resp;
}

// ─── API PÚBLICA ──────────────────────────────────────────────
function aiHelpAnswer(question) {
  var guide = aiHelpSearch(question);
  if (guide) return aiHelpFormat(guide);

  // Si no encuentra, sugiere preguntar de otra forma
  return '🤔 No encontré una guía específica para eso. Probá preguntando con otras palabras, o decime **"¿qué sabés hacer?"** para ver todas las guías disponibles.';
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] ai-help.js cargado — ' + AI_HELP_GUIDES.length + ' guías');
