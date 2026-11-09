import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseTransport} from '../src/net/transport.js';
import {createRoom} from '../src/net/room.js';

/* Live check against a real Supabase project. Skipped unless both variables are set:
   SUPABASE_URL=... SUPABASE_KEY=<publishable key> npm test */
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms){const end=Date.now()+ms;while(Date.now()<end){if(fn())return true;await sleep(100);}return false;}

test('live: two clients meet over Supabase Realtime, move, cheer and leave',{skip:(!url||!key)&&'set SUPABASE_URL and SUPABASE_KEY to run'},async()=>{
  const code='T'+Math.random().toString(36).slice(2,6).toUpperCase();
  const ta=createSupabaseTransport({url,key}),tb=createSupabaseTransport({url,key});
  const a=createRoom(ta),b=createRoom(tb);
  try{
    a.join(code,'Ann',1);
    assert.ok(await until(()=>ta.status==='connected',10000),'A did not connect, status='+ta.status);
    b.join(code,'Ben',2);
    assert.ok(await until(()=>tb.status==='connected',10000),'B did not connect, status='+tb.status);
    assert.ok(await until(()=>a.count===2&&b.count===2,8000),'peers did not find each other: a='+a.count+' b='+b.count);
    assert.equal([...b.peers.values()][0].name,'Ann');
    a.update({x:3,z:4,yaw:1,sp:1});
    assert.ok(await until(()=>{const p=[...b.peers.values()][0];return p&&p.tx===3&&p.tz===4;},4000),'position did not arrive');
    a.emote();
    assert.ok(await until(()=>[...b.peers.values()][0].emoteUntil>0,4000),'emote did not arrive');
    b.leave();
    assert.ok(await until(()=>a.count===1,4000),'bye did not arrive');
  }finally{a.leave();b.leave();await sleep(500);}
});
