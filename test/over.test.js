import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newState,begin,view,pick,served,retry,advance} from '../src/story/engine.js';
const L=s=>({ko:s,en:s});
const graph={
  e:{t:'enter',who:'a',next:'r'},
  r:{t:'recommend',who:'a',hint:L('h'),cands:[{id:'negroni',match:'good'},{id:'daiquiri',match:'miss'}],fail:'lv',react:{3:'ok',2:'ok',1:'ok',0:'ok'}},
  lv:{t:'leave',who:'a',next:'ov'},
  ov:{t:'over',retry:'e',title:L('t'),tip:L('다시 시도해 보세요.')},
  ok:{t:'close',title:L('c'),note:L('n')}
};
test('a wrong drink says so, and repeated tries add a hint',()=>{
  const st=newState(1);begin(st,graph,'e');
  assert.equal(view(st,graph).kind,'recommend');
  pick(st,graph,1);served(st,graph,3);
  let v=view(st,graph);assert.equal(v.kind,'over');assert.match(v.tip.ko,/다른 술/);assert.equal(v.hint,null);
  retry(st,graph);pick(st,graph,1);served(st,graph,3);v=view(st,graph);assert.equal(v.hint,null);
  retry(st,graph);pick(st,graph,1);served(st,graph,3);v=view(st,graph);assert.ok(v.hint&&v.hint.ko.length>5);
});
test('the retry text for a good drink path is unaffected',()=>{
  const st=newState(1);begin(st,graph,'e');pick(st,graph,0);served(st,graph,3);
  assert.equal(view(st,graph).kind,'close');
});
