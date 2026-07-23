/* Homepage — Камилски дол */

function HomeHero() {
  const variant = (typeof document !== "undefined" && document.body.dataset.heroVariant) || "circle";
  return (
    <section className="kd-hero" data-variant={variant}>
      <div className="kd-hero-grid">
        <div className="kd-hero-meta">
          <div className="cat">Кат. № АРХ-001</div>
          <div className="cat" style={{marginTop: 6}}>Източни Родопи · 41.5999° С · 26.0560° И</div>
        </div>

        <div className="kd-hero-center">
          <div className="kd-hero-circle">
            <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="circle-top" d="M 160,160 m -130,0 a 130,130 0 1,1 260,0" />
                <path id="circle-bottom" d="M 160,160 m -130,0 a 130,130 0 1,0 260,0" />
              </defs>
              <circle cx="160" cy="160" r="148" fill="none" stroke="currentColor" strokeOpacity="0.32" strokeWidth="0.5"/>
              <circle cx="160" cy="160" r="130" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.5"/>
              <text fontSize="11" letterSpacing="6" fill="currentColor" fontFamily="var(--mono)">
                <textPath href="#circle-top" startOffset="50%" textAnchor="middle">
                  АРХИВ · СЕЛО КАМИЛСКИ ДОЛ · ДЕВЕДЕРЕ
                </textPath>
              </text>
              <text fontSize="11" letterSpacing="6" fill="currentColor" fontFamily="var(--mono)">
                <textPath href="#circle-bottom" startOffset="50%" textAnchor="middle">
                  ОБЩИНА ИВАЙЛОВГРАД · МMXXVI
                </textPath>
              </text>
            </svg>
            <div className="kd-hero-mark">
              <div className="kd-hero-est mono">est.</div>
              <div className="kd-hero-year serif"><em>пр. 1572</em></div>
              <div className="kd-hero-est mono">a.d.</div>
            </div>
          </div>
        </div>

        <div className="kd-hero-side">
          <div className="cat">Население · 102 · преброяване 2024</div>
          <div className="cat" style={{marginTop: 6}}>Надм. вис. · 372 м</div>
        </div>
      </div>

      <h1 className="kd-hero-title serif">
        Хроника на едно <em>родопско</em> село,<br/>
        някога наречено <em>Деведере</em> —<br/>
        „долът на камилата“.
      </h1>

      <div className="kd-hero-rule"></div>

      <div className="kd-hero-foot">
        <span className="smallcaps">Свитък I</span>
        <span className="mono">— превъртете надолу —</span>
        <span className="smallcaps">XXVI Април MMXXVI</span>
      </div>
    </section>
  );
}

function Prologue() {
  return (
    <section className="kd-prologue">
      <div className="kd-prologue-inner">
        <div className="smallcaps">Пролог</div>
        <p className="kd-prologue-lede serif">
          В един от най‑крайните ридове на Източните Родопи, високо над долината на Арда,
          стои село от камък. Оградите са от камък, площадът е от камък, дори къщите растат
          от скалата. Името му означава <em>долът на камилата</em> — спомен за керваните,
          които са спирали тук, и за златото, което някога са носили нагоре от римските мини.
        </p>
        <div className="kd-prologue-cols">
          <p>
            Първите писмени сведения за селото са от 1572 година — документ за границите на
            Черменския вакъф, в който името му стои редом с Горноселци и Сив кладенец, трите
            най‑стари селища на този край. Преди това — мълчание, овчари юруци, керван‑сараи,
            стари пътища от Мезек към Лютица.
          </p>
          <p>
            До 1934 година селото се нарича <em className="serif">Деведере</em>, по турското
            <span className="mono"> „деве“</span> (камила) и <span className="mono">„дере“</span> (дол). Сегашното
            име е негов точен превод. Този архив пази онова, което остана: камъните,
            гласовете, имената, песните и една камбана, отлята в Одрин през 1895 г.
          </p>
        </div>
      </div>
    </section>
  );
}

function FactStrip() {
  const facts = [
    { num: "1572", label: "Първо писмено сведение" },
    { num: "1895", label: "Камбаната, отлята в Одрин" },
    { num: "1912", label: "Освобождение от османска власт" },
    { num: "1913", label: "Опожаряване и избиване" },
    { num: "1934", label: "Преименуване на Камилски дол" },
    { num: "102", label: "Жители (преброяване 2024)" },
  ];
  return (
    <section className="kd-facts">
      <div className="kd-facts-inner">
        {facts.map((f, i) => (
          <div className="kd-fact" key={i}>
            <div className="kd-fact-num serif">{f.num}</div>
            <div className="kd-fact-label">{f.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  return (
    <section className="kd-featured">
      <div className="kd-featured-head">
        <div>
          <div className="cat">— Изложба на седмицата</div>
          <h2 className="serif">Камбаната от Одрин, <em>1895</em></h2>
        </div>
        <a href="/artifacts/" className="btn">Към сбирката →</a>
      </div>
      <div className="kd-featured-body">
        <div className="ph kd-featured-img" data-label="Photograph · черно‑бял отпечатък" data-cat="ОБ‑017 · ок. 1962" style={kdImg("ОБ‑017", {aspectRatio: "4/5"})}></div>
        <div className="kd-featured-text">
          <p className="serif kd-featured-lede">
            Излята е в Одрин и пренесена с волска кола през река Арда. Когато през лятото
            на 1913 г. турските части подпалват селото, камбаната оцелява — снемат я,
            заравят я в двора на църквата, и след години отново я вдигат на камбанарията,
            където виси и днес.
          </p>
          <dl className="kd-meta">
            <div><dt>Каталожен номер</dt><dd>ОБ‑017</dd></div>
            <div><dt>Произход</dt><dd>Одрин (Едирне), Османска империя</dd></div>
            <div><dt>Материал</dt><dd>Бронз, желязо</dd></div>
            <div><dt>Дата на отливане</dt><dd>1895 г.</dd></div>
            <div><dt>Местонахождение</dt><dd>Църква „Св. Атанас“, Камилски дол</dd></div>
            <div><dt>Състояние</dt><dd>Експонирано · действащо</dd></div>
          </dl>
          <a href="/artifacts/" className="kd-featured-link">Прочетете цялата история →</a>
        </div>
      </div>
    </section>
  );
}

function SectionGrid() {
  const sections = [
    { num: "I", title: "Хронология", sub: "Свитък на времето — от римските мини до днес.", href: "timeline.html", label: "Photograph · стенопис в църквата", cat: "СН‑031" },
    { num: "II", title: "Фото архив", sub: "342 снимки, описани и подредени по десетилетия.", href: "archive.html", label: "Photograph · сватба", cat: "СН‑112" },
    { num: "III", title: "Предмети", sub: "Камбани, чешми, ракли, инструменти, икони.", href: "artifacts.html", label: "Object · ракла, орех", cat: "ОБ‑044" },
    { num: "IV", title: "Хора", sub: "Имена, лица, родове, гласове на отишлите си.", href: "people.html", label: "Portrait · Стоян Митрев", cat: "ХР‑009" },
    { num: "V", title: "Карта", sub: "Чешми, мегдани, мандри, римски пътеки.", href: "map.html", label: "Map · 1:5000 геодезия", cat: "КР‑002" },
    { num: "VI", title: "Език", sub: "Думи от родопския говор, които си отиват.", href: "#", label: "Manuscript · речник", cat: "ДК‑003" },
  ];
  return (
    <section className="kd-sections">
      <div className="kd-sections-head">
        <div className="smallcaps">Раздели на архива</div>
        <h2 className="serif">Шест свитъка</h2>
      </div>
      <div className="kd-sections-grid">
        {sections.map((s) => (
          <a className="kd-section" href={s.href} key={s.num}>
            <div className="kd-section-num mono">{s.num}.</div>
            <div className="ph kd-section-img" data-label={s.label} data-cat={s.cat} style={kdImg(s.cat)}></div>
            <h3 className="serif">{s.title}</h3>
            <p>{s.sub}</p>
            <span className="kd-section-arrow">→ Виж раздела</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function VoicesTeaser() {
  const voices = [
    { name: "баба Кера, 88 г.", year: "записан 2019", quote: "„Дядо ми разправяше — когато подпалиха селото, камбаната я свалиха през нощта и я закопаха в двора. Три години стоя в земята.“", dur: "14:22" },
    { name: "дядо Атанас, 91 г.", year: "записан 2017", quote: "„Преди язовира ходехме до Арда за риба пеша. Сега водата е горе, а пътят е под нея.“", dur: "08:47" },
    { name: "Мария Митрева, 67 г.", year: "записан 2022", quote: "„На Атанасовден всичко село се събираше. Печахме агне на огнището. Сега сме осем души на масата.“", dur: "21:03" },
  ];
  return (
    <section className="kd-voices">
      <div className="kd-voices-head">
        <div>
          <div className="cat">— Устни истории</div>
          <h2 className="serif">Гласове, които сме записали</h2>
        </div>
        <a href="/people/" className="btn">Слушайте всички →</a>
      </div>
      <div className="kd-voices-grid">
        {voices.map((v, i) => (
          <article className="kd-voice" key={i}>
            <div className="kd-voice-play">▶</div>
            <div className="kd-voice-meta">
              <div className="cat">{v.year} · {v.dur}</div>
              <div className="kd-voice-name serif">{v.name}</div>
            </div>
            <blockquote className="serif">{v.quote}</blockquote>
            <div className="kd-voice-wave">
              {Array.from({length: 48}).map((_, j) => (
                <span key={j} style={{height: `${20 + Math.abs(Math.sin(i*7+j*0.7))*70}%`}}/>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContributeStrip() {
  return (
    <section className="kd-contrib">
      <div className="kd-contrib-inner">
        <div className="smallcaps">— Споделете</div>
        <h2 className="serif">Имате снимка, писмо или спомен <em>от Камилски дол</em>?</h2>
        <p>
          Архивът се пълни от потомците на селото — в България, в Гърция, отвъд океана.
          Изпратете ни сканирана снимка, разкажете спомен на близък, дайте име на лице,
          което не разпознаваме.
        </p>
        <a href="/contribute/" className="btn btn-primary">Дарете на архива →</a>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <SiteHeader active="home" />
      <main>
        <HomeHero />
        <Prologue />
        <FactStrip />
        <Featured />
        <SectionGrid />
        <VoicesTeaser />
        <ContributeStrip />
      </main>
      <SiteFooter />
      <TweaksRoot />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
