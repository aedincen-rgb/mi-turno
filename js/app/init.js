// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/init.js
//  Renderizado del componente Root
// ════════════════════════════════════════════════════════════════
// Inicio de la aplicación
try {
  // Test de dependencias críticas antes de arrancar
  console.log('[MT] Verificando entorno...');
  var deps = {
    React: !!window.React,
    ReactDOM: !!window.ReactDOM,
    Supabase: !!window.supabase || !!window.SUPA,
    Root: typeof Root !== 'undefined',
    Calculator: typeof doCalc !== 'undefined'
  };
  console.table(deps);

  if (window.React && window.ReactDOM && typeof Root !== 'undefined') {
    // Envolver en ErrorBoundary: un crash de render muestra la pantalla de
    // recuperación en vez de quedar en blanco. Fallback a Root pelado si el
    // boundary no estuviera cargado.
    var tree =
      typeof ErrorBoundary !== 'undefined'
        ? React.createElement(ErrorBoundary, null, React.createElement(Root, null))
        : React.createElement(Root, null);
    ReactDOM.createRoot(document.getElementById('root')).render(tree);
    console.log('[MT] App montada con éxito.');
  } else {
    var missing = Object.keys(deps)
      .filter(function (k) {
        return !deps[k];
      })
      .join(', ');
    throw new Error('Faltan dependencias críticas: ' + (missing || 'React/Root'));
  }
} catch (e) {
  // Retira el splash inicial: si no, su z-index taparía este mensaje.
  var sp = document.getElementById('initSplash');
  if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  document.getElementById('root').innerHTML =
    '<div style="color:#b91c1c;padding:40px;font-family:-apple-system,sans-serif;text-align:center">' +
    '<div style="font-size:44px;margin-bottom:14px">⚠</div>' +
    '<div style="font-size:17px;font-weight:700;margin-bottom:6px">Error al iniciar</div>' +
    '<div style="font-size:12.5px;opacity:0.6">' +
    e.message +
    '</div></div>';
}
