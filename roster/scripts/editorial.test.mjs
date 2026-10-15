import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadGuides,parseGuide,inline,wordCount,editorialSchema} from '../lib/editorial.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));

test('47 distinct core guides contain substantial copy and matching FAQ schema',async()=>{
  const guides=await loadGuides(root);
  assert.equal(guides.length,47);
  assert.equal(new Set(guides.map(g=>g.path)).size,47);
  assert.equal(guides.filter(g=>g.directoryPath).length,5);
  for(const g of guides){
    if(g.directoryPath){assert.equal(g.path,g.directoryPath+'guide/');assert.ok(!guides.some(other=>other.path===g.directoryPath));}
    assert.ok(g.words>=1000,`${g.id}: ${g.words} words`);
    assert.ok(g.title.length<=60,`${g.id}: title length`);
    assert.ok(g.description.length<=155,`${g.id}: description length`);
    assert.equal(g.faqs.length,4,`${g.id}: FAQ content`);
    assert.equal(new Set(g.toc.map(t=>t.id)).size,g.toc.length);
    assert.ok(g.body.includes('<table>'),`${g.id}: useful comparison table`);
    const schema=editorialSchema(g,'https://example.test/roster');
    assert.equal(schema[0]['@type'],'Article');
    assert.equal(schema.find(s=>s['@type']==='FAQPage').mainEntity.length,4);
    for(const [q,a] of g.faqs){assert.ok(g.body.includes(inline(q)));assert.ok(a.length>100);}
    assert.ok(!JSON.stringify(schema).match(/"(?:Service|AggregateRating|Offer|Review)"/));
  }
});

test('word counts exclude link destinations and Markdown formatting',()=>{
  assert.equal(wordCount('## A short answer\n\nRead [the guide](https://example.test/a-very-long-url).'),6);
});

test('editorial content is escaped, unsafe links rejected and FAQ answers stay plain text',()=>{
  assert.equal(inline('<script>no</script>'),'&lt;script&gt;no&lt;/script&gt;');
  assert.throws(()=>inline('[bad](javascript:alert)'),/Unsupported/);
  const g=parseGuide('A direct answer.\n\n## FAQs\n\n### Is this useful?\n\nRead **the details** and [the source](https://example.test/source).','TEST');
  assert.deepEqual(g.faqs,[['Is this useful?','Read the details and the source.']]);
  assert.equal(g.sources[0].url,'https://example.test/source');
});
