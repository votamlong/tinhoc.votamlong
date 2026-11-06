// Giả lập google.script.run: gọi Apps Script Web App bằng fetch
(function () {
  function call(fn, args, ok, fail) {
    fetch(window.GAS_API_URL, { method: 'POST', redirect: 'follow',
      body: JSON.stringify({ fn: fn, args: args, token: localStorage.getItem('eduToken') || '' }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r.authError) { localStorage.removeItem('eduUser'); localStorage.removeItem('eduToken'); location.reload(); return; }
        if (r.error) throw new Error(r.error);
        if (fn === 'loginUser' && r.result && r.result.token) localStorage.setItem('eduToken', r.result.token);
        if (ok) ok(r.result);
      })
      .catch(function (e) { if (fail) fail(e); else console.error(fn, e); });
  }
  function make(ok, fail) {
    return new Proxy({}, { get: function (_, name) {
      if (name === 'withSuccessHandler') return function (f) { return make(f, fail); };
      if (name === 'withFailureHandler') return function (f) { return make(ok, f); };
      return function () { call(name, Array.prototype.slice.call(arguments), ok, fail); };
    } });
  }
  window.google = { script: { run: make() } };
})();
