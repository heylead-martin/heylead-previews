/* Photo archive — filterable */

const PHOTOS = [
  { cat: "СН-001", title: "Площадът, общ изглед", decade: "1920", category: "Архитектура", aspect: "4/3" },
  { cat: "СН-008", title: "Каменна чешма, северна махала", decade: "1930", category: "Архитектура", aspect: "3/4" },
  { cat: "СН-014", title: "Семейство Митреви пред дома", decade: "1930", category: "Семейства", aspect: "4/5" },
  { cat: "СН-021", title: "Жетва над селото", decade: "1940", category: "Земеделие", aspect: "3/2" },
  { cat: "СН-029", title: "Сватба на Кера и Стоян", decade: "1950", category: "Семейства", aspect: "4/5" },
  { cat: "СН-031", title: "Стенопис, „Св. Атанас“", decade: "1950", category: "Църква", aspect: "3/4" },
  { cat: "СН-038", title: "Овчари над Арда", decade: "1950", category: "Земеделие", aspect: "3/2" },
  { cat: "СН-044", title: "Училищна група, IV отделение", decade: "1960", category: "Деца", aspect: "4/3" },
  { cat: "СН-052", title: "Преди потопяването — старият път", decade: "1960", category: "Пейзаж", aspect: "16/9" },
  { cat: "СН-061", title: "Атанасовден, литургия", decade: "1960", category: "Празници", aspect: "4/5" },
  { cat: "СН-070", title: "Каменна ограда, изток", decade: "1970", category: "Архитектура", aspect: "3/4" },
  { cat: "СН-078", title: "Майстор Тодор и неговото килимче", decade: "1970", category: "Занаяти", aspect: "1/1" },
  { cat: "СН-086", title: "Селото от въздуха", decade: "1970", category: "Пейзаж", aspect: "16/9" },
  { cat: "СН-094", title: "Печене на агне, Гергьовден", decade: "1980", category: "Празници", aspect: "4/3" },
  { cat: "СН-103", title: "Камбанарията, ремонт", decade: "1990", category: "Църква", aspect: "3/4" },
  { cat: "СН-112", title: "Сватба на Мария", decade: "2000", category: "Семейства", aspect: "4/5" },
  { cat: "СН-120", title: "Язовир „Ивайловград“ от селото", decade: "2010", category: "Пейзаж", aspect: "16/9" },
  { cat: "СН-128", title: "Площадът днес", decade: "2020", category: "Архитектура", aspect: "4/3" },
];

function ArchiveApp() {
  const [decade, setDecade] = React.useState("Всички");
  const [cat, setCat] = React.useState("Всички");
  const [layout, setLayout] = React.useState("grid");
  const [active, setActive] = React.useState(null);

  const decades = ["Всички", ...Array.from(new Set(PHOTOS.map(p => p.decade))).sort()];
  const cats = ["Всички", ...Array.from(new Set(PHOTOS.map(p => p.category))).sort()];

  const filtered = PHOTOS.filter(p =>
    (decade === "Всички" || p.decade === decade) &&
    (cat === "Всички" || p.category === cat)
  );

  return (
    <>
      <SiteHeader active="archive"/>
      <div className="section-head">
        <div>
          <div className="num">III</div>
          <div className="kicker smallcaps">Фото архив</div>
        </div>
        <div>
          <h1 className="serif">Триста четиридесет и две <em>снимки</em>,<br/>описани и подредени.</h1>
          <p className="sub">Намерени по тавани, в старите ракли, в албумите на потомците. Скенирани, описани и поставени в каталог. Кликнете върху снимка, за да видите всичко известно за нея.</p>
        </div>
      </div>

      <div className="ar-controls">
        <div className="ar-controls-inner">
          <div className="ar-filter-group">
            <span className="smallcaps">Десетилетие</span>
            <div className="ar-chips">
              {decades.map(d => (
                <button key={d} className={"ar-chip " + (decade === d ? "active" : "")} onClick={() => setDecade(d)}>
                  {d === "Всички" ? d : d + "‑те"}
                </button>
              ))}
            </div>
          </div>
          <div className="ar-filter-group">
            <span className="smallcaps">Тема</span>
            <div className="ar-chips">
              {cats.map(c => (
                <button key={c} className={"ar-chip " + (cat === c ? "active" : "")} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="ar-meta">
            <span className="cat">{filtered.length} от {PHOTOS.length}</span>
            <div className="ar-layout">
              <button className={layout === "grid" ? "active" : ""} onClick={() => setLayout("grid")}>▦</button>
              <button className={layout === "masonry" ? "active" : ""} onClick={() => setLayout("masonry")}>▤</button>
            </div>
          </div>
        </div>
      </div>

      <div className={"ar-gallery " + layout}>
        {filtered.map(p => (
          <button
            key={p.cat}
            className="ar-tile"
            onClick={() => setActive(p)}
            style={layout === "masonry" ? { aspectRatio: p.aspect } : {}}
          >
            <div className="ph ar-tile-img" data-label={"Photograph · " + p.title} data-cat={p.cat} style={kdImg(p.cat)}></div>
            <div className="ar-tile-meta">
              <div className="ar-tile-cat mono">{p.cat} · {p.decade}</div>
              <div className="ar-tile-title serif">{p.title}</div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="ar-modal" onClick={() => setActive(null)}>
          <div className="ar-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="ar-modal-close" onClick={() => setActive(null)}>× Затвори</button>
            <div className="ph ar-modal-img" data-label={"Photograph · " + active.title} data-cat={active.cat} style={kdImg(active.cat, {aspectRatio: active.aspect})}></div>
            <div className="ar-modal-side">
              <div className="cat">{active.cat}</div>
              <h2 className="serif">{active.title}</h2>
              <dl className="kd-meta">
                <div><dt>Десетилетие</dt><dd>{active.decade}‑те</dd></div>
                <div><dt>Тема</dt><dd>{active.category}</dd></div>
                <div><dt>Носител</dt><dd>Сребърен отпечатък</dd></div>
                <div><dt>Източник</dt><dd>Семеен архив</dd></div>
              </dl>
              <p className="serif" style={{fontSize: 18, lineHeight: 1.5, color: "var(--paper-dim)"}}>
                Снимката е дарена на архива от потомците на семейство Митреви през 2019 г.
                Скенирана с разделителна способност 1200 dpi и описана с помощта на местни жители.
              </p>
            </div>
          </div>
        </div>
      )}

      <SiteFooter/>
      <TweaksRoot/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ArchiveApp/>);
