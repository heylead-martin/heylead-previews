/* Contribute page */

function ContributeApp() {
  const [type, setType] = React.useState("photo");
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({ name: "", email: "", relation: "", title: "", year: "", description: "" });
  const update = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <>
      <SiteHeader active="contribute"/>
      <div className="section-head">
        <div>
          <div className="num">VII</div>
          <div className="kicker smallcaps">Дарение към архива</div>
        </div>
        <div>
          <h1 className="serif">Една снимка, едно име,<br/>един <em>спомен</em>.</h1>
          <p className="sub">Архивът се пълни от потомците. Ако имате стари снимки, писма, документи или спомен от близък — изпратете ни ги. Описваме ги, връщаме ви оригиналите, отваряме ги за всички.</p>
        </div>
      </div>

      <section className="cb-stage">
        <div className="cb-stage-inner">
          <aside className="cb-side">
            <div className="smallcaps">Стъпка {step} от 3</div>
            <ol className="cb-steps">
              <li className={step >= 1 ? "active" : ""} onClick={() => setStep(1)}><span className="mono">01.</span> Какво дарявате</li>
              <li className={step >= 2 ? "active" : ""} onClick={() => setStep(2)}><span className="mono">02.</span> Описание</li>
              <li className={step >= 3 ? "active" : ""} onClick={() => setStep(3)}><span className="mono">03.</span> Контакт</li>
            </ol>
            <hr className="hairline-soft" style={{margin: "32px 0"}}/>
            <p className="cb-side-note">
              Не сте сигурни какво имате? Изпратете снимка на телефона на архивиста — Димитър Митрев, <span className="mono">+359 88 123 456</span>. Той ще ви помогне.
            </p>
          </aside>

          <div className="cb-form">
            {step === 1 && (
              <>
                <h2 className="serif">Какво искате да дарите?</h2>
                <p className="cb-lede">Изберете типа материал. На всеки етап можете да се върнете назад.</p>
                <div className="cb-types">
                  {[
                    { v: "photo", t: "Снимка", d: "Семейна, селска, на хора, на сграда." },
                    { v: "doc", t: "Документ или писмо", d: "Удостоверение, писмо, тефтер, бележка." },
                    { v: "object", t: "Предмет", d: "Носия, ракла, оръдие на труда, икона." },
                    { v: "story", t: "Спомен или разказ", d: "Записан или неща, които някой ви разправяше." },
                    { v: "name", t: "Име на лице от снимка", d: "Помагате да разпознаем човек, когото не знаем." },
                  ].map(o => (
                    <button key={o.v} className={"cb-type " + (type === o.v ? "active" : "")} onClick={() => setType(o.v)}>
                      <div className="cb-type-radio">{type === o.v ? "●" : "○"}</div>
                      <div>
                        <div className="serif cb-type-title">{o.t}</div>
                        <div className="cb-type-desc">{o.d}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="cb-actions">
                  <span/>
                  <button className="btn btn-primary" onClick={() => setStep(2)}>Напред →</button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="serif">Опишете го с ваши думи.</h2>
                <p className="cb-lede">Нищо страшно ако не знаете точните дати — приблизителна година и десетилетие е достатъчно.</p>
                <div className="cb-fields">
                  <label>
                    <span>Заглавие или кратко описание</span>
                    <input type="text" value={form.title} onChange={e => update("title", e.target.value)} placeholder="напр. „Сватбата на дядо Стоян и баба Кера“"/>
                  </label>
                  <div className="cb-fields-row">
                    <label>
                      <span>Година (приблизителна)</span>
                      <input type="text" value={form.year} onChange={e => update("year", e.target.value)} placeholder="ок. 1958"/>
                    </label>
                    <label>
                      <span>Място</span>
                      <input type="text" placeholder="Камилски дол, площадът"/>
                    </label>
                  </div>
                  <label>
                    <span>Подробно описание</span>
                    <textarea rows="6" value={form.description} onChange={e => update("description", e.target.value)} placeholder="Кои са на снимката? Какъв е поводът? Как сте я получили? Какво ви е разправял дядо/баба за нея?"/>
                  </label>
                  <div className="cb-upload">
                    <div className="cb-upload-icon mono">+</div>
                    <div>
                      <div className="serif" style={{fontSize: 18}}>Прикачете файл</div>
                      <div className="cat">JPG, PNG, PDF · до 50 MB · може и снимка с телефон</div>
                    </div>
                  </div>
                </div>
                <div className="cb-actions">
                  <button className="btn" onClick={() => setStep(1)}>← Назад</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)}>Напред →</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="serif">Кой сте вие?</h2>
                <p className="cb-lede">Само за да ви се обадим, ако имаме въпроси — или ако искаме да ви върнем оригиналите.</p>
                <div className="cb-fields">
                  <div className="cb-fields-row">
                    <label>
                      <span>Име</span>
                      <input type="text" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Мария Митрева"/>
                    </label>
                    <label>
                      <span>E‑mail</span>
                      <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="maria@..."/>
                    </label>
                  </div>
                  <label>
                    <span>Връзка с Камилски дол</span>
                    <input type="text" value={form.relation} onChange={e => update("relation", e.target.value)} placeholder="внучка на дядо Стоян Митрев"/>
                  </label>
                  <label className="cb-check">
                    <input type="checkbox" defaultChecked/>
                    <span>Съгласен/съгласна съм материалът да бъде включен в публичния архив, с моето име като дарител.</span>
                  </label>
                </div>
                <div className="cb-actions">
                  <button className="btn" onClick={() => setStep(2)}>← Назад</button>
                  <button className="btn btn-primary">Изпрати дарението</button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <SiteFooter/>
      <TweaksRoot/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ContributeApp/>);
