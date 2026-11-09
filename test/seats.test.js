import test from 'node:test';
import assert from 'node:assert/strict';
import {SEATS,SEAT_MAX,seatByWireId,PHOTO_SPOTS,COUNTER_STOOL_X,NPC_STOOL_X} from '../src/game/seats.js';

const inRoom=(x,z)=>x>-10&&x<10&&z>-3&&z<12;

test('seats are unique, inside the room and addressable by wire id',()=>{
  assert.equal(new Set(SEATS.map(s=>s.id)).size,SEATS.length);
  assert.equal(SEAT_MAX,SEATS.length);
  SEATS.forEach((s,i)=>{
    assert.ok(inRoom(s.x,s.z),s.id+' outside room');
    assert.ok(inRoom(s.stand.x,s.stand.z),s.id+' stand-up spot outside room');
    assert.equal(seatByWireId(i+1),s);
  });
  assert.equal(seatByWireId(0),null);assert.equal(seatByWireId(SEAT_MAX+1),null);assert.equal(seatByWireId(1.5),null);
});
test('players only get the counter stools the guests are not using',()=>{
  const stools=SEATS.filter(s=>s.kind==='stool').map(s=>s.x).sort((a,b)=>a-b);
  assert.deepEqual(stools,COUNTER_STOOL_X.filter(x=>NPC_STOOL_X.indexOf(x)<0));
  assert.deepEqual(stools,[-2.6,3.7]);
});
test('no two seats overlap and every stand-up spot is clear of other seats',()=>{
  for(const a of SEATS)for(const b of SEATS){
    if(a===b)continue;
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.6,a.id+' too close to '+b.id);
    assert.ok(Math.hypot(a.stand.x-b.x,a.stand.z-b.z)>.5,a.id+' stand-up spot sits on '+b.id);
  }
});
test('photo spots are inside the room and apart from each other',()=>{
  assert.equal(new Set(PHOTO_SPOTS.map(p=>p.id)).size,PHOTO_SPOTS.length);
  for(const p of PHOTO_SPOTS){
    assert.ok(inRoom(p.x,p.z)&&p.name.ko&&p.name.en);
    const cx=p.x+Math.sin(p.face)*2.4,cz=p.z+Math.cos(p.face)*2.4;
    assert.ok(inRoom(cx,cz),p.id+' photo camera would be outside the room');
  }
});
