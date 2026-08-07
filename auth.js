/* Previews site gate - client-side only (GitHub Pages has no server auth).
 * Not a substitute for Cloudflare Access if you need real security.
 */
(function () {
  var cfg = window.PREVIEWS_AUTH;
  if (!cfg) return;

  var path = location.pathname || '';
  if (/login\.html$/i.test(path) || path.endsWith('/login') || path.endsWith('/login/')) return;

  try {
    var ok = sessionStorage.getItem(cfg.sessionKey) === cfg.passwordHash
      || localStorage.getItem(cfg.sessionKey) === cfg.passwordHash;
    if (ok) return;
  } catch (e) {}

  var next = encodeURIComponent(location.pathname + location.search + location.hash);
  location.replace('/login.html?next=' + next);
})();
