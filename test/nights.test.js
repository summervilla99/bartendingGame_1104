import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,begin,view,advance,pick,served,drainEvents} from '../src/story/engine.js';
import {NIGHTS,CHARS,FLAVOR} from '../src/story/nights.js';
import {RECIPE_BY_ID} from '../src/game/bartending.js';
import {SEATS} from '../src/game/seats.js';

const bi=o=>o&&typeof o.ko==='string'&&o.ko.length>0&&typeof o.en==='string'&&o.en.length>0;
const refsOf=n=>[n.next,n.fail,n.then,n.else,...(n.opts||[]).map(o=>o.next),...Object.values(n.react||{})].filter(Boolean);

test('nights are numbered in order', () => {
  NIGHTS.forEach((n,i) => assert.equal(n.n,i+1));
});
NIGHTS.forEach(N => {
  const G=N.graph;
  test('night '+N.n+': references, texts, speakers and seats are valid', () => {
    assert.ok(G[N.entry]);
    Object.values(G).forEach(n => {
      refsOf(n).forEach(r => assert.ok(G[r], n.id+' -> '+r));
      if(n.t==='say'){ assert.ok(bi(n.text), n.id); assert.ok(n.who==='narr'||CHARS[n.who], n.id+' who'); }
      (n.opts||[]).forEach(o => assert.ok(bi(o.text), n.id));
      if(n.t==='enter'||n.t==='leave') assert.ok(CHARS[n.who]&&CHARS[n.who].seat, n.id+' who has no seat');
      if(n.t==='enter'){ [{who:n.who,seat:n.seat},...(n.also||[])].forEach(a => { const s=CHARS[a.who].seat; assert.equal(a.seat==='piano',s==='piano',n.id+' piano characters stay at the piano'); assert.ok(a.seat==='piano'?SEATS.some(x=>x.kind==='piano'):/^g[0-3]$/.test(a.seat), n.id+' seat'); }); }
      if(n.t==='over'){ assert.equal(G[n.retry].t,'enter', n.id+' retries from an entrance'); assert.ok(bi(n.title)&&bi(n.tip)); }
      if(n.t==='order') assert.ok(RECIPE_BY_ID[n.rec], n.id);
      if(n.pre){ assert.ok(bi(n.pre.text)&&(n.pre.who==='narr'||CHARS[n.pre.who]), n.id+' pre'); }
      if(n.t==='fx'&&n.music) assert.ok(['jazz','house','classical'].includes(n.music), n.id+' music');
    });
    Object.values(CHARS).filter(c=>c.look).forEach(c => assert.ok(c.look.skin!=null && c.look.top!=null));
  });
  test('night '+N.n+': every choice has three options and exactly one right answer', () => {
    Object.values(G).filter(n=>n.t==='choice').forEach(n => {
      assert.equal(n.opts.length,3,n.id);
      assert.equal(n.opts.filter(o=>o.right).length,1,n.id);
    });
  });
  test('night '+N.n+': recommendations are roughly half fitting, half not', () => {
    Object.values(G).filter(n=>n.t==='recommend').forEach(n => {
      const count=m=>n.cands.filter(c=>c.match===m).length;
      assert.ok(count('good')>=2 && count('ok')>=1 && count('miss')>=count('good')+count('ok')-1, n.id);
      n.cands.forEach(c => { assert.ok(RECIPE_BY_ID[c.id], c.id); assert.ok(bi(FLAVOR[c.id]), c.id); assert.ok(bi(c.lead), c.id); });
      assert.ok(G[n.fail]);
    });
  });
  test('night '+N.n+': one close card, no orphans', () => {
    const seen=new Set(), stack=[N.entry]; let closes=0;
    while(stack.length){ const id=stack.pop(); if(seen.has(id)) continue; seen.add(id); if(G[id].t==='close') closes++; refsOf(G[id]).forEach(r=>stack.push(r)); }
    assert.equal(closes,1);
    assert.equal(seen.size, Object.keys(G).length, 'orphans: '+Object.keys(G).filter(k=>!seen.has(k)).join(','));
  });
  test('night '+N.n+': playing every right answer reaches the close card', () => {
    const st=newState(N.n,null); begin(st,G,N.entry);
    let guard=0; const log=[];
    while(view(st,G).kind!=='close' && guard++<200){
      drainEvents(st).filter(e=>e.k==='enter'||e.k==='leave').forEach(e=>log.push(e.k+':'+e.who+':'+(e.seat||'')));
      const v=view(st,G);
      if(v.kind==='say') advance(st,G);
      else if(v.kind==='choice') pick(st,G,G[st.node].opts.findIndex(o=>o.right));
      else if(v.kind==='recommend'){ pick(st,G,G[st.node].cands.findIndex(c=>c.match==='good')); served(st,G,3); }
      else if(v.kind==='wait') served(st,G,3);
      else throw new Error('stuck at '+st.node+' ('+v.kind+')');
    }
    assert.equal(view(st,G).kind,'close');
    const seatOf=new Map();                  // who sits where: nobody shares a seat while both are at the bar
    const present=new Set();                 // entering twice is harmless (retry checkpoints); leaving needs someone present; the bar is empty at the end
    log.forEach(e=>{const [k,w,seat]=e.split(':');
      if(k==='enter'){ for(const [o,s2] of seatOf) if(o!==w&&present.has(o)&&s2===seat) assert.fail(w+' takes '+seat+' while '+o+' sits there'); present.add(w); seatOf.set(w,seat); }
      else { assert.ok(present.has(w), w+' leaves without being there'); present.delete(w); }});
    assert.equal(present.size,0,'still at the bar: '+[...present].join(','));
  });
  test('night '+N.n+': each wrong answer ends in a game over after the guest leaves', () => {
    Object.values(G).filter(n=>n.t==='choice').forEach(c => {
      c.opts.forEach((o,i) => {
        if(o.right) return;
        const st=newState(N.n,null); begin(st,G,N.entry);
        let guard=0;
        while(st.node!==c.id && guard++<200){ const v=view(st,G); if(v.kind==='say') advance(st,G); else if(v.kind==='choice') pick(st,G,G[st.node].opts.findIndex(x=>x.right)); else if(v.kind==='recommend'){ pick(st,G,G[st.node].cands.findIndex(x=>x.match==='good')); served(st,G,3);} else if(v.kind==='wait') served(st,G,3); }
        drainEvents(st); pick(st,G,i);
        guard=0; while(view(st,G).kind==='say'&&guard++<10) advance(st,G);
        assert.equal(view(st,G).kind,'over',c.id+' option '+i);
        assert.ok(drainEvents(st).some(e=>e.k==='leave'), c.id+' guest leaves');
      });
    });
  });
});
test('night 2 remembers the sheet music from night 1', () => {
  const has=new Set(), no=new Set();
  [[{seoyun_saw_sheet:true},has],[{},no]].forEach(([flags,set]) => {
    const st=newState(2,{flags}); begin(st,NIGHTS[1].graph,'o1');
    let g=0; while(g++<20&&view(st,NIGHTS[1].graph).kind==='say'){ set.add(st.node); advance(st,NIGHTS[1].graph); }
  });
  assert.ok(has.has('sy_sheet')); assert.ok(!no.has('sy_sheet'));
});
test('night 7 has three endings chosen by the bond', () => {
  const N=NIGHTS[6],G=N.graph;
  const run=bond=>{
    const st=newState(7,{hearts:{bond},flags:{}}); begin(st,G,N.entry); let g=0;
    while(view(st,G).kind!=='close'&&g++<200){ drainEvents(st); const v=view(st,G);
      if(v.kind==='say') advance(st,G); else if(v.kind==='choice') pick(st,G,G[st.node].opts.findIndex(o=>o.right));
      else if(v.kind==='recommend'){ pick(st,G,G[st.node].cands.findIndex(c=>c.match==='good')); served(st,G,3); } else if(v.kind==='wait') served(st,G,3); }
    return Object.keys(st.flags).filter(f=>f.startsWith('ending_'));
  };
  assert.deepEqual(run(5),['ending_love']); assert.deepEqual(run(4),['ending_love']);
  assert.deepEqual(run(3),['ending_friend']); assert.deepEqual(run(2),['ending_friend']);
  assert.deepEqual(run(1),['ending_apart']); assert.deepEqual(run(0),['ending_apart']);
});
test('the bond can reach the love ending by playing every right answer in nights 2, 4, 6', () => {
  let hearts={}, flags={};
  [2,4,5,6].forEach(n => {
    const N=NIGHTS[n-1],G=N.graph,st=newState(n,{hearts,flags}); begin(st,G,N.entry); let g=0;
    while(view(st,G).kind!=='close'&&g++<300){ drainEvents(st); const v=view(st,G);
      if(v.kind==='say') advance(st,G); else if(v.kind==='choice') pick(st,G,G[st.node].opts.findIndex(o=>o.right));
      else if(v.kind==='recommend'){ pick(st,G,G[st.node].cands.findIndex(c=>c.match==='good')); served(st,G,3); } else if(v.kind==='wait') served(st,G,3); }
    hearts=st.hearts; flags=st.flags;
  });
  assert.equal(hearts.bond,5);
});
