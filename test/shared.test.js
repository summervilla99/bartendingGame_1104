import test from 'node:test';
import assert from 'node:assert/strict';
import {TIMES,DEFAULT} from '../src/session.js';
import {createWorld,tickOrders,restore,snapshot} from '../src/game/world.js';
import {claimSeat,releaseClaim,expireClaims,applyServed,autoServe,hostMissing,electHost,acceptSnapshot,parseGameMessage,tipFor,NPC_SERVE_AFTER,MAX_TIP} from '../src/game/shared.js';

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
