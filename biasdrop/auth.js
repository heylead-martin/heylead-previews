/* BiasDrop-only client gate. Does NOT unlock other previews.heylead.com sites.
 * GitHub Pages is static - this is casual privacy, not strong security.
 */
(function () {
  var cfg = window.BIASDROP_AUTH;
  if (!cfg) return;

  var path = location.pathname || "";
  if (/\/biasdrop\/login\.html$/i.test(path) || /\/biasdrop\/login\/?$/i.test(path)) return;
  if (/\/biasdrop\/logout\.html$/i.test(path) || /\/biasdrop\/logout\/?$/i.test(path)) return;

  function base() {
    // resolve /biasdrop/ root even from nested routes
    var m = path.match(/^(.*\/biasdrop)(?:\/|$)/i);
    if (m) return m[1].replace(/\/?$/, "/");
    return "/biasdrop/";
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(cfg.sessionKey);
      localStorage.removeItem(cfg.sessionKey);
    } catch (e) {}
  }

  function isLoggedIn() {
    try {
      return (
        sessionStorage.getItem(cfg.sessionKey) === cfg.passwordHash ||
        localStorage.getItem(cfg.sessionKey) === cfg.passwordHash
      );
    } catch (e) {
      return false;
    }
  }

  try {
    if (!isLoggedIn()) {
      var next = encodeURIComponent(location.pathname + location.search + location.hash);
      var loginUrl = base() + "login.html?next=" + next;
      // Give the Insights tracker a moment to boot (snippet is async) so a
      // short session can still open before we leave for the login screen.
      // Full page recording of the gated content still starts after password.
      setTimeout(function () {
        location.replace(loginUrl);
      }, 120);
      return;
    }
  } catch (e) {
    location.replace(base() + "login.html");
    return;
  }

  function mountLogout() {
    if (document.getElementById("biasdrop-logout")) return;
    // hide global previews logout if it somehow mounted
    var globalOut = document.getElementById("previews-logout");
    if (globalOut) globalOut.remove();

    var a = document.createElement("a");
    a.id = "biasdrop-logout";
    a.href = base() + "logout.html";
    a.textContent = "Log out";
    a.setAttribute("aria-label", "Log out of BiasDrop");
    a.style.cssText = [
      "position:fixed",
      "bottom:max(12px,env(safe-area-inset-bottom))",
      "right:max(12px,env(safe-area-inset-right))",
      "z-index:2147483000",
      "font:600 11px/1 Outfit,Inter,system-ui,sans-serif",
      "letter-spacing:0.06em",
      "text-transform:uppercase",
      "text-decoration:none",
      "color:rgba(255,255,255,0.92)",
      "background:rgba(7,7,15,0.85)",
      "border:1px solid rgba(255,45,149,0.35)",
      "backdrop-filter:blur(8px)",
      "-webkit-backdrop-filter:blur(8px)",
      "padding:10px 14px",
      "border-radius:999px",
      "box-shadow:0 8px 24px rgba(255,45,149,0.2)",
      "cursor:pointer",
    ].join(";");
    a.addEventListener("click", function (e) {
      e.preventDefault();
      clearSession();
      location.replace(base() + "login.html");
    });
    document.body.appendChild(a);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountLogout);
  } else {
    mountLogout();
  }
})();
