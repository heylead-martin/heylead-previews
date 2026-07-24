/* Timeline page */

const TIMELINE = [
  { year: "пр. н.е.", era: "Античност", title: "Римски златни мини", body: "На околните хълмове са копани мини за злато, които според местната традиция работят повече от две хилядолетия. До преди 250 г. рудата е изнасяна с камили — оттам и името.", cat: "ХР‑001" },
  { year: "ок. 1100", era: "Средновековие", title: "Наблюдателна кула „Наредените камъни“", body: "На върха „Наредените камъни“ — на 1.82 км североизточно от селото — стои късноантична и средновековна наблюдателно‑съобщителна кула, по пътя между крепостта „Неузетикон“ при Мезек и „Лютица“ при Ивайловград.", cat: "ХР‑002" },
  { year: "1572", era: "Османски период", title: "Първо писмено сведение", body: "Името „Камилски дол“ се появява в документ за границите на Черменския вакъф, заедно с Горноселци и Сив кладенец — трите най‑стари селища на този край. Преди това: овчари юруци, стари кервански пътища.", cat: "ХР‑003", primary: true },
  { year: "ок. 1700", era: "Османски период", title: "Заселване от деведерци в Мала Азия", body: "Жители на Деведере — заедно с преселници от Покрован и Хухла — са сред първите основатели на село Коджабунар в Мала Азия. Въглищарският занаят отвежда деведерци до Одрин и Цариград.", cat: "ХР‑004" },
  { year: "1780", era: "Кърджалийско време", title: "Прииждане на българи", body: "В кърджалийските години селото приема нови български семейства от съседни родопски села. Деведере става едно от „средновековните“ села със запазено българско православно население.", cat: "ХР‑005" },
  { year: "1895", era: "Възраждане", title: "Камбаната, отлята в Одрин", body: "За църквата „Св. Атанас“ е поръчана и отлята бронзова камбана в Одрин. Пренасят я с волска кола през река Арда. Тя оцелява през пожара от 1913 г. и виси на камбанарията до днес.", cat: "ОБ‑017", primary: true },
  { year: "1898", era: "Възраждане", title: "Преустроена чешма", body: "Една от четирите постоянно течащи чешми с балканска вода е преустроена тази година. Възрастта на оригиналната ѝ зидария не е известна.", cat: "ОБ‑022" },
  { year: "1912", era: "Балканска война", title: "Освобождение", body: "През октомври Деведере е освободено от османска власт и присъединено към Княжество България. Дотогава селото принадлежи административно към Мустафапашенска каза.", cat: "ХР‑009", primary: true },
  { year: "1913", era: "Втора балканска война", title: "Опожаряване и избиване", body: "През лятото турската войска преминава линията Мидия–Енос. Селото е опожарено, жителите са изтезавани и убивани, жени и девойки — отвличани. Избити са десетки. Камбаната е снета и закопана в двора на църквата.", cat: "ХР‑010", primary: true, dark: true },
  { year: "1934", era: "Царство България", title: "Преименуване", body: "С Министерска заповед селото е преименувано от Деведере на Камилски дол — точен превод на старото име. „Деве“ (камила) и „дере“ (дол).", cat: "ХР‑011" },
  { year: "1939–1945", era: "Световни войни", title: "Жертви от двете Световни войни", body: "В центъра на селото, до паметника на убитите от 1913 г., е изграден каменен паметник на загиналите от Камилски дол във Втората световна война.", cat: "ОБ‑031" },
  { year: "1963", era: "НРБ", title: "Язовир „Ивайловград“", body: "Стената на новопостроения язовир преглъща част от долината на река Арда под селото. Старите пътеки до реката, до мандрите и до рибарските вирове изчезват под водата.", cat: "ХР‑014" },
  { year: "1989", era: "НРБ", title: "Връхна точка на населението", body: "До тази година жителите на Камилски дол достигат 900 души. Започва трайно изселване към Ивайловград, Хасково, София и в чужбина.", cat: "ХР‑016" },
  { year: "2024", era: "Днес", title: "Преброяване — 102 жители", body: "В Камилски дол живеят 102 души, основно възрастни. Селото пази четирите си чешми, каменния си площад, църквата с оригиналните стенописи и камбаната от 1895 г.", cat: "ХР‑020", primary: true },
];

function TimelineApp() {
  const [active, setActive] = React.useState(2);
  const [filter, setFilter] = React.useState("Всички");
  const eras = ["Всички", ...Array.from(new Set(TIMELINE.map(t => t.era)))];

  const visible = TIMELINE.map((t, i) => ({...t, idx: i})).filter(t => filter === "Всички" || t.era === filter);

  return (
    <>
      <SiteHeader active="timeline"/>
      <div className="section-head">
        <div>
          <div className="num">II</div>
          <div className="kicker smallcaps">Свитък на времето</div>
        </div>
        <div>
          <h1 className="serif">Хронология на <em>Деведере</em>,<br/>от мините до днес.</h1>
          <p className="sub">Четиринадесет точки на времето, в които селото оставя следа в писан документ. Между тях — мълчание, овчарски ритуали, неотбелязани смърти, кервани, които вече не идват.</p>
        </div>
      </div>

      <div className="tl-controls">
        <div className="tl-controls-inner">
          <div className="tl-eras">
            {eras.map(e => (
              <button key={e} className={"tl-era " + (filter === e ? "active" : "")} onClick={() => setFilter(e)}>
                {e}
              </button>
            ))}
          </div>
          <div className="cat">{visible.length} записа · превъртете долната скала</div>
        </div>
      </div>

      <div className="tl-scrubber">
        <div className="tl-scrubber-inner">
          <div className="tl-track"></div>
          {TIMELINE.map((t, i) => (
            <button
              key={i}
              className={"tl-pin " + (i === active ? "active" : "") + (t.primary ? " primary" : "")}
              style={{ left: `${(i / (TIMELINE.length - 1)) * 100}%` }}
              onClick={() => setActive(i)}
              aria-label={t.year}
            >
              <span className="tl-pin-dot"></span>
              <span className="tl-pin-year mono">{t.year}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tl-feature">
        <div className="tl-feature-inner">
          <div className="tl-feature-meta">
            <div className="cat">{TIMELINE[active].cat} · {TIMELINE[active].era}</div>
            <div className="tl-feature-year serif">{TIMELINE[active].year}</div>
          </div>
          <div className="tl-feature-body">
            <h2 className="serif">{TIMELINE[active].title}</h2>
            <p>{TIMELINE[active].body}</p>
            <div className="tl-feature-nav">
              <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}>← По‑рано</button>
              <button onClick={() => setActive(Math.min(TIMELINE.length - 1, active + 1))} disabled={active === TIMELINE.length - 1}>По‑късно →</button>
            </div>
          </div>
          <div className="ph tl-feature-img" data-label={"Photograph · " + TIMELINE[active].title} data-cat={TIMELINE[active].cat} style={kdImg(TIMELINE[active].cat)}></div>
        </div>
      </div>

      <div className="tl-list">
        <div className="tl-list-inner">
          <div className="smallcaps" style={{marginBottom: 32}}>— Пълен списък</div>
          {visible.map(t => (
            <article key={t.idx} className={"tl-row " + (t.idx === active ? "active" : "")} onClick={() => setActive(t.idx)}>
              <div className="tl-row-year serif">{t.year}</div>
              <div className="tl-row-body">
                <div className="cat">{t.cat} · {t.era}</div>
                <h3 className="serif">{t.title}</h3>
                <p>{t.body}</p>
              </div>
              <div className="tl-row-mark">{t.primary ? "★" : "·"}</div>
            </article>
          ))}
        </div>
      </div>

      <SiteFooter/>
      <TweaksRoot/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<TimelineApp/>);
