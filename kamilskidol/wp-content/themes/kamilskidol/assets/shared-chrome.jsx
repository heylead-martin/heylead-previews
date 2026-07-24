/* Site header, footer, tweaks bootstrap.
   Each page wraps its content with <SiteHeader active="..."/> ... <SiteFooter/>
   and mounts <TweaksRoot/> at the end. */

const NAV = [
  { id: "home", label: "Начало", href: "/kamilskidol/" },
  { id: "timeline", label: "Хронология", href: "/kamilskidol/timeline/" },
  { id: "archive", label: "Архив", href: "/kamilskidol/archive/" },
  { id: "artifacts", label: "Предмети", href: "/kamilskidol/artifacts/" },
  { id: "people", label: "Хора", href: "/kamilskidol/people/" },
  { id: "map", label: "Карта", href: "/kamilskidol/map/" },
  { id: "contribute", label: "Дарение", href: "/kamilskidol/contribute/" },
];

function SiteHeader({ active }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="/kamilskidol/" className="brand">
          <span className="crest">Камилски дол</span>
          <span className="est">EST. ANTE 1572 · ДЕВЕДЕРЕ</span>
        </a>
        <nav className={"nav " + (open ? "open" : "")}>
          {NAV.map(n => (
            <a key={n.id} href={n.href} className={active === n.id ? "active" : ""}>{n.label}</a>
          ))}
        </nav>
        <span className="lang-pill">БГ / EN</span>
        <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Меню">
          {open ? "×" : "☰"}
        </button>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h4>Архив на село Камилски дол</h4>
          <p style={{lineHeight: 1.6, maxWidth: "38ch", margin: 0}}>
            Дигитален архив на историята, предметите, хората и преданията на село Камилски дол —
            някогашно <em style={{fontFamily: "var(--serif)"}}>Деведере</em>, в Източните Родопи, община Ивайловград.
          </p>
        </div>
        <div>
          <h4>Раздели</h4>
          <ul>
            <li><a href="/kamilskidol/timeline/">Хронология</a></li>
            <li><a href="/kamilskidol/archive/">Фото архив</a></li>
            <li><a href="/kamilskidol/artifacts/">Предмети</a></li>
            <li><a href="/kamilskidol/people/">Хора и спомени</a></li>
          </ul>
        </div>
        <div>
          <h4>Изследване</h4>
          <ul>
            <li><a href="/kamilskidol/map/">Историческа карта</a></li>
            <li><a href="#">Език и диалект</a></li>
            <li><a href="#">Природа</a></li>
            <li><a href="#">Посещение</a></li>
          </ul>
        </div>
        <div>
          <h4>Контакт</h4>
          <ul>
            <li><a href="/kamilskidol/contribute/">Споделете история</a></li>
            <li>arhiv@kamilskidol.bg</li>
            <li>41.5999° С · 26.0560° И</li>
          </ul>
        </div>
      </div>
      <div className="colophon">
        <span>© MMXXVI Архив Камилски дол</span>
        <span>Каталог · v.2.4</span>
        <span>Източници: Л. Милетич · М. Николчовска · ОИМ Ивайловград</span>
      </div>
    </footer>
  );
}

/* Tweaks ----------------------------------------------------- */

const KD_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "type": "serif-pair-1",
  "density": "default",
  "heroVariant": "circle"
}/*EDITMODE-END*/;

function TweaksRoot() {
  const [tweaks, setTweak] = useTweaks(KD_TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.body.dataset.palette = "forest";
    document.body.dataset.type = tweaks.type;
    document.body.dataset.density = tweaks.density;
    document.body.dataset.heroVariant = tweaks.heroVariant;
  }, [tweaks]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Typography">
        <TweakRadio
          value={tweaks.type}
          onChange={(v) => setTweak("type", v)}
          options={[
            { value: "serif-pair-1", label: "Cormorant + Inter" },
            { value: "serif-pair-2", label: "EB Garamond + Work Sans" },
            { value: "editorial", label: "Playfair + Grotesk" },
          ]}
        />
      </TweakSection>
      <TweakSection title="Density">
        <TweakRadio
          value={tweaks.density}
          onChange={(v) => setTweak("density", v)}
          options={[
            { value: "sparse", label: "Sparse" },
            { value: "default", label: "Default" },
            { value: "dense", label: "Dense" },
          ]}
        />
      </TweakSection>
      <TweakSection title="Hero layout (homepage)">
        <TweakRadio
          value={tweaks.heroVariant}
          onChange={(v) => setTweak("heroVariant", v)}
          options={[
            { value: "circle", label: "Сircle est." },
            { value: "split", label: "Split" },
            { value: "stack", label: "Stack" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

Object.assign(window, { SiteHeader, SiteFooter, TweaksRoot, NAV });
