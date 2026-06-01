var _errorLoggerInit = (function () {
  var queue = [];
  var isProcessing = false;

  function shouldLog(message) {
    if (!message) return false;
    var ignore = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection detected',
      'Script error',
      'undefined is not an object'
    ];
    return !ignore.some(function (pattern) {
      return message.indexOf(pattern) !== -1;
    });
  }

  function getStackTrace(error) {
    if (!error || !error.stack) return '';
    return error.stack.substring(0, 500);
  }

  function logToSupabase(errorData) {
    if (!window.SUPA || !isOnline()) return;

    queue.push(errorData);

    if (isProcessing) return;
    isProcessing = true;

    setTimeout(function () {
      if (queue.length === 0) {
        isProcessing = false;
        return;
      }

      var batch = queue.splice(0, 10);

      window.SUPA.from('error_logs')
        .insert(batch)
        .then(function () {
          isProcessing = false;
          if (queue.length > 0) {
            setTimeout(logToSupabase, 100);
          }
        })
        .catch(function (err) {
          isProcessing = false;
        });
    }, 50);
  }

  window.onerror = function (message, source, lineno, colno, error) {
    if (!shouldLog(message)) return false;

    var uid = null;
    try {
      var sess = leer('mt_sess');
      if (sess) {
        var parsed = JSON.parse(sess);
        uid = parsed.user ? parsed.user.id : null;
      }
    } catch (e) {}

    var errorData = {
      message: String(message).substring(0, 255),
      source: source ? source.split('/').pop() : null,
      line: lineno,
      col: colno,
      stack: getStackTrace(error),
      version: window.MT_APP_VERSION || 'unknown',
      user_id: uid,
      ua: navigator.userAgent.substring(0, 255),
      url: window.location.pathname
    };

    logToSupabase(errorData);

    return false;
  };

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var message =
      typeof reason === 'string'
        ? reason
        : reason && reason.message
          ? reason.message
          : String(reason);

    if (!shouldLog(message)) return;

    var uid = null;
    try {
      var sess = leer('mt_sess');
      if (sess) {
        var parsed = JSON.parse(sess);
        uid = parsed.user ? parsed.user.id : null;
      }
    } catch (e) {}

    var errorData = {
      message: 'Unhandled Promise: ' + String(message).substring(0, 220),
      source: 'promise',
      stack: getStackTrace(reason),
      version: window.MT_APP_VERSION || 'unknown',
      user_id: uid,
      ua: navigator.userAgent.substring(0, 255),
      url: window.location.pathname
    };

    logToSupabase(errorData);
  });

  return function () {
    return queue.length;
  };
})();
