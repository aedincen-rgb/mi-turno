// ════════════════════════════════════════════════════════════════
//  MI TURNO · a11y-helpers.js
//  Accesibilidad: helpers ARIA y utilidades para screen readers
// ════════════════════════════════════════════════════════════════

/**
 * Genera un ID único para ARIA describedby/labelledby
 */
function generateA11yId(prefix) {
  return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Añade label ARIA a un elemento (cuando no hay <label> semántico)
 */
function setAriaLabel(element, label) {
  if (!element) return;
  element.setAttribute('aria-label', label);
}

/**
 * Conecta dos elementos con aria-labelledby
 * Útil para conectar títulos con contenido
 */
function connectLabelledBy(element, labelElementId) {
  if (!element) return;
  element.setAttribute('aria-labelledby', labelElementId);
}

/**
 * Marca un elemento como describedby otro
 * Útil para textos de ayuda/error
 */
function setAriaDescribedBy(element, descriptionId) {
  if (!element) return;
  var current = element.getAttribute('aria-describedby') || '';
  var ids = current ? current.split(' ') : [];
  if (!ids.includes(descriptionId)) {
    ids.push(descriptionId);
    element.setAttribute('aria-describedby', ids.join(' '));
  }
}

/**
 * Configura un elemento como región viva (live region)
 * Para anuncios dinámicos a screen readers
 * polite = no interrumpe, assertive = interrumpe
 */
function setAriaLive(element, politeness) {
  if (!element) return;
  politeness = politeness || 'polite';
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', 'true');
}

/**
 * Marca un elemento como "aria-busy" durante carga/procesamiento
 */
function setAriaBusy(element, isBusy) {
  if (!element) return;
  element.setAttribute('aria-busy', isBusy ? 'true' : 'false');
}

/**
 * Configura estado expandido/colapsado (para acordeones, dropdowns)
 */
function setAriaExpanded(element, isExpanded) {
  if (!element) return;
  element.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
}

/**
 * Marca un elemento como "aria-disabled" (más accesible que disabled)
 */
function setAriaDisabled(element, isDisabled) {
  if (!element) return;
  element.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  if (isDisabled) {
    element.setAttribute('tabindex', '-1');
  } else {
    element.removeAttribute('tabindex');
  }
}

/**
 * Configura modal dialog: inert = fondo no accesible
 */
function setModalA11y(modalElement, isOpen) {
  if (!modalElement) return;
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', 'true');
  
  // Marcar el resto de la página como inert (no accesible)
  var backdrop = modalElement.getAttribute('data-backdrop-id');
  if (backdrop) {
    var bgElement = document.getElementById(backdrop);
    if (bgElement) {
      bgElement.setAttribute('inert', isOpen ? 'inert' : '');
    }
  }
}

/**
 * Configura un botón para disparar un diálogo
 */
function setAriaControls(triggerButton, modalId) {
  if (!triggerButton) return;
  triggerButton.setAttribute('aria-controls', modalId);
}

/**
 * Anuncia algo para screen readers sin cambiar el DOM visible
 */
function announceToScreenReader(message, politeness) {
  politeness = politeness || 'polite';
  var announcement = document.getElementById('a11y-announcement');
  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'a11y-announcement';
    announcement.setAttribute('aria-live', politeness);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'fixed';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    document.body.appendChild(announcement);
  }
  announcement.textContent = message;
}

/**
 * Anuncia un error de forma urgente (assertive)
 */
function announceError(message) {
  announceToScreenReader(message, 'assertive');
}

/**
 * Anuncia un éxito de forma normal (polite)
 */
function announceSuccess(message) {
  announceToScreenReader(message, 'polite');
}

/**
 * Cambia el título de la página (para anunciar cambios de vista)
 */
function updatePageTitle(newTitle) {
  document.title = newTitle;
  // Opcionalmente, anuncia el cambio
  announceToScreenReader(newTitle);
}

/**
 * Crea un "skip link" para saltar contenido repetitivo
 * Típicamente: "Saltar al contenido principal"
 */
function createSkipLink(targetId, linkText) {
  linkText = linkText || 'Saltar al contenido principal';
  var skipLink = document.createElement('a');
  skipLink.href = '#' + targetId;
  skipLink.textContent = linkText;
  skipLink.style.position = 'fixed';
  skipLink.style.top = '-40px';
  skipLink.style.left = '0';
  skipLink.style.background = 'black';
  skipLink.style.color = 'white';
  skipLink.style.padding = '8px';
  skipLink.style.zIndex = '10000';
  skipLink.style.textDecoration = 'none';
  skipLink.style.fontSize = '14px';
  
  skipLink.addEventListener('focus', function() {
    skipLink.style.top = '0';
  });
  skipLink.addEventListener('blur', function() {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Asegura focus visible en elemento
 */
function focusElement(element) {
  if (!element) return;
  element.focus();
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Valida contraste de color (WCAG AA: 4.5:1 para texto)
 * Simplificado: devuelve aproximación
 */
function getLuminance(r, g, b) {
  var a = [r, g, b].map(function(v) {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1, rgb2) {
  var lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  var lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  var lighter = Math.max(lum1, lum2);
  var darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
