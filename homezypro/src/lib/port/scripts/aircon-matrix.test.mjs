import test from 'node:test';
import assert from 'node:assert/strict';
import {airconMatrix,unitColumns,sizeColumns,unitRowProblem} from '../lib/aircon-matrix.mjs';
import {rateCell,rateLabel,ownLabelSource} from '../lib/sourced-rates.mjs';

const line=(job,amount,units,text,extra={})=>({job,amount_sgd:amount,units_in_price:units,service:text,price_text:text,unit:units===1?'per unit':`total for ${units} units`,sourceUrl:'https://example.com/p',capturedAt:'2026-10-10',promo:false,...extra});
const co=(slug,lines)=>({slug,name:slug,category:'aircon',enrichment:{priceLines:lines}});
const cell=(rows,service,column)=>rows.find(r=>r.service.id===service).cells.find(c=>c.column.id===column);

test('Cells need three companies and use one lowest rate per company',()=>{
 const rows=airconMatrix([co('a',[line('general-service',50,1,'General servicing $50'),line('general-service',40,1,'General servicing $40')]),co('b',[line('general-service',60,1,'General servicing $60')])],unitColumns);
 assert.equal(cell(rows,'general','1').count,2);assert.equal(cell(rows,'general','1').shown,false);
 const three=airconMatrix([co('a',[line('general-service',40,1,'General servicing $40')]),co('b',[line('general-service',60,1,'General servicing $60')]),co('c',[line('general-service',70,1,'General servicing $70')])],unitColumns);
 assert.deepEqual([cell(three,'general','1').min,cell(three,'general','1').max,cell(three,'general','1').median],[40,70,60]);
});

test('Packages, per-unit wording on multi-unit totals and mismatched counts are left out',()=>{
 const rows=airconMatrix([co('a',[line('general-service',250,2,'2 Units Servicing Package | $250')]),co('b',[line('general-service',19,6,'6 Fancoil units & above | $19 each')]),co('c',[line('chemical-overhaul',299.6,1,'1 FCU - $160.50 | 2 FCU - $299.60')]),co('d',[line('general-service',80,1,'Chemical Overhaul $80 | General Servicing $40')])],unitColumns);
 assert.equal(cell(rows,'general','2').count,0);assert.equal(cell(rows,'general','5+').count,0);assert.equal(cell(rows,'overhaul','1').count,0);assert.equal(cell(rows,'general','1').count,0);
});

test('Unit size comes from the words printed before the amount',()=>{
 const rows=airconMatrix([co('a',[line('chemical-overhaul',140,1,'9K - 12K BTU...... $120 | 18K BTU...... $140')]),co('b',[line('chemical-overhaul',80,1,'$80 per unit, for aircon below 18k BTU')]),co('c',[line('chemical-overhaul',150,1,'Chemical overhaul 9k and 12k BTU | $150')])],sizeColumns);
 assert.deepEqual(cell(rows,'overhaul','18k').entries.map(e=>e.company.slug),['a']);
 assert.deepEqual(cell(rows,'overhaul','9k').entries.map(e=>e.company.slug),['c']);
 assert.deepEqual(cell(rows,'overhaul','12k').entries.map(e=>e.company.slug),['c']);
});

// Review 2026-10-17 P0-4: rows from real price tables that must not sit in a units cell.
const tier=(job,amount,units,extra)=>line(job,amount,units,extra.price_text||'',{unit:units===1?'per unit':`total for ${units} units`,qty:units,...extra});
test('Per-unit, additional-unit and minimum-quantity rates never become a units cell',()=>{
 const cases=[
  [tier('general-service',30,3,{service:'3 unit and above : General Servicing, From',price_text:'S$30.00',excerpt:'3 unit and above : General Servicing, From | S$30.00'}),/minimum-quantity/],
  [tier('general-service',38,1,{qty:2,min_units:2,price_text:'*Additional Fan Coil Unit shall be charge at $38 per unit'}),/qty 2|minimum 2/],
  [tier('general-service',20,1,{price_text:'$20.00 / Unit',excerpt:'05 and above Fan Coil Units $20.00 / Unit'}),/minimum-quantity/],
  [tier('chemical-wash',85,1,{qty:8,min_units:8,price_text:'Chemical wash (fan coil, no dismantling) from $85 per unit.'}),/qty 8|minimum 8/],
  [tier('general-service',20,1,{price_text:'With us it works out from as low as $20 a unit. A single unit is $50; two is $60'}),/one-unit price printed is S\$50/],
  [tier('general-service',60,1,{qty:2,price_text:'$60.00',excerpt:'2 fan coil units $60.00'}),/qty 2/]
 ];
 for(const [p,why] of cases)assert.match(String(unitRowProblem(p)),why,p.price_text);
 assert.equal(unitRowProblem(tier('chemical-overhaul',160,1,{price_text:'Chemical Overhaul (Wallmount AC) - $160 for 1 unit, $150 per unit for 2 units or more'})),null);
 assert.equal(unitRowProblem(tier('general-service',90,3,{service_raw:'Normal Servicing - 2 units - $70',price_text:'3 units - $90',excerpt:'2 units - $70 | 3 units - $90'})),null);
});
test('Totals are checked against the company\'s own one-unit price: contracts and per-unit "totals" are left out',()=>{
 const rows=airconMatrix([
  co('ec',[tier('general-service',50,1,{price_text:'1 unit - $50'}),tier('general-service',70,2,{price_text:'2 units - $70'}),tier('general-service',400,4,{price_text:'4 units - $400'})]),
  co('pc',[tier('general-service',45,1,{price_text:'S$45.00'}),tier('general-service',30,3,{price_text:'S$30.00'})])
 ],unitColumns);
 assert.deepEqual(cell(rows,'general','2').entries.map(e=>e.company.slug),['ec']);
 assert.equal(cell(rows,'general','4').count,0);
 assert.equal(cell(rows,'general','3').count,0);
});
test('A chemical wash amount must be the one printed after "Chemical wash"',()=>{
 const afix=tier('chemical-wash',50,1,{price_text:'$50 for 1 unit, $30/unit for 2 units, $25/unit for 3 or more. Chemical wash: $60 for 1 unit, $50/unit for 2+.'});
 assert.equal(cell(airconMatrix([co('afix',[afix])],unitColumns),'wash','1').count,0);
});
// P0-5: a tiered row's label is its own tier, never the previous row's service_raw.
test('Tiered rows are labelled from their own price text',()=>{
 const p={job:'general-service',amount_sgd:90,units_in_price:3,service_raw:'Normal Servicing - 2 units - $70',service:'Normal Servicing - 2 units',price_text:'3 units - $90'};
 assert.equal(ownLabelSource(p),'Normal Servicing, 3 units');
 assert.match(rateLabel(p,{name:'General servicing',noun:'general servicing',match:/servic/i}),/3 units/);
 assert.equal(ownLabelSource({...p,service_raw:'Service Aircon Frm $90/Unit',service:'Service Aircon Frm'}),'Service Aircon Frm');
});
// P1-7: starting prices, "and above" and two-decimal money as printed.
test('"From", "and above" and cents are kept as printed',()=>{
 const r=(amount,price_text,extra={})=>rateCell({job:'general-service',amount_sgd:amount,units_in_price:1,unit:'per unit',price_text,...extra});
 assert.match(r(17,'Service Aircon Frm $17/Unit'),/^From S\$17 /);
 assert.match(r(19.5,'Aircon Servicing Singapore from $19.50 | Sky Blue Aircon'),/^From S\$19\.50/);
 assert.match(r(21.8,'from $21.80/unit'),/^From S\$21\.80/);
 assert.match(r(280,'Chemical Treatment $280.00 and above'),/^S\$280 and above/);
 assert.match(r(35,'Starting price: From $35 to $50 per unit',{amount_max_sgd:50}),/^From S\$35 to S\$50/);
 assert.match(r(80,'from S$80',{amount_max_sgd:100,excerpt:'Chemical Wash (From S$80/Unit)'}),/^From S\$80 per unit$/);
});
test('Gas top-up leaves out pressure tests and coil replacement',()=>{
 const rows=airconMatrix([co('d',[tier('gas-top-up',80,1,{price_text:'A nitrogen pressure test for a single system costs $80 to $120.'}),tier('gas-top-up',400,1,{price_text:'Coil sourcing, installation, full regas | $400 to $900+'})])],unitColumns);
 assert.equal(cell(rows,'gas','1').count,0);
});
