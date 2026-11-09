import test from 'node:test';
import assert from 'node:assert/strict';
import {parse,applyMessage,createPeers,expire,smooth,sanitizeName,sanitizeText,STALE_MS,MAX_PEERS,NAME_MAX,CHAT_MAX,CHAT_GAP_MS,EMOTES} from '../src/net/peers.js';
import {SEAT_MAX} from '../src/game/seats.js';
import {createRoom,makeCode,normalizeCode,CODE_LEN} from '../src/net/room.js';
import {createLocalTransport} from '../src/net/transport.js';

const pos=(o)=>Object.assign({t:'pos',id:'p-aaaa',x:1,z:2,yaw:.5,sp:1,name:'Mina',c:3},o||{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

test('parse rejects malformed or hostile messages',()=>{
  for(const bad of [null,undefined,'x',42,{},{t:'pos'},{t:'pos',id:'ab',x:0,z:0,yaw:0},{t:'nope',id:'p-aaaa'},
    pos({x:NaN}),pos({z:Infinity}),pos({yaw:'1'}),{t:'emote',id:'p-aaaa',e:'teleport'},pos({id:'x'.repeat(40)})])
    assert.equal(parse(bad),null,JSON.stringify(bad));
});
test('parse clamps positions into the room, cleans names and wraps the look index',()=>{
  const m=parse(pos({x:999,z:-999,name:'<b>Mi"na</b>'+'x'.repeat(40),c:-3,sp:99}));
  assert.ok(m.x<=9.7&&m.z>=-3);
  assert.ok(!/[<>"]/.test(m.name));assert.ok(m.name.length<=NAME_MAX);
  assert.ok(m.c>=0&&m.c<8);assert.equal(m.sp,1.5);
  assert.equal(sanitizeName('a\u0000b'),'ab');
});
test('peers: join, move, emote, leave',()=>{
  const peers=createPeers();
  assert.ok(applyMessage(peers,pos(),0));
  assert.equal(peers.size,1);
  assert.ok(applyMessage(peers,pos({x:4}),50));
  assert.equal(peers.get('p-aaaa').tx,4);
  assert.ok(applyMessage(peers,{t:'emote',id:'p-aaaa',e:'cheers'},60));
  assert.ok(peers.get('p-aaaa').emoteUntil>60);
  assert.ok(applyMessage(peers,{t:'bye',id:'p-aaaa'},70));
  assert.equal(peers.size,0);
  assert.equal(applyMessage(peers,{t:'emote',id:'p-zzzz',e:'cheers'},80),false);
});
test('the room is capped and silent peers expire',()=>{
  const peers=createPeers();
  for(let i=0;i<MAX_PEERS+3;i++)applyMessage(peers,pos({id:'p-peer'+i}),0);
  assert.equal(peers.size,MAX_PEERS);
  applyMessage(peers,pos({id:'p-peer0'}),STALE_MS);
  const gone=expire(peers,STALE_MS+100);
  assert.equal(gone.length,MAX_PEERS-1);
  assert.deepEqual([...peers.keys()],['p-peer0']);
});
test('smooth converges and turns the short way round',()=>{
  const p={x:0,z:0,tx:5,tz:-5,yaw:3.0,tyaw:-3.0,sp:1,ph:0};
  for(let i=0;i<120;i++)smooth(p,.016);
  assert.ok(Math.abs(p.x-5)<.05&&Math.abs(p.z+5)<.05);
  const d=Math.atan2(Math.sin(p.tyaw-p.yaw),Math.cos(p.tyaw-p.yaw));
  assert.ok(Math.abs(d)<.05);
  assert.ok(p.ph>0);
});
test('room codes are well formed',()=>{
  for(let i=0;i<50;i++){const c=makeCode();assert.equal(c.length,CODE_LEN);assert.ok(/^[A-HJ-NP-Z2-9]+$/.test(c));}
  assert.equal(normalizeCode(' ab-c1 xyz'),'ABC1X');
});

/* two clients over a real BroadcastChannel */
test('two room clients see each other, track movement and emotes, and drop on leave',async()=>{
  const code='TEST1';
  const a=createRoom(createLocalTransport()),b=createRoom(createLocalTransport());
  try{
    a.join(code,'Ann',1);await sleep(30);
    b.join(code,'Ben',2);await sleep(60);
    assert.equal(a.count,2);assert.equal(b.count,2);
    assert.equal([...a.peers.values()][0].name,'Ben');
    assert.equal([...b.peers.values()][0].name,'Ann');
    await sleep(120);
    a.update({x:3,z:4,yaw:1,sp:1});await sleep(40);
    const seen=[...b.peers.values()][0];
    assert.equal(seen.tx,3);assert.equal(seen.tz,4);
    a.emote();await sleep(40);
    assert.ok(seen.emoteUntil>0);
    b.leave();await sleep(40);
    assert.equal(a.count,1);assert.equal(b.active,false);
  }finally{a.leave();b.leave();}
});
test('different rooms do not hear each other',async()=>{
  const a=createRoom(createLocalTransport()),b=createRoom(createLocalTransport());
  try{
    a.join('ROOMA','A',0);b.join('ROOMB','B',0);await sleep(60);
    assert.equal(a.count,1);assert.equal(b.count,1);
  }finally{a.leave();b.leave();}
});

test('game messages travel between room clients and never reach the peer table',async()=>{
  const a=createRoom(createLocalTransport()),b=createRoom(createLocalTransport());
  const got=[];
  try{
    a.join('GAME1','Ann',0);b.join('GAME1','Ben',0);await sleep(80);
    b.onGame(m=>got.push(m));
    a.sendGame({k:'claim',seat:'g1'});await sleep(40);
    assert.equal(got.length,1);assert.equal(got[0].k,'claim');assert.equal(got[0].id,a.me.id);
    assert.equal(b.peers.size,1);
    assert.deepEqual(b.ids().sort(),[a.me.id,b.me.id].sort());
  }finally{a.leave();b.leave();}
});

test('chat: cleaned, bounded, ignored from strangers and rate limited',()=>{
  assert.equal(sanitizeText('  hi <b>there</b>\n\n you '),'hi bthere/b you');
  assert.equal(sanitizeText('x'.repeat(500)).length,CHAT_MAX);
  assert.equal(parse({t:'chat',id:'p-aaaa',text:'   '}),null);
  assert.equal(parse({t:'chat',id:'p-aaaa',text:'<>'}),null);
  const peers=createPeers();
  assert.equal(applyMessage(peers,{t:'chat',id:'p-aaaa',text:'hello'},0),false);   // unknown sender
  applyMessage(peers,pos(),0);
  assert.ok(applyMessage(peers,{t:'chat',id:'p-aaaa',text:'hello'},100));
  const p=peers.get('p-aaaa');
  assert.equal(p.chat.text,'hello');assert.equal(p.chatSeq,1);assert.ok(p.chat.until>100);
  assert.equal(applyMessage(peers,{t:'chat',id:'p-aaaa',text:'spam'},100+CHAT_GAP_MS-10),false);
  assert.equal(p.chat.text,'hello');
  assert.ok(applyMessage(peers,{t:'chat',id:'p-aaaa',text:'later'},100+CHAT_GAP_MS+10));
  assert.equal(p.chatSeq,2);
});
test('emotes and seats are validated',()=>{
  for(const e of EMOTES)assert.equal(parse({t:'emote',id:'p-aaaa',e}).e,e);
  assert.equal(parse({t:'emote',id:'p-aaaa',e:'teleport'}),null);
  assert.equal(parse(pos({st:1})).st,1);
  assert.equal(parse(pos({st:SEAT_MAX})).st,SEAT_MAX);
  for(const bad of [0,-1,SEAT_MAX+1,1.5,'3',null,NaN])assert.equal(parse(pos({st:bad})).st,0);
  const peers=createPeers();
  applyMessage(peers,pos({st:2}),0);assert.equal(peers.get('p-aaaa').st,2);
  applyMessage(peers,pos({st:0}),50);assert.equal(peers.get('p-aaaa').st,0);
  applyMessage(peers,{t:'emote',id:'p-aaaa',e:'wave'},60);assert.equal(peers.get('p-aaaa').emote,'wave');
});
test('chat and emotes reach another room client',async()=>{
  const a=createRoom(createLocalTransport()),b=createRoom(createLocalTransport());
  try{
    a.join('SOCI1','Ann',0);b.join('SOCI1','Ben',0);await sleep(80);
    a.update({x:1,z:1,yaw:0,sp:0,st:3});await sleep(40);
    assert.equal([...b.peers.values()][0].st,3);
    assert.equal(a.chat('  hello <3 '),'hello 3');await sleep(40);
    const p=[...b.peers.values()][0];
    assert.equal(p.chat.text,'hello 3');
    a.emote('clap');await sleep(40);assert.equal(p.emote,'clap');
    a.emote('nonsense');await sleep(40);assert.equal(p.emote,'clap');
    assert.equal(a.chat('   '),'');
  }finally{a.leave();b.leave();}
});
