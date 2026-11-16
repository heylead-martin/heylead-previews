"""Final checks: exact 24-page set (1:1 with the live site), links/assets, forbidden strings, head meta."""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# live page -> new path (REVISION2.md)
EXPECTED = [
    ("/", ""), ("/privacy-policy/", "poveritelnost"), ("/cookie-policy/", "biskvitki"),
    ("/сусамово-масло/", "susamovo-maslo"), ("/google-reviews/", "otzivi"), ("/yumeiho/", "yumeiho"),
    ("/емоционални-проблеми/", "emocionalni-problemi"), ("/deep-tissue-massage/", "dalbokotakanen-masazh"),
    ("/bamboo-sticks-massage/", "masazh-s-bambukovi-prachki"),
    ("/emotional_unblocking/", "razvarzvane-na-emocionalni-blokazhi"), ("/balkan-massage/", "balkansko-gazene"),
    ("/prices/", "ceni"), ("/products/", "produkti"), ("/ваучер/", "vaucheri"), ("/regression/", "regresia"),
    ("/tiger-balm/", "tigrov-balsam"), ("/contacts/", "kontakti"), ("/nlp/", "nlp-terapia"),
    ("/chiropractor_sofia/", "chakrakchia"), ("/легенче-топла-вода-сол/", "legenche-topla-voda-sol"),
    ("/recycling/", "reciklirane"), ("/речник-болест-причина-решение-по-луиз/", "rechnik-luiz-hei"),
    ("/лечебен-масаж-rade-center-sofia/", "lecheben-masazh"), ("/sleep/", "son"),
]
errs = []
pages = []
for d, _, fs in os.walk(ROOT):
    if "_tools" in d: continue
    for f in fs:
        if f.endswith(".html"): pages.append(os.path.join(d, f))
want = {os.path.join(p, "index.html") if p else "index.html" for _, p in EXPECTED}
have = {os.path.relpath(p, ROOT) for p in pages}
if len(EXPECTED) != 24: errs.append("EXPECTED table must have 24 rows")
for x in sorted(want - have): errs.append(f"missing page {x}")
for x in sorted(have - want): errs.append(f"unexpected page {x}")
if len(pages) != 24: errs.append(f"expected exactly 24 html pages, found {len(pages)}")
titles, descs = {}, {}
for p in pages:
    s = open(p, encoding="utf-8").read()
    rel = os.path.relpath(p, ROOT)
    for need in ['<meta name="robots" content="noindex, nofollow, noarchive">', '<html lang="bg"', 'name="viewport"']:
        if need not in s: errs.append(f"{rel}: missing {need}")
    if re.search(r"auth(-config)?\.js", s): errs.append(f"{rel}: auth script")
    if re.search(r'rel="canonical"', s): errs.append(f"{rel}: canonical")
    if re.search(r"(?<![а-яА-Я])(лв\.?|лева)(?![а-яА-Я])|BGN", s): errs.append(f"{rel}: currency лв/BGN")
    if "Пиротска" in s: errs.append(f"{rel}: old address")
    if "Marian" in s or "Мариян" in s: errs.append(f"{rel}: Marian review")
    t = re.search(r"<title>(.*?)</title>", s).group(1); titles.setdefault(t, []).append(rel)
    m = re.search(r'<meta name="description" content="(.*?)">', s); descs.setdefault(m.group(1), []).append(rel)
    for attr, url in re.findall(r'(href|src|srcset)="([^"]+)"', s):
        urls = [u.strip().split(" ")[0] for u in url.split(",")] if attr == "srcset" else [url]
        for u in urls:
            if re.match(r"(https?:|mailto:|tel:|viber:|#)", u): continue
            if not u.startswith("/radecenter/"):
                errs.append(f"{rel}: non-absolute {attr} {u}"); continue
            path = u.split("#")[0][len("/radecenter/"):]
            fp = os.path.join(ROOT, path)
            if path == "" or path.endswith("/"): fp = os.path.join(fp, "index.html")
            if not os.path.isfile(fp): errs.append(f"{rel}: broken {u}")
    for m in re.finditer(r"<img [^>]+>", s):
        tag = m.group(0)
        if "width=" not in tag or "height=" not in tag or 'alt=' not in tag: errs.append(f"{rel}: img attrs {tag[:80]}")
        if "logo.webp" not in tag and 'decoding="async"' not in tag: errs.append(f"{rel}: img without decoding=async {tag[:80]}")
        if "logo.webp" not in tag and 'loading="lazy"' not in tag and 'fetchpriority="high"' not in tag: errs.append(f"{rel}: img neither lazy nor hero {tag[:80]}")
    if len(re.findall(r'fetchpriority="high"', s)) > 1: errs.append(f"{rel}: more than one fetchpriority=high")
    if rel in ("index.html", os.path.join("kontakti", "index.html")):
        for ph in ("vhod-1.webp", "vhod-2.webp", "adres-sredna-gora-68.webp"):
            if ph not in s: errs.append(f"{rel}: missing entrance photo {ph}")
    for m in re.finditer(r'<a [^>]*target="_blank"[^>]*>', s):
        if 'rel="noopener"' not in m.group(0): errs.append(f"{rel}: target without noopener")
for k, v in list(titles.items()) + list(descs.items()):
    if len(v) > 1: errs.append(f"duplicate title/desc {k}: {v}")
print(f"{len(pages)} pages checked")
css = os.path.getsize(os.path.join(ROOT, "css/site.css")); js = os.path.getsize(os.path.join(ROOT, "js/site.js"))
rjs = os.path.getsize(os.path.join(ROOT, "js/rechnik.js"))
print(f"css {css} B, js {js} B, rechnik.js {rjs} B")
if css > 40000 or js > 3000 or rjs > 1500: errs.append("asset size budget")
if not errs:
    print("\nPages (live → new):")
    for live, p in EXPECTED:
        print(f"  {live:<45} /radecenter/{p + '/' if p else ''}")
print("\n".join(errs) if errs else "ALL CHECKS PASSED")
sys.exit(1 if errs else 0)
