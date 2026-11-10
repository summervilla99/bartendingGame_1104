import test from 'node:test';
import assert from 'node:assert/strict';
import {INGR,ING,RECIPES,VESSEL_CAP} from '../src/data.js';
import {TIMES,FAMILIES,FAM_ORDER,poolFor,DEFAULT} from '../src/session.js';
import {createWorld,tickOrders,pendingSeats,releaseSeat,nightOver,nightSummary,snapshot,restore} from '../src/game/world.js';
import {startDrink,pourStep,clearPour,shakeStroke,stirTurn,setGarnish,scoreDrink,serveDrink,settleDrink,pourVesselOf,RECIPE_BY_ID,SHAKE_STROKES} from '../src/game/bartending.js';

const cfg=(o)=>Object.assign({},DEFAULT,o||{});
const CITRUS=['lime','lemon','grapefruit'];

/* ── data sanity: every recipe must be makeable ── */
test('every recipe uses known ingredients, a known glass and has a tip',()=>{
  for(const r of RECIPES){
    for(const id of Object.keys(r.parts))assert.ok(ING[id],r.id+' uses unknown ingredient '+id);
    assert.ok(VESSEL_CAP[r.glass],r.id+' unknown glass '+r.glass);
    assert.ok(['shake','stir','build'].includes(r.method),r.id+' bad method');
    assert.ok(r.tip,r.id+' has no tip');
  }
});
test('total volume fits both the pour vessel and the serving glass',()=>{
  for(const r of RECIPES){
    const total=Object.values(r.parts).reduce((a,b)=>a+b,0);
    assert.ok(total<=VESSEL_CAP[pourVesselOf(r)],r.id+' overflows its pour vessel');
    assert.ok(total<=VESSEL_CAP[r.glass],r.id+' overflows its serving glass');
  }
});
test('method rule: citrus is never stirred; spirit-only drinks are never shaken',()=>{
  for(const r of RECIPES){
    const ids=Object.keys(r.parts);
    if(ids.some(i=>CITRUS.includes(i)))assert.notEqual(r.method,'stir',r.id+' has citrus but is stirred');
    if(r.method==='shake')assert.ok(ids.some(i=>ING[i].cat!=='spirit'&&i!=='bitters'),r.id+' is shaken without any mixer');
  }
});
test('menu families only reference real recipes and are never empty',()=>{
  const ids=new Set(RECIPES.map(r=>r.id));
  for(const f of FAM_ORDER){
    const list=FAMILIES[f];
    if(list)for(const id of list)assert.ok(ids.has(id),f+' references '+id);
    assert.ok(poolFor({menu:f},RECIPES).length>0);
  }
});

/* ── orders ── */
function runOrders(seed,time,mode,seconds){
  const w=createWorld(cfg({time,mode}),seed,0),log=[];
  for(let t=0;t<seconds;t+=.05){const ev=tickOrders(w,t);if(ev){log.push(ev.seatId+':'+ev.recipeId+'@'+t.toFixed(2));}}
  return {w,log};
}
test('orders are deterministic for a seed and differ between seeds',()=>{
  const a=runOrders(42,'prime','practice',60),b=runOrders(42,'prime','practice',60),c=runOrders(43,'prime','practice',60);
  assert.deepEqual(a.log,b.log);
  assert.notDeepEqual(a.log,c.log);
});
test('only active seats order, and never more than maxPending at once',()=>{
  const w=createWorld(cfg({time:'golden',mode:'practice'}),7,0);
  for(let t=0;t<200;t+=.05){
    tickOrders(w,t);
    assert.ok(pendingSeats(w).length<=TIMES.golden.maxPending);
    for(const s of w.seats)if(s.order)assert.ok(s.active);
  }
});
test('service mode stops ordering once the goal is reached',()=>{
  const w=createWorld(cfg({time:'golden',mode:'service'}),1,0);
  for(let t=0;t<2000;t+=.05){const ev=tickOrders(w,t);if(ev)releaseSeat(w,ev.seatId,t,3);}
  assert.equal(w.night.ordered,TIMES.golden.goal);
});
test('orders respect the chosen menu family',()=>{
  const w=createWorld(cfg({time:'last',menu:'house',mode:'practice'}),5,0);
  const seen=new Set();
  for(let t=0;t<400;t+=.05){const ev=tickOrders(w,t);if(ev){seen.add(ev.recipeId);releaseSeat(w,ev.seatId,t,2);}}
  assert.ok(seen.size>0);
  for(const id of seen)assert.ok(FAMILIES.house.includes(id),id+' is not a house original');
});

/* ── making a drink ── */
function orderedDrink(recipeId){
  const w=createWorld(cfg({time:'prime',mode:'practice'}),9,0);
  w.seats[0].order={recipeId,at:0};
  return {w,d:startDrink(w,'g0')};
}
function pourExact(d,r){for(const id of Object.keys(r.parts)){let left=r.parts[id];while(left>1e-6){const before=d.poured[id]||0;pourStep(d,id,.05);left=r.parts[id]-(d.poured[id]||0);if((d.poured[id]||0)===before)break;}}}
test('pouring is capped by the vessel and accumulates per ingredient',()=>{
  const {d}=orderedDrink('daiquiri');
  assert.equal(d.cap,VESSEL_CAP.tin);
  for(let i=0;i<1000;i++)pourStep(d,'rum',.05);
  assert.ok(Math.abs(d.total-d.cap)<1e-9);
  assert.equal(pourStep(d,'lime',.05),0);
  clearPour(d);assert.equal(d.total,0);assert.deepEqual(d.poured,{});
});
test('mixing progress: shake counts strokes, stir accumulates turns',()=>{
  const {d}=orderedDrink('daiquiri');
  for(let i=0;i<SHAKE_STROKES-1;i++)shakeStroke(d);
  assert.ok(d.mixProg<1);shakeStroke(d);assert.equal(d.mixProg,1);
  const {d:s}=orderedDrink('negroni');
  for(let i=0;i<30;i++)stirTurn(s,Math.PI*2/10);
  assert.ok(Math.abs(s.mixProg-1)<1e-9);
});
test('a perfect drink scores three stars and the hour multiplies the tip',()=>{
  const {w,d}=orderedDrink('highball');
  const r=RECIPE_BY_ID.highball;
  pourExact(d,r);setGarnish(d,r.garnish);
  const res=serveDrink(d);
  assert.ok(res.final>.99);assert.equal(res.stars,3);
  assert.equal(res.tip,3*3000+Math.round(res.acc*1000));
  const base=res.tip;
  settleDrink(w,d);
  assert.equal(res.tip,Math.round(base*TIMES.prime.tipMult));
  assert.equal(w.night.served,1);assert.equal(w.tips,res.tip);
});
test('a wrong pour with no mixing scores badly',()=>{
  const {d}=orderedDrink('negroni');
  pourStep(d,'gin',.2);pourStep(d,'rum',1);
  const res=serveDrink(d);
  assert.ok(res.stars<=1);
});
test('night summary and nightOver follow the goal',()=>{
  const w=createWorld(cfg({time:'golden',mode:'service'}),3,0);
  assert.equal(nightOver(w),false);
  w.night.served=TIMES.golden.goal;w.night.stars=TIMES.golden.goal*3;
  assert.equal(nightOver(w),true);
  assert.equal(nightSummary(w).level,3);
});

/* ── serialisation ── */
test('snapshot round-trips through JSON and restore validates it',()=>{
  const {w,d}=orderedDrink('mojito');
  pourStep(d,'rum',.5);
  const snap=snapshot(w,d),text=JSON.stringify(snap),back=restore(JSON.parse(text));
  assert.deepEqual(back.world,w);assert.deepEqual(back.drink,d);
  assert.equal(restore({v:99}),null);
  const bad=JSON.parse(text);bad.drink.recipeId='nope';assert.equal(restore(bad),null);
});
test('a restored world continues the same order sequence',()=>{
  const a=createWorld(cfg({time:'prime',mode:'practice'}),11,0);
  for(let t=0;t<20;t+=.05)tickOrders(a,t);
  const b=restore(JSON.parse(JSON.stringify(snapshot(a)))).world;
  const la=[],lb=[];
  for(let t=20;t<80;t+=.05){const x=tickOrders(a,t),y=tickOrders(b,t);if(x)la.push(x.recipeId);if(y)lb.push(y.recipeId);}
  assert.deepEqual(la,lb);
});

test('every recipe has detailed notes in both languages; classic family is real', async ()=>{
  const {detailOf}=await import('../src/notes.js');
  const {RECIPES}=await import('../src/data.js');
  for(const r of RECIPES){
    const d=detailOf(r);
    for(const k of ['steps','watch','taste','mistake']){
      assert.ok(d[k]&&d[k].length,r.id+' has no '+k);
      for(const x of d[k]){assert.ok(x.ko&&x.en,r.id+' '+k+' missing a language');}
    }
  }
  assert.ok(FAMILIES.classic.every(id=>RECIPES.some(r=>r.id===id&&!r.season)),'classic ids must exist and not be seasonal');
  assert.equal(FAM_ORDER[0],'classic');
});
