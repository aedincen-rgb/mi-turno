(function () {
  try {
    var t = JSON.parse(localStorage.getItem('mt_theme'));
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
