// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/a11y-init.js
//  Inicialización de accesibilidad en toda la app
// ════════════════════════════════════════════════════════════════

(function() {
  
  // Crear skip link
  createSkipLink('main-content', 'Saltar al contenido principal');
  
  // Asegurar que root tenga ARIA correcto
  var root = document.getElementById('root');
  if (root) {
    root.setAttribute('role', 'main');
    root.setAttribute('aria-label', 'Contenido principal de Mi Turno');
  }
  
  // Detectar si el usuario está usando un screen reader
  // (nota: esto es una heurística simple)
  var isScreenReaderActive = navigator.accessibility && navigator.accessibility.active;
  if (isScreenReaderActive) {
    document.documentElement.setAttribute('data-screen-reader', 'true');
    announceToScreenReader('Mi Turno cargado. Utiliza Tab para navegar, Escape para cerrar diálogos.');
  }
  
  // Observar cambios en el DOM para aplicar ARIA a elementos nuevos
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Si se añade un modal nuevo, aplicar focus trap
      var addedNodes = mutation.addedNodes;
      addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          if (node.getAttribute('role') === 'dialog' || node.classList.contains('modal')) {
            setupModalFocusTrap(node);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Manejar cambios de pestañas
  var originalLocation = window.location.href;
  window.addEventListener('hashchange', function() {
    var hash = window.location.hash.substr(1);
    var tabName = hash || 'Inicio';
    announceTabChange(tabName);
  });
  
})();
