// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/init.js
//  Renderizado del componente Root
// ════════════════════════════════════════════════════════════════
// Inicio de la aplicación
try {
  if (window.React && window.ReactDOM) {
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root, null));
  } else {
    throw new Error('React no cargó');
  }
} catch (e) {
  document.getElementById('root').innerHTML =
    '<div style="color:#b91c1c;padding:40px;font-family:-apple-system,sans-serif;text-align:center"><div style="font-size:44px;margin-bottom:14px">⚠</div><div style="font-size:17px;font-weight:700;margin-bottom:6px">Error al iniciar</div><div style="font-size:12.5px;opacity:0.6">' +
    e.message +
    '</div></div>';
}
