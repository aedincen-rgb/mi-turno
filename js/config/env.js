// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/env.js
//  Variables de entorno y aliases React
// ════════════════════════════════════════════════════════════════
// Variables de entorno
var IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
var IS_SAFARI=/^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
var IS_IOS_SAFARI=IS_IOS&&IS_SAFARI;
var IS_STANDALONE=window.navigator.standalone===true;
console.log('[MT] Entorno:',{iOS:IS_IOS,Safari:IS_SAFARI,iOSSafari:IS_IOS_SAFARI,PWA:IS_STANDALONE});
