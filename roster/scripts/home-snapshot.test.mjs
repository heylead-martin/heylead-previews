import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildHomeSnapshot, eligibleHomePrice, snapshotTrades, verifiedHomePin} from '../lib/home-snapshot.mjs';

const trade = id => snapshotTrades.find(t => t.id === id);
const price = (amount, overrides={}) => ({job:'choke-clearing',service:'Toilet choke clearing',amount_sgd:amount,unit:'per job',sourceUrl:'https://example.com/prices',capturedAt:'2026-10-12',...overrides});
const company = (slug, amounts=[], overrides={}) => ({slug,name:slug,category:'plumbing',address:{value:'12 Test Street, Singapore 123456'},enrichment:{priceLines:amounts.map(n=>price(n))},...overrides});
const pin = c => ({status:'verified',precision:'building',addressHash:createHash('sha256').update(c.address.value).digest('hex'),latitude:1.3,longitude:103.8});
const rating = (value,count) => ({value,count,sourceUrl:'https://maps.google.com/?cid=1',checkedAt:'2026-10-12'});

test('Map dots require current verified building evidence within Singapore',()=>{
 const c=company('a'), good=pin(c);
 assert.equal(verifiedHomePin(c,good),true);
 for (const patch of [{status:'unresolved'},{precision:'unit'},{addressHash:'old'},{latitude:0},{longitude:2},{latitude:NaN}]) assert.equal(verifiedHomePin(c,{...good,...patch}),false);
 assert.equal(verifiedHomePin({...c,address:{value:'Changed address'}},good),false);
});

test('Unpublished companies cannot affect homepage statistics, prices or map dots',()=>{
 const a=company('a',[80],{whatsapp:{value:'123'},googleRating:rating(4,10)}), hidden=company('hidden',[1],{publish:false,googleRating:rating(5,1000)});
 const data=buildHomeSnapshot([a,hidden],{a:pin(a),hidden:pin(hidden)},{a:{published:true},hidden:{published:true}});
 assert.deepEqual(data.stats.all,{total:1,mapped:1,priced:1,whatsapp:1,rated:1,average:'4.0'});
 assert.deepEqual(data.points,[{trade:'plumbing',latitude:1.3,longitude:103.8}]);
 assert.equal(data.prices.plumbing.samples.length,1);
});

test('Homepage average treats rated companies equally rather than weighting businesses by review volume',()=>{
 const rows=[company('a',[],{googleRating:rating(5,1000)}),company('b',[],{googleRating:rating(3,10)}),company('unrated')];
 const data=buildHomeSnapshot(rows,{},{});
 assert.equal(data.stats.all.average,'4.0');
 assert.equal(data.stats.all.rated,2);
 assert.equal(data.stats.cleaning.average,null);
});

test('Job averages use one lowest eligible price per company and require at least three companies',()=>{
 const rows=[company('a',[100,80,90]),company('b',[100]),company('c',[120])];
 assert.equal(buildHomeSnapshot(rows.slice(0,2),{},{}).prices.plumbing.average,null);
 const result=buildHomeSnapshot(rows,{},{}).prices.plumbing;
 assert.equal(result.average,100);
 assert.deepEqual(result.samples.map(s=>s.amount),[80,100,120]);
 assert.equal(result.samples[0].sourceUrl,'https://example.com/prices');
 assert.equal(buildHomeSnapshot([],{},{}).prices.plumbing.average,null);
});

test('Missing evidence, invalid amounts, promotions and general guides never supply a job average',()=>{
 for (const patch of [{amount_sgd:0},{amount_sgd:NaN},{amount_sgd:-10},{sourceUrl:''},{capturedAt:''},{promo:true},{indicative:true},{price_text:'Annual package'},{excerpt:'Typical cost guide'},{unit:'per month'},{qty:2},{units_in_price:2}]) assert.equal(eligibleHomePrice(price(80,patch),trade('plumbing')),false,JSON.stringify(patch));
 assert.equal(eligibleHomePrice(price(80,{service:'Sink choke clearing'}),trade('plumbing')),false);
});

test('Comparable jobs preserve their unit and do not mix cleaning or aircon packages with starting rates',()=>{
 const air=price(30,{job:'general-service',service:'General aircon servicing',unit:'per unit'});
 assert.equal(eligibleHomePrice(air,trade('aircon')),true);
 for(const patch of [{units_in_price:3},{service:'Chemical wash'},{price_text:'Quarterly package'}]) assert.equal(eligibleHomePrice({...air,...patch},trade('aircon')),false);
 const clean=price(25,{job:'regular-cleaning',service:'Regular home cleaning',unit:'per hour'});
 assert.equal(eligibleHomePrice(clean,trade('cleaning')),true);
 for(const patch of [{unitInferred:true},{service:'Office cleaning'},{service:'Deep cleaning'},{unit:'per session'}]) assert.equal(eligibleHomePrice({...clean,...patch},trade('cleaning')),false);
 assert.equal(eligibleHomePrice(price(50,{job:'power-point',service:'Power-point installation',unit:'per point'}),trade('electrician')),true);
 assert.equal(eligibleHomePrice(price(50,{job:'power-point',service:'Power-point replacement',unit:'per point'}),trade('electrician')),false);
});
