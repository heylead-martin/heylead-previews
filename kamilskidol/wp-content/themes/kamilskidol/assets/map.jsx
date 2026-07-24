/* Map page — pannable historical map */

const PINS = [
  { id: 1, x: 48, y: 42, cat: "ОБ-001", title: "Църква „Св. Атанас“", body: "Каменна църква от началото на 19 век, с оригинални стенописи и дърворезба. Камбанарията носи камбаната, отлята в Одрин през 1895 г." },
  { id: 2, x: 52, y: 50, cat: "ОБ-038", title: "Площадът", body: "Изцяло калдъръмен. В центъра — паметникът на убитите от 1913 г. и загиналите във Втората световна война." },
  { id: 3, x: 38, y: 38, cat: "ОБ-007", title: "Чешма „Балканска вода“", body: "Една от четирите постоянно течащи чешми. Преустроена 1898 г." },
  { id: 4, x: 60, y: 32, cat: "ОБ-009", title: "Чешма, североизток", body: "Втора от четирите. Зидана от ломен камък, кацнала на скалата." },
  { id: 5, x: 44, y: 60, cat: "ОБ-011", title: "Чешма, юг", body: "Трета. Близо до старата мандра." },
  { id: 6, x: 56, y: 58, cat: "ОБ-013", title: "Чешма, изток", body: "Четвърта. Покрита с каменна плоча." },
  { id: 7, x: 72, y: 22, cat: "ХР-002", title: "„Наредените камъни“", body: "Връх на 1.82 км североизточно. Останки от късноантична и средновековна наблюдателна кула, по пътя Мезек–Лютица." },
  { id: 8, x: 28, y: 70, cat: "ХР-001", title: "Римски златни мини", body: "Останки от антични мини. До преди 250 години рудата е изнасяна с камили — оттам и името." },
  { id: 9, x: 50, y: 82, cat: "ХР-014", title: "Залив на язовир „Ивайловград“", body: "Стената е изградена през 1963 г. Под водата остават старите пътеки до река Арда и рибарските вирове." },
  { id: 10, x: 18, y: 20, cat: "ОБ-019", title: "Стара мандра", body: "Изоставена. Овчарите я ползваха до края на 70‑те години." },
];

function MapApp() {
  const [active, setActive] = React.useState(2);
  const [layer, setLayer] = React.useState("modern");
  const cur = PINS.find(p => p.id === active) || PINS[0];

  return (
    <>
      <SiteHeader active="map"/>
      <div className="section-head">
        <div>
          <div className="num">VI</div>
          <div className="kicker smallcaps">Историческа карта</div>
        </div>
        <div>
          <h1 className="serif">Чешми, мегдани, мандри —<br/><em>десет</em> точки от селото.</h1>
          <p className="sub">Превключете между съвременната карта, австро‑унгарския щаб от 1903 г. и полевата геодезия 1:5000 от 1962 г. Натиснете върху знак, за да прочетете какво стои там.</p>
        </div>
      </div>

      <div className="ar-controls">
        <div className="ar-controls-inner" style={{gridTemplateColumns: "1fr auto"}}>
          <div className="ar-filter-group">
            <span className="smallcaps">Картен слой</span>
            <div className="ar-chips">
              <button className={"ar-chip " + (layer === "modern" ? "active" : "")} onClick={() => setLayer("modern")}>Съвременна</button>
              <button className={"ar-chip " + (layer === "1903" ? "active" : "")} onClick={() => setLayer("1903")}>1903 — Австро‑унгарска</button>
              <button className={"ar-chip " + (layer === "1962" ? "active" : "")} onClick={() => setLayer("1962")}>1962 — Геодезия 1:5000</button>
            </div>
          </div>
          <div className="ar-meta"><span className="cat">{PINS.length} обекта · 41.5999° С 26.0560° И</span></div>
        </div>
      </div>

      <section className="mp-stage">
        <div className="mp-canvas" data-layer={layer}>
          <svg className="mp-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="3" stroke="rgba(212,200,176,0.06)" strokeWidth="0.5"/>
              </pattern>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(212,200,176,0.05)" strokeWidth="0.2"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)"/>
            {/* Contours */}
            <path d="M 10,80 Q 30,70 50,75 T 90,72" fill="none" stroke="rgba(184,168,120,0.18)" strokeWidth="0.25"/>
            <path d="M 5,65 Q 25,55 45,58 T 95,55" fill="none" stroke="rgba(184,168,120,0.18)" strokeWidth="0.25"/>
            <path d="M 8,48 Q 30,38 50,42 T 92,40" fill="none" stroke="rgba(184,168,120,0.22)" strokeWidth="0.3"/>
            <path d="M 12,32 Q 32,22 52,25 T 88,22" fill="none" stroke="rgba(184,168,120,0.22)" strokeWidth="0.3"/>
            <path d="M 15,18 Q 35,8 55,12 T 85,10" fill="none" stroke="rgba(184,168,120,0.18)" strokeWidth="0.25"/>
            {/* River — Arda */}
            <path d="M 0,88 Q 20,82 40,85 T 80,82 Q 92,80 100,82" fill="none" stroke="rgba(120,150,180,0.4)" strokeWidth="1.2"/>
            {/* Roads */}
            <path d="M 50,100 Q 50,75 52,50 T 60,20 L 75,5" fill="none" stroke="rgba(212,200,176,0.18)" strokeWidth="0.4" strokeDasharray="1 1"/>
            <path d="M 0,55 Q 25,52 50,50 T 100,48" fill="none" stroke="rgba(212,200,176,0.14)" strokeWidth="0.3" strokeDasharray="0.5 0.8"/>
            {/* Village footprint */}
            <rect x="42" y="38" width="20" height="18" fill="rgba(184,168,120,0.08)" stroke="rgba(184,168,120,0.4)" strokeWidth="0.2"/>
            {/* Mine shaft */}
            <circle cx="28" cy="70" r="1.5" fill="none" stroke="rgba(184,168,120,0.5)" strokeWidth="0.3" strokeDasharray="0.4 0.4"/>
            {/* Tower */}
            <polygon points="72,20 73,24 71,24" fill="rgba(184,168,120,0.5)"/>
          </svg>
          {PINS.map(p => (
            <button
              key={p.id}
              className={"mp-pin " + (active === p.id ? "active" : "")}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => setActive(p.id)}
              aria-label={p.title}
            >
              <span className="mp-pin-num mono">{p.id}</span>
            </button>
          ))}
          <div className="mp-compass">
            <div className="mono" style={{fontSize: 10, letterSpacing: "0.2em"}}>С</div>
            <div className="mp-compass-needle"/>
          </div>
          <div className="mp-scalebar">
            <div className="mp-scalebar-bar"/>
            <div className="mono" style={{fontSize: 10, marginTop: 4}}>0 — 500 м</div>
          </div>
          <div className="mp-legend">
            <div className="mono">{layer === "modern" ? "ИГН · 2024" : layer === "1903" ? "K. u. K. Militärgeographisches Institut · 1903" : "Геодезия НРБ · 1962"}</div>
          </div>
        </div>

        <aside className="mp-side">
          <div className="cat">{cur.cat}</div>
          <h2 className="serif">{cur.title}</h2>
          <p>{cur.body}</p>
          <hr className="hairline-soft"/>
          <div className="smallcaps" style={{marginTop: 24, marginBottom: 12}}>— Всички точки</div>
          <ol className="mp-list">
            {PINS.map(p => (
              <li key={p.id} className={active === p.id ? "active" : ""} onClick={() => setActive(p.id)}>
                <span className="mono">{String(p.id).padStart(2, "0")}</span>
                <span>{p.title}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <SiteFooter/>
      <TweaksRoot/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MapApp/>);
