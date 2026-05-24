// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-support.js
//  IA de Soporte Técnico y Arquitectura (Admin)
//  Modo Desarrollador · Diccionario · Troubleshooting · Diagnóstico
//  100% offline
// ════════════════════════════════════════════════════════════════

// ─── BASE DE CONOCIMIENTO TÉCNICO ──────────────────────────────

var _SUPPORT_DICTIONARY = {
  'html': 'HTML: Es el esqueleto. **index.html** es la puerta de entrada principal de la app.',
  'css': 'CSS: Es la ropa y estilos. Tu app usa **38 archivos CSS** para ser modular y fácil de mantener.',
  'js': 'JavaScript: El cerebro. **39 archivos JS** manejan la lógica y la comunicación con Supabase.',
  'sw.js': '**Service Worker**: Es como un asistente fantasma que maneja el modo offline y el caché persistente. Si algo no se actualiza, ¡sospecha de él!',
  'manifest.json': 'Configura la instalación como PWA: ícono, nombre, colores de tema.',
  'package.json': 'Lista de ingredientes y librerías del proyecto. Como la "receta" de la app.',
  'estructura.md': 'Tu mapa interno que explica por qué hay 77+ archivos y cómo se organizan.',
  'base': '**css/base/** → Reglas fundamentales: colores, reset de estilos, tipografía.',
  'layout': '**css/layout/** → Cómo se acomodan las cosas: header, scroll, botones de acción.',
  'components': '**css/components/** → Bloques reutilizables: tarjetas, botones, inputs.',
  'utils': '**js/utils/** → Funciones pequeñas y específicas: formato de moneda, haptic, red.',
  'sync-queue.js': '**Cola de sincronización**: Guarda cambios offline y los sube a Supabase cuando hay conexión.',
  'services': '**js/services/** → Conexiones externas: Supabase, Calculadora, IA.',
  'tabs': '**js/tabs/** → Las 5 pantallas principales de la interfaz: Inicio, Dashboard, Asistente, Historial, Ajustes.',
  'app': '**js/app/** → Componentes de alto nivel: Root (raíz), Auth (login), AppMain (app principal).',
  'pwa': '**PWA** (Progressive Web App): Una web que se siente como app nativa: se puede instalar y funciona offline.',
  'cache': 'Memoria temporal. Hay varios niveles: navegador, Service Worker, localStorage. El SW es el más "terco".',
  'cdn': 'Red de servidores que sirven librerías rápido (React, Chart.js, jsPDF).',
  '404': '**Error 404**: No existe. El archivo no se encuentra en la ruta especificada.',
  '500': '**Error 500**: Falló el servidor. Algo salió mal en la nube (Vercel o Supabase).',
  'modular': 'Fragmentar en muchos archivos pequeños en lugar de uno gigante. Facilita el mantenimiento y la colaboración.',
  'frontend': 'Lo que el usuario ve y toca: HTML, CSS, JS en el navegador.',
  'backend': 'Lo que no se ve: Supabase (Base de datos, Autenticación, Edge Functions).',
  'react': 'Librería de UI declarativa. Aquí usamos una versión vanilla con `h()` que imita React.',
  'git': '**Git**: Control de versiones. `commit` (foto), `branch` (rama), `push` (subir), `pull` (bajar).',
  'commit': 'Un "punto de guardado" en la historia del código. Como un "checkpoint".',
  'branch': 'Rama: línea paralela de desarrollo (main es la principal, puedes crear experimentos).',
  'revert': 'Deshacer un cambio creando un nuevo commit que anula el anterior. Seguro.',
  'reset': 'Mover la historia hacia atrás. **Peligroso** si ya hiciste push a GitHub.',
  'vercel': '**Vercel**: Donde vive la app desplegada. Se actualiza automáticamente desde GitHub.',
  'deployment': 'Una versión publicada de la app. Cada "deploy" es inmutable.',
  'rollback': 'Volver a una versión anterior que funcionaba. Vercel lo hace fácil.',
  'devtools': '**F12**: Herramientas de desarrollador. Console (errores), Network (peticiones), Application (SW/Storage).',
  'console': 'Donde JavaScript "grita" sus errores. ¡Mira aquí primero cuando algo falle!',
  'network': 'Pestaña de DevTools que muestra qué archivos cargan y cuáles fallan (rojo = error).',
  'application': 'Pestaña de DevTools para gestionar Service Worker (Unregister), almacenamiento (localStorage, IndexedDB).'
};

var _SUPPORT_DEV_MAP = {
  'emoji': '**Emoji/iconos**: js/tabs/home.js (botones) o js/utils/icons.js (SVG de navegación).',
  'luna': '**Modo oscuro**: js/tabs/home.js (icono) y estilos en css/modals/dark-overrides.css.',
  'color': '**Colores**: Modifica css/base/variables.css para temas globales.',
  'boton': '**Botones**: Estilos en css/layout/action-button.css. Lógica en js/tabs/home.js.',
  'calculo': '**Cálculos**: Toda la lógica matemática vive en js/services/calculator.js.',
  'supabase': '**Supabase**: Configuración en js/config.js y helpers en js/services/supabase.js.',
  'login': '**Login**: Pantalla de acceso en js/app/auth-screen.js, estilos en css/components/auth-screen.css.',
  'error': '**Errores**: Logger en js/utils/error-logger.js, visor en js/modals/error-viewer.js.',
  'pdf': '**PDF/Excel**: Generación de documentos en js/services/export-files.js.',
  'ia': '**IA**: Este motor está dividido en js/services/ai-shared.js (base), ai-support.js (técnico) y ai-financial.js (financiero).',
  'infra': '**Infraestructura**: Revisa js/config.js para variables, Vercel para Environment Variables, Supabase para RLS policies.',
  'vercel': '**Vercel debug**: Si la app no carga → 1. Revisa Environment Variables en dashboard de Vercel. 2. Verifica que el SW no esté cacheando versión vieja.',
  'red': '**Red/Offline**: Usa `navigator.onLine`. Errores "Failed to fetch" suelen ser CORS o falta de internet.',
  'cors': '**CORS**: Si ves errores de CORS, revisa que el dominio de Vercel esté en "Allowed Origins" en Supabase (API Settings).'
};

var _SUPPORT_TROUBLESHOOTING = {
  'supabase_auth': '**Login falla**: Revisa si el email está confirmado en Supabase Auth y si las políticas RLS de "perfiles" permiten SELECT.',
  'supabase_db': '**No guarda datos**: Mira la consola de errores (F12). "PGRST116" = registro no existe. "403" = problema de RLS.',
  'vercel_deploy': '**Error 500 en Vercel**: Revisa los logs de las Edge Functions en el dashboard. Falta una variable de entorno casi siempre.',
  'network_offline': '**Modo offline**: La app detecta automáticamente. Los cambios se guardan en localStorage y se sincronizan al recuperar conexión.',
  'cors': '**CORS**: Agrega el dominio de Vercel en "Allowed Origins" en el dashboard de Supabase → API Settings.'
};

var _SUPPORT_GOLDEN_RULES = [
  '1️⃣ **Antes de borrar**, haz backup manual de la carpeta.',
  '2️⃣ **Si no ves cambios**, el Service Worker (SW) es el culpable → F12 > Application > Unregister.',
  '3️⃣ **F12 > Console > Network** es tu primer paso para diagnosticar.',
  '4️⃣ **Vercel es una máquina del tiempo**: puedes hacer Rollback a cualquier deploy.',
  '5️⃣ **Los errores tienen mensajes**: léelos completos antes de actuar.',
  '6️⃣ **Modularizar** temprano facilita la vida a futuro.'
];

// ─── MOTOR DE RESPUESTA ───────────────────────────────────────

function aiSupportAnswer(question, state, c) {
  var t = _aiNorm(question);
  var q = question.toLowerCase().trim();
  var isAdmin = state.session && state.session.isAdmin;

  // Solo responde si es admin o si la consulta es claramente técnica
  if (!isAdmin && !_aiHas(t, 'como funciona', 'ayuda app', 'como registr', 'como iniciar',
    'como export', 'como cambio salario', 'como uso', 'como inicio', 'iniciar turno',
    'que es', 'significa', 'donde', 'archivo', 'modulo', 'codigo', 'error', 'falla',
    'supabase', 'vercel', 'red', 'conexion', 'regla', 'oro')) {
    return null; // No es para mí, pasa al otro asistente
  }

  // ── AYUDA APP (preguntas de uso, accesibles para todos) ──
  if (_aiHas(t, 'como registr', 'como iniciar turno', 'como uso', 'como funciona', 'como inicio', 'iniciar turno')) {
    return _pick([
      '✦ **Cómo usar Mi Turno:**\n1. Ve a la pestaña **Inicio** y toca el botón **Iniciar** para arrancar un turno.\n2. El cronómetro corre en tiempo real calculando recargos.\n3. Toca **Parar** al terminar: se guarda automáticamente.\n4. En **Análisis** ves tu desempeño del mes.\n5. En **Historial** puedes exportar a PDF o Excel. ¡Así de fácil!',
      '¡Claro! Es muy sencillo:\n1. **Inicio** → toca **Iniciar**.\n2. Trabajas normal, la app va calculando.\n3. Al terminar, toca **Parar**.\n4. Revisa tus números en **Análisis**.\n5. Exporta desde **Historial**.\n¿Alguna duda en particular?'
    ]);
  }
  if (_aiHas(t, 'como export', 'exportar pdf', 'exportar excel', 'generar reporte')) {
    return 'Ve a la pestaña **Historial** (icono de reloj) → en la parte superior tienes botones para **Exportar PDF** y **Exportar Excel**. Generan reportes mensuales con desglose por recargo.';
  }
  if (_aiHas(t, 'como cambio salario', 'cambiar salario', 'editar salario', 'configur salario', 'ajustes')) {
    return 'Ve a la pestaña **Ajustes** (engranaje) → toca el campo de **Salario base** y escribe el nuevo valor. ¡Se actualiza al instante en todos los cálculos!';
  }

  // ── SOLO ADMIN: MODO DESARROLLADOR ──
  if (!isAdmin) return null;

  // Reglas de oro
  if (_aiHas(t, 'reglas', 'oro', 'lecciones', 'consejos')) {
    return '🌟 **Reglas de Oro del Proyecto:**\n\n' + _SUPPORT_GOLDEN_RULES.join('\n') +
      '\n\n💡 *Siguiendo estas pautas, vas a evitar el 90% de los dolores de cabeza.*';
  }

  // Diccionario de conceptos
  for (var term in _SUPPORT_DICTIONARY) {
    if (_aiHas(t, term)) {
      return '📖 **Diccionario Técnico:**\n\n' + _SUPPORT_DICTIONARY[term] +
        '\n\n💡 *Definición específica para tu proyecto Mi Turno.* ¿Necesitas que profundice en algo?';
    }
  }

  // Diagnósticos de infraestructura (prioritarios)
  if (_aiHas(t, 'supabase')) {
    return '🛡 **Diagnóstico Supabase:**\n' + _SUPPORT_DEV_MAP.supabase +
      '\n\n🔧 ' + _SUPPORT_TROUBLESHOOTING.supabase_auth + '\n' + _SUPPORT_TROUBLESHOOTING.supabase_db;
  }
  if (_aiHas(t, 'vercel', 'despliegue', 'hosting')) {
    return '🚀 **Diagnóstico Vercel:**\n' + _SUPPORT_DEV_MAP.vercel +
      '\n\n🔧 ' + _SUPPORT_TROUBLESHOOTING.vercel_deploy;
  }
  if (_aiHas(t, 'red', 'conexion', 'internet', 'offline')) {
    var status = navigator.onLine ? '✅ Actualmente en línea' : '❌ Actualmente sin conexión';
    return '🌐 **Estado de Red:** ' + status + '\n\n🔧 ' + _SUPPORT_TROUBLESHOOTING.network_offline +
      '\n\n🔧 ' + _SUPPORT_TROUBLESHOOTING.cors;
  }

  // Mapa de arquitectura
  var respuesta = '🛠 **Te ayudo a ubicar eso…**\n\n';
  var found = false;

  for (var key in _SUPPORT_DEV_MAP) {
    if (_aiHas(t, key)) {
      respuesta += '• ' + _SUPPORT_DEV_MAP[key] + '\n';
      found = true;
    }
  }
  if (_aiHas(t, 'error', 'falla', 'bug', 'no funciona')) {
    respuesta += '• ' + _SUPPORT_DEV_MAP.error + '\n';
    found = true;
  }

  if (!found) {
    // Último recurso: intentar matchear con el diccionario ya buscado arriba
    return '🤔 No encontré una respuesta específica para tu consulta técnica. Prueba preguntando por:\n\n' +
      '• Un concepto: "¿Qué es HTML/SW/PWA?"\n' +
      '• Un módulo: "¿Dónde está el login?"\n' +
      '• Un problema: "Error con Supabase / Vercel / offline"\n' +
      '• **/reglas** para ver las reglas de oro del proyecto.';
  }

  respuesta += '\n💡 *Basado en la estructura actual del proyecto. ¿Necesitas más detalles?*';
  return respuesta;
}
