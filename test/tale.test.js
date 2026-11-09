import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,begin,view,advance,pick,served,drainEvents,reactStars,retry,MAX_HEARTS} from '../src/story/engine.js';
import {NIGHT1,CHARS,FLAVOR} from '../src/story/night1.js';
import {RECIPE_BY_ID} from '../src/game/bartending.js';

const G=NIGHT1.graph;
const bi=o=>o&&typeof o.ko==='string'&&o.ko.length>0&&typeof o.en==='string'&&o.en.length>0;

test('every node reference exists and every text has ko and en', () => {
  Object.values(G).forEach(n => {
    const refs=[n.next,n.fail,...(n.opts||[]).map(o=>o.next),...Object.values(n.react||{})].filter(Boolean);
    refs.forEach(r => assert.ok(G[r], n.id+' -> '+r));
    if(n.t==='say') assert.ok(bi(n.text), n.id);
    (n.opts||[]).forEach(o => assert.ok(bi(o.text), n.id));
    if(n.t==='recommend') assert.ok(bi(n.hint), n.id);
    if(n.t==='say' && n.who!=='narr') assert.ok(CHARS[n.who], n.id+' who');
  });
});
test('recommendation candidates are real recipes with a flavour line', () => {
  Object.values(G).filter(n=>n.t==='recommend').forEach(n => {
    const count=m=>n.cands.filter(c=>c.match===m).length;
    assert.ok(count('good')>=2 && count('ok')>=1 && count('miss')>=count('good')+count('ok')-1, n.id+' roughly half fit, half do not');
    assert.equal(new Set(n.cands.map(c=>c.id)).size,n.cands.length);
    n.cands.forEach(c => { assert.ok(RECIPE_BY_ID[c.id], c.id); assert.ok(bi(FLAVOR[c.id]), c.id); assert.ok(bi(c.lead), c.id+' lead'); assert.ok(['good','ok','miss'].includes(c.match)); });
    assert.ok(n.react[2] && n.react[1] && n.react[3]); assert.ok(G[n.fail]);
  });
});
test('every path reaches the close card', () => {
  const seen=new Set(), stack=[NIGHT1.entry]; let closes=0;
  while(stack.length){ const id=stack.pop(); if(seen.has(id)) continue; seen.add(id); const n=G[id];
    if(n.t==='close') closes++;
    [n.next,n.fail,...(n.opts||[]).map(o=>o.next),...Object.values(n.react||{})].filter(Boolean).forEach(r=>stack.push(r)); }
  assert.equal(closes,1);
  Object.values(G).filter(n=>n.t==='over').forEach(n=>assert.equal(G[n.retry].t,'enter','retry goes back to a guest entrance'));
  assert.equal(seen.size, Object.keys(G).length, 'no orphan nodes');
});
test('a full playthrough: hearts, flags, events', () => {
  const st=newState(1,null); begin(st,G,NIGHT1.entry);
  let guard=0, enters=[];
  while(view(st,G).kind!=='close' && guard++<100){
    drainEvents(st).forEach(e=>enters.push(e.k+':'+e.who));
    const v=view(st,G);
    if(v.kind==='say') advance(st,G);
    else if(v.kind==='choice') pick(st,G,G[st.node].opts.findIndex(o=>o.right));
    else if(v.kind==='recommend'){ pick(st,G,G[st.node].cands.findIndex(c=>c.match==='good')); assert.equal(view(st,G).kind,'wait'); served(st,G,3); }
    else if(v.kind==='wait') served(st,G,3);
    else throw new Error('stuck '+v.kind);
  }
  assert.equal(view(st,G).kind,'close');
  assert.deepEqual(enters,['enter:seoyun','leave:seoyun','enter:taesik','leave:taesik']);
  assert.ok(st.hearts.seoyun>=2 && st.flags.seoyun_knows_master);
  assert.ok(st.flags.seoyun_saw_sheet);
});
test('mismatch caps the praise; hearts are clamped', () => {
  assert.equal(reactStars('ok',3),2); assert.equal(reactStars('good',3),3); assert.equal(reactStars('ok',1),1);
  const st=newState(1,{hearts:{seoyun:MAX_HEARTS}}); begin(st,G,'sy_r3b');
  assert.equal(st.hearts.seoyun,MAX_HEARTS); assert.equal(st.gain.seoyun,0);
});
test('the guest comments on the very drink, then reacts; a drink that does not suit makes them leave', () => {
  const idx=m=>G.rec_sy.cands.findIndex(c=>c.match===m);
  // ok drink: lead line, then the reaction is capped at two stars
  let st=newState(1,null); begin(st,G,'rec_sy'); pick(st,G,idx('ok')); served(st,G,3);
  let v=view(st,G); assert.equal(v.kind,'say'); assert.equal(v.who,'seoyun'); assert.ok(v.text.ko.includes('묵직'));
  advance(st,G); assert.equal(st.node,'sy_r2');
  // good drink at 3 stars: best reaction
  st=newState(1,null); begin(st,G,'rec_sy'); pick(st,G,idx('good')); served(st,G,3); advance(st,G); assert.equal(st.node,'sy_r3');
  // a miss: the lead, then the guest leaves and the run ends, whatever the stars
  st=JSON.parse(JSON.stringify(newState(1,null))); begin(st,G,'rec_sy'); pick(st,G,idx('miss'));
  const copy=JSON.parse(JSON.stringify(st)); served(copy,G,3); advance(copy,G); assert.equal(copy.node,'sy_m');
  let g=0; while(view(copy,G).kind==='say'&&g++<5) advance(copy,G);
  assert.equal(view(copy,G).kind,'over');
});
test('each choice has exactly one right answer; the others make the guest leave and end the run', () => {
  Object.values(G).filter(n=>n.t==='choice').forEach(n => {
    assert.equal(n.opts.length,3,n.id);
    assert.equal(n.opts.filter(o=>o.right).length,1,n.id);
  });
  const st=newState(1,null); begin(st,G,NIGHT1.entry);
  while(st.node!=='c1') advance(st,G);
  drainEvents(st);
  [0,2].forEach(i => {
    const s2=JSON.parse(JSON.stringify(st));
    pick(s2,G,i); assert.equal(view(s2,G).kind,'say');
    let g=0; while(view(s2,G).kind==='say'&&g++<10) advance(s2,G);
    assert.equal(view(s2,G).kind,'over');
    assert.ok(drainEvents(s2).some(e=>e.k==='leave'&&e.who==='seoyun'));
    retry(s2,G); assert.equal(s2.node,'sy0'); assert.equal(view(s2,G).kind,'say');
  });
});
test('retry restores hearts from before the guest', () => {
  const st=newState(1,{hearts:{taesik:1}}); begin(st,G,'e_ts');
  while(st.node!=='c2') advance(st,G);
  pick(st,G,2); advance(st,G);                       // right answer: +1 heart
  assert.equal(st.hearts.taesik,2);
  begin(st,G,'c3'); pick(st,G,0); while(view(st,G).kind==='say') advance(st,G);
  assert.equal(view(st,G).kind,'over'); retry(st,G);
  assert.equal(st.hearts.taesik,1); assert.equal(st.node,'ts1');
});
