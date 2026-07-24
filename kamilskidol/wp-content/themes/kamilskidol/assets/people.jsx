/* People & oral histories */

const PEOPLE = [
  { cat: "ХР-001", name: "баба Кера Митрева", years: "1936 – 2023", role: "Разказвачка, шивачка", recorded: "2019",
    quote: "„Дядо ми разправяше — когато подпалиха селото, камбаната я свалиха през нощта и я закопаха в двора. Три години стоя в земята.“",
    body: "Родена и починала в Камилски дол. Една от последните жени, които са носили родопската носия с черна бельова риза. Записани са 14 часа разговори за бита, празниците и сватбените обичаи в селото от края на 19 век.",
    family: "Митреви" },
  { cat: "ХР-002", name: "дядо Атанас Стоянов", years: "1934 –", role: "Овчар, рибар", recorded: "2017",
    quote: "„Преди язовира ходехме до Арда за риба пеша. Сега водата е горе, а пътят е под нея.“",
    body: "На 91 години все още поддържа малко стадо. Помни старите пътеки до река Арда, преди те да бъдат потопени под язовир „Ивайловград“ през 1963 г.",
    family: "Стоянови" },
  { cat: "ХР-003", name: "Мария Митрева", years: "1959 –", role: "Учителка", recorded: "2022",
    quote: "„На Атанасовден всичко село се събираше. Печахме агне на огнището. Сега сме осем души на масата.“",
    body: "Преподава в основното училище на Ивайловград. Връща се всяка година за патронния празник на църквата.",
    family: "Митреви" },
  { cat: "ХР-004", name: "поп Никола", years: "1818 – 1897", role: "Свещеник", recorded: "—",
    quote: "„Дарил иконата на Св. Богородица в иконостаса. Подписът му стои на гърба ѝ.“",
    body: "Свещеник на църквата „Св. Атанас“ в продължение на 38 години. По негова поръчка е отлята камбаната в Одрин през 1895 г.",
    family: "—" },
  { cat: "ХР-005", name: "Тодор Калайджията", years: "1888 – 1963", role: "Калайджия, въглищар", recorded: "—",
    quote: "„Семейството отива чак до Цариград с дървени въглища. Връщат се с памук и сол.“",
    body: "Един от последните представители на занаята „калайджия“ в селото. Пътувал като въглищар до Одрин и Цариград, както мнозина деведерци преди него.",
    family: "Калайджиеви" },
  { cat: "ХР-006", name: "Димитър Митрев", years: "1965 –", role: "Архивист, дарител", recorded: "2024",
    quote: "„Пазя снимките и писмата на дядо. Ако ние не ги опишем, никой няма да го направи.“",
    body: "Основен дарител на дигиталния архив. Внук на Кера. Скенира семейните снимки от 1920 г. насам, описва ги и ги свързва с устните истории на баба си.",
    family: "Митреви" },
];

function PeopleApp() {
  const [active, setActive] = React.useState(0);
  const [view, setView] = React.useState("voices");
  const cur = PEOPLE[active];

  return (
    <>
      <SiteHeader active="people"/>
      <div className="section-head">
        <div>
          <div className="num">V</div>
          <div className="kicker smallcaps">Хора и спомени</div>
        </div>
        <div>
          <h1 className="serif">Имена, лица, гласове —<br/>хората, <em>които пазят</em> селото.</h1>
          <p className="sub">Записахме разговори с двадесет и трима възрастни жители и потомци. Тук са шест от тях. Не са свидетели на големи събития — те са самото село, разказано на глас.</p>
        </div>
      </div>

      <div className="ar-controls">
        <div className="ar-controls-inner" style={{gridTemplateColumns: "1fr auto"}}>
          <div className="ar-filter-group">
            <span className="smallcaps">Изглед</span>
            <div className="ar-chips">
              <button className={"ar-chip " + (view === "voices" ? "active" : "")} onClick={() => setView("voices")}>Гласове</button>
              <button className={"ar-chip " + (view === "tree" ? "active" : "")} onClick={() => setView("tree")}>Родове</button>
            </div>
          </div>
          <div className="ar-meta"><span className="cat">{PEOPLE.length} лица · 23 записа</span></div>
        </div>
      </div>

      {view === "voices" && (
        <section className="pe-feature">
          <div className="pe-feature-inner">
            <div className="ph pe-feature-portrait" data-label={"Portrait · " + cur.name} data-cat={cur.cat} style={kdImg(cur.cat)}></div>
            <div className="pe-feature-body">
              <div className="cat">{cur.cat} · записан {cur.recorded}</div>
              <h2 className="serif">{cur.name}</h2>
              <div className="pe-years mono">{cur.years} · {cur.role}</div>
              <blockquote className="serif pe-quote">{cur.quote}</blockquote>
              <p className="pe-body">{cur.body}</p>
              <div className="pe-player">
                <button className="pe-play">▶</button>
                <div className="pe-wave">
                  {Array.from({length: 80}).map((_, j) => (
                    <span key={j} style={{height: `${15 + Math.abs(Math.sin(active*3 + j*0.4))*80}%`}}/>
                  ))}
                </div>
                <span className="cat">14:22 / 1:42:08</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "tree" && (
        <section className="pe-tree-section">
          <div className="pe-tree-inner">
            <div className="smallcaps" style={{marginBottom: 32}}>— Родът Митреви</div>
            <div className="pe-tree">
              <div className="pe-tree-row" style={{justifyContent: "center"}}>
                <div className="pe-tree-node">
                  <div className="cat">ок. 1850</div>
                  <div className="serif">Стоян Митрев</div>
                </div>
              </div>
              <div className="pe-tree-line"/>
              <div className="pe-tree-row">
                <div className="pe-tree-node"><div className="cat">1888 – 1963</div><div className="serif">Тодор Калайджията</div></div>
                <div className="pe-tree-node"><div className="cat">1892 – 1971</div><div className="serif">Никола Митрев</div></div>
              </div>
              <div className="pe-tree-line"/>
              <div className="pe-tree-row">
                <div className="pe-tree-node primary"><div className="cat">1936 – 2023</div><div className="serif">баба Кера</div></div>
                <div className="pe-tree-node"><div className="cat">1938 – 2014</div><div className="serif">Атанас Митрев</div></div>
              </div>
              <div className="pe-tree-line"/>
              <div className="pe-tree-row">
                <div className="pe-tree-node"><div className="cat">1959 –</div><div className="serif">Мария Митрева</div></div>
                <div className="pe-tree-node primary"><div className="cat">1965 –</div><div className="serif">Димитър Митрев</div></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pe-grid-section">
        <div className="pe-grid-inner">
          <div className="smallcaps" style={{marginBottom: 32}}>— Всички записани</div>
          <div className="pe-grid">
            {PEOPLE.map((p, i) => (
              <button key={p.cat} className={"pe-card " + (i === active ? "active" : "")} onClick={() => { setActive(i); setView("voices"); window.scrollTo({top: 280, behavior: "smooth"}); }}>
                <div className="ph pe-card-portrait" data-label={"Portrait · " + p.name} data-cat={p.cat} style={kdImg(p.cat)}></div>
                <div className="cat" style={{marginTop: 12}}>{p.cat} · {p.recorded}</div>
                <h3 className="serif">{p.name}</h3>
                <div className="pe-card-role">{p.role}</div>
                <div className="pe-card-years mono">{p.years}</div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<PeopleApp/>);
