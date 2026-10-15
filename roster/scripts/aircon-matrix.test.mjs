import test from 'node:test';
import assert from 'node:assert/strict';
import {airconMatrix,unitColumns,sizeColumns} from '../lib/aircon-matrix.mjs';

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
