import test from 'node:test';
import assert from 'node:assert/strict';
import {TIMES,DEFAULT} from '../src/session.js';
import {createWorld,tickOrders,restore,snapshot} from '../src/game/world.js';
import {claimSeat,releaseClaim,expireClaims,applyServed,autoServe,hostMissing,electHost,acceptSnapshot,parseGameMessage,tipFor,placeOrder,fireLate,NPC_SERVE_AFTER,MAX_TIP,FIRE_COOLDOWN,FIRE_GRACE} from '../src/game/shared.js';
import {RECIPES} from '../src/data.js';

const cfg=(o)=>Object.assign({},DEFAULT,{time:'prime',mode:'practice'},o||{});
/* a world with orders on the first three counter seats */
function world(){
  const w=createWorld(cfg(),5,0);
  w.hostId='p-host';
  for(let i=0;i<3;i++)w.seats[i].order={recipeId:['daiquiri','negroni','mojito'][i],at:i};
  return w;
}
const good=(w,seatIdx,over)=>{const s=w.seats[seatIdx];return Object.assign({rec:s.order.recipeId,stars:3,final:.95,tip:10000,ml:90,col:[.5,.5,.5]},over||{});};

test('claiming: stations, one ticket per bartender, one bartender per ticket',()=>{
  const w=world();
  let r=claimSeat(w,'g0','p-aaaa',10);
  assert.deepEqual([r.ok,r.station,r.orderNo],[true,0,1]);
  assert.equal(claimSeat(w,'g0','p-bbbb',11).reason,'taken');
  assert.equal(claimSeat(w,'g1','p-aaaa',12).reason,'busy');
  r=claimSeat(w,'g1','p-bbbb',13);
  assert.deepEqual([r.ok,r.station,r.orderNo],[true,1,2]);
  assert.equal(claimSeat(w,'g2','p-cccc',14).reason,'full');
  assert.equal(claimSeat(w,'g3','p-cccc',15).reason,'none');
  assert.equal(claimSeat(w,'g0','p-aaaa',16).ok,true);
});
test('only the owner can release a claim, and it frees the station',()=>{
  const w=world();
  claimSeat(w,'g0','p-aaaa',0);
  assert.equal(releaseClaim(w,'g0','p-bbbb'),false);
  assert.equal(releaseClaim(w,'g0','p-aaaa'),true);
  assert.deepEqual(w.stations,[null,null]);
  assert.equal(claimSeat(w,'g0','p-bbbb',1).ok,true);
});
test('claims of players who left the room are freed',()=>{
  const w=world();
  claimSeat(w,'g0','p-aaaa',0);claimSeat(w,'g1','p-bbbb',0);
  assert.equal(expireClaims(w,['p-host','p-bbbb']),1);
  assert.equal(w.seats[0].claim,null);assert.equal(w.seats[1].claim.by,'p-bbbb');
  assert.deepEqual(w.stations,[null,'p-bbbb']);
});
test('a served drink settles the night with the hour bonus and frees the seat',()=>{
  const w=world();
  claimSeat(w,'g0','p-aaaa',0);
  const before=w.rev,res=applyServed(w,'g0','p-aaaa',good(w,0),20);
  assert.equal(res.tip,tipFor(w.session,10000));
  assert.equal(res.tip,Math.round(10000*TIMES.prime.tipMult));
  assert.equal(w.night.served,1);assert.equal(w.night.tips,res.tip);assert.equal(w.tips,res.tip);
  assert.equal(w.night.best.recipeId,'daiquiri');
  const s=w.seats[0];
  assert.equal(s.order,null);assert.equal(s.claim,null);assert.equal(s.reaction.stars,3);
  assert.equal(s.served.recipeId,'daiquiri');assert.equal(s.served.by,'p-aaaa');assert.ok(s.served.rev>before);
  assert.deepEqual(w.stations,[null,null]);
});
test('invalid serve requests change nothing',()=>{
  const w=world();
  claimSeat(w,'g0','p-aaaa',0);
  const before=JSON.stringify(w);
  assert.equal(applyServed(w,'g0','p-bbbb',good(w,0),1),null);          // not the claimer
  assert.equal(applyServed(w,'g0','p-aaaa',good(w,0,{rec:'negroni'}),1),null); // wrong drink
  assert.equal(applyServed(w,'g1','p-aaaa',good(w,1),1),null);          // unclaimed seat
  assert.equal(JSON.stringify(w),before);
});
test('the house bartender serves forgotten orders without tips or counting them toward the goal',()=>{
  const w=world();
  w.night.ordered=3;
  claimSeat(w,'g1','p-aaaa',0);
  assert.equal(autoServe(w,NPC_SERVE_AFTER-1),0);
  assert.equal(autoServe(w,NPC_SERVE_AFTER+5),2);               // g0 and g2; g1 is claimed
  assert.equal(w.tips,0);assert.equal(w.night.tips,0);assert.equal(w.night.served,0);
  assert.equal(w.night.ordered,1);
  assert.equal(w.seats[0].served.by,'npc');assert.equal(w.seats[0].served.stars,2);
  assert.ok(w.seats[1].order&&w.seats[1].claim);
});
test('host election and snapshot acceptance',()=>{
  const w=world();
  assert.equal(hostMissing(w,['p-host','p-x']),false);
  assert.equal(hostMissing(w,['p-x','p-y']),true);
  assert.equal(hostMissing({hostId:null},['p-x']),true);
  assert.equal(electHost(['p-zzz','p-aaa','p-mmm']),'p-aaa');
  assert.equal(electHost([]),null);
  assert.equal(acceptSnapshot({rev:5},{rev:3},true),false);
  assert.equal(acceptSnapshot({rev:5},{rev:6},true),true);
  assert.equal(acceptSnapshot({rev:5},{rev:1},false),true);
});
test('game messages are validated',()=>{
  const w=world(),m=(o)=>Object.assign({t:'g',id:'p-aaaa'},o);
  assert.ok(parseGameMessage(m({k:'need'})));
  assert.equal(parseGameMessage(m({k:'claim',seat:'g2'})).seat,'g2');
  for(const bad of [null,{},{t:'g'},m({k:'claim',seat:'g9'}),m({k:'claim',seat:'x'}),m({k:'zzz'}),
    m({k:'served',seat:'g0',rec:'nope',stars:3,final:1,tip:1,ml:1,col:[0,0,0]}),
    m({k:'served',seat:'g0',rec:'daiquiri',stars:7,final:1,tip:1,ml:1,col:[0,0,0]}),
    m({k:'served',seat:'g0',rec:'daiquiri',stars:3,final:1,tip:MAX_TIP+1,ml:1,col:[0,0,0]}),
    m({k:'served',seat:'g0',rec:'daiquiri',stars:3,final:1,tip:1,ml:1,col:[0,0]}),
    m({k:'served',seat:'g0',rec:'daiquiri',stars:3,final:NaN,tip:1,ml:1,col:[0,0,0]}),
    m({k:'world',w:{v:2,seats:[]}}),m({k:'world'})])
    assert.equal(parseGameMessage(bad),null,JSON.stringify(bad));
  const ok=parseGameMessage(m({k:'served',seat:'g0',rec:'daiquiri',stars:3,final:.9,tip:9000,ml:90,col:[.1,.2,.3],extra:'x'}));
  assert.ok(ok&&!('extra' in ok));
  const wm=parseGameMessage(m({k:'world',w:JSON.parse(JSON.stringify(w))}));
  assert.deepEqual(wm.w,w);
  const bad=JSON.parse(JSON.stringify(w));bad.seats[0].order.recipeId='nope';
  assert.equal(parseGameMessage(m({k:'world',w:bad})),null);
});
test('a night played across a snapshot hand-over (host leaves, another takes over)',()=>{
  const a=createWorld(cfg({mode:'service'}),9,0);a.hostId='p-aaa';
  for(let t=0;t<30;t+=.05)tickOrders(a,t);
  const seat=a.seats.find(s=>s.order);
  assert.ok(seat);
  claimSeat(a,seat.id,'p-bbb',30);
  const b=restore(JSON.parse(JSON.stringify(snapshot(a)))).world;     // what a client mirrors
  assert.equal(hostMissing(b,['p-bbb','p-ccc']),true);
  b.hostId=electHost(['p-bbb','p-ccc']);
  assert.equal(b.hostId,'p-bbb');
  const res=applyServed(b,seat.id,'p-bbb',{rec:seat.order.recipeId,stars:2,final:.7,tip:6000,ml:80,col:[.4,.4,.4]},31);
  assert.ok(res&&b.night.served===1);
  for(let t=31;t<200;t+=.05){const ev=tickOrders(b,t);if(ev)b.night.ordered;}
  assert.ok(b.night.ordered>=1);
});

/* ── friends mode: seated customers, time limit ── */
const room=(o)=>{const w=createWorld(cfg(Object.assign({chairs:4,limit:30},o||{})),3,0);w.hostId='p-host';return w;};
test('in a room only the leftmost NPC guest is active; solo keeps the usual guests',()=>{
  const r=room();
  assert.deepEqual(r.seats.map(s=>s.active),[true,false,false,false,false,false,false,false]);
  const solo=createWorld(cfg(),3,0);
  assert.deepEqual(solo.seats.map(s=>s.active),[false,true,true,true,false,false,false,false].map((_,i)=>TIMES.prime.guests.indexOf(i)>=0&&i<4));
});
test('a seated player orders; one order at a time, only from the menu, never in solo',()=>{
  const w=room(),pool=RECIPES.filter(r=>['negroni','mojito'].includes(r.id));
  const a=placeOrder(w,'p-aaaa','negroni',-1.5,5,pool);
  assert.deepEqual([a.ok,a.seatId],[true,'g4']);
  assert.equal(w.seats[4].customer,'p-aaaa');assert.equal(w.seats[4].stoolX,-1.5);assert.equal(w.night.ordered,1);
  assert.equal(placeOrder(w,'p-aaaa','mojito',-1.5,6,pool).reason,'busy');
  assert.equal(placeOrder(w,'p-bbbb','daiquiri',0,6,pool).reason,'menu');
  for(const id of ['p-b','p-c','p-d'])assert.equal(placeOrder(w,id+'xx','mojito',0,7,pool).ok,true);
  assert.equal(placeOrder(w,'p-eeee','mojito',0,8,pool).reason,'full');
  assert.equal(placeOrder(world(),'p-aaaa','negroni',0,0,pool).reason,'solo');
});
test('a customer order is made, served to that stool, and frees the customer seat',()=>{
  const w=room(),pool=RECIPES;
  placeOrder(w,'p-cust','mojito',1.2,10,pool);
  claimSeat(w,'g4','p-barman',11);
  const res=applyServed(w,'g4','p-barman',{rec:'mojito',stars:3,final:.95,tip:10000,ml:150,col:[.5,.5,.5]},20);
  assert.ok(res&&w.night.served===1);
  const s=w.seats[4];
  assert.equal(s.order,null);assert.equal(s.customer,null);
  assert.equal(s.served.x,1.2);assert.equal(s.served.to,'p-cust');
  assert.equal(placeOrder(w,'p-cust','negroni',1.2,25,pool).ok,true);   // can order again
});
test('a customer who leaves voids their order',()=>{
  const w=room();
  placeOrder(w,'p-cust','mojito',1.2,10,RECIPES);claimSeat(w,'g4','p-bar',11);
  assert.equal(w.night.ordered,1);
  assert.ok(expireClaims(w,['p-host','p-bar'])>0);
  assert.equal(w.seats[4].order,null);assert.equal(w.seats[4].claim,null);assert.equal(w.night.ordered,0);
  assert.deepEqual(w.stations,[null,null]);
});
test('too slow: the bartender is fired, locked out for a while, and the order is free again',()=>{
  const w=room({limit:30});
  w.seats[0].order={recipeId:'negroni',at:0};
  claimSeat(w,'g0','p-slow',100);
  let r=fireLate(w,100+30+FIRE_GRACE);
  assert.equal(r.changed,false);
  r=fireLate(w,100+30+FIRE_GRACE+.1);
  assert.deepEqual(r.fired,['p-slow']);
  assert.equal(w.seats[0].claim,null);assert.ok(w.seats[0].order);assert.deepEqual(w.stations,[null,null]);
  assert.equal(claimSeat(w,'g0','p-slow',140).reason,'fired');
  assert.equal(claimSeat(w,'g0','p-other',140).ok,true);
  releaseClaim(w,'g0','p-other');
  r=fireLate(w,100+30+FIRE_GRACE+.1+FIRE_COOLDOWN+1);
  assert.equal(r.changed,true);assert.deepEqual(w.fired,{});
  assert.equal(claimSeat(w,'g0','p-slow',200).ok,true);
});
test('no time limit when the limit is 0 (solo)',()=>{
  const w=createWorld(cfg(),1,0);w.seats[1].order={recipeId:'negroni',at:0};claimSeat(w,'g1','p-a',0);
  assert.equal(fireLate(w,9999).fired.length,0);assert.ok(w.seats[1].claim);
});
test('order messages are validated',()=>{
  const m=o=>Object.assign({t:'g',id:'p-aaaa'},o);
  assert.equal(parseGameMessage(m({k:'order',rec:'mojito'})).rec,'mojito');
  assert.equal(parseGameMessage(m({k:'order',rec:'nope'})),null);
  assert.equal(parseGameMessage(m({k:'claim',seat:'g7'})).seat,'g7');
  assert.equal(parseGameMessage(m({k:'claim',seat:'g8'})),null);
});

test('a friends room can switch the NPC guest\'s orders off',()=>{
  const mk=npc=>createWorld(Object.assign({},DEFAULT,{time:'prime',mode:'service',chairs:4,limit:45,npcOrders:npc}),11,0);
  const on=mk(true),off=mk(false);let nOn=0,nOff=0;
  for(let t=0;t<120;t+=.5){if(tickOrders(on,t))nOn++;if(tickOrders(off,t))nOff++;}
  assert.ok(nOn>0,'the NPC guest orders by default');assert.equal(nOff,0);
  assert.ok(off.seats.every(s=>!s.order));
});

test('an order from a sofa or lounge chair is delivered to the nearest cafe table; the piano bench cannot order',async()=>{
  const {SEATS,dropFor,canOrderFrom}=await import('../src/game/seats.js');
  const w=createWorld(Object.assign({},DEFAULT,{time:'prime',mode:'service',chairs:4,limit:45}),5,0);
  const sofa=SEATS.find(s=>s.id==='benchL2.8'),stool=SEATS.find(s=>s.id==='stool0'),piano=SEATS.find(s=>s.kind==='piano');
  assert.equal(canOrderFrom(piano),false);assert.equal(canOrderFrom(sofa),true);assert.equal(canOrderFrom(stool),true);
  assert.equal(dropFor(stool),null);
  const drop=dropFor(sofa);assert.ok(drop&&Math.abs(drop.x+8.85)<.3&&drop.y===.78);
  const pool=RECIPES.slice(0,4),rec=pool[0].id;
  const r=placeOrder(w,'p1',rec,drop.x,1,pool,drop);assert.ok(r.ok);
  const seat=w.seats.find(s=>s.id===r.seatId);assert.deepEqual(seat.drop,drop);
  const claim=claimSeat(w,seat.id,'bart',2);assert.ok(claim.ok);
  const done=applyServed(w,seat.id,'bart',{rec,stars:3,final:.95,tip:3000,ml:90,col:[.5,.2,.1]},3);
  assert.ok(done);assert.deepEqual(seat.served.drop,drop);assert.equal(seat.drop,null);      // the served drink remembers where to land
});
test('the bartending message is validated: unknown recipes, stages and out-of-range values are dropped or cleaned',()=>{
  const ok=parseGameMessage({t:'g',id:'a',k:'bar',rec:RECIPES[0].id,stage:'pour',v:60,s:0,col:[.5,.1,.1],pour:'gin',drag:true,mix:.5,srv:0,gar:'lime'});
  assert.ok(ok&&ok.pour==='gin'&&ok.drag===true&&ok.gar==='lime');
  assert.equal(parseGameMessage({t:'g',id:'a',k:'bar',rec:'nope',stage:'pour'}),null);
  assert.equal(parseGameMessage({t:'g',id:'a',k:'bar',rec:RECIPES[0].id,stage:'hack'}),null);
  const dirty=parseGameMessage({t:'g',id:'a',k:'bar',rec:RECIPES[0].id,stage:'mix',v:99999,col:[9,0,0],pour:'<img>',gar:'x'});
  assert.equal(dirty.v,0);assert.equal(dirty.col,null);assert.equal(dirty.pour,'');assert.equal(dirty.gar,'none');
  assert.deepEqual(parseGameMessage({t:'g',id:'a',k:'bar',off:true}),{k:'bar',id:'a',off:true});
});
