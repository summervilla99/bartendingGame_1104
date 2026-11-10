import test from 'node:test';
import assert from 'node:assert/strict';
import {DECOR,DECOR_KINDS,DEFAULT_DECOR,addEarned,loadEarned,cleanDecor,loadDecor,saveDecor,unlockedIn} from '../src/decor.js';

const mem=()=>{const m={};return {getItem:k=>(k in m?m[k]:null),setItem:(k,v)=>{m[k]=String(v);}};};

test('every kind starts with a free default option',()=>{
  DECOR_KINDS.forEach(k=>{
    assert.equal(DECOR[k][0].at,0);assert.equal(DECOR[k][0].id,DEFAULT_DECOR[k]);
    assert.equal(new Set(DECOR[k].map(o=>o.id)).size,DECOR[k].length,k+' has duplicate ids');
    DECOR[k].forEach(o=>{assert.ok(o.n.ko&&o.n.en);});
    assert.deepEqual(DECOR[k].map(o=>o.at),DECOR[k].map(o=>o.at).slice().sort((a,b)=>a-b),k+' thresholds ascend');
  });
});
test('earning tips unlocks options once and reports them',()=>{
  const st=mem();
  assert.equal(loadEarned(st),0);
  let r=addEarned(9000,st);assert.equal(r.fresh.length,0);
  r=addEarned(2000,st);assert.deepEqual(r.fresh.map(f=>f.kind+':'+f.opt.id),['coaster:leather']);
  r=addEarned(1,st);assert.equal(r.fresh.length,0,'already unlocked');
  assert.equal(loadEarned(st),11001);
  assert.equal(addEarned(-5,st).total,11001,'negative tips are ignored');
});
test('cleanDecor drops unknown ids; loadDecor drops what is still locked',()=>{
  assert.deepEqual(cleanDecor({light:'x',frame:'jazz',coaster:5}),{light:'amber',frame:'jazz',coaster:'none'});
  assert.deepEqual(cleanDecor(null),DEFAULT_DECOR);
  const st=mem();saveDecor({light:'sapphire',frame:'jazz',coaster:'cat'},st);
  assert.deepEqual(loadDecor(st,0),DEFAULT_DECOR);
  assert.deepEqual(loadDecor(st,15000),Object.assign({},DEFAULT_DECOR,{frame:'jazz'}));
  assert.equal(loadDecor(st,1e9).light,'sapphire');
  assert.ok(unlockedIn('light',20000).length===2);
});
