// ════════════════════════════════════════════════════════════════
//  MI TURNO · a11y-announcements.js
//  Sistema centralizado de anuncios para screen readers
// ════════════════════════════════════════════════════════════════

/**
 * Crear región ARIA live para anuncios
 */
(function() {
  var announcerContainer = document.createElement('div');
  announcerContainer.id = 'a11y-announcer';
  announcerContainer.setAttribute('aria-live', 'polite');
  announcerContainer.setAttribute('aria-atomic', 'true');
  announcerContainer.style.position = 'absolute';
  announcerContainer.style.left = '-10000px';
  announcerContainer.style.width = '1px';
  announcerContainer.style.height = '1px';
  announcerContainer.style.overflow = 'hidden';
  document.body.appendChild(announcerContainer);
  
  window.a11yAnnouncer = announcerContainer;
})();

/**
 * Anuncio personalizado con delay (para evitar overlap de anuncios)
 */
var pendingAnnouncement = null;
var announcementTimeout = null;

function announceAction(message, options) {
  options = options || {};
  var priority = options.priority || 'polite'; // 'polite' o 'assertive'
  var delay = options.delay !== undefined ? options.delay : 500; // ms antes de anunciar
  
  // Cancelar anuncio pendiente
  if (announcementTimeout) {
    clearTimeout(announcementTimeout);
  }
  
  // Actualizar prioridad del announcer
  var announcer = window.a11yAnnouncer;
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    
    announcementTimeout = setTimeout(function() {
      announcer.textContent = message;
      announcementTimeout = null;
    }, delay);
  }
}

/**
 * Anuncios específicos de la app
 */

function announceTurnoSaved(fecha, horaInicio, horaFin) {
  var msg = 'Turno guardado el ' + fecha + ' de ' + horaInicio + ' a ' + horaFin;
  announceAction(msg, { priority: 'assertive' });
}

function announceTurnoDeleted(fecha) {
  var msg = 'Turno del ' + fecha + ' eliminado';
  announceAction(msg, { priority: 'polite' });
}

function announceCalculationComplete(salarioTotal) {
  var msg = 'Cálculo completado. Salario total: ' + salarioTotal;
  announceAction(msg, { priority: 'assertive' });
}

function announceError(error) {
  var msg = 'Error: ' + (error?.message || error);
  announceAction(msg, { priority: 'assertive' });
}

function announceValidationError(fieldName, reason) {
  var msg = fieldName + ' inválido: ' + reason;
  announceAction(msg, { priority: 'assertive' });
}

function announceLoadingStart(action) {
  var msg = action + ', por favor espera...';
  announceAction(msg, { priority: 'polite' });
}

function announceLoadingEnd(action) {
  var msg = action + ' completado';
  announceAction(msg, { priority: 'polite' });
}

function announceTabChange(tabName) {
  var msg = 'Pestaña: ' + tabName;
  announceAction(msg, { priority: 'polite' });
}

function announceModalOpened(modalTitle) {
  var msg = 'Diálogo abierto: ' + modalTitle;
  announceAction(msg, { priority: 'polite' });
}

function announceModalClosed(modalTitle) {
  var msg = 'Diálogo cerrado: ' + modalTitle;
  announceAction(msg, { priority: 'polite' });
}
