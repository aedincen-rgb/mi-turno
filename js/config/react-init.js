// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/react-init.js
//  Verificación React y aliases
// ════════════════════════════════════════════════════════════════
// Verificación de React + aliases
if (!window.React || !window.ReactDOM) {
  document.getElementById('root').innerHTML =
    '<div style="color:#b91c1c;padding:40px;text-align:center;font-family:-apple-system,sans-serif">Error de conexión. Recarga la página.</div>';
  throw new Error('React no cargó - abortando carga de scripts');
}
var useState = React.useState,
  useEffect = React.useEffect,
  useRef = React.useRef,
  useCallback = React.useCallback,
  useMemo = React.useMemo,
  h = React.createElement;
