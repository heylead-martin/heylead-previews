/* Previews site gate - client-side only (GitHub Pages has no server auth).
 * Not a substitute for Cloudflare Access if you need real security.
 */
(function () {
  var cfg = window.PREVIEWS_AUTH;
  if (!cfg) return;

  var path = location.pathname || '';
  if (/login\.html$/i.test(path) || path.endsWith('/login') || path.endsWith('/login/')) return;
  if (/logout\.html$/i.test(path) || path.endsWith('/logout') || path.endsWith('/logout/')) return;

  function clearSession() {
    try {
      sessionStorage.removeItem(cfg.sessionKey);
      localStorage.removeItem(cfg.sessionKey);
    } catch (e) {}
  }

  function isLoggedIn() {
    try {
      return sessionStorage.getItem(cfg.sessionKey) === cfg.passwordHash
        || localStorage.getItem(cfg.sessionKey) === cfg.passwordHash;
    } catch (e) {
      return false;
    }
  }

  try {
    if (!isLoggedIn()) {
      var next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace('/login.html?next=' + next);
      return;
    }
  } catch (e) {
    location.replace('/login.html');
    return;
  }

  // Floating logout control on every protected page
  function mountLogout() {
    if (document.getElementById('previews-logout')) return;
    var a = document.createElement('a');
    a.id = 'previews-logout';
    a.href = '/logout.html';
    a.textContent = 'Log out';
    a.setAttribute('aria-label', 'Log out of HeyLead Previews');
    a.style.cssText = [
      'position:fixed',
      'bottom:max(12px,env(safe-area-inset-bottom))',
      'right:max(12px,env(safe-area-inset-right))',
      'z-index:2147483000',
      'font:600 11px/1 Inter,system-ui,-apple-system,sans-serif',
      'letter-spacing:0.06em',
      'text-transform:uppercase',
      'text-decoration:none',
      'color:rgba(255,255,255,0.92)',
      'background:rgba(16,21,29,0.78)',
      'border:1px solid rgba(255,255,255,0.14)',
      'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)',
      'padding:10px 14px',
      'border-radius:999px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.22)',
      'cursor:pointer'
    ].join(';');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      clearSession();
      location.replace('/login.html');
    });
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLogout);
  } else {
    mountLogout();
  }
})();
