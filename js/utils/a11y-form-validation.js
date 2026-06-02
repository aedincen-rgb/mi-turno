// ════════════════════════════════════════════════════════════════
//  MI TURNO · a11y-form-validation.js
//  Validación accesible con mensajes para screen readers
// ════════════════════════════════════════════════════════════════

/**
 * Valida un input y anuncia el error para screen readers
 */
function validateInput(input, rules) {
  rules = rules || {};
  var errors = [];
  var value = input.value.trim();
  var label = input.getAttribute('aria-label') || input.name || 'Campo';
  
  // Requerido
  if (rules.required && !value) {
    errors.push(label + ' es requerido');
  }
  
  // Mínimo
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    errors.push(label + ' debe ser mayor a ' + rules.min);
  }
  
  // Máximo
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    errors.push(label + ' debe ser menor a ' + rules.max);
  }
  
  // Patrón (regex)
  if (rules.pattern && value && !rules.pattern.test(value)) {
    errors.push((rules.patternMessage || label + ' tiene formato inválido'));
  }
  
  // Email
  if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push(label + ' debe ser un email válido');
  }
  
  // Mostrar/ocultar errores en UI
  displayInputErrors(input, errors);
  
  // Anunciar al screen reader si hay errores
  if (errors.length > 0) {
    announceError(label + ': ' + errors.join('. '));
  }
  
  return errors.length === 0;
}

/**
 * Muestra errores visuales en el input
 */
function displayInputErrors(input, errors) {
  var errorId = input.id + '-error';
  var existing = document.getElementById(errorId);
  
  // Remover error anterior
  if (existing) {
    existing.remove();
    var describedBy = input.getAttribute('aria-describedby') || '';
    input.setAttribute('aria-describedby', describedBy.replace(errorId, '').trim());
  }
  
  if (errors.length > 0) {
    // Crear elemento de error
    var errorEl = document.createElement('div');
    errorEl.id = errorId;
    errorEl.className = 'input-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = errors[0]; // Mostrar primer error
    errorEl.style.color = 'var(--danger)';
    errorEl.style.fontSize = '14px';
    errorEl.style.marginTop = '4px';
    
    input.parentNode.insertBefore(errorEl, input.nextSibling);
    input.setAttribute('aria-invalid', 'true');
    
    // Conectar con aria-describedby
    var describedBy = input.getAttribute('aria-describedby') || '';
    var ids = describedBy ? describedBy.split(' ') : [];
    if (!ids.includes(errorId)) {
      ids.push(errorId);
      input.setAttribute('aria-describedby', ids.join(' '));
    }
  } else {
    input.setAttribute('aria-invalid', 'false');
  }
}

/**
 * Valida un formulario completo
 */
function validateForm(formElement, validationRules) {
  validationRules = validationRules || {};
  var allValid = true;
  var firstInvalidInput = null;
  
  var inputs = formElement.querySelectorAll('input, textarea, select');
  inputs.forEach(function(input) {
    var inputName = input.name || input.id;
    var rules = validationRules[inputName] || {};
    
    if (!validateInput(input, rules)) {
      allValid = false;
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
    }
  });
  
  // Mover focus al primer campo inválido
  if (firstInvalidInput) {
    focusElement(firstInvalidInput);
    announceError('Hay errores en el formulario. Revisa los campos resaltados.');
  } else {
    announceSuccess('Formulario válido. Puedes enviar.');
  }
  
  return allValid;
}

/**
 * Manejar submit de formulario con validación
 */
function setupFormValidation(formElement, validationRules, onSubmit) {
  formElement.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (validateForm(formElement, validationRules)) {
      if (typeof onSubmit === 'function') {
        onSubmit(formElement);
      }
    }
  });
  
  // Validación en tiempo real (on blur)
  var inputs = formElement.querySelectorAll('input, textarea, select');
  inputs.forEach(function(input) {
    input.addEventListener('blur', function() {
      var inputName = input.name || input.id;
      var rules = validationRules[inputName] || {};
      validateInput(input, rules);
    });
  });
}

/**
 * Validadores específicos de Mi Turno
 */

function validateSalario(input) {
  var value = parseFloat(input.value);
  var sminimo = 1750905; // Salario mínimo 2026
  
  var rules = {
    required: true,
    min: sminimo,
    max: 999999999
  };
  
  return validateInput(input, rules);
}

function validateTime(input) {
  // Formato HH:MM
  var pattern = /^([0-1]\d|2[0-3]):[0-5]\d$/;
  var rules = {
    required: true,
    pattern: pattern,
    patternMessage: 'Formato de hora inválido. Usa HH:MM (0-23:00-59)'
  };
  
  return validateInput(input, rules);
}

function validateDate(input) {
  var value = input.value;
  var rules = {
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    patternMessage: 'Formato de fecha inválido. Usa YYYY-MM-DD'
  };
  
  if (!validateInput(input, rules)) return false;
  
  // Validar que sea una fecha real
  var date = new Date(value + 'T00:00:00');
  if (isNaN(date.getTime())) {
    displayInputErrors(input, ['Fecha inválida']);
    return false;
  }
  
  return true;
}
