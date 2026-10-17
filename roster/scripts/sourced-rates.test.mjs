import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guideEvidence, sourcedRates, rateCandidates, rateProblem, rateLabel, rateCell, displayUnit, isFromPrice, priceRange, additionalRates, minimumCompanies, maxLabelLength} from '../lib/sourced-rates.mjs';

// Fixtures copy the release fields of the entries found in the 15 Oct 2026 live QA.
const line = overrides => ({job:'repair',service:'Troubleshooting',unit:'per job',amount_sgd:60,price_text:'$60',excerpt:'',sourceUrl:'https://example.com/prices',capturedAt:'2026-10-10',promo:false,...overrides});
const company = (slug, category, lines) => ({slug, name:slug, category, enrichment:{priceLines:lines}});
const spec = key => guideEvidence[key];

test('Starting prices keep their "From" wording', () => {
  for (const price_text of ['From $ 280', 'From $350*', 'from SG $30', 'From SGD $120', 'Services start from just S$80, with transparent 2026 pricing', 'Starting at $120/Unit', 'Prices start from $128 nett onwards.', '$90 onwards', 'Recurring service begins at only $24 per hour', 'as low as $18/hour', 'From $1,400/Month'])
    assert.equal(isFromPrice(line({amount_sgd:Number(price_text.match(/\$\s*([\d,]+)/)[1].replace(',', '')), price_text})), true, price_text);
  // "from" next to another amount, or no starting wording at all.
  assert.equal(isFromPrice(line({amount_sgd:360, price_text:'$320 for Studio - $360 for 3 rooms - $600 onwards for Landed Homes'})), false);
  assert.equal(isFromPrice(line({amount_sgd:60, price_text:'$60'})), false);
  assert.equal(isFromPrice(line({amount_sgd:25, price_text:'$25.50 from 2 units'})), false);
  assert.equal(rateCell(line({amount_sgd:280, unit:'per job', price_text:'From $ 280'})), 'From S$280 per job');
  assert.equal(rateCell(line({amount_sgd:1998, price_text:'Inverter fan coils, copper piping and trunking included, from $1,998.'})), 'From S$1,998 per job');
});

test('Printed ranges are shown in full', () => {
  assert.equal(rateCell(line({unit:'as printed', amount_sgd:40, price_text:'Troubleshooting | $40-$80'})), 'S$40 to S$80');
  assert.equal(rateCell(line({unit:'as printed', amount_sgd:20, service:'Day Curtains', price_text:'Day Curtains | $20 - $25'})), 'S$20 to S$25');
  assert.equal(rateCell(line({unit:'as printed (range)', amount_sgd:60, amount_max_sgd:80, price_text:'Repair troubleshooting starts from $60-$80, with the fix quoted separately'})), 'From S$60 to S$80');
  assert.equal(rateCell(line({amount_sgd:450, amount_max_sgd:850, price_text:'$450 - $850+'})), 'S$450 to S$850+ per job');
  assert.deepEqual(priceRange(line({amount_sgd:1953, price_text:'$1,953.00 - $3,013.00'})), {max:3013, open:false});
  // A range elsewhere in the text does not belong to the shown amount.
  assert.equal(priceRange(line({amount_sgd:150, price_text:'3-Room HDB | $360 - $380 | $150 | $250'})), null);
});

test('Units printed by the source are preserved', () => {
  assert.equal(displayUnit(line({unit:'per job', unitInferred:true, amount_sgd:60, price_text:'From S$60/hour'})), 'per hour');
  assert.equal(displayUnit(line({unit:'per job', unitInferred:true, service:'Troubleshooting per unit', price_text:'Troubleshooting from $60 nett per unit'})), 'per unit');
  assert.equal(displayUnit(line({unit:'per job', unitInferred:true, amount_sgd:40, service:'Furniture Assembly (per piece)', price_text:'Furniture Assembly (per piece) | From $40'})), 'per piece');
  assert.equal(rateCell(line({unit:'as printed', amount_sgd:70, service:'System Installation (1-4) - from $70 per unit onwards', price_text:'from $70 per unit onwards'})), 'From S$70 per unit');
  assert.equal(displayUnit(line({unit:'per unit', unitInferred:true, amount_sgd:120, amount_max_sgd:150, price_text:'R22 Gas | $120 - $150 /psig'})), 'per psig');
  assert.equal(displayUnit(line({unit:'per job', unitInferred:true, amount_sgd:40, amount_max_sgd:60, price_text:'Subsequent Hour: $40 - $60'})), 'per hour');
  // A stated release unit is not overridden, and "as printed" never reaches the page.
  assert.equal(displayUnit(line({unit:'per piece', unitInferred:false, amount_sgd:25, price_text:'From $25.00/pc'})), 'per piece');
  assert.equal(displayUnit(line({unit:'as printed', amount_sgd:30, price_text:'$30'})), '');
  assert.equal(displayUnit(line({unit:'per unit (from)', amount_sgd:30, price_text:'$30'})), 'per unit');
});

test('Spower shows its first-point rate with the $67 additional-point rate printed beside it', () => {
  const spower = line({job:'light-installation', unit:'per job', unitInferred:true, amount_sgd:97,
    service:'Install / replace light/ ceiling light fitting - (with existing point) (per additional point)',
    service_raw:'Install / replace light/ ceiling light fitting - From $97 (with existing point) From $67 (per additional point)',
    price_text:'From $97 (with existing point) From $67 (per additional point)'});
  assert.deepEqual(additionalRates(spower), [{from:true, amount:67, unit:'per additional point'}]);
  assert.equal(rateCell(spower), 'From S$97 per job; from S$67 per additional point');
  assert.equal(rateLabel(spower, spec('EL-07')), 'Install / replace light/ ceiling light fitting (with existing point)');
});

test('Labels are plain service names without source fragments', () => {
  const label = (service, key, extra={}) => rateLabel(line({service, ...extra}), spec(key));
  assert.equal(label('13A single power point: - Double power point (13A x2)', 'EL-08', {price_text:'Double power point (13A x2): From $90', amount_sgd:90}), 'Double power point (13A x2)');
  assert.equal(label('Troubleshooting | each', 'AC-06'), 'Troubleshooting');
  assert.equal(label('Chemical Wash Overhaul - Deep cleaning and overhaul services for 9,000-12,000 BTU fan coil units, with pricing depending on c', 'AC-08'), 'Chemical Wash Overhaul');
  assert.equal(label('Best Weekly Maid Service & Part Time Cleaner Services - Book professional home cleaning today!', 'CL-05', {job:'regular-cleaning'}), 'Part-time cleaning');
  assert.equal(label('Your Reliable House Cleaning Agency - The best option for keeping your home sparkling clean.', 'CL-05'), 'Part-time cleaning');
  assert.equal(label('Drilling & Installation Service | Professional Painting & Wall Touch-Ups - Professional painting services and interior improvements to refresh your living space.', 'HM-03'), 'Professional Painting & Wall Touch-Ups');
  assert.equal(label('Eco Chemical Wash - $80 per unit', 'chemical-wash'), 'Eco Chemical Wash');
  assert.equal(label('Aircon gas top-up (from, nett)', 'gas-top-up'), 'Aircon gas top-up');
  assert.equal(label('8 units - Chemical wash (fan coil, no dismantling).', 'chemical-wash'), 'Chemical wash (fan coil, no dismantling)');
  assert.equal(rateLabel(line({service:'Aircon Chemical Overhaul Singapore | NewCool'}), spec('AC-08'), 'Newcool'), 'Aircon Chemical Overhaul Singapore');
  // Without a heading, a long label is cut at a word boundary.
  const long = rateLabel(line({service:'Supply and install a concealed single thirteen amp power point including chasing plastering and making good of the wall surface afterwards'}), spec('EL-08'));
  assert.ok(long.length <= maxLabelLength && /^Supply and install .*\b\w+$/.test(long) && 'Supply and install a concealed single thirteen amp power point including chasing plastering and making good of the wall surface afterwards'.startsWith(long), long);
});

test('Entries that are not prices for the guide service are rejected', () => {
  const cases = [
    ['AC-06', 'review text', {service:'Great people and process. Booked their $30 check when my aircon could not switch on. They traced the problem to wiring. No upsell, no drama.', price_text:'Great people and process. Booked their $30 check when my aircon could not switch on.', amount_sgd:30, unit:'as printed', excerpt:'“ | Great people and process.'}],
    ['AC-08', 'review text', {job:'chemical-wash', service:'Very good service!👍👍 - The overhaul and chemical wash', price_text:'The overhaul and chemical wash $100', amount_sgd:100, unit:'per unit', excerpt:'4 months ago | The overhaul and chemical wash $100'}],
    ['AC-09', 'surcharge, not a service price', {job:'condenser-cleaning', service:'Wall-mounted units. Cassette, ducted and outdoor units are on the full rate card. Above 12,000 BTU adds $10 per unit, and fan blower removal', price_text:'Wall-mounted units. Cassette, ducted and outdoor units are on the full rate card. Above 12,000 BTU adds $10 per unit, an', amount_sgd:10, unit:'per unit'}],
    ['AC-08', 'surcharge, not a service price', {job:'chemical-overhaul', service:'Chemical overhaul pricing: - Indoor units above 24,000 BTU', price_text:'Indoor units above 24,000 BTU: +$20/unit', amount_sgd:20, unit:'per unit'}],
    ['chemical-wash', 'surcharge, not a service price', {job:'chemical-wash', service:'Chemical wash', price_text:'+$95 each', amount_sgd:95, unit:'per unit'}],
    ['AC-06', 'work from another trade', {job:'repair', service:'Labor & material to repair leak at exposed copper pipe or UPVC pipe', price_text:'From $140', amount_sgd:140}],
    ['AC-04', 'work from another trade', {job:'installation', service:'Installing Curtain Rods - ( per additional unit)', price_text:'From $100 (From $30 per additional unit)', amount_sgd:100}],
    ['chemical-wash', 'market statement, not a company rate', {job:'chemical-wash', service:'How Much Is Air Con Serving And Chemical Wash In Singapore? - typical price for general AC servicing Singapore starts from S$40', price_text:'typical price for general AC servicing Singapore starts from S$40', amount_sgd:40, unit:'per unit'}],
    ['chemical-wash', 'service named only in a negation', {job:'chemical-wash', service:'Best for: No chemical wash needed', price_text:'From $60 / unit', amount_sgd:60, unit:'per unit'}],
    ['CL-06', 'service named only as a cross-sell', {job:'post-renovation', service:'Curtains Cleaning - Commonly booked with Post Renovation Cleaning Services. Eliminate germs, bacterias and other contaminants from your curt', price_text:'From $25.00/pc', amount_sgd:25, unit:'per piece'}],
    ['HM-03', 'general rate for several services', {job:'plumbing', service:'Handyman Help (Electrical/Plumbing/Painting/Assembly and Mounting) starts and depends on complexity of work required.', price_text:'Handyman Help (Electrical/Plumbing/Painting/Assembly and Mounting) starts from $45', amount_sgd:45, unit:'as printed'}],
    ['HM-04', 'general rate for several services', {job:'drilling-mounting', service:'Installation Services Singapore - TV brackets, mirrors, shelves, lights, curtain hardware and accessories.', price_text:'From S$60 - TV brackets, mirrors, shelves, lights, curtain hardware and accessories.', amount_sgd:60}],
    ['CL-07', 'add-on to another booking', {job:'steam', service:'Steam sanitisation, curtains and floor steaming are optional add-ons.', price_text:'Steam sanitisation ($10/item), curtains ($10/panel) and floor steaming ($10/room) are optional add-ons.', amount_sgd:10, unit:'per piece'}]
  ];
  for (const [key, reason, fields] of cases) assert.equal(rateProblem(line(fields), spec(key)), reason, fields.service);
  // Genuine rates from the same companies still pass.
  assert.equal(rateProblem(line({job:'chemical-wash', service:'Chemical wash', price_text:'From $70 / unit', amount_sgd:70, unit:'per unit'}), spec('chemical-wash')), null);
  assert.equal(rateProblem(line({job:'repair', service:'Indoor unit part repair', price_text:'from $80', amount_sgd:80, unit:'as printed'}), spec('AC-06')), null);
  assert.equal(rateProblem(line({job:'curtain', service:'Curtains Cleaning - Commonly booked with Post Renovation Cleaning Services.', price_text:'From $25.00/pc', amount_sgd:25, unit:'per piece'}), spec('CL-10')), null);
  assert.equal(rateProblem(line({job:'deep-cleaning', service:'Spring Cleaning / End of Tenancy / Ad-hoc Cleaning - (4 hours, 1 cleaner)', price_text:'$191', amount_sgd:191, unit:'per visit'}), spec('CL-04')), null);
});

test('A rejected lowest entry gives way to the company\'s next genuine rate', () => {
  const kool = company('kool', 'aircon', [
    line({job:'chemical-wash', service:'Best for: No chemical wash needed', price_text:'From $60 / unit', amount_sgd:60, unit:'per unit'}),
    line({job:'chemical-wash', service:'Chemical wash', price_text:'From $70 / unit', amount_sgd:70, unit:'per unit'})]);
  const rows = sourcedRates(spec('chemical-wash'), [kool]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].line.amount_sgd, 70);
  assert.equal(rateCandidates(spec('chemical-wash'), [kool]).rejected[0].reason, 'service named only in a negation');
});

test('Current release: guide tables hold only genuine, fully worded rates', () => {
  const companies = JSON.parse(readFileSync(new URL('../data/companies.json', import.meta.url))).companies.filter(c => c.publish !== false);
  const banned = [/booked their \$30/i, /12,000 BTU adds/i, /exposed copper pipe/i, /curtain rods/i, /general AC servicing/i, /no chemical wash needed/i, /handyman help/i, /very good service/i];
  assert.equal(minimumCompanies, 3);
  for (const [key, s] of Object.entries(guideEvidence)) {
    for (const {company: c, line: p} of sourcedRates(s, companies)) {
      const where = `${key} ${c.name}`;
      assert.equal(rateProblem(p, s), null, where);
      assert.ok(!banned.some(re => re.test(`${p.service} ${p.price_text}`) && !(s.trade === 'plumbing' && /pipe/.test(re.source))), `QA-flagged entry returned: ${where}`);
      if (key === 'CL-06') assert.ok(!/^curtains? cleaning/i.test(p.service), `Curtain cleaning listed as post-renovation: ${where}`);
      const label = rateLabel(p, s, c.name), cell = rateCell(p);
      assert.ok(label.length >= 3 && label.length <= maxLabelLength, `Label length: ${where}: ${label}`);
      assert.ok(!/\|\s*(?:each|per\b|\/)|\s\|$|\$\d/.test(label), `Label fragment: ${where}: ${label}`);
      assert.ok(!/as printed/.test(cell), `Unit placeholder: ${where}`);
      const range = priceRange(p);
      if (range) assert.ok(cell.includes(` to S$${range.max.toLocaleString('en-SG')}`), `Range shortened: ${where}: ${cell}`);
      else if (isFromPrice(p)) assert.ok(cell.startsWith('From S$'), `Starting price shown as firm: ${where}: ${cell}`);
      assert.ok(/^(?:From )?S\$[\d,.]+(?: to S\$[\d,.]+\+?)?(?: per [a-z ]+)?(?:; (?:from )?S\$[\d,.]+ per additional [a-z]+)*$/.test(cell), `Rate wording: ${where}: ${cell}`);
    }
  }
  const spower = sourcedRates(spec('EL-07'), companies).find(r => /spower/i.test(r.company.name));
  assert.match(rateCell(spower.line), /; from S\$67 per additional point$/);
});
