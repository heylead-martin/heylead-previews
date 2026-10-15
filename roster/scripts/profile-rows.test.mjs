import test from 'node:test';
import assert from 'node:assert/strict';
import {profileRowProblem} from '../lib/sourced-rates.mjs';
import {markSic,tidyPriceLabel} from '../lib/profile-copy.mjs';

const row=(label,price,excerpt)=>({label,price,excerpt,sourceUrl:'https://example.com/',capturedAt:'2026-10-10',indicative:false});

test('Profile price rows: testimonials, headings and condition fragments are hidden',()=>{
 // Fixtures copy rows from the 15 Oct 2026 live QA (Snowflake and others).
 assert.equal(profileRowProblem(row('Repair','See source details','“ | Great people and process. Booked their $30 check when my aircon could not switch on.')),'review text');
 assert.equal(profileRowProblem(row('General service','See source details','Aircon Service Rates and Pricing | General servicing from $25 a unit when three or more are done together.')),'page heading, not a service price');
 assert.equal(profileRowProblem(row('General servicing - Per unit, 3 or more units. One unit is $50.','Per unit, 3 or more units. One unit is $50.','from $25 | Per unit, 3 or more units. One unit is $50.')),'condition fragment, not a price');
 assert.equal(profileRowProblem(row('Condenser cleaning','See source details','Ask for this | Wall-mounted units. Above 12,000 BTU adds $10 per unit.')),'page heading, not a service price');
 assert.equal(profileRowProblem(row('Very good service!👍👍 - The overhaul and chemical wash','The overhaul and chemical wash $100','4 months ago | The overhaul and chemical wash $100')),'review text');
});

test('Profile price rows: real prices stay, including sentences and company FAQ answers',()=>{
 assert.equal(profileRowProblem(row('General servicing','from $25','General servicing | from $25')),null);
 assert.equal(profileRowProblem(row('Aircon servicing, single fan coil','A single fan coil will cost you $40.','A single fan coil will cost you $40.')),null);
 assert.equal(profileRowProblem(row('Late hours allowance','+ $10 / job','Late hours allowance | + $10 / job')),null);
 assert.equal(profileRowProblem(row('Home cleaning, 3 hours','See source details','How much does cleaning cost? | Home cleaning starts from $66 for 3 hours')),null);
 assert.equal(profileRowProblem(row('General service','See source details','General service 30$ per/unit')),null);
});

test('Obvious source typos are marked [sic], ordinary words are not',()=>{
 assert.equal(markSic('Ttroubleshooting | each'),'Ttroubleshooting [sic] | each');
 assert.equal(markSic('Ttroubleshooting [sic]'),'Ttroubleshooting [sic]');
 for(const w of ['Llama cleaning','Eerie noise','Aaron','Troubleshooting','Ooze'])assert.equal(markSic(w),w);
 assert.match(tidyPriceLabel('Ttroubleshooting'),/\[sic\]$/);
});
