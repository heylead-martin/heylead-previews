// Martin, 18 Oct 2026: no visible capture dates anywhere on the site. Every date stays in the data
// (companies.json, the search index, JSON-LD dateModified), and source links stay; the pages just
// do not print "Checked 10 Oct 2026", "Google Maps · 2026-10-10" and the like.
// Article bylines (<time>) are publication dates, not capture dates, and are kept.

const MONTH = String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?`;
const DAY_DATE = String.raw`\d{1,2}(?:\s*(?:-|to|and)\s*\d{1,2})?\s+${MONTH}\s+20\d\d`;
const DATE = String.raw`(?:20\d\d-\d\d-\d\d(?:T[\d:+]+)?|${DAY_DATE})`;
// Any visible full date: ISO, "10 Oct 2026", "10 to 12 October 2026", "October 2026".
export const VISIBLE_DATE = new RegExp(String.raw`\b20\d\d-\d\d-\d\d\b|\b${DAY_DATE}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d\b`);

// Roster's own capture-date phrasing, removed from visible text only.
const PATTERNS = [
  [new RegExp(String.raw`\s*\((?:checked|captured|as of)\s+${DATE}\)`, 'gi'), ''],
  [new RegExp(String.raw`\s*(?:Last checked|Facts last checked|Prices and services checked|Checked|Captured|Check date:?|Source checked)\s+(?:on\s+)?${DATE}\.?`, 'gi'), ''],
  [new RegExp(String.raw`\s*[·|]\s*${DATE}`, 'g'), ''],
  [new RegExp(String.raw`(\b(?:reviews?|stars?|rating)\b[^.<]{0,40}?)\s+on\s+${DATE}`, 'gi'), '$1'],
  [new RegExp(String.raw`,?\s*(?:checked|captured)\s+(?:on|between)\s+${DATE}`, 'gi'), ''],
  // Research notes shown with excerpts: "page opened 2026-10-10", "as shown on 2026-10-10", "(r14 2026-10-15)".
  [new RegExp(String.raw`,?\s+(?:opened|read|as shown on|web search on|on)\s+${DATE}`, 'gi'), ''],
  [new RegExp(String.raw`,?\s+(?:20\d\d-\d\d-\d\d\b|${DAY_DATE})(?=\))`, 'g'), ''],
  [new RegExp(String.raw`,?\s*(?:current\s+)?as of\s+(?:${DATE}|${MONTH}\s+20\d\d)`, 'gi'), '']
];
export const stripDateText = text => PATTERNS.reduce((t, [re, to]) => t.replace(re, to), text);

// Applies stripDateText to text between tags, outside <script>, <style>, <time> and <head>.
export function stripCaptureDates(html) {
  let skip = 0;
  return html.split(/(<[^>]*>)/).map(part => {
    if (part.startsWith('<')) {
      if (/^<(script|style|time|head)\b/i.test(part)) skip++;
      else if (/^<\/(script|style|time|head)>/i.test(part)) skip = Math.max(0, skip - 1);
      return part;
    }
    return skip ? part : stripDateText(part);
  }).join('');
}
