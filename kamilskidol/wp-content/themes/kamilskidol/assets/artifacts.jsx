/* Artifacts page */

const ARTIFACTS = [
  { cat: "ОБ-001", title: "Камбана от Одрин", date: "1895", material: "Бронз", category: "Култови", featured: true,
    body: "Отлята в Одрин и пренесена с волска кола. Свалена и закопана в нощта на 16 срещу 17 юли 1913 г., преди опожаряването. Изровена и качена обратно през 1916 г. Тон: ми‑бемол. Действаща." },
  { cat: "ОБ-007", title: "Каменна чешма „Балканска вода“", date: "пр. 1898", material: "Местен камък", category: "Архитектура",
    body: "Една от четирите постоянно течащи чешми. Зидарията е от ломен камък, уста — мраморна. Преустроена 1898 г. — оригиналната възраст не е известна. Водата извира под скалата на 312 м." },
  { cat: "ОБ-014", title: "Стенопис „Св. Атанас“", date: "ок. 1820", material: "Темпера върху мазилка", category: "Култови",
    body: "Северната стена на наоса. Местен зограф, неизвестен. Запазени са фрагменти на сцената „Чудото с агнето“. Реставрирано частично през 1992 г." },
  { cat: "ОБ-022", title: "Сватбена ракла", date: "1903", material: "Орех, ковано желязо", category: "Бит",
    body: "Дарена от семейство Митреви. На капака — резбован растителен мотив, типичен за района на Ивайловград. Запазени инициали „КМ“ — Кера Митрева." },
  { cat: "ОБ-029", title: "Овчарски рог „Сагмал“", date: "ок. 1880", material: "Биволски рог", category: "Земеделие",
    body: "Думата „сагмал“ — наследство от юруците. Използван при доене за привикване на стадото. Тонът се променя според годината — този е настроен на „ла“." },
  { cat: "ОБ-038", title: "Паметник на убитите", date: "1923", material: "Гранит", category: "Спомен", featured: true,
    body: "В центъра на площада. Изписани са имената на 47 жители на селото, избити през лятото на 1913 г., и на 14 загинали в двете Световни войни." },
  { cat: "ОБ-044", title: "Икона „Св. Богородица“", date: "1872", material: "Дърво, темпера", category: "Култови",
    body: "От поставените в иконостаса на църквата. На гърба — посвещение на дарителя „поп Никола от Деведере“." },
  { cat: "ОБ-051", title: "Дървен плуг „рало“", date: "ок. 1920", material: "Дъб", category: "Земеделие",
    body: "Употребяван до 60‑те години. Местен тип с извит чатал, удобен за каменистата почва на околните склонове." },
];

function ArtifactsApp() {
  const [active, setActive] = React.useState(0);
  const [filter, setFilter] = React.useState("Всички");
  const cats = ["Всички", ...Array.from(new Set(ARTIFACTS.map(a => a.category)))];
  const visible = ARTIFACTS.map((a, i) => ({...a, idx: i})).filter(a => filter === "Всички" || a.category === filter);
  const cur = ARTIFACTS[active];

  return (
    <>
      <SiteHeader active="artifacts"/>
      <div className="section-head">
        <div>
          <div className="num">IV</div>
          <div className="kicker smallcaps">Сбирка от предмети</div>
        </div>
        <div>
          <h1 className="serif">Камбани, чешми, ракли —<br/><em>осем</em> предмета, които пазят селото.</h1>
          <p className="sub">Не музей, а списък. Тези предмети все още стоят на местата си — в църквата, на площада, в семейните дворове. Тук сме записали какво знаем за всеки от тях.</p>
        </div>
      </div>

      <div className="ar-controls">
        <div className="ar-controls-inner" style={{gridTemplateColumns: "1fr auto"}}>
          <div className="ar-filter-group">
            <span className="smallcaps">Категория</span>
            <div className="ar-chips">
              {cats.map(c => (
                <button key={c} className={"ar-chip " + (filter === c ? "active" : "")} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="ar-meta">
            <span className="cat">{visible.length} предмета</span>
          </div>
        </div>
      </div>

      <section className="af-feature">
        <div className="af-feature-inner">
          <div className="ph af-feature-img" data-label={"Object · " + cur.title} data-cat={cur.cat} style={kdImg(cur.cat)}></div>
          <div className="af-feature-side">
            <div className="cat">{cur.cat}</div>
            <h2 className="serif">{cur.title}</h2>
            <p className="af-feature-body serif">{cur.body}</p>
            <dl className="kd-meta">
              <div><dt>Датиране</dt><dd>{cur.date}</dd></div>
              <div><dt>Материал</dt><dd>{cur.material}</dd></div>
              <div><dt>Категория</dt><dd>{cur.category}</dd></div>
              <div><dt>Местонахождение</dt><dd>{cur.category === "Култови" ? "Църква „Св. Атанас“" : cur.category === "Архитектура" ? "Площад" : "Сбирка"}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="af-grid-section">
        <div className="af-grid-inner">
          <div className="smallcaps" style={{marginBottom: 32}}>— Цялата сбирка</div>
          <div className="af-grid">
            {visible.map(a => (
              <button key={a.cat} className={"af-card " + (a.idx === active ? "active" : "")} onClick={() => { setActive(a.idx); window.scrollTo({top: 320, behavior: "smooth"}); }}>
                <div className="ph af-card-img" data-label={"Object · " + a.title} data-cat={a.cat} style={kdImg(a.cat, {aspectRatio: "1/1"})}></div>
                <div className="cat" style={{marginTop: 12}}>{a.cat} · {a.date}</div>
                <h3 className="serif">{a.title}</h3>
                <div className="af-card-meta">{a.material} · {a.category}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter/>
      <TweaksRoot/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ArtifactsApp/>);
