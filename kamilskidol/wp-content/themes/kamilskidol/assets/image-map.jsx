/* image-map.jsx
 * Maps each design item's catalog code (data-cat / cat field) to a real
 * Pexels photo URL. All photos are free / no-attribution-required per the
 * Pexels licence. These are placeholder stand-ins until original archival
 * material from the village is supplied. Every URL was sourced via web
 * search and matches the subject of the placeholder it replaces.
 */
const KD_PEXELS = (id, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const KD_IMAGES = {
  /* ---- Home page ---- */
  // Featured artifact: bronze bell from Odrin (1895)
  "ОБ‑017": KD_PEXELS(33169591),                 // Old stone chapel bell tower
  // Section thumbnails
  "СН‑031": KD_PEXELS(4916524),                  // Church fresco / ornamental ceiling
  "СН‑112": KD_PEXELS(29045845),                 // Vintage couple silhouette (wedding)
  "ОБ‑044": KD_PEXELS(10619928),                 // Orthodox icon
  "ХР‑009": KD_PEXELS(21617725, 700),            // B&W elderly man portrait
  "КР‑002": KD_PEXELS(29144894),                 // Aerial abandoned stone village
  "ДК‑003": KD_PEXELS(31426203),                 // Historic arched architecture / manuscript-feel

  /* ---- Archive page (СН-001 … СН-128) ---- */
  "СН-001": KD_PEXELS(28831136),                 // Площадът — alpine village
  "СН-008": KD_PEXELS(33091199),                 // Каменна чешма — historic stone fountain
  "СН-014": KD_PEXELS(16390250),                 // Семейство пред дома — elderly on bench at house
  "СН-021": KD_PEXELS(30862083),                 // Жетва — shepherd in mountain landscape
  "СН-029": KD_PEXELS(29045845),                 // Сватба — vintage couple
  "СН-031": KD_PEXELS(4916524),                  // Стенопис — fresco
  "СН-038": KD_PEXELS(30862083),                 // Овчари над Арда — shepherd
  "СН-044": KD_PEXELS(20767948),                 // Училищна група — historic stone building (B&W)
  "СН-052": KD_PEXELS(17906049),                 // Стария път — village in mountains
  "СН-061": KD_PEXELS(10628200),                 // Атанасовден литургия — orthodox icon
  "СН-070": KD_PEXELS(35171654),                 // Каменна ограда — ancient ruins
  "СН-078": KD_PEXELS(3756038),                  // Майстор Тодор — elderly bearded man
  "СН-086": KD_PEXELS(9674376),                  // Селото от въздуха — abandoned mountain village
  "СН-094": KD_PEXELS(30862083),                 // Гергьовден агне — shepherd / lamb
  "СН-103": KD_PEXELS(33169591),                 // Камбанарията — bell tower
  "СН-112": KD_PEXELS(29045845),                 // Сватба — vintage couple
  "СН-120": KD_PEXELS(28831136),                 // Язовир — alpine landscape
  "СН-128": KD_PEXELS(31426203),                 // Площадът днес — historic arched architecture

  /* ---- Artifacts page (ОБ-001 … ОБ-051) ---- */
  "ОБ-001": KD_PEXELS(33169591),                 // Камбана от Одрин — bell tower
  "ОБ-007": KD_PEXELS(33091199),                 // Каменна чешма "Балканска вода" — fountain
  "ОБ-014": KD_PEXELS(4916524),                  // Стенопис "Св. Атанас" — fresco ceiling
  "ОБ-022": KD_PEXELS(35171654),                 // Сватбена ракла — ancient texture
  "ОБ-029": KD_PEXELS(30862083),                 // Овчарски рог — shepherd
  "ОБ-038": KD_PEXELS(20767948, 800),            // Паметник на убитите — historic stone monument
  "ОБ-044": KD_PEXELS(10619928),                 // Икона "Св. Богородица"
  "ОБ-051": KD_PEXELS(9565000),                  // Дървен плуг — archaeological site

  /* ---- Timeline (ХР‑001 … ХР‑020) ---- */
  "ХР‑001": KD_PEXELS(35171654),                 // Римски златни мини — ancient ruins
  "ХР‑002": KD_PEXELS(31426203),                 // Кула — historic arched architecture
  "ХР‑003": KD_PEXELS(9674376),                  // Първо писмено — abandoned mountain village
  "ХР‑004": KD_PEXELS(17906049),                 // Заселване в Мала Азия — village in arid mountains
  "ХР‑005": KD_PEXELS(28831136),                 // Кърджалийско време — alpine village
  "ХР‑009": KD_PEXELS(20767948),                 // Освобождение 1912 — historic monument
  "ХР‑010": KD_PEXELS(29144894),                 // Опожаряване — abandoned ruins
  "ХР‑011": KD_PEXELS(31426203),                 // Преименуване — arched architecture
  "ХР‑014": KD_PEXELS(28831136),                 // Язовир — landscape
  "ХР‑016": KD_PEXELS(9674376),                  // Връхна точка населението
  "ХР‑020": KD_PEXELS(33169591),                 // 2024, 102 жители — bell tower

  /* ---- People (ХР-001 … ХР-006) ---- */
  "ХР-001": KD_PEXELS(13650950),                 // баба Кера Митрева — elderly woman headscarf
  "ХР-002": KD_PEXELS(17039298),                 // дядо Атанас Стоянов — elderly man with cap
  "ХР-003": KD_PEXELS(27584187),                 // Мария Митрева — woman white headscarf
  "ХР-004": KD_PEXELS(3756038),                  // поп Никола — elderly bearded man
  "ХР-005": KD_PEXELS(6420909),                  // Тодор Калайджията — elderly mustache portrait
  "ХР-006": KD_PEXELS(21617725),                 // Димитър Митрев — B&W mustached man
};

/* Helper used by JSX: returns an inline-style object that sets --img if a
   match exists, otherwise an empty object (placeholder pattern stays).
   Accepts either a full cat code ("СН-001") or a "code · suffix" string —
   in the latter case the code part is matched. */
function kdImg(cat, extra) {
  if (!cat) return extra || {};
  const key = String(cat).split("·")[0].trim();
  const url = KD_IMAGES[key] || KD_IMAGES[cat];
  const base = url ? { "--img": `url("${url}")` } : {};
  return extra ? Object.assign({}, base, extra) : base;
}

Object.assign(window, { KD_IMAGES, kdImg });
