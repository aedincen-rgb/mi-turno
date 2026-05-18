// ════════════════════════════════════════════════════════════════
//  MI TURNO · config/viewport-fix.js
//  Fix viewport iOS
// ════════════════════════════════════════════════════════════════
// Fix viewport iOS (notch, safe area, barra dinámica)
if (IS_IOS) {
  try {
    var setVH = function () {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', function () {
      setTimeout(setVH, 100);
    });
  } catch (e) {}
}
