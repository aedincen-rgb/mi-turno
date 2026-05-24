// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/storage.js
//  localStorage seguro con fallback en memoria
// ════════════════════════════════════════════════════════════════
var safeStorage = (function () {
  try {
    var t = '__mt_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return window.localStorage;
  } catch (e) {
    console.warn('[MT] localStorage no disponible, usando memoria');
    var m = {};
    return {
      getItem: function (k) {
        return m[k] || null;
      },
      setItem: function (k, v) {
        m[k] = String(v);
      },
      removeItem: function (k) {
        delete m[k];
      },
      clear: function () {
        m = {};
      },
      key: function (i) {
        return Object.keys(m)[i] || null;
      },
      get length() {
        return Object.keys(m).length;
      }
    };
  }
})();

function leer(k, d) {
  try {
    var v = safeStorage.getItem(k);
    return v != null ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}

function grabar(k, v) {
  try {
    safeStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.warn('[MT] Storage falló:', e);
  }
}

function borrarKey(k) {
  try {
    safeStorage.removeItem(k);
  } catch (e) {}
}
