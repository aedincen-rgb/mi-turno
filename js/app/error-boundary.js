// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/error-boundary.js
//  Límite de error de React: atrapa crashes de render y muestra una
//  pantalla de recuperación amable en vez de pantalla blanca.
// ════════════════════════════════════════════════════════════════
// Los error boundaries DEBEN ser componentes de clase (function
// components no pueden serlo). Se construye al estilo ES5 con
// prototype — sin la palabra `class` — para no romper la consistencia
// del codebase. React detecta el boundary por getDerivedStateFromError.
function ErrorBoundary(props) {
  React.Component.call(this, props);
  this.state = { hasError: false, msg: '' };
}
ErrorBoundary.prototype = Object.create(React.Component.prototype);
ErrorBoundary.prototype.constructor = ErrorBoundary;

ErrorBoundary.getDerivedStateFromError = function (err) {
  return { hasError: true, msg: (err && err.message) || 'Error desconocido' };
};

ErrorBoundary.prototype.componentDidCatch = function (err, info) {
  try {
    console.error('[MT] ErrorBoundary atrapó:', err, info);
  } catch (_) {}
  // Reusar el logger del proyecto si está disponible (sube a Supabase).
  try {
    if (typeof logError === 'function') {
      logError({
        message: 'ErrorBoundary: ' + ((err && err.message) || 'render error'),
        stack: (err && err.stack) || (info && info.componentStack) || '',
        type: 'react-boundary'
      });
    }
  } catch (_) {}
};

ErrorBoundary.prototype._retry = function () {
  try {
    if (typeof haptic === 'function') haptic();
  } catch (_) {}
  this.setState({ hasError: false, msg: '' });
};

ErrorBoundary.prototype._hardReset = function () {
  try {
    if (typeof haptic === 'function') haptic();
  } catch (_) {}
  try {
    if (typeof window._mtHardReset === 'function') {
      window._mtHardReset('Reiniciando app…');
      return;
    }
  } catch (_) {}
  window.location.reload();
};

ErrorBoundary.prototype.render = function () {
  if (!this.state.hasError) return this.props.children;

  var self = this;
  return h(
    'div',
    {
      className: 'eb-screen',
      role: 'alert',
      'aria-live': 'assertive'
    },
    h(
      'div',
      { className: 'eb-card' },
      h('div', { className: 'eb-ico', 'aria-hidden': 'true' }, '😕'),
      h('div', { className: 'eb-ttl' }, 'Algo salió mal'),
      h(
        'div',
        { className: 'eb-sub' },
        'Tus datos están a salvo. Probá reintentar; si sigue fallando, reiniciá la app.'
      ),
      h(
        'div',
        { className: 'eb-actions' },
        h(
          'button',
          {
            type: 'button',
            className: 'eb-btn eb-btn-primary',
            onClick: function () {
              self._retry();
            }
          },
          'Reintentar'
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'eb-btn eb-btn-ghost',
            onClick: function () {
              self._hardReset();
            }
          },
          'Reiniciar app'
        )
      ),
      this.state.msg ? h('div', { className: 'eb-detail' }, this.state.msg) : null
    )
  );
};
