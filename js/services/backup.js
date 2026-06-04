// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/backup.js
//  Respaldo y restauración de datos locales
//  Exporta localStorage a un archivo .json y permite restaurarlo.
//  100% offline · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── EXPORTAR RESPALDO ────────────────────────────────────────
// Recolecta todas las claves mt_* de localStorage y las empaqueta
// en un archivo .json que se descarga automáticamente.
function backupExport() {
  try {
    var data = {};
    var count = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('mt_') === 0) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (_) {
          data[key] = localStorage.getItem(key);
        }
        count++;
      }
    }

    if (count === 0) {
      alert('No hay datos para respaldar. Registrá algunos turnos primero.');
      return false;
    }

    var backup = {
      app: 'mi-turno',
      version: typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'v95',
      date: new Date().toISOString(),
      keys: count,
      data: data
    };

    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'mi-turno-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    alert('Error al crear el respaldo: ' + (err.message || err));
    return false;
  }
}

// ─── IMPORTAR RESPALDO ────────────────────────────────────────
// Abre un selector de archivos, valida el .json y restaura los datos.
// callback(isSuccess, message) se llama al finalizar.
function backupImport(callback) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';

  input.onchange = function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) {
      if (callback) callback(false, 'No se seleccionó ningún archivo.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var backup = JSON.parse(ev.target.result);

        // Validar estructura
        if (!backup || backup.app !== 'mi-turno' || !backup.data || typeof backup.data !== 'object') {
          if (callback) callback(false, 'El archivo no es un respaldo válido de Mi Turno.');
          return;
        }

        var keys = Object.keys(backup.data);
        if (keys.length === 0) {
          if (callback) callback(false, 'El respaldo está vacío.');
          return;
        }

        // Confirmación antes de sobrescribir
        var confirmed = confirm(
          '¿Restaurar este respaldo?\n\n' +
          '📅 Fecha: ' + (backup.date ? new Date(backup.date).toLocaleString('es-CO') : 'Desconocida') + '\n' +
          '📦 Versión: ' + (backup.version || 'Desconocida') + '\n' +
          '🔑 Datos: ' + keys.length + ' registros\n\n' +
          '⚠️ Esto reemplazará tus datos actuales. La app se recargará.'
        );

        if (!confirmed) {
          if (callback) callback(false, 'Restauración cancelada.');
          return;
        }

        // Restaurar
        var restored = 0;
        var failed = 0;
        for (var i = 0; i < keys.length; i++) {
          try {
            var val = backup.data[keys[i]];
            var str = typeof val === 'string' ? val : JSON.stringify(val);
            localStorage.setItem(keys[i], str);
            restored++;
          } catch (_) {
            failed++;
          }
        }

        // Guardar timestamp de última restauración
        try {
          localStorage.setItem('mt_backup_restored', new Date().toISOString());
        } catch (_) {}

        if (callback) callback(true, 'Se restauraron ' + restored + ' registros' + (failed > 0 ? ' (' + failed + ' errores)' : '') + '.');
      } catch (err) {
        if (callback) callback(false, 'El archivo no es un JSON válido.');
      }
    };

    reader.onerror = function () {
      if (callback) callback(false, 'No se pudo leer el archivo.');
    };

    reader.readAsText(file);
  };

  // Trigger click
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// ─── RECORDATORIO DE RESPALDO ─────────────────────────────────
// Sugiere respaldar cada 15 días. Devuelve true si toca recordar.
function backupShouldRemind() {
  try {
    var lastBackup = localStorage.getItem('mt_backup_exported');
    var lastRestore = localStorage.getItem('mt_backup_restored');
    var last = lastBackup || lastRestore;
    if (!last) return true; // nunca respaldó

    var lastDate = new Date(last);
    var now = new Date();
    var days = (now - lastDate) / (1000 * 60 * 60 * 24);
    return days >= 15;
  } catch (_) {
    return false;
  }
}

// Marcar que ya se respaldó (para el recordatorio)
function backupMarkExported() {
  try {
    localStorage.setItem('mt_backup_exported', new Date().toISOString());
  } catch (_) {}
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
console.log('[MT] backup.js cargado');
