"""Shared helpers + layout for the Rade Center static site generator."""
import os, html
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = "/radecenter"
SUPERDOC = "https://superdoc.bg/radecenter"
TEL = "tel:+359885314878"
PHONE = "0885 314 878"
EMAIL = "radecentersofia@gmail.com"
VIBER = "viber://chat?number=%2B359885314878"
WHATSAPP = "https://wa.me/359885314878"
FACEBOOK = "https://www.facebook.com/radecenter/"
YOUTUBE = "https://www.youtube.com/channel/UCeG_o4bqvIEtnSyqvIAAhZw"
TRIPADVISOR = "https://www.tripadvisor.com/Attraction_Review-g294452-d15099768-Reviews-Rade_Center_Yumeiho_Reiki_Therapy_Massages_in_Sofia_Bulgaria-Sofia_Sofia_Region.html"
GOOGLE_REVIEWS = "https://maps.google.com/?cid=6469132271704086732"
MAPS = "https://www.google.com/maps/search/?api=1&query=ул.+Средна+гора+68,+София"
MAP_EMBED = "https://www.google.com/maps?q=%D1%83%D0%BB.+%D0%A1%D1%80%D0%B5%D0%B4%D0%BD%D0%B0+%D0%B3%D0%BE%D1%80%D0%B0+68,+%D0%A1%D0%BE%D1%84%D0%B8%D1%8F&output=embed"
ADDRESS = "ул. „Средна гора“ 68, София"
EXT = 'target="_blank" rel="noopener"'

ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'
ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'


def esc(s):
    return html.escape(s, quote=True)


def img(name, alt, sizes="100vw", cls="", eager=False, w=None):
    """<img> with intrinsic size + srcset using the -700 variant when present."""
    path = os.path.join(ROOT, "img", name + ".webp")
    W, H = Image.open(path).size
    small = os.path.join(ROOT, "img", name + "-700.webp")
    attrs = [f'src="{B}/img/{name}.webp"']
    if os.path.exists(small) and W > 700:
        attrs.append(f'srcset="{B}/img/{name}-700.webp 700w, {B}/img/{name}.webp {W}w"')
        attrs.append(f'sizes="{sizes}"')
    attrs.append(f'width="{W}" height="{H}"')
    attrs.append(f'alt="{esc(alt)}"')
    if cls:
        attrs.append(f'class="{cls}"')
    if eager:
        attrs.append('loading="eager" fetchpriority="high" decoding="async"')
    else:
        attrs.append('loading="lazy" decoding="async"')
    return "<img " + " ".join(attrs) + ">"


def btn_book(cls="btn btn--primary", label="Запази час в SuperDoc"):
    return f'<a class="{cls}" href="{SUPERDOC}" {EXT}>{ICON_CAL}{label}</a>'


def btn_call(cls="btn btn--ghost", label=f"Обади се {PHONE}"):
    return f'<a class="{cls}" href="{TEL}">{ICON_PHONE}{label}</a>'


# ---------- Reviews (real Google reviews; only obvious typos fixed) ----------
REVIEWS = {
    "valya": ("Valya Meshalova", "Посетих Радо в RadeCenter за юмейхо терапия и останах очарована от знанията и уменията му, съчетани с разбиране и топло човешко отношение. Умее да предразполага и споделя съвети за превенция вкъщи. Ръцете, вратът и кръстът ми бяха много сковани, имах проблем с възпалена фасция на стъпалото. Тръгвам си нов човек и се чувствам прекрасно след терапията му."),
    "zornitsa": ("Zornitsa Stoilova", "Страхотен професионалист! Влязох в кабинета с прищипан нерв и ужасни болки. След час излязох ходейки сама, с огромно облекчение и усмивка на лице 😀 Много внимателно работи и явно знае какво прави. Препоръчвам го на всичките ми познати. Голямо БЛАГОДАРЯ, бъди здрав!"),
    "valentina": ("Valentina Toleva", "Посетих Радо за чакруване и останах изключително доволна. Отделя специално внимание да намери източника на проблема и да даде по някой полезен съвет за решаването му. Истински професионалист в това, което прави."),
    "dimo": ("Dimo Zhelevski", "След юмейхо процедурата смея да твърдя, че толкова добре не съм се чувствал от години! Просветна ми, олекна ми, заредих се с енергия! Освен самата процедура получих и съвети за това какво да променя в начина ми на живот, за да се запази този резултат повече време. Определено бих препоръчал на всички!"),
    "ivaylo": ("Ivaylo Vatovski", "Чувството след първата юмейхо терапия е все едно съм махнал 10 кг товар от гърба си. Радостин обяснява всяка стъпка и е чудесен човек за комуникация."),
    "kristina": ("Kristina Vladimirova", "Радо е страхотен! Знания, умения, съчетани с разбиране и топло човешко отношение. Гърбът, вратът и кръстът ми бяха напълно сковани. Тръгнах си нов човек! Препоръчвам с две ръце! 🙂"),
    "plamen": ("plamen tomov", "Днес посетих центъра за първи път, препоръчан от мой роднина, който вече беше ползвал услугите на центъра. Имам проблем с кръста от години, а от около месец и болки в шийните прешлени. Останах приятно изненадан от първия сеанс и отношението на Радо. Обяснява всяко свое действие. Облекчението е факт. Препоръчвам горещо на всеки с подобни проблеми. Огромно благодаря, Радо! :)"),
    "ekaterina": ("Ekaterina Doncheva", "Много трудно е да намериш специалист в областта, който знае какво прави. Дори и доказани физиотерапевти не умеят да облекчат болката и да „напипат“ проблема така, както Ради го прави. Силно препоръчвам – мен ме облекчава и спасява от болка и блокажи всеки път."),
    "branimir": ("Branimir Negrevski", "Това място е невероятно. Тоест тук се чувствам много различно, като дойда. Първо, човекът Ради те предразполага да говориш. Изслушва те и след това говори. Качество, което не се среща често днес сред хората. Юмейхо масажът е много добър. След масажа се чувствам нов и с различна нагласа за себе си и за живота. Масажа препоръчвам на всеки, който има нужда, и не само – също и на хората, които обичат да се грижат за себе си ей така, профилактично."),
    "iolanda": ("Iolanda Cossa", "Лично аз отидох доста схваната и с болки, но благодарение на терапията се почувствах изключително облекчена. Най-хубавото е, че Радо знае как да те предразположи, подхожда с разбиране и освен това няма как да си тръгнеш, без да си научил нещо ново и полезно за теб. Благодаря, Радо!"),
    "vladimir": ("Vladimir Valchev", "Като колега и професионалист, който работи в Щатите, бях изключително очарован от техниката и похватите, които Радо ползва. Той не само успява да облекчи физическите проблеми, но обръща внимание и на психологичните пречки, които ние сами си поставяме. Един сеанс с него е достатъчен да ви замисли за вашите проблеми в дълбочина. Радо е създаден да помага и да обучава."),
    "stanislav": ("Stanislav Stefanov", "Радо е невероятен специалист и човек. Целият ми гръб беше скован, но буквално с едно ходене бях като нов. Не само работата на Радо е невероятна, но и отношението му. Говори си с вас като с приятели и наистина иска да ви помогне. Ако някой има проблем с кръста или нещо друго, Радо определено е вашият човек."),
    "toshev": ("Александър Тошев", "Много приятно и безболезнено наместване! Радо отделя време да обясни и покаже на клиента как технически се появяват проблемите, свързани с гръбнака."),
    "diana": ("Diana Rangelova", "Страхотно отношение и комуникация, закупих ваучер и съм много доволна. Препоръчвам терапията с чакръкчия!"),
    "julia": ("Julia Milcheva", "Радо е професионалист. Бях при него на акупресура и съм изключително доволна. Има много знания и работи страхотно."),
    "ventsislav": ("Ventsislav Ivanov", "Отлично качество на мануалната терапия на Радо. Облекчи ми болката в нерва на задния бедрен мускул още от първото посещение. При нужда ще се обръщам към него отново."),
    "aysen": ("Айсен Кременлиева", "Юмейхо терапията както те кара да усещаш тялото си леко, така те учи да бъдеш тук и сега, което се дължеше на човешкото и професионално отношение на Ради. Благодаря! 🙂"),
    "kk": ("k k", "Терапия за душа и тяло. Радо е страхотен професионалист. Извършва процедура, подобряваща не само физическото, но и душевното състояние. Изключително внимателен, а комуникацията с него е повече от добра."),
    "jordan": ("jordan tsolov", "Беше просто невероятно, отидох с болки в гърба и раменете… А си тръгнах буквално като чисто нов човек. Просто човекът си разбира от работата, супер позитивен и отзивчив и определено професионалист в своята сфера! Препоръчвам!"),
    "stefan": ("Stefan Kerekov", "Виках много, боля ме още повече, но физическото и психическото облекчение и удовлетворението след това са уникални. Радо пипа изключително здраво и определено знае какво прави. Препоръчвам с две ръце!"),
    "nina": ("Nina Yaneva", "Мълчаливата признателност не е от полза на никого и затова изказвам моята лична преценка към Радостин Русев – Чакръкчия и Юмейхо терапевт. Изключително внимателен, преди всичко е човек и след това е професионалист. Благодаря…"),
}


def review(key, cls="review", label=None):
    name, text = REVIEWS[key]
    initial = name.strip()[0].upper()
    lab = f" · {label}" if label else ""
    return (f'<figure class="{cls}"><div class="stars" aria-label="5 от 5 звезди">★★★★★</div>'
            f'<blockquote><p>{esc(text)}</p></blockquote>'
            f'<figcaption><span class="avatar" aria-hidden="true">{esc(initial)}</span>'
            f'<span><b>{esc(name)}</b><span>Отзив в Google{lab}</span></span></figcaption></figure>')


def reviews_carousel(keys):
    """Home: grid on desktop, scroll-snap carousel on mobile, long texts clamped."""
    return ('<div class="reviews reviews--home" role="region" aria-label="Отзиви от Google (плъзнете за още)" tabindex="0">'
            + "".join(review(k, "review review--clamp") for k in keys) + "</div>")


def reviews_grid(keys, cls="reviews"):
    return f'<div class="{cls}">' + "".join(review(k) for k in keys) + "</div>"


RATING = '<span class="rating">4.9 <span class="stars">★</span> в Google · 152 отзива</span>'


def faq(items):
    out = ['<div class="faq">']
    for q, a in items:
        out.append(f"<details><summary>{q}</summary><div>{a}</div></details>")
    out.append("</div>")
    return "".join(out)


def crumbs(items):
    """items: list of (label, href|None)."""
    lis = []
    for label, href in items:
        if href:
            lis.append(f'<li><a href="{href}">{label}</a></li>')
        else:
            lis.append(f'<li aria-current="page">{label}</li>')
    return f'<nav class="crumbs" aria-label="Навигационна пътечка"><ol><li><a href="{B}/">Начало</a></li>{"".join(lis)}</ol></nav>'


def cta_band(title="Готови ли сте за първата си среща с Радо?",
             text="Запазете час онлайн в SuperDoc или се обадете – ще намерим удобен ден и час."):
    return (f'<section class="section"><div class="wrap"><div class="cta-band"><div><h2>{title}</h2><p>{text}</p></div>'
            f'<div class="btn-row">{btn_book("btn btn--light")}{btn_call("btn btn--outline-light")}</div></div></div></section>')


HOURS = ('<dl class="hours"><dt>Понеделник – Събота</dt><dd>10:00 – 20:00</dd>'
         '<dt>Неделя</dt><dd>почивен ден</dd></dl>')

DISCLAIMER = ("Терапиите в Rade Center не заменят медицинската диагностика и лечение. "
              "При сериозни или остри оплаквания се консултирайте с лекар.")

NAV = [
    ("terapii", "Терапии"), ("ceni", "Цени"), ("chakrakchia", "За Радо"), ("otzivi", "Отзиви"),
    ("produkti", "Продукти"), ("vaucheri", "Ваучери"), ("kontakti", "Контакти"),
]

ARTICLES = [
    # slug, short title, summary, img, alt
    ("lecheben-masazh", "Лечебен масаж в Rade Center",
     "Юмейхо, балканско газене, дълбокотъканен масаж, развързване на емоционални блокажи и бамбукови пръчки – какво представлява всеки лечебен масаж.",
     "yumeiho-2", "Юмейхо терапия – Радо работи с пациент"),
    ("son", "Спите ли човешки или се гърчите от болки?",
     "Коя поза за сън е най-добра за гърба, мек или твърд матрак, каква възглавница – съвети от практиката на чакръкчия.",
     "son-matrak", "Двойка спи на матрак"),
    ("legenche-topla-voda-sol", "След дълъг работен ден – легенче с топла вода и сол",
     "Стар домашен метод за уморени крака: как действа, за кого е, колко сол и колко топла вода.",
     "legenche-topla-voda", "Радо с крака в легенче с топла вода"),
    ("rechnik-luiz-hei", "Речник Болест – Причина – Решение по Луиз Хей",
     "Таблица на физическите проблеми и вероятните им мисловни причини, с нов мисловен модел за всяко състояние – с търсене и азбучен указател.",
     None, None),
]
ARTICLE_SHORT = {"lecheben-masazh": "Лечебен масаж", "son": "Сън и болки в гърба",
                 "legenche-topla-voda-sol": "Легенче с топла вода и сол", "rechnik-luiz-hei": "Речник по Луиз Хей"}

SERVICES = [
    # slug, name, short, img, duration, price, group
    ("chakrakchia", "Чакръкчия", "Традиционно мануално наместване – Радо сам открива къде е проблемът в тялото.", "therapy-back", "1 час", "40 €", "body"),
    ("yumeiho", "Юмейхо терапия", "Японски метод за възстановяване на баланса в тялото – масажни техники, наместване и акупресура.", "yumeiho", "от 1 час", "от 40 €", "body"),
    ("balkansko-gazene", "Балканско газене", "Старата българска традиция „ходене по гърба“ – за схванатост и отпускане на мускулите.", "balkansko-gazene-wide", "1 час", "40 €", "body"),
    ("dalbokotakanen-masazh", "Дълбокотъканен масаж", "Масаж със сусамово масло за натоварени гръб, рамене и шия – дълбоко отпускане.", "dalbokotakanen-masazh", "1 час", "40 €", "body"),
    ("masazh-s-bambukovi-prachki", "Масаж с бамбукови пръчки", "Ръчна процедура през дрехите за по-добра циркулация на лимфата.", "bambukovi-prachki-wide", "1 час", "40 €", "body"),
    ("razvarzvane-na-emocionalni-blokazhi", "Развързване на емоционални блокажи", "Акупресура, съчетана с психологически упражнения, при натрупани емоции и напрежение.", "emocionalni-blokazhi", "1 час", "40 €", "mind"),
    ("regresia", "Регресия", "Спокоен процес без хипноза за търсене на лични отговори – с възможност за аудио запис.", "regresia", "1 ч. 30 мин. – 2 часа", "40 €", "mind"),
    ("nlp-terapia", "НЛП терапия", "Невролингвистично програмиране – практични техники срещу страх, тревожност и стари модели.", "nlp-terapia", "1 ч. 30 мин.", "40 €", "mind"),
]
SERVICE_BY_SLUG = {s[0]: s for s in SERVICES}
# one-line descriptions for the compact mobile cards (<640px)
TAGLINE = {'chakrakchia': 'Традиционно мануално наместване.', 'yumeiho': 'Японски метод за баланс в тялото.', 'balkansko-gazene': 'Българската традиция „ходене по гърба“.', 'dalbokotakanen-masazh': 'Дълбоко отпускане за гръб, рамене и шия.', 'masazh-s-bambukovi-prachki': 'За по-добра циркулация на лимфата.', 'razvarzvane-na-emocionalni-blokazhi': 'Акупресура с психологически упражнения.', 'regresia': 'Без хипноза, с възможен аудио запис.', 'nlp-terapia': 'Техники срещу страх и тревожност.'}



def service_card(slug, sizes="(min-width: 1180px) 280px, (min-width: 640px) 45vw, 88px"):
    s = SERVICE_BY_SLUG[slug]
    return (f'<article class="card">{img(s[3], s[1] + " в Rade Center", sizes=sizes)}'
            f'<div class="card-body"><h3><a href="{B}/{slug}/">{s[1]}</a></h3>'
            f'<p class="card-desc">{s[2]}</p><p class="card-tag">{TAGLINE[slug]}</p>'
            f'<div class="meta"><span>{s[4]}</span><span>{s[5]}</span></div></div></article>')


def header(active):
    def cu(x):
        return ' aria-current="page"' if active == x else ""
    lis = []
    for slug, label in NAV:
        if slug == "terapii":
            sub = "".join(f'<li><a href="{B}/{x[0]}/"{cu(x[0])}>{x[1]}</a></li>' for x in SERVICES)
            sub += f'<li class="sub-sep"><a href="{B}/emocionalni-problemi/"{cu("emocionalni-problemi")}>Емоционални проблеми</a></li>'
            on = active in SERVICE_BY_SLUG or active == "emocionalni-problemi"
            lis.append(f'<li class="has-sub{" is-active" if on else ""}"><a href="{B}/#terapii">{label}</a><ul class="sub">{sub}</ul></li>')
        else:
            lis.append(f'<li><a href="{B}/{slug}/"{cu(slug)}>{label}</a></li>')
    return f'''<a class="skip-link" href="#main">Към съдържанието</a>
<header class="site-header"><div class="wrap header-in">
<a class="brand" href="{B}/" aria-label="Rade Center – начало"><img src="{B}/img/logo.webp" width="300" height="300" alt="Лого на Rade Center" decoding="async">Rade Center</a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span>Меню</button>
<nav class="nav" id="site-nav" aria-label="Основна навигация"><ul>{"".join(lis)}</ul></nav>
{btn_book("btn btn--primary btn--sm header-cta", "Запази час")}
</div></header>'''


def footer():
    pages = [("", "Начало"), ("ceni", "Цени"), ("chakrakchia", "За Радо"), ("otzivi", "Отзиви"),
             ("produkti", "Продукти"), ("vaucheri", "Ваучери"), ("kontakti", "Контакти")]
    links = "".join(f'<li><a href="{B}/{s + "/" if s else ""}">{l}</a></li>' for s, l in pages)
    svc = "".join(f'<li><a href="{B}/{s[0]}/">{s[1]}</a></li>' for s in SERVICES)
    svc += f'<li><a href="{B}/emocionalni-problemi/">Емоционални проблеми</a></li>'
    use = "".join(f'<li><a href="{B}/{a[0]}/">{ARTICLE_SHORT[a[0]]}</a></li>' for a in ARTICLES)
    return f'''<footer class="site-footer"><div class="wrap">
<div class="footer-grid">
<div><div class="footer-brand"><img src="{B}/img/logo.webp" width="300" height="300" alt="" loading="lazy" decoding="async">Rade Center</div>
<p>Чакръкчия, Юмейхо, масаж, регресия и НЛП терапия в София с Радостин „Радо“ Русев.</p>
<p>{ADDRESS}<br>до западния изход на метростанция „Опълченска“</p>
<p><a href="{TEL}">{PHONE}</a><br><a href="mailto:{EMAIL}">{EMAIL}</a></p>
<p>Понеделник – Събота: 10:00 – 20:00<br>Неделя – почивен ден</p>
<div class="social"><a href="{FACEBOOK}" {EXT}>Facebook</a><a href="{YOUTUBE}" {EXT}>YouTube</a><a href="{TRIPADVISOR}" {EXT}>Tripadvisor</a><a href="{GOOGLE_REVIEWS}" {EXT}>Google</a></div></div>
<div><h2>Терапии</h2><ul>{svc}</ul></div>
<div><h2>Полезно</h2><ul>{use}</ul></div>
<div><h2>Страници</h2><ul>{links}</ul></div>
</div>
<div class="disclaimer"><p>{DISCLAIMER} Ако имате изследвания (ЯМР, скенер, рентген), донесете ги при първото посещение.</p>
<p class="legal"><span>© 2026 Rade Center</span><a href="{B}/poveritelnost/">Поверителност</a><a href="{B}/biskvitki/">Бисквитки</a><a href="{B}/reciklirane/">Рециклиране</a></p></div>
</div></footer>
<div class="mobile-bar">{btn_call("btn btn--ghost", "Обади се")}{btn_book("btn btn--primary", "Запази час")}</div>'''


def page(title, desc, body, active=None):
    return f'''<!doctype html>
<html lang="bg" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#2e4a3b">
<link rel="preload" href="{B}/fonts/lora-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{B}/fonts/manrope-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{B}/css/site.css">
<link rel="icon" href="{B}/img/logo.webp" type="image/webp">
<script>document.documentElement.className='js'</script>
<script src="{B}/js/site.js" defer></script>
</head>
<body>
{header(active)}
<main id="main">
{body}
</main>
{footer()}
</body>
</html>
'''


def write(rel, html_text):
    path = os.path.join(ROOT, rel.strip("/"), "index.html") if not rel.endswith(".html") else os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html_text)
    return path


def article_card(slug):
    a = next(x for x in ARTICLES if x[0] == slug)
    media = img(a[3], a[4], sizes="(min-width: 1180px) 280px, (min-width: 640px) 45vw, 88px") if a[3] else \
        '<div class="card-ph" aria-hidden="true"><span>А – Я</span></div>'
    return (f'<article class="card card--article">{media}'
            f'<div class="card-body"><h3><a href="{B}/{slug}/">{a[1]}</a></h3><p>{a[2]}</p>'
            f'<div class="meta"><span>Прочети</span><span>→</span></div></div></article>')
