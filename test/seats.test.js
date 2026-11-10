import test from 'node:test';
import assert from 'node:assert/strict';
import {SEATS,SEAT_MAX,seatByWireId,PHOTO_SPOTS,layoutStools,stoolXs,isFree,STOOL_MAX,STOOLS,standSpot} from '../src/game/seats.js';

const inRoom=(x,z)=>x>-10&&x<10&&z>-3&&z<12;
const active=()=>SEATS.filter(s=>s.active);

test('seats are unique, inside the room and addressable by wire id',()=>{
  layoutStools(0);
  assert.equal(new Set(SEATS.map(s=>s.id)).size,SEATS.length);
  assert.equal(SEAT_MAX,SEATS.length);
  SEATS.forEach((s,i)=>{
    assert.ok(inRoom(s.x,s.z),s.id+' outside room');
    assert.ok(inRoom(s.stand.x,s.stand.z),s.id+' stand-up spot outside room');
    assert.equal(seatByWireId(i+1),s);
  });
  assert.equal(seatByWireId(0),null);assert.equal(seatByWireId(SEAT_MAX+1),null);assert.equal(seatByWireId(1.5),null);
});
test('solo layout: players only get the stools the guests are not using',()=>{
  layoutStools(0);
  const free=SEATS.filter(s=>s.kind==='stool'&&isFree(s)).map(s=>s.x).sort((a,b)=>a-b);
  assert.deepEqual(free,[-2.6,3.7]);
});
test('room layout: N stools spread evenly, the leftmost is the NPC guest, the rest are for players',()=>{
  for(let n=2;n<=STOOL_MAX;n++){
    const xs=layoutStools(n),stools=STOOLS;
    assert.equal(xs.length,n);
    assert.equal(stools.filter(s=>s.active).length,n);
    assert.equal(stools[0].x,-3.7);assert.equal(stools[0].npc,true);
    assert.equal(stools.filter(s=>isFree(s)).length,n-1);
    assert.equal(xs[n-1],3.7);
    for(let i=1;i<n;i++)assert.ok(xs[i]-xs[i-1]>=1.0,'stools too close at n='+n);
    stools.filter(s=>!s.active).forEach(s=>assert.equal(isFree(s),false));
  }
  assert.deepEqual(stoolXs(2),[-3.7,3.7]);assert.deepEqual(stoolXs(3),[-3.7,0,3.7]);
  assert.equal(stoolXs(99).length,STOOL_MAX);assert.equal(stoolXs(1).length,2);
  layoutStools(0);
});
test('no two active seats overlap and every stand-up spot is clear of other seats',()=>{
  for(const n of [0,2,3,4,5,6,7,8]){
    layoutStools(n);
    for(const a of active())for(const b of active()){
      if(a===b)continue;
      assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.6,n+': '+a.id+' too close to '+b.id);
      assert.ok(Math.hypot(a.stand.x-b.x,a.stand.z-b.z)>.5,n+': '+a.id+' stand-up spot sits on '+b.id);
    }
  }
  layoutStools(0);
});
test('photo spots are inside the room and apart from each other',()=>{
  assert.equal(new Set(PHOTO_SPOTS.map(p=>p.id)).size,PHOTO_SPOTS.length);
  for(const p of PHOTO_SPOTS){
    assert.ok(inRoom(p.x,p.z)&&p.name.ko&&p.name.en);
    const cx=p.x+Math.sin(p.face)*2.4,cz=p.z+Math.cos(p.face)*2.4;
    assert.ok(inRoom(cx,cz),p.id+' photo camera would be outside the room');
  }
});

import {setLoungeTaken,LOUNGE_SEAT_IDS} from '../src/game/seats.js';
test('the lounge armchairs are seats; they are taken only while the lounge guests sit there',()=>{
  layoutStools(0);
  const seats=LOUNGE_SEAT_IDS.map(id=>SEATS.find(s=>s.id===id));
  assert.equal(seats.length,2);seats.forEach(s=>assert.ok(s&&s.kind==='chair'));
  setLoungeTaken([true,false]);assert.equal(isFree(seats[0]),false);assert.equal(isFree(seats[1]),true);
  setLoungeTaken([false,false]);seats.forEach(s=>assert.equal(isFree(s),true));      // a friends room: nobody in the lounge
  setLoungeTaken([false,false]);
});
test('standing spots: front of the counter and beside cafe tables, nowhere else',()=>{
  assert.deepEqual(standSpot(1.2,2.6),{stoolX:1.2,drop:null});
  const t=standSpot(-8.2,1.9);assert.ok(t&&t.drop&&t.drop.y===.78);
  assert.equal(standSpot(0,8),null);assert.equal(standSpot(NaN,2),null);
});
