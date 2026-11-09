import test from 'node:test';
import assert from 'node:assert/strict';

/* Minimal localStorage for Node, installed before the save module runs. */
const mem=new Map();
globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const {loadTale,commitNight,resetTale,isNightOpen}=await import('../src/story/save.js');

test('ending flags are kept in the gallery but never in the saved memories', () => {
  mem.clear();
  commitNight(7,{hearts:{bond:5},flags:{bond_title:true,ending_love:true}});
  let s=loadTale();
  assert.equal(s.endings.ending_love,true); assert.equal(s.flags.ending_love,undefined); assert.equal(s.flags.bond_title,true);
  // a replay that ends differently only adds its own ending
  commitNight(7,{hearts:{bond:5},flags:{ending_friend:true}});
  s=loadTale(); assert.deepEqual(Object.keys(s.endings).sort(),['ending_friend','ending_love']);
});
test('starting over clears progress but keeps the endings seen', () => {
  mem.clear(); commitNight(1,{hearts:{seoyun:2},flags:{a:true}}); commitNight(7,{hearts:{},flags:{ending_apart:true}});
  const s=resetTale();
  assert.deepEqual(s.done,{}); assert.deepEqual(s.hearts,{}); assert.deepEqual(s.flags,{}); assert.equal(s.endings.ending_apart,true);
  assert.equal(isNightOpen(1,loadTale()),true); assert.equal(isNightOpen(2,loadTale()),false);
});
test('replaying a finished night does not change the saved hearts', () => {
  mem.clear(); commitNight(2,{hearts:{bond:1},flags:{}}); commitNight(2,{hearts:{bond:5},flags:{x:true}});
  assert.equal(loadTale().hearts.bond,1);
});
