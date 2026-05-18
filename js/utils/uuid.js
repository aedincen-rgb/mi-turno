// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/uuid.js
//  Generador de UUID
// ════════════════════════════════════════════════════════════════
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hashP(s) {
  var hv = 0,
    i;
  for (i = 0; i < s.length; i++) {
    hv = (Math.imul(31, hv) + s.charCodeAt(i)) | 0;
  }
  return 'p' + (hv >>> 0).toString(36);
}
