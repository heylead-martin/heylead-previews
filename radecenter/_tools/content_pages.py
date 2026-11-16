"""Main pages."""
from lib import *

BRING = "Ако имате направени изследвания като ЯМР, скенер или рентген – донесете ги със себе си при първото посещение."

FAQ_BOOK = ("Как да запазя час?", f'<p>Онлайн в <a href="{SUPERDOC}" {EXT}>SuperDoc</a>. Можете и да се обадите на <a href="{TEL}">{PHONE}</a> или да пишете във Viber / WhatsApp на +359 885 314 878.</p>')
FAQ_PRICE = ("Колко струва една терапия?", f'<p>Стандартната цена за 1 час терапия е 40 €. Юмейхо терапия от 1 ч. 30 мин. е 51 €, а от 2 часа – 82 €. Регресията (1 ч. 30 мин. – 2 часа) и НЛП терапията (1 ч. 30 мин.) също са по 40 €. Вижте <a href="{B}/ceni/">всички цени</a>.</p>')
FAQ_WHERE = ("Къде се намирате?", f"<p>На {ADDRESS} – до западния изход на метростанция „Опълченска“.</p>")
FAQ_BRING = ("Какво да нося на първото посещение?", f"<p>{BRING}</p>")
FAQ_HOURS = ("Какво е работното време?", "<p>Понеделник – Събота от 10:00 до 20:00 ч. Неделя е почивен ден.</p>")
FAQ_PAY = ("Мога ли да платя с карта?", "<p>Да. В центъра имаме ПОС терминал – можете да платите на място с карта или в брой.</p>")
FAQ_HYPNO = ("Използвате ли хипноза при регресията?", '<p>Не. Първо ви учим как да се отпуснете, а след сесията можете да получите аудио запис на целия процес.</p>')
FAQ_VOUCHER = ("Колко е валиден ваучерът за подарък?", f'<p>Стандартно 1 месец от датата на издаване, без такси. За всеки допълнителен месец валидност се доплащат 5 €. <a href="{B}/vaucheri/">Повече за ваучерите</a>.</p>')
FAQ_SHIP = ("Изпращате ли продукти?", f'<p>Белия тигров балсам изпращаме с Еконт и Спиди до всички градове в България. Пишете ни във Viber или WhatsApp на +359 885 314 878 с две имена, телефон и адрес. За останалите <a href="{B}/produkti/">продукти</a> – попитайте ни.</p>')
FAQ_BAMBOO = ("Подходящ ли е масажът с бамбукови пръчки за всеки?", '<p>Не се препоръчва при разширени вени и при чувствителна кожа. Резултатите се получават след минимум 10 процедури.</p>')
FAQ_MED = ("Заменят ли терапиите лечението при лекар?", f"<p>Не. {DISCLAIMER}</p>")


def home():
    tags = "".join(f"<li>{t}</li>" for t in ["Чакръкчия", "Юмейхо", "Масаж", "Регресия", "НЛП"])
    body = f'''
<section class="hero"><div class="wrap hero-grid">
<div>
<span class="eyebrow">Rade Center · София</span>
<h1>Чакръкчия, Юмейхо, масаж, регресия и НЛП – <em>при Радо</em></h1>
<p class="lead">Не е нужно да казвате къде ви боли. Радостин „Радо“ Русев сам открива проблема в тялото и ви помага за облекчаване на болката – а когато тежестта е в ума, е доверен събеседник.</p>
<ul class="tags" aria-label="Терапии">{tags}</ul>
<div class="btn-row">{btn_book()}{btn_call()}</div>
</div>
<div class="hero-media">{img("rado-portrait", "Радостин „Радо“ Русев – чакръкчия и Юмейхо терапевт в Rade Center", sizes="(min-width: 900px) 480px, 100vw", eager=True)}
<div class="hero-badge"><strong>4.9 ★</strong>152 отзива в Google</div></div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<ul class="trust">
<li><i aria-hidden="true">★</i><div><b>4.9 в Google</b><span>въз основа на 152 отзива</span></div></li>
<li><i aria-hidden="true">✓</i><div><b>Сертификати от 2017 г.</b><span>масаж, Юмейхо 3-та степен, Регресия, НЛП</span></div></li>
<li><i aria-hidden="true">€</i><div><b>40 € / 1 час</b><span>стандартна цена за терапия</span></div></li>
</ul>
</div></section>

<section class="section section--sand" id="terapii"><div class="wrap">
<div class="section-head"><span class="eyebrow">Терапии</span><h2>За тялото и за ума</h2><p class="lead">Мануални терапии за гърба, ставите и мускулите – и спокойни методи за емоциите, които тежат.</p></div>
<div class="group"><h3 class="group-title">Тяло</h3><div class="cards">{"".join(service_card(s[0]) for s in SERVICES if s[6]=="body")}</div></div>
<div class="group"><h3 class="group-title">Ум и емоции</h3><div class="cards">{"".join(service_card(s[0]) for s in SERVICES if s[6]=="mind")}</div></div>
<p style="margin-top:32px"><a class="btn btn--ghost" href="{B}/emocionalni-problemi/">При емоционални проблеми</a> <a class="btn btn--ghost" href="{B}/ceni/">Цени</a></p>
</div></section>

<section class="section"><div class="wrap split split--about">
<div class="about-photo">{img("rado-portrait-2", "Портрет на Радостин Русев", sizes="(min-width: 880px) 420px, 100vw")}</div>
<div>
<span class="eyebrow">За Радо</span>
<h2>Роден да прави терапии</h2>
<p>Още като дете Радо има силно развита чувствителност в допира и емоционална уравновесеност на зрял човек. Практикува масаж и газене върху роднини и съседи от 6-годишна възраст – и още тогава разбира, че призванието му е да помага на хората.</p>
<p>Днес е чакръкчия, Юмейхо терапевт 3-та степен, масажист, водач регресия, НЛП терапевт и коуч.</p>
<ul class="timeline" style="margin:24px 0 24px 8px">
<li><span>2017</span><b>Сертифициран масажист – класически масаж</b></li>
<li><span>2019</span><b>Юмейхо терапевт 3-та степен</b></li>
<li><span>2021 · 2022</span><b>Водач Регресия · НЛП терапевт</b></li>
</ul>
<a class="btn btn--ghost" href="{B}/chakrakchia/">Повече за Радо</a>
</div>
</div></section>

<section class="section section--green"><div class="wrap split">
<div>
<span class="eyebrow">Работно време</span>
<h2>Кога можете да дойдете</h2>
<p class="lead">Запазете час онлайн в SuperDoc или по телефона.</p>
<div class="btn-row">{btn_book("btn btn--light")}{btn_call("btn btn--outline-light")}</div>
</div>
<div class="box" style="color:var(--ink)">
<h3>Работно време</h3>{HOURS}
<hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
<ul class="contact-list">
<li><small>Телефон</small><a href="{TEL}">{PHONE}</a></li>
<li><small>Viber / WhatsApp</small><a href="{WHATSAPP}" {EXT}>+359 885 314 878</a></li>
</ul>
</div>
</div></section>

<section class="section"><div class="wrap">
<div class="section-head"><span class="eyebrow">Отзиви</span><h2>Какво казват хората след посещение</h2><p>{RATING}</p></div>
{reviews_carousel(["zornitsa", "valya", "ekaterina", "plamen", "dimo", "iolanda"])}
<div class="btn-row"><a class="btn btn--ghost" href="{B}/otzivi/">Прочети всички отзиви</a><a class="btn btn--ghost" href="{GOOGLE_REVIEWS}" {EXT}>Вижте ни в Google</a></div>
</div></section>

<section class="section section--sand"><div class="wrap split">
<div>
<span class="eyebrow">Как да ни намерите</span>
<h2>ул. „Средна гора“ 68, София</h2>
<p class="lead">До западния изход на метростанция „Опълченска“.</p>
<p>{BRING}</p>
<div class="btn-row"><a class="btn btn--primary" href="{MAPS}" {EXT}>Отвори в Google Maps</a><a class="btn btn--ghost" href="{B}/kontakti/">Контакти и упътване</a></div>
</div>
<div class="photos">
<div class="wide">{img("adres-sredna-gora-68", "Карта: Rade Center на ул. „Средна гора“ 68 до метростанция „Опълченска“", sizes="(min-width: 880px) 560px, 100vw")}</div>
<div>{img("vhod-1", "Вход към двора на ул. „Средна гора“ 68", sizes="(min-width: 880px) 280px, 50vw")}</div>
<div>{img("vhod-2", "Входната врата на Rade Center", sizes="(min-width: 880px) 280px, 50vw")}</div>
</div>
</div></section>

<section class="section" id="statii"><div class="wrap">
<div class="section-head"><span class="eyebrow">Полезно</span><h2>Полезни статии</h2><p class="lead">Кратки и практични текстове от практиката на Радо – за лечебния масаж, съня и простите домашни методи.</p></div>
<div class="cards cards--4">{"".join(article_card(a[0]) for a in ARTICLES)}</div>
</div></section>

<section class="section section--sand"><div class="wrap">
<div class="section-head"><span class="eyebrow">Въпроси</span><h2>Често задавани въпроси</h2></div>
{faq([FAQ_PRICE, FAQ_BOOK, FAQ_WHERE, FAQ_BRING, FAQ_PAY, FAQ_HYPNO])}
<p style="margin-top:20px"><a href="{B}/kontakti/#faq">Още въпроси и отговори →</a></p>
</div></section>
{cta_band()}'''
    write("", page("Rade Center – Чакръкчия, Юмейхо, масаж, регресия и НЛП в София",
                   "Rade Center, София: чакръкчия, Юмейхо терапия, масаж, регресия и НЛП с Радостин „Радо“ Русев. 4.9 ★ в Google. 40 € / 1 час. ул. „Средна гора“ 68.",
                   body))


def chakrakchia():
    """Merged page: live /chiropractor_sofia/ ("Чакръкчия в София") = Радо's bio + the чакръкчия service."""
    body = f'''
<section class="page-hero"><div class="wrap">
{crumbs([("Чакръкчия в София", None)])}
<div class="page-hero-grid"><div>
<span class="eyebrow">Чакръкчия · Терапевт</span>
<h1>Чакръкчия в София – Радостин Русев</h1>
<p class="lead">Радо е роден да прави терапии. Не е нужно да му казвате къде ви боли – той сам намира проблема в тялото и ви помага за облекчението на болката.</p>
<ul class="facts"><li><small>Продължителност</small><b>1 час</b></li><li><small>Цена</small><b>40 €</b></li></ul>
<div class="btn-row">{btn_book()}{btn_call("btn btn--ghost", "Обади се на Радо")}</div>
</div>
<div>{img("rado-portrait", "Радостин „Радо“ Русев – чакръкчия в Rade Center", sizes="(min-width: 900px) 560px, 100vw", eager=True)}</div>
</div></div></section>

<section class="section"><div class="wrap content-grid">
<div class="prose">
<h2>Роден да прави терапии</h2>
<p>Още като дете Радо има свръхразвита чувствителност в сетивото за допир и проявява емоционална уравновесеност на зрял човек. Практикува масаж и газене върху роднини и съседи още от 6-годишна възраст. Още тогава разбира, че призванието му е да помага на хората, а по-късно се насочва към мануалните терапии и психотерапевтичните методи.</p>
<blockquote>Предимството при Радо е, че не е нужно да му казваш къде те боли – той сам намира проблема в тялото ти и ти помага за облекчението на болката.</blockquote>
<p>Освен с ръцете си, Радо помага и с разговор. Той е доверен събеседник, който задава необходимите въпроси, за да намерите решение на своите дилеми и трудни взаимоотношения.</p>
<h2>Квалификации</h2>
<ol class="timeline">
<li><span>от детството</span><b>Чакръкчия</b>Масаж и газене от 6-годишна възраст.</li>
<li><span>2017</span><b>Сертифициран масажист</b>„Класически масаж“.</li>
<li><span>2019</span><b>Сертифициран мануален терапевт по японската методика Юмейхо – 3-та степен</b>Пълноправен терапевт.</li>
<li><span>2021</span><b>Сертифициран водач Регресия</b></li>
<li><span>2022</span><b>Сертифициран НЛП терапевт</b></li>
<li><span>&nbsp;</span><b>Коуч</b></li>
</ol>
<h2>Какво представлява терапията от чакръкчия</h2>
<p>Чакръкчия е традиционното българско название за човек, който намества и облекчава тялото с ръце. Радо практикува масаж и газене от дете и днес съчетава този опит с професионалните си квалификации по масаж и Юмейхо.</p>
<h3>При какво може да помогне</h3>
<ul class="check">
<li>схванат гръб, врат или кръст;</li>
<li>напрежение и блокажи по гърба;</li>
<li>болка, за която не знаете откъде идва – Радо сам търси източника ѝ.</li>
</ul>
<p class="note">Терапията не замества лекарска диагноза. При остра травма или неясна причина за болката първо се консултирайте с лекар.</p>
<h3>Как протича посещението</h3>
<ol class="steps">
<li>Разговор за оплакванията и предисторията им. Ако имате изследвания – ЯМР, скенер или рентген – донесете ги.</li>
<li>Радо сам търси източника на проблема в тялото чрез допир.</li>
<li>Мануална работа – наместване и отпускане на напрегнатите зони.</li>
<li>Съвети какво да промените у дома, за да се запази резултатът.</li>
</ol>
<p>Радо пише и статии за своите пациенти – за <a href="{B}/lecheben-masazh/">лечебния масаж</a>, за <a href="{B}/son/">съня</a> и за простите домашни методи като <a href="{B}/legenche-topla-voda-sol/">легенчето с топла вода и сол</a>. В статията си за съня честно казва:</p>
<blockquote>Аз не съм доктор и не претендирам да зная повече от тях. Искам тази статия да се използва за бърза справка от моите пациенти.</blockquote>
<div class="stack-reviews"><h2>Какво казват клиентите</h2>{review("toshev")}{review("valentina")}</div>
<h2>Често задавани въпроси</h2>
{faq([("Трябва ли да знам точно къде ми е проблемът?", "<p>Не. Радо сам намира проблема в тялото чрез допир. Разкажете му какво усещате и откога.</p>"), FAQ_BRING, ("Колко струва и колко трае?", "<p>Терапията от чакръкчия е 1 час и струва 40 €.</p>"), FAQ_PAY])}
<p class="small muted">{DISCLAIMER}</p>
</div>
<aside><div class="aside-cta"><h3>Терапия от чакръкчия</h3><p class="price">40 €</p><p>1 час</p>{btn_book("btn btn--light")}{btn_call("btn btn--outline-light", PHONE)}</div>
<div class="box" style="margin-top:20px"><h3>Работно време</h3>{HOURS}<p class="small muted" style="margin:14px 0 0">{ADDRESS} · <a href="{B}/kontakti/">Как да стигнете</a></p></div></aside>
</div></section>

<section class="section section--sand"><div class="wrap">
<div class="section-head"><span class="eyebrow">Отзиви за Радо</span><h2>„Преди всичко е човек и след това е професионалист“</h2><p>{RATING}</p></div>
{reviews_grid(["nina", "vladimir", "branimir"])}
<p style="margin-top:24px"><a class="btn btn--ghost" href="{B}/otzivi/">Прочети всички отзиви</a></p>
</div></section>

<section class="section"><div class="wrap">
<div class="section-head"><span class="eyebrow">Терапии</span><h2>С какво още може да ви помогне Радо</h2></div>
<div class="cards">{"".join(service_card(s) for s in ["yumeiho", "balkansko-gazene", "regresia", "nlp-terapia"])}</div>
</div></section>
{cta_band("Обади се на Радо", "Разкажете му какво ви тежи – ще намерите заедно подходящата терапия.")}'''
    write("chakrakchia/", page("Чакръкчия в София – Радостин Русев | Rade Center",
                               "Чакръкчия в София: Радостин „Радо“ Русев – сертифициран масажист (2017), Юмейхо терапевт 3-та степен (2019), водач Регресия (2021), НЛП терапевт (2022). 1 час – 40 €.",
                               body, active="chakrakchia"))


PRICES = [
    ("Терапия от чакръкчия", "1 час", "40 €", "chakrakchia"),
    ("Юмейхо терапия", "1 час", "40 €", "yumeiho"),
    ("Юмейхо терапия", "1 ч. 30 мин.", "51 €", "yumeiho"),
    ("Юмейхо терапия", "2 часа", "82 €", "yumeiho"),
    ("Дълбокотъканен масаж", "1 час", "40 €", "dalbokotakanen-masazh"),
    ("Балканско газене (балкански масаж)", "1 час", "40 €", "balkansko-gazene"),
    ("Масаж с бамбукови пръчки", "1 час", "40 €", "masazh-s-bambukovi-prachki"),
    ("Детоксикация с вендузи", "1 час", "40 €", None),
    ("Регресия", "1 ч. 30 мин. – 2 часа", "40 €", "regresia"),
    ("НЛП терапия", "1 ч. 30 мин.", "40 €", "nlp-terapia"),
    ("Развързване на емоционални блокажи", "1 час", "40 €", "razvarzvane-na-emocionalni-blokazhi", "акупресура с психологически упражнения"),
]
PRODUCTS_PRICES = [
    ('<a href="/radecenter/susamovo-maslo/">Немско сусамово масло</a>', "9,20 € / бр."),
    ("Muscular Balm", "цена при запитване"),
    ("Пластири „Джян Канг“", "7,70 € / бр."),
    ("Пластири „Вутонг“", "8,20 € / бр."),
    ('<a href="/radecenter/tigrov-balsam/">Бял тигров балсам (White Tiger Balm)</a>', "15 €"),
    ("Книга „Хвани Жокера“", "10,20 €"),
    ("Книга „Бизнес над червената линия“", "10,20 €"),
    ("Книга „Магията на баланса“", "9,20 €"),
]


def ceni():
    rows = []
    for name, dur, price, slug, *note in PRICES:
        n = f'<a href="{B}/{slug}/">{name}</a>' if slug else name
        if note: n += f"<small>{note[0]}</small>"
        rows.append(f'<tr><th scope="row">{n}</th><td class="d">{dur}</td><td class="p">{price}</td></tr>')
    prow = "".join(f'<tr><th scope="row">{n}</th><td class="p">{p}</td></tr>' for n, p in PRODUCTS_PRICES)
    body = f'''
<section class="page-hero"><div class="wrap">
{crumbs([("Цени", None)])}
<span class="eyebrow">Ценоразпис</span>
<h1>Цени</h1>
<p class="lead">Стандартната цена за 1 час терапия е 40 €. Всички цени са в евро.</p>
<div class="btn-row">{btn_book()}<a class="btn btn--ghost" href="{B}/vaucheri/">Вземи ваучер</a></div>
</div></section>

<section class="section"><div class="wrap content-grid">
<div>
<h2 id="t-terapii" class="h-table">Терапии</h2>
<table class="price-table" aria-labelledby="t-terapii">
<thead><tr><th scope="col">Терапия</th><th scope="col">Продължителност</th><th scope="col" style="text-align:right">Цена</th></tr></thead>
<tbody>{"".join(rows)}</tbody>
</table>
<h2 id="t-produkti" class="h-table" style="margin-top:48px">Продукти</h2>
<table class="price-table" aria-labelledby="t-produkti">
<thead><tr><th scope="col">Продукт</th><th scope="col" style="text-align:right">Цена</th></tr></thead>
<tbody>{prow}</tbody>
</table>
<p style="margin-top:16px"><a href="{B}/produkti/">Повече за продуктите и поръчката →</a></p>
</div>
<aside>
<div class="box"><h3>Плащане</h3><p>На място в брой или с карта – в центъра имаме ПОС терминал.</p></div>
<div class="box" style="margin-top:20px"><h3>Ваучер за подарък</h3><p>Стандартна валидност – 1 месец от издаването, без такси. Всеки допълнителен месец – +5 €.</p><a href="{B}/vaucheri/">Как се купува ваучер →</a></div>
<div class="box" style="margin-top:20px"><h3>Първо посещение</h3><p>{BRING}</p></div>
</aside>
</div></section>
{cta_band("Запазете своя час", "Запазете час онлайн в SuperDoc или се обадете на 0885 314 878.")}'''
    write("ceni/", page("Цени на терапиите и продуктите в евро | Rade Center София",
                        "Ценоразпис на Rade Center: терапия от чакръкчия, Юмейхо, масажи, регресия и НЛП – 40 € за 1 час. Цени на продукти и ваучери.",
                        body, active="ceni"))


def produkti():
    order = f'Поръчка: Viber / WhatsApp <a href="{WHATSAPP}" {EXT}>+359 885 314 878</a> или на място в центъра.'
    contra = "<p><strong>Противопоказания:</strong> индивидуална непоносимост към някой от компонентите, бременност, кърмене, кожни раздразнения и рани, деца под 15 години.</p>"
    use = "<p><strong>Как се използва:</strong> част от пластира се залепя върху болезнената област. След 7–8 часа процедурата може да се повтори. Курсът се избира индивидуално – приблизително 20–25 дни.</p>"
    body = f'''
<section class="page-hero"><div class="wrap">
{crumbs([("Продукти", None)])}
<span class="eyebrow">Продукти</span>
<h1>Продукти за дома</h1>
<p class="lead">Масла, балсами и пластири, както и книги за общуване и баланс. Можете да ги закупите на място в центъра.</p>
</div></section>

<section class="section"><div class="wrap">
<div class="products">
<article class="product product--wide" id="tigrov-balsam">
<div>{img("tigrov-balsam", "Бял тигров балсам White Tiger Balm – бурканче и кутия", sizes="(min-width: 760px) 260px, 120px")}</div>
<div>
<span class="eyebrow">Изпращаме в цяла България</span>
<h2><a href="{B}/tigrov-balsam/">Бял тигров балсам (White Tiger Balm)</a></h2>
<p class="price">15 €</p>
<blockquote style="margin:0 0 1em;font:italic 1.1rem/1.6 var(--serif);color:var(--green)">„Чакръкчия съм вече повече от 30 години и това е най-доброто мазило, което познавам.“ – Радо</blockquote>
<p>Оригиналното мазило е поръчано от Виетнам – в бурканчета по 20 г, максимален концентрат. Помага за облекчаване на мускулното напрежение и намаляване на локализираната болка.</p>
<p class="note" style="margin-top:14px"><strong>Доставка:</strong> изпращаме с Еконт и Спиди до всички градове в България. Пишете във Viber или WhatsApp на <a href="{WHATSAPP}" {EXT}>+359 885 314 878</a> – две имена, телефон и адрес.</p>
<p><a class="btn btn--ghost btn--sm" href="{B}/tigrov-balsam/">Приложение и предупреждения →</a></p>
</div>
</article>

<article class="product" id="susamovo-maslo">
{img("susamovo-maslo", "Бутилка немско сусамово масло", sizes="150px")}
<div><h3><a href="{B}/susamovo-maslo/">Немско сусамово масло</a></h3><p class="price">9,20 € / бр.</p>
<p>Маслото, което използваме и при <a href="{B}/dalbokotakanen-masazh/">дълбокотъканния масаж</a>. Може да облекчи болки в ставите и да подобри ставната подвижност. В Аюрведа се използва за лечебни масажи и се вярва, че отвежда излишната топлина от тялото.</p>
<p><a href="{B}/susamovo-maslo/">Повече за сусамовото масло →</a></p></div>
</article>

<article class="product" id="muscular-balm">
{img("muscular-balm", "Muscular Balm – бурканче и кутия", sizes="150px")}
<div><h3>Muscular Balm</h3><p class="price">цена при запитване</p>
<p>Създаден да облекчава мускулни болки в рамото, гърба, кръста и ставите. Може да помага при ревматизъм по ръцете и ходилата. Може да се използва и като загряващ агент при тренировки.</p></div>
</article>

<article class="product" id="plastiri-dzhyan-kang">
{img("plastiri-dzhyan-kang", "Пластири Джян Канг – опаковка", sizes="150px")}
<div><h3>Пластири „Джян Канг“</h3><p class="price">7,70 € / бр.</p>
<p>Фитопластир за тяло с противовъзпалително действие – улеснява движението в ставите и намалява болката. Препоръчва се както за профилактика, така и за облекчаване при възпалителни и метаболитни заболявания.</p>
<details><summary>Употреба и противопоказания</summary>{use}{contra}</details></div>
</article>

<article class="product" id="plastiri-vutong">
{img("plastiri-vutong", "Пластири Вутонг – опаковка", sizes="150px")}
<div><h3>Пластири „Вутонг“</h3><p class="price">8,20 € / бр.</p>
<p>„Wutong“ в превод от китайски означава „без болка“. Има обезболяващ и противовъзпалителен ефект, намалява подуването и отоците, подобрява кръвообращението. Препоръчва се при болки в ставите и мускулите, ревматични болки, болки в кръста, навяхвания и изкълчвания.</p>
<details><summary>Употреба и противопоказания</summary>{use}{contra}</details></div>
</article>

<article class="product" id="hvani-zhokera">
{img("kniga-hvani-zhokera", "Корица на книгата „Хвани Жокера“", sizes="150px")}
<div><h3>Книга „Хвани Жокера“</h3><p class="price">10,20 €</p><p>Книга за подобряване на общуването очи в очи в бизнес среда.</p></div>
</article>

<article class="product" id="biznes-nad-chervenata-liniya">
{img("kniga-biznes-nad-chervenata-liniya", "Корица на книгата „Бизнес над червената линия“", sizes="150px")}
<div><h3>Книга „Бизнес над червената линия“</h3><p class="price">10,20 €</p><p>Книга за подобряване на структурата на вашия бизнес.</p></div>
</article>
</div>
<div class="box" style="margin-top:22px"><h3>Книга „Магията на баланса“ – 9,20 €</h3><p style="margin:0">Тайната да имаш щастливо семейство и успешна кариера едновременно.</p></div>
</div></section>

<section class="section section--sand"><div class="wrap">
<div class="section-head"><span class="eyebrow">Поръчка</span><h2>Как да поръчате</h2></div>
<ol class="steps narrow">
<li>Изберете продукт и ни пишете във Viber или WhatsApp на <a href="{WHATSAPP}" {EXT}>+359 885 314 878</a> или се обадете на <a href="{TEL}">{PHONE}</a>.</li>
<li>За доставка посочете две имена, телефон и адрес. Тигровия балсам изпращаме с Еконт или Спиди до всички градове в България.</li>
<li>Можете да вземете продуктите и на място в центъра – {ADDRESS}.</li>
</ol>
<p class="small muted" style="margin-top:20px">Продуктите не са лекарства и не заменят лечение, назначено от лекар.</p>
</div></section>
{cta_band()}'''
    write("produkti/", page("Продукти – тигров балсам, сусамово масло, пластири | Rade Center",
                            "Бял тигров балсам (15 €, доставка в цяла България), немско сусамово масло, Muscular Balm, пластири Джян Канг и Вутонг и книги – от Rade Center.",
                            body, active="produkti"))


def vaucheri():
    iban = '<span class="bank">BG59UNCR70001525625096</span>'
    body = f'''
<section class="page-hero"><div class="wrap">
{crumbs([("Ваучери", None)])}
<div class="page-hero-grid"><div>
<span class="eyebrow">Подарък</span>
<h1>Ваучери за подарък</h1>
<p class="lead">Подарете терапия, процедура или продукт от Rade Center. Ваучер може да се издаде за всички наши услуги и продукти.</p>
<div class="btn-row"><a class="btn btn--primary" href="{WHATSAPP}" {EXT}>Пиши ни във Viber / WhatsApp</a>{btn_call()}</div>
</div>
<div>{img("vaucher-podarak", "Ръце, които подават подарък с червена панделка", sizes="(min-width: 900px) 560px, 100vw", eager=True)}</div>
</div></div></section>

<section class="section"><div class="wrap content-grid">
<div class="prose">
<h2>Как да вземете ваучер</h2>
<ol class="steps">
<li><strong>Изберете</strong> терапия, процедура или продукт – от <a href="{B}/ceni/">ценоразписа</a> или на място в центъра.</li>
<li><strong>Платете</strong> стойността – по банков път или на място в брой или с карта (имаме ПОС терминал).</li>
<li><strong>Изпратете ни имейл адрес</strong> – във Viber на {PHONE} или в чата ни във Facebook. Ако желаете, посочете и името на получателя (може и в основанието на банковия превод).</li>
<li><strong>Получавате ваучера</strong> на посочения имейл или във Viber.</li>
<li><strong>Получателят запазва час</strong> на <a href="{TEL}">{PHONE}</a> или в <a href="{SUPERDOC}" {EXT}>SuperDoc</a>.</li>
<li><strong>В уговорения ден</strong> получателят идва с файла на ваучера в телефона си – така пестим хартия и спасяваме повече дървета.</li>
</ol>
<h2>Данни за банков превод</h2>
<div class="box">
<ul class="contact-list">
<li><small>IBAN</small>{iban}</li>
<li><small>Получател</small>„Раде Юмейхо Терапи Център“ ЕООД (RADE YUMEIHO THERAPY CENTRE EOOD)</li>
<li><small>Основание</small>„ваучер – процедура“ (напишете желаната процедура или продукт)</li>
</ul>
</div>
<h2>Какво може да пише на ваучера</h2>
<ul class="check">
<li>вашето име (или не);</li>
<li>името на получателя (или не);</li>
<li>стойността на ваучера (или не);</li>
<li>срок на валидност – стандартно 1 месец от датата на издаване, без такси. За всеки допълнителен месец се доплащат 5 €.</li>
</ul>
<h2>Въпроси</h2>
{faq([FAQ_VOUCHER, ("Мога ли да платя ваучера на място?", "<p>Да – в центъра можете да платите в брой или с карта.</p>"), ("За какво може да бъде ваучерът?", f'<p>За всички наши терапии, процедури и продукти. Вижте <a href="{B}/ceni/">цените</a>.</p>')])}
</div>
<aside><div class="aside-cta"><h3>Въпроси за ваучер?</h3><p>Пишете ни смело в чатовете или просто се обадете.</p>
<a class="btn btn--light" href="{WHATSAPP}" {EXT}>Viber / WhatsApp</a>{btn_call("btn btn--outline-light", PHONE)}
<a class="btn btn--outline-light" href="{FACEBOOK}" {EXT}>Facebook</a></div>
<div class="box" style="margin-top:20px"><h3>Отзив</h3><p class="muted" style="margin:0">„Страхотно отношение и комуникация, закупих ваучер и съм много доволна.“<br><b>– Diana Rangelova, Google</b></p></div></aside>
</div></section>
{cta_band("Подарете грижа", "Ваучер за терапия при Радо – подарък, който се усеща.")}'''
    write("vaucheri/", page("Ваучери за подарък – терапия или масаж | Rade Center София",
                            "Ваучер за подарък за терапия, масаж или продукт от Rade Center. Плащане по банков път или на място с карта. Валидност 1 месец, +5 € за всеки следващ.",
                            body, active="vaucheri"))


def otzivi():
    keys = ["valya", "zornitsa", "ekaterina", "dimo", "valentina", "plamen", "branimir", "iolanda",
            "vladimir", "ivaylo", "kristina", "toshev", "diana", "ventsislav", "aysen"]
    body = f'''
<section class="page-hero"><div class="wrap">
{crumbs([("Отзиви", None)])}
<span class="eyebrow">Отзиви</span>
<h1>Какво казват хората за Радо</h1>
<p class="lead">Отзиви от Google, написани от хора, които вече са идвали в центъра.</p>
<p>{RATING}</p>
<div class="btn-row"><a class="btn btn--primary" href="{GOOGLE_REVIEWS}" {EXT}>Всички отзиви в Google</a><a class="btn btn--ghost" href="{TRIPADVISOR}" {EXT}>Tripadvisor</a></div>
</div></section>

<section class="section"><div class="wrap">
{reviews_grid(keys, "reviews-masonry")}
<div class="box" style="margin-top:20px;text-align:center"><h3>Били сте при нас?</h3><p>Ще се радваме да споделите впечатленията си.</p><a class="btn btn--ghost" href="https://search.google.com/local/writereview?placeid=ChIJzQ3lqQOFqkARzBjws4b5xlk" {EXT}>Оценете ни в Google</a></div>
</div></section>
{cta_band()}'''
    write("otzivi/", page("Отзиви – 4.9 ★ в Google от 152 отзива | Rade Center",
                          "Реални отзиви от Google за Радо и Rade Center в София – чакръкчия, Юмейхо терапия, масаж. 4.9 ★ от 152 отзива.",
                          body, active="otzivi"))


def kontakti():
    body = f'''
<section class="page-hero"><div class="wrap">
{crumbs([("Контакти", None)])}
<span class="eyebrow">Контакти</span>
<h1>Контакти и как да ни намерите</h1>
<p class="lead">{ADDRESS} – до западния изход на метростанция „Опълченска“.</p>
<div class="btn-row">{btn_book()}{btn_call()}</div>
</div></section>

<section class="section"><div class="wrap info-grid info-grid--3">
<div class="box"><h3>Свържете се</h3>
<ul class="contact-list">
<li><small>Телефон</small><a href="{TEL}">{PHONE}</a></li>
<li><small>Viber / WhatsApp</small><a href="{WHATSAPP}" {EXT}>+359 885 314 878</a></li>
<li><small>Имейл</small><a href="mailto:{EMAIL}">{EMAIL}</a></li>
<li><small>Facebook</small><a href="{FACEBOOK}" {EXT}>facebook.com/radecenter</a></li>
</ul></div>
<div class="box"><h3>Работно време</h3>{HOURS}<p class="small muted" style="margin-top:16px">Можете да запазите час и онлайн в SuperDoc.</p></div>
<div class="box"><h3>Онлайн запис</h3><p>Имаме връзка със SuperDoc – можете да запазите час през онлайн календара им.</p>{btn_book("btn btn--primary", "Отвори SuperDoc")}</div>
</div></section>

<section class="section section--sand" id="karta"><div class="wrap split">
<div class="map-card">
<div class="map-ph">
<div><div class="map-pin" aria-hidden="true"></div>
<p style="font:600 1.25rem var(--serif);margin:0 0 4px">Rade Center</p>
<p class="muted" style="margin:0 0 14px">{ADDRESS}</p>
<button class="btn btn--light btn--sm" type="button" data-map="{MAP_EMBED}">Покажи картата тук</button>
<p class="small muted" style="margin:10px 0 0">Картата на Google се зарежда само след натискане.</p></div>
</div>
<div class="map-body"><h2 style="font-size:1.4rem">Карта</h2><p>{ADDRESS}</p><a class="btn btn--primary" href="{MAPS}" {EXT}>Отвори в Google Maps</a></div>
</div>
<div>
<span class="eyebrow">Упътване</span>
<h2>Как да стигнете</h2>
<ul class="check">
<li>С метро: слезте на метростанция „Опълченска“ и излезте през <strong>западния изход</strong> – центърът е съвсем наблизо.</li>
<li>Ориентир: до голям строеж и частен паркинг.</li>
<li>Адрес: {ADDRESS}.</li>
</ul>
<div class="photos" style="margin-top:20px">
<div class="wide">{img("adres-sredna-gora-68", "Карта с местоположението на Rade Center до метростанция „Опълченска“", sizes="(min-width: 880px) 560px, 100vw")}</div>
<div>{img("vhod-1", "Входът към сградата на ул. „Средна гора“ 68", sizes="(min-width: 880px) 280px, 50vw")}</div>
<div>{img("vhod-2", "Входната врата на Rade Center", sizes="(min-width: 880px) 280px, 50vw")}</div>
</div>
</div>
</div></section>

<section class="section"><div class="wrap split">
<div><span class="eyebrow">Първо посещение</span><h2>Какво да носите</h2>
<p class="lead">{BRING}</p></div>
<div class="box"><h3>Плащане</h3><p>В центъра можете да платите в брой или с карта – имаме ПОС терминал.</p><h3>Ваучери</h3><p style="margin:0">Искате да подарите терапия? <a href="{B}/vaucheri/">Вижте как работят ваучерите</a>.</p></div>
</div></section>

<section class="section section--sand" id="faq"><div class="wrap">
<div class="section-head"><span class="eyebrow">Въпроси</span><h2>Често задавани въпроси</h2></div>
{faq([FAQ_BOOK, FAQ_HOURS, FAQ_WHERE, FAQ_BRING, FAQ_PRICE, FAQ_PAY, FAQ_HYPNO, ("Мога ли да получа запис от регресията?", "<p>Да – след регресията можете да получите аудио запис на целия процес.</p>"), FAQ_BAMBOO, FAQ_VOUCHER, FAQ_SHIP, FAQ_MED])}
</div></section>
{cta_band()}'''
    write("kontakti/", page("Контакти – ул. „Средна гора“ 68, метро „Опълченска“ | Rade Center",
                            "Rade Center: ул. „Средна гора“ 68, София, до западния изход на метро „Опълченска“. Тел. 0885 314 878, Viber/WhatsApp, SuperDoc. Пон–Съб 10–20 ч.",
                            body, active="kontakti"))


def build():
    home(); chakrakchia(); ceni(); produkti(); vaucheri(); otzivi(); kontakti()
