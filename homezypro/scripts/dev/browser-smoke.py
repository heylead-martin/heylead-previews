"""Dev smoke test in system Chrome against scripts/dev/serve-dist.mjs (which applies _headers and
_redirects): every page type loads with the production CSP and no CSP violations or console errors,
the client catalogue renders and searches, logos and icons load, and the redirects answer 301.

    node scripts/dev/serve-dist.mjs 4329 &   python3 scripts/dev/browser-smoke.py 4329
"""
import json
import sys
import urllib.request

from playwright.sync_api import sync_playwright

BASE = f'http://localhost:{sys.argv[1] if len(sys.argv) > 1 else 4329}'
PAGES = ['/', '/plumbing/', '/aircon-servicing/', '/search/?q=cleaning', '/aircon-servicing/chemical-wash/', '/company/art-of-cleaning-pte-ltd/',
         '/company/22-power-electric-pte-ltd/', '/aircon/servicing-price/', '/plumbing/bedok/', '/plumbing/best/', '/blog/', '/blog/ceiling-leak-what-to-do/',
         '/how-it-works/', '/what-service-do-i-need/', '/claim-listing/', '/logo-removal/', '/does-not-exist/']


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


def head(path):
    opener = urllib.request.build_opener(NoRedirect)
    try:
        r = opener.open(BASE + path)
        return r.status, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers)


problems, report = [], {}
for path, want in [('/roster/plumbing/', '/plumbing/'), ('/roster/company/billy-aircon/', '/aircon-servicing/'), ('/company/billy-aircon/', '/aircon-servicing/'), ('/roster', '/')]:
    status, h = head(path)
    if status != 301 or h.get('Location') != want:
        problems.append(f'redirect {path}: {status} {h.get("Location")}')
status, h = head('/logos/')
_, page_headers = head('/plumbing/')
report['html headers'] = {k: v[:60] for k, v in page_headers.items() if k.lower() in ('content-security-policy', 'x-frame-options', 'cache-control', 'x-robots-tag')}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    errors = []
    page.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    page.on('pageerror', lambda e: errors.append(str(e)))
    for path in PAGES:
        errors.clear()
        page.goto(BASE + path, wait_until='networkidle')
        broken = page.evaluate('''() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && !i.dataset.src && !i.src.startsWith('https://')).map(i => i.src)''')
        logo = page.evaluate('() => !!document.querySelector("header .brand-logo") && document.querySelector("header .brand-logo").getBoundingClientRect().height > 20')
        if path.startswith('/search/'):
            page.wait_for_selector('[data-company]', timeout=5000)
            shown = page.evaluate('() => [...document.querySelectorAll("[data-company] h2 a, [data-company] h3 a")].slice(0, 3).map(a => a.textContent)')
            report['search ?q=cleaning first results'] = shown
        if path == '/plumbing/':
            page.click('[data-load-more]')
            page.wait_for_timeout(300)
            report['plumbing cards after load more'] = page.evaluate('() => document.querySelectorAll("[data-other-list] [data-company]").length')
        if path == '/does-not-exist/':  # the 404 page reports its own status
            errors[:] = [e for e in errors if '404 (Not Found)' not in e]
        if errors:
            problems.append(f'{path}: {errors[:3]}')
        if broken:
            problems.append(f'{path}: broken images {broken[:3]}')
        if not logo:
            problems.append(f'{path}: header logo not rendered')
    page.goto(BASE + '/plumbing/')
    report['favicon'] = page.evaluate('() => fetch("/favicon.ico").then(r => r.status)')
    page.screenshot(path='/tmp/hz-header.png', clip={'x': 0, 'y': 0, 'width': 1280, 'height': 260})
    browser.close()

print(json.dumps(report, indent=1))
print('PROBLEMS' if problems else 'OK', *problems, sep='\n')
sys.exit(1 if problems else 0)
