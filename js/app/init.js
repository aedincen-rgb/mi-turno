// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/init.js
//  Renderizado del componente Root
// ════════════════════════════════════════════════════════════════
// Inicio de la aplicación
try {
  // Test de dependencias críticas antes de arrancar
  console.log('[MT] Verificando entorno...');
  const deps = {
    React: !!window.React,
    ReactDOM: !!window.ReactDOM,
    Supabase: !!window.supabase || !!window.SUPA,
    Root: typeof Root !== 'undefined',
    Calculator: typeof doCalc !== 'undefined'
  };
  console.table(deps);

  // Verificamos que los componentes vitales existan
  if (window.React && window.ReactDOM && typeof Root !== 'undefined') {
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root, null));
    console.log('[MT] App montada con éxito.');
  } else {
    const missing = Object.keys(deps).filter(k => !deps[k]).join(', ');
    throw new Error('Faltan dependencias críticas: ' + (missing || 'React/Root'));
  }
} catch (e) {
  document.getElementById('root').innerHTML =
    '<div style="color:#b91c1c;padding:40px;font-family:-apple-system,sans-serif;text-align:center"><div style="font-size:44px;margin-bottom:14px">⚠</div><div style="font-size:17px;font-weight:700;margin-bottom:6px">Error al iniciar</div><div style="font-size:12.5px;opacity:0.6">' +
    e.message +
    '</div></div>';
}
