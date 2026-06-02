// ════════════════════════════════════════════════════════════════
//  MI TURNO · a11y-keyboard.js
//  Navegación por teclado: Tab, Enter, Flechas, Escape
// ════════════════════════════════════════════════════════════════

/**
 * Manejador global de navegación por teclado
 * Soporta: Tab (navegar), Enter/Space (activar), Escape (cerrar modal)
 */
window.setupKeyboardNavigation = function() {
  
  // Escape cierra modales
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      var openModal = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (openModal) {
        var closeBtn = openModal.querySelector('[aria-label*="cerrar"], [aria-label*="Cerrar"], .close-btn');
        if (closeBtn) {
          closeBtn.click();
          e.preventDefault();
        }
      }
    }
  });
  
  // Enter/Space activa botones sin focus-visible explícito
  document.addEventListener('keydown', function(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
      if (e.key === ' ') e.preventDefault(); // Space no scrollea
      e.target.click();
    }
  });
};

/**
 * Manejo de flechas para listas de opciones (turnos, recargos)
 * Soporta: ↑↓ para navegar, Enter para seleccionar
 */
window.setupArrowKeyNavigation = function(containerSelector, itemSelector) {
  var container = document.querySelector(containerSelector);
  if (!container) return;
  
  var items = Array.from(container.querySelectorAll(itemSelector));
  var currentIndex = -1;
  
  container.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (currentIndex === -1) {
        currentIndex = 0;
      } else if (e.key === 'ArrowDown') {
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
      } else {
        currentIndex = Math.max(currentIndex - 1, 0);
      }
      
      focusElement(items[currentIndex]);
      announceToScreenReader('Opción ' + (currentIndex + 1) + ' de ' + items.length, 'polite');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      var focused = document.activeElement;
      if (items.includes(focused)) {
        focused.click();
      }
    }
  });
  
  // Reset cuando se sale del contenedor
  container.addEventListener('blur', function() {
    currentIndex = -1;
  }, true);
};

/**
 * Manejo de inputs numéricos con flechas (↑↓ incrementa/decrementa)
 * Ej: salario, horas
 */
window.setupNumberInputArrows = function(inputSelector, step) {
  step = step || 1;
  var inputs = document.querySelectorAll(inputSelector);
  
  inputs.forEach(function(input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        var val = parseFloat(input.value) || 0;
        input.value = val + step;
        input.dispatchEvent(new Event('change'));
        announceToScreenReader(input.getAttribute('aria-label') + ': ' + input.value, 'polite');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        var val = parseFloat(input.value) || 0;
        input.value = Math.max(0, val - step);
        input.dispatchEvent(new Event('change'));
        announceToScreenReader(input.getAttribute('aria-label') + ': ' + input.value, 'polite');
      }
    });
  });
};

/**
 * Manejo de switches/checkboxes con teclado
 * Space para toggle
 */
window.setupSwitchKeyboard = function(switchSelector) {
  var switches = document.querySelectorAll(switchSelector);
  
  switches.forEach(function(sw) {
    sw.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        var isChecked = sw.getAttribute('aria-checked') === 'true';
        sw.setAttribute('aria-checked', !isChecked);
        var label = sw.getAttribute('aria-label');
        var state = !isChecked ? 'activado' : 'desactivado';
        announceToScreenReader(label + ' ' + state, 'polite');
      }
    });
  });
};

/**
 * Tab trap para modales (mantiene focus dentro del modal)
 */
window.setupModalFocusTrap = function(modalElement) {
  if (!modalElement) return;
  
  var focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  var firstElement = focusableElements[0];
  var lastElement = focusableElements[focusableElements.length - 1];
  
  modalElement.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab hacia atrás
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab hacia adelante
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
  
  // Focus inicial en primer elemento del modal
  setTimeout(function() {
    firstElement.focus();
  }, 100);
};

/**
 * Inicialización automática al cargar la página
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.setupKeyboardNavigation);
} else {
  window.setupKeyboardNavigation();
}
