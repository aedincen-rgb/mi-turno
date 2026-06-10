// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-app-kb.js
//  Base de conocimiento experta sobre la propia aplicación.
//  La IA conoce cada rincón de Mi Turno: qué es, cómo funciona,
//  dónde están las cosas, cómo se configuran y por qué.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

var AI_APP_KB = [
  // ═══ QUÉ ES MI TURNO ═══
  {
    q: [
      'que es mi turno',
      'de que trata la app',
      'para que sirve esta app',
      'que hace esta aplicacion'
    ],
    a: '**Mi Turno** es una app colombiana 100% offline para trabajadores por turnos. Calcula tu nómina con todos los recargos legales (nocturno, festivo, horas extra), proyecta tus ingresos y te da análisis detallados de tu rendimiento. No necesita internet para funcionar.'
  },
  {
    q: ['como funciona', 'como opera', 'que hace', 'cual es la magia'],
    a: 'Mi Turno funciona así:\n\n1. **Iniciás tu turno** en la pestaña Inicio\n2. **Trabajás** — la app cuenta el tiempo en vivo\n3. **Finalizás** cuando terminás\n4. La app **calcula automáticamente** tus ingresos aplicando todos los recargos de ley colombiana\n5. Ves tus **estadísticas** en la pestaña Análisis\n6. **Preguntás** lo que quieras en la pestaña Asistente\n\nTodo 100% local, sin enviar tus datos a ningún lado.'
  },
  {
    q: ['es gratis', 'cuesta algo', 'tiene costo', 'hay que pagar'],
    a: '**Sí, es completamente gratis.** No tiene costo de descarga, no tiene suscripciones, no tiene publicidad. Es software libre para la comunidad trabajadora colombiana.'
  },
  {
    q: ['quien la hizo', 'quien creo esto', 'desarrollador', 'autor'],
    a: 'Mi Turno fue creado por un desarrollador colombiano independiente. La app es mantenida activamente con mejoras cada semana basadas en el feedback de la comunidad.'
  },

  // ═══ LAS 5 PESTAÑAS ═══
  {
    q: ['que pestañas tiene', 'cuales son las pestañas', 'que secciones hay', 'navegacion'],
    a: 'La app tiene **5 pestañas** en la barra inferior:\n\n1. 🏠 **Inicio** — iniciar/finalizar turno, ver ganancias en vivo\n2. 📊 **Análisis** — proyección, KPIs, gráficos y desgloses\n3. ✦ **Asistente** — IA que responde tus preguntas\n4. 🕐 **Historial** — todos tus turnos pasados\n5. ⚙️ **Ajustes** — configurar salario, PIN, perfil y más'
  },
  {
    q: ['que hay en inicio', 'pestaña principal', 'home', 'pantalla principal'],
    a: 'En la pestaña **Inicio** encontrás:\n\n• El botón grande para **iniciar** y **finalizar** turnos\n• Tu **ganancia en vivo** mientras trabajás\n• Indicador de **tipo de hora** (diurna/nocturna/festivo)\n• **Resumen del mes** actualizado al instante\n• **Atajos** a funciones frecuentes\n\nEs tu centro de operaciones diario.'
  },
  {
    q: ['que hay en análisis', 'pestaña analisis', 'dashboard', 'estadisticas'],
    a: 'En la pestaña **Análisis** tenés:\n\n• **Proyección al cierre** del mes — cuánto ganarías a tu ritmo actual\n• **KPIs**: días trabajados, horas totales, promedio por turno, mejor día\n• **Gráfico de barras** de ingreso diario\n• **Gráfico circular** de distribución por tipo de recargo\n• **Anillo de progreso** — % de tu salario base alcanzado\n• **Línea acumulada** — tu ingreso día a día vs proyección\n• **Resumen financiero** completo\n• **Botón de compartir por WhatsApp** para mandar tus números al instante'
  },
  {
    q: ['que hay en asistente', 'pestaña ia', 'chat', 'como hablo con la ia'],
    a: 'En la pestaña **Asistente** ✦ podés:\n\n• **Escribir** tus preguntas en español natural\n• **Tocar** las 7 categorías precargadas con preguntas frecuentes\n• **Hablar** manteniendo pulsado el botón del micrófono\n• Recibir **respuestas habladas** con el modo manos libres\n• Activar **Gemini** (requiere internet) para preguntas complejas\n\nLa IA conoce tus turnos, recargos, proyecciones y leyes laborales.'
  },
  {
    q: ['que hay en historial', 'mis turnos', 'registro', 'turnos pasados'],
    a: 'En la pestaña **Historial** tenés:\n\n• **Lista completa** de todos tus turnos, del más reciente al más viejo\n• **Detalle** de cada turno: fecha, hora de entrada/salida, duración y pago\n• **Desglose de recargos** aplicados a cada turno\n• **Exportar** tus datos como **PDF** o **Excel**\n• **Enviar reporte por correo** para mandárselo a tu jefe o empresa\n• **Borrar** turnos individuales (deslizando a la izquierda)'
  },
  {
    q: ['que hay en ajustes', 'configuracion', 'settings', 'como configuro'],
    a: 'En la pestaña **Ajustes** ⚙️ encontrás:\n\n• **Perfil**: foto, nombre, email, género y estado de conexión\n• **Salario base**: tu sueldo mensual bruto\n• **Preferencias de pago**: modo quincena, auxilio de transporte, prestaciones\n• **Seguridad**: PIN de acceso, gestionar cuenta (cambiar email/contraseña)\n• **Datos**: respaldar y restaurar todos tus datos\n• **Apariencia**: modo oscuro (ícono de luna en la esquina superior)\n\nTambién ves la versión actual de la app al final.'
  },

  // ═══ FUNCIONAMIENTO INTERNO ═══
  {
    q: [
      'como calcula los recargos',
      'formula de calculo',
      'como se hace el calculo',
      'metodo de calculo'
    ],
    a: 'La app calcula los recargos según el **Código Sustantivo del Trabajo** colombiano:\n\n1. **Valor hora base** = salario mensual ÷ 240 horas\n2. Cada minuto de tu turno se clasifica en 8 categorías según:\n   - Hora del día (6AM-9PM = diurno, 9PM-6AM = nocturno)\n   - Tipo de día (hábil, domingo, festivo)\n   - Si supera el límite ordinario (8h/día o jornada semanal)\n3. Se aplica el **recargo** correspondiente:\n   - Nocturno: +35% | Festivo: +75% | Extra diurno: +25%\n   - Extra nocturno: +75% | Extra festivo diurno: +100%\n   - Extra festivo nocturno: +150%\n\nTodo el cálculo es 100% local — no depende de internet.'
  },
  {
    q: ['funciona sin internet', 'offline', 'sin conexion', 'modo avion', 'no tengo datos'],
    a: '**Sí, Mi Turno funciona completamente sin internet.**\n\n• Iniciar y finalizar turnos: ✅\n• Calcular ingresos y recargos: ✅\n• Ver análisis y proyecciones: ✅\n• Usar el asistente IA: ✅ (es 100% local)\n• Exportar PDF/Excel: ✅\n\nSi tenés cuenta en la nube (Supabase), tus datos se sincronizan automáticamente cuando vuelve la conexión. El ícono en Ajustes te muestra el estado.'
  },
  {
    q: [
      'donde se guardan mis datos',
      'almacenamiento',
      'privacidad',
      'seguridad de datos',
      'donde estan mis turnos'
    ],
    a: 'Tus datos se guardan en **dos lugares** según tu configuración:\n\n**Modo local (invitado):**\n• Todo en tu dispositivo, en localStorage del navegador\n• Nadie más tiene acceso\n\n**Modo con cuenta (email + contraseña):**\n• Primero en tu dispositivo (offline-first)\n• Luego se sincronizan con Supabase (nube)\n• Podés acceder desde varios dispositivos con la misma cuenta\n\nLa app **nunca** comparte tus datos con terceros. Todo el cálculo de nómina ocurre en tu dispositivo.'
  },

  // ═══ SINCRONIZACIÓN Y SUPABASE ═══
  {
    q: [
      'estoy conectado a supabase',
      'como se si estoy en la nube',
      'conexion supabase',
      'estado de nube',
      'sincronizado'
    ],
    a: 'Para ver tu estado de conexión:\n\n1. Andá a la pestaña **Ajustes**\n2. Arriba de todo, en tu perfil, ves un **círculo de color**:\n   - 🟢 **Verde**: conectado a Supabase, todo sincronizado\n   - 🟡 **Ámbar**: sincronizando cambios pendientes\n   - ⚪ **Gris**: modo local o sin conexión\n\nLa app funciona 100% en modo local. La nube es opcional para multi-dispositivo.'
  },
  {
    q: [
      'como funciona la sincronizacion',
      'sync',
      'sincronizar',
      'datos en la nube',
      'multi dispositivo'
    ],
    a: 'La sincronización funciona así:\n\n1. **Offline-first**: tus cambios se guardan primero en tu dispositivo\n2. Los cambios se **encolan** y se suben a Supabase cuando hay internet\n3. **Tiempo real**: si tenés la app en 2 dispositivos, los cambios se reflejan en <1 segundo\n4. **Realtime**: solo para turnos (no para PIN, foto ni preferencias)\n\nEl LED en Ajustes te muestra el estado en vivo.'
  },

  // ═══ CONFIGURACIONES ═══
  {
    q: ['como cambio mi salario', 'configurar salario', 'poner sueldo', 'cambiar sueldo base'],
    a: 'Para configurar tu salario:\n\n1. Andá a **Ajustes** ⚙️\n2. Tocá donde dice **Salario base**\n3. Ingresá tu salario mensual bruto en pesos (ej: 1750905)\n4. Tocá ✓ para guardar\n\nNo uses puntos ni comas. Este valor se usa para todos los cálculos de la app.'
  },
  {
    q: ['como cambio mi foto', 'poner foto de perfil', 'avatar', 'imagen de perfil'],
    a: 'Para cambiar tu foto de perfil:\n\n1. Andá a **Ajustes** ⚙️\n2. Tocá el **círculo de la foto** (arriba)\n3. Elegí **Cambiar foto** (de tu galería) o **Eliminar foto**\n\nLa foto se guarda **solo en tu dispositivo**. No se sube a la nube.'
  },
  {
    q: ['como cambio mi nombre', 'nombre en la app', 'apodo', 'alias', 'como me llamo en la app'],
    a: 'Para cambiar tu nombre en la app:\n\n1. Andá a **Ajustes** ⚙️\n2. Tocá el **lápiz ✎** al lado de tu nombre\n3. Escribí el nombre o apodo que quieras\n4. Tocá ✓ para guardar\n\nEste nombre lo usa la IA para hablarte de forma personal.'
  },
  {
    q: ['como configuro la quincena', 'modo quincenal', 'pago cada 15 dias', 'q1 q2'],
    a: 'Para activar el modo quincena:\n\n1. Andá a **Ajustes** ⚙️ > Preferencias de pago\n2. Activá el switch **Calcular por quincena**\n3. Configurá los días de inicio: Q1 (por defecto día 1) y Q2 (día 16)\n\nEsto separa tus ingresos en dos periodos de pago. Ideal si cobrás cada 15 días.'
  },
  {
    q: ['como pongo el pin', 'configurar pin', 'codigo de acceso', 'bloquear app'],
    a: 'Para poner un PIN de acceso:\n\n1. Andá a **Ajustes** ⚙️ > Cuenta\n2. Tocá **Gestionar cuenta**\n3. Seleccioná la pestaña **PIN**\n4. Ingresá un código de 4 a 6 dígitos\n5. Confirmalo\n\nLa próxima vez que entrés, podés usar el PIN en vez de la contraseña.'
  },
  {
    q: ['como respaldo', 'backup', 'copia de seguridad', 'no perder datos'],
    a: 'Para respaldar todos tus datos:\n\n1. Andá a **Ajustes** ⚙️ > Datos\n2. Tocá **📦 Respaldar datos**\n3. Se descarga un archivo .json con turnos, salario y ajustes\n4. Guardalo en un lugar seguro (Google Drive, correo, etc.)\n\nPara restaurar: tocá **📂 Restaurar datos** y seleccioná el archivo.'
  },

  // ═══ EXPORTACIÓN ═══
  {
    q: ['como exporto a pdf', 'descargar pdf', 'informe pdf', 'reporte mensual'],
    a: 'Para exportar tus turnos como PDF:\n\n1. Andá a **Historial** 🕐\n2. Tocá el botón **Exportar** (ícono de descarga)\n3. Elegí **PDF**\n4. El archivo se descarga automáticamente\n\nTambién podés enviarlo por correo desde el mismo modal.'
  },
  {
    q: ['como comparto por whatsapp', 'enviar numeros por whatsapp', 'compartir analisis'],
    a: 'Para compartir tus números por WhatsApp:\n\n1. Andá a **Análisis** 📊\n2. Bajá hasta el final\n3. Tocá el botón **💬 WhatsApp**\n4. Se abre WhatsApp con un mensaje pre-formateado con tu total, turnos, proyección y desglose\n\nNo genera archivo PDF — es solo un mensaje de texto rápido.'
  },
  {
    q: ['como envio por correo', 'enviar reporte', 'mandar a jefe', 'email'],
    a: 'Para enviar tu reporte por correo:\n\n1. Andá a **Historial** 🕐\n2. Tocá **Exportar** y elegí el formato (PDF o Excel)\n3. En el modal, tocá **Enviar por correo**\n4. Ingresá el correo de destino\n5. Tocá enviar\n\nRequiere conexión a internet.'
  },

  // ═══ USO DIARIO ═══
  {
    q: ['como inicio turno', 'empezar a trabajar', 'marcar entrada', 'fichar'],
    a: 'Para iniciar un turno:\n\n1. Abrí la app (ya estás en **Inicio** 🏠)\n2. Tocá el botón grande **Iniciar**\n3. El reloj empieza a correr\n4. Ves tus ganancias estimadas en vivo\n\nCuando termines, tocá **Finalizar** en el mismo botón.'
  },
  {
    q: ['como finalizo turno', 'terminar de trabajar', 'cerrar jornada', 'marcar salida'],
    a: 'Para finalizar tu turno:\n\n1. En **Inicio** 🏠, tocá **Finalizar**\n2. Si duró menos de 1 minuto, no se registra (evita toques accidentales)\n3. El turno se guarda y aparece en **Historial**\n4. Tus KPIs y proyección se actualizan al instante'
  },
  {
    q: ['cuando se considera nocturno', 'horario nocturno', 'a que hora es nocturno'],
    a: 'El horario nocturno en Colombia es de **9:00 PM a 6:00 AM**.\n\nSi tu turno traslapa ese horario, la parte nocturna se paga con un **35% de recargo**. La app detecta esto automáticamente.'
  },
  {
    q: ['que es un festivo', 'como se que dia es festivo', 'calendario festivos'],
    a: 'Los festivos en Colombia son determinados por la **Ley Emiliani**. Algunos se trasladan al lunes siguiente para crear puentes.\n\nLa app tiene **todos los festivos precargados** hasta 2030. Si trabajás un festivo, tu turno se paga con **75% de recargo** (o más si también es nocturno o extra).'
  },
  {
    q: ['como funciona el genero', 'hombre mujer app', 'para que sirve genero', 'selector genero'],
    a: 'El selector de género (♂/♀) está en **Ajustes** > Perfil, entre tu email y el estado de conexión.\n\nLa IA usa esta preferencia para adaptar su lenguaje:\n• **Hombre**: "parce", "hermano", "socio", "campeón"\n• **Mujer**: "amiga", "reina", "bella", "campeona"\n• **Sin seleccionar**: lenguaje neutro\n\nEs 100% opcional y solo se guarda en tu dispositivo.'
  },

  // ═══ INSTALACIÓN ═══
  {
    q: [
      'como instalo la app',
      'instalar en el celular',
      'pwa',
      'pantalla de inicio',
      'añadir a inicio'
    ],
    a: 'Para instalar Mi Turno en tu celular:\n\n**Android (Chrome):**\n1. Tocá los 3 puntitos ⋮\n2. "Añadir a pantalla de inicio"\n\n**iPhone (Safari):**\n1. Tocá el botón Compartir (cuadro con flecha)\n2. "Añadir a inicio"\n\nLa app se instala como cualquier otra y se actualiza automáticamente.'
  },

  // ═══ SOLUCIÓN DE PROBLEMAS ═══
  {
    q: ['no puedo iniciar sesion', 'no entra', 'error login', 'no me deja entrar'],
    a: 'Si no podés iniciar sesión:\n\n1. Verificá que el **email y contraseña** sean correctos\n2. Si usás PIN, asegurate de que sea el correcto (4 a 6 dígitos)\n3. Revisá tu **conexión a internet** si usás cuenta en la nube\n4. Probá cerrando la app y abriéndola de nuevo\n\nSi nada funciona, andá a Ajustes > Cerrar sesión y volvé a entrar.'
  },
  {
    q: ['se trabo la app', 'no responde', 'pantalla blanca', 'se quedo pegado', 'no carga'],
    a: 'Si la app se traba:\n\n1. **Cerrá la app** completamente (deslizala hacia arriba en el gestor de apps)\n2. **Abrila de nuevo**\n3. Si sigue mal, **mantené pulsado el botón de recargar** en el navegador\n\nSi nada funciona, escribí **/reset** en el chat del asistente para reiniciar todo.\n\nTus datos no se pierden — están guardados localmente.'
  },
  {
    q: ['no se actualiza', 'sigue en version vieja', 'no veo los cambios', 'como actualizo'],
    a: 'La app se actualiza automáticamente al abrirla. Si ves una versión vieja:\n\n1. **Cerrá la app completamente**\n2. **Abrila de nuevo** (esto fuerza al Service Worker a buscar la última versión)\n3. Si aún no se actualiza, **arrastrá hacia abajo** para refrescar\n\nTu versión actual aparece al final de la pestaña Ajustes.'
  },
  {
    q: ['no se sincroniza', 'no sube a la nube', 'sync no funciona', 'ambar no cambia'],
    a: 'Si la sincronización no funciona:\n\n1. Verificá que tengas **internet**\n2. Andá a **Ajustes** y tocá el LED de conexión para ver detalles\n3. Si ves ⚪ gris, **cerrá sesión y volvé a entrar** (esto revalida tu token)\n4. Si ves 🟡 ámbar por mucho tiempo, puede haber cambios en cola — se subirán cuando haya buena conexión\n\nRecordá: la app funciona 100% sin nube. No perdés nada.'
  },

  // ═══ CARACTERÍSTICAS AVANZADAS ═══
  {
    q: ['que es el modo manos libres', 'hablar sin tocar', 'conversacion continua', 'modo escucha'],
    a: 'El **modo manos libres** te permite hablar con la IA sin tocar el teléfono:\n\n1. Activá el switch "Modo manos libres" debajo del chat\n2. La IA te da un briefing (cuánto llevás)\n3. Después, **te escucha** automáticamente — vos hablás, ella responde y te lee la respuesta\n4. Para pausar, desactivá el switch\n\nIdeal para cuando estás trabajando y no podés tocar la pantalla.'
  },
  {
    q: ['que es gemini', 'modo gemini', 'ia de google', 'gemini vs normal'],
    a: '**Gemini** es un modo experimental que usa la IA de Google para preguntas complejas:\n\n• Activado con el ícono ✦ en el chat (color blanco = Gemini, gris = IA local)\n• **Requiere internet**\n• Usa tus datos reales: Gemini entiende la pregunta, pero la app calcula\n• Para conceptos laborales usa la IA de Google\n• Para tus números usa el motor local de Mi Turno\n\nLa IA local es 100% offline y muy capaz — probala primero.'
  },
  {
    q: [
      'que es la ley 2101',
      'reduccion jornada',
      'horas semanales 2026',
      'cuantas horas son legales'
    ],
    a: 'La **Ley 2101 de 2021** reduce la jornada laboral en Colombia gradualmente:\n\n• 2023: 47h/semana\n• 2024: 46h/semana\n• 2025: 45h/semana\n• **2026: 44h/semana** (vigente desde jun 15)\n• 2027: 42h/semana (meta final)\n\nLa app ajusta automáticamente el límite según la fecha del turno. Las horas que superan este límite se pagan como extras.'
  },
  {
    q: ['cuanto es el auxilio de transporte', 'subsidio transporte', 'auxilio 2026'],
    a: 'El auxilio de transporte para 2026 es de **$249,095** mensuales (Decreto 1470 de 2025).\n\nAplica si tu salario es ≤ 2 salarios mínimos. Se paga proporcional a los días trabajados. La app lo calcula automáticamente si activás el switch en Ajustes > Preferencias de pago.'
  },
  {
    q: ['cuanto es el salario minimo', 'smmlv 2026', 'minimo 2026 colombia'],
    a: 'El salario mínimo en Colombia para 2026 es de **$1,750,905** mensuales (Decretos 1469-1470 de diciembre 2025).\n\nEste valor lo usa la app como referencia. Si tu salario es mayor, configuralo en Ajustes para cálculos precisos.'
  },

  // ═══ FILOSOFÍA ═══
  {
    q: ['por que offline', 'por que no usa internet', 'privacidad app', 'seguridad app'],
    a: 'Mi Turno es **offline-first** por diseño:\n\n1. **Privacidad**: tus datos de nómina nunca salen de tu dispositivo durante los cálculos\n2. **Disponibilidad**: funciona en sótanos, metros, zonas rurales — donde no hay señal\n3. **Velocidad**: sin latencia de red, todo es instantáneo\n4. **Batería**: sin llamadas constantes a servidores, ahorra batería\n\nLa nube (Supabase) es opcional y solo para sincronización entre dispositivos.'
  },
  {
    q: ['diferencia con otras apps', 'por que esta y no otra', 'que la hace especial'],
    a: 'Mi Turno se diferencia de otras apps de nómina en:\n\n• **100% offline**: la mayoría de apps requieren internet constante\n• **Recargos colombianos reales**: muchas apps usan fórmulas simplificadas\n• **IA local**: el asistente nunca manda tus datos a servidores externos\n• **Sin publicidad ni suscripciones**: completamente gratis\n• **Actualizada**: seguimiento de cambios legales (Ley 2101, decretos anuales)\n• **Comunidad**: mejorada con feedback de trabajadores reales'
  }
];

// ─── MOTOR DE BÚSQUEDA ────────────────────────────────────────

/**
 * Busca en la base de conocimiento de la app usando stemming y matching.
 * @param {string} question
 * @returns {string|null} respuesta formateada o null si no encuentra
 */
function aiAppKBSearch(question) {
  if (!question) return null;

  var tokens = [];
  if (typeof aiTokenize === 'function') {
    tokens = aiTokenize(question);
  } else {
    var q = (question || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿¡?!,.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    tokens = q.split(' ').filter(function (w) {
      return w.length >= 2;
    });
  }

  if (!tokens.length) return null;

  var best = null;
  var bestScore = 0;

  for (var i = 0; i < AI_APP_KB.length; i++) {
    var entry = AI_APP_KB[i];
    var entryScore = 0;

    // Buscar en keywords
    for (var j = 0; j < entry.q.length; j++) {
      var kw = entry.q[j];
      var kwTokens = typeof aiTokenize === 'function' ? aiTokenize(kw) : kw.split(' ');
      var matchCount = 0;
      for (var k = 0; k < kwTokens.length; k++) {
        for (var t = 0; t < tokens.length; t++) {
          if (tokens[t] === kwTokens[k]) {
            matchCount++;
            break;
          }
        }
      }
      if (matchCount === kwTokens.length) {
        entryScore += kwTokens.length * 3;
      }
    }

    // Substring matching en keywords para preguntas largas
    var qLower = question.toLowerCase();
    for (var s = 0; s < entry.q.length; s++) {
      if (qLower.indexOf(entry.q[s]) >= 0) {
        entryScore += entry.q[s].length;
      }
    }

    if (entryScore > bestScore) {
      bestScore = entryScore;
      best = entry;
    }
  }

  return bestScore > 0 ? best.a : null;
}

/**
 * Responde preguntas sobre cómo usar la app combinando
 * la base de conocimiento experta + las guías paso a paso.
 */
function aiAppKBAnswer(question) {
  var resp = aiAppKBSearch(question);
  if (resp) return resp;

  // Fallback a las guías de ai-help.js
  if (typeof aiHelpAnswer === 'function') {
    var helpResp = aiHelpAnswer(question);
    if (helpResp && helpResp.indexOf('No encontré') < 0) return helpResp;
  }

  return null;
}

window.AI_APP_KB = AI_APP_KB;
window.aiAppKBSearch = aiAppKBSearch;
window.aiAppKBAnswer = aiAppKBAnswer;

console.log(
  '[MT] ai-app-kb.js cargado — Base de conocimiento de la app ✓ (' + AI_APP_KB.length + ' entradas)'
);
