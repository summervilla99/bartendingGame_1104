import test from 'node:test';
import assert from 'node:assert/strict';
import {RECIPES,ING} from '../src/data.js';
import {STAGES,DIFFS,limitOf,goalOf,stageOf,stageRecipes,paramsOf,poolFor,isUnlocked,DEFAULT,TIMES,loadSession} from '../src/session.js';
import {createWorld,tickOrders,nightOver} from '../src/game/world.js';
import {quip,QUIPS,RECIPE_QUIPS} from '../src/game/quips.js';
import {bonusOf,recordServe,breakCombo,patienceOf,COMBO_MAX,RUSH_PATIENCE} from '../src/game/bonus.js';
import {claimSeat,applyServed,fireLate} from '../src/game/shared.js';

const cfg=o=>Object.assign({},DEFAULT,o||{});

test('practice levels grow step by step and every drink is reachable',()=>{
  assert.equal(STAGES.length,8);
  const ids=new Set(RECIPES.map(r=>r.id));
  const last=stageRecipes(STAGES[7],RECIPES);
  ids.forEach(id=>assert.ok(last.includes(id),id+' unreachable in the last level'));
  let prev=0;
  STAGES.forEach((st,i)=>{
    const pool=stageRecipes(st,RECIPES);
    assert.ok(pool.length>=prev&&pool.length>=8,st.id+' pool grows');prev=pool.length;
    pool.forEach(id=>assert.ok(ids.has(id),id+' unknown'));
    if(i){const p=STAGES[i-1];
      assert.ok(st.goal>=p.goal&&st.minStars>=p.minStars&&st.guests>=p.guests&&st.maxPending>=p.maxPending,st.id+' not easier than '+p.id);
      assert.ok(st.every[1]<=p.every[1]&&st.rushP>=p.rushP,st.id+' pace');
      if(p.limit&&st.limit)assert.ok(st.limit<=p.limit);
    }
    assert.ok(st.name.ko&&st.name.en&&st.desc.ko&&st.desc.en);
  });
  assert.equal(STAGES[0].limit,0);assert.equal(STAGES[7].limit,30);
  assert.ok(STAGES[0].guests===1&&STAGES[7].guests===4);
});
test('a level sets the guest count, pace, pool and goal of the night',()=>{
  for(const st of STAGES){
    const c=cfg({mode:'story',stage:st.id});
    assert.deepEqual(poolFor(c,RECIPES).map(r=>r.id).sort(),stageRecipes(st,RECIPES).slice().sort());
    assert.equal(goalOf(c),st.goal);assert.equal(limitOf(c),st.limit);
    const w=createWorld(c,5,0);
    assert.equal(w.seats.filter((s,i)=>i<4&&s.active).length,st.guests);
    const seen=new Set();let ordered=0,maxOpen=0;
    for(let t=0;t<4000;t+=.1){const ev=tickOrders(w,t);if(ev){seen.add(ev.recipeId);ordered++;}
      maxOpen=Math.max(maxOpen,w.seats.filter(s=>s.order).length);
      if(t%7<.1)w.seats.forEach(s=>{s.order=null;});}
    assert.equal(ordered,st.goal,'orders stop at the goal');
    assert.ok(maxOpen<=st.maxPending,st.id+' open orders '+maxOpen);
    const pool=stageRecipes(st,RECIPES);for(const id of seen)assert.ok(pool.includes(id));
    w.night.served=st.goal;assert.equal(nightOver(w),true);
  }
  assert.equal(stageOf(cfg({stage:'zzz'})).id,'s1');
});
test('free practice can set guest count and pace',()=>{
  const base=paramsOf(cfg({mode:'practice'}));
  assert.deepEqual(base.guests,TIMES.prime.guests);
  const one=paramsOf(cfg({mode:'practice',guests:1,pace:'slow'}));
  assert.equal(one.guests.length,1);assert.equal(one.maxPending,1);assert.ok(one.every[0]>base.every[0]);
  const rush=paramsOf(cfg({mode:'practice',guests:4,pace:'rush'}));
  assert.equal(rush.maxPending,4);assert.ok(rush.every[1]<base.every[1]);
  assert.deepEqual(paramsOf(cfg({mode:'practice',guests:9})).guests,TIMES.prime.guests,'bad count is ignored');
});
test('stages unlock in order',()=>{
  assert.equal(isUnlocked('s1',{cleared:{}}),true);
  assert.equal(isUnlocked('s2',{cleared:{}}),false);
  assert.equal(isUnlocked('s2',{cleared:{s1:2}}),true);
  assert.equal(isUnlocked('s3',{cleared:{s1:2}}),false);
  assert.equal(isUnlocked('s8',{cleared:{s1:2,s2:2,s3:2,s4:2,s5:2,s6:2,s7:2}}),true);
});
test('difficulty sets the time limit; practice has none; bad values fall back',()=>{
  assert.deepEqual(DIFFS,{easy:60,mid:45,hard:30});
  const sv=o=>cfg(Object.assign({mode:'service'},o));
  assert.equal(limitOf(sv({diff:'easy'})),60);assert.equal(limitOf(sv({diff:'mid'})),45);assert.equal(limitOf(sv({diff:'hard'})),30);
  assert.equal(limitOf(cfg({diff:'hard',mode:'practice'})),0);assert.equal(limitOf(cfg({diff:'hard',mode:'tale'})),0);
  assert.equal(limitOf(sv({diff:'nonsense'})),60);
  assert.equal(loadSession().diff,'easy');
});
test('the solo bar is well filled in every hour',()=>{
  for(const id of Object.keys(TIMES))assert.ok(TIMES[id].guests.length>=4,id+' has too few guests');
});
test('quips: every star level has lines in both languages and the pick is stable',()=>{
  for(const k of [0,1,2,3]){assert.ok(QUIPS[k].length>=5);QUIPS[k].forEach(q=>assert.ok(q.ko&&q.en));}
  Object.values(RECIPE_QUIPS).forEach(q=>assert.ok(q.ko&&q.en));
  assert.deepEqual(quip(3,7,'negroni'),quip(3,7,'negroni'));
  assert.ok(quip(1,-5,'x').ko);
  const hit=[0,1,2,3,4,5].map(n=>quip(3,n,'negroni')).filter(q=>q===RECIPE_QUIPS.negroni).length;
  assert.ok(hit>0,'recipe-specific lines appear sometimes');
  assert.equal(quip(0,3,'negroni')===RECIPE_QUIPS.negroni,false);
});
test('combo: consecutive 2+ star drinks raise the tip, a bad drink resets it',()=>{
  const w=createWorld(cfg(),1,0);
  assert.equal(bonusOf(w,'g1',3,false),1);recordServe(w,'g1',3);
  assert.equal(w.combo,1);
  assert.ok(Math.abs(bonusOf(w,'g1',2,false)-1.1)<1e-9);recordServe(w,'g1',2);
  assert.equal(w.combo,2);
  for(let i=0;i<10;i++)recordServe(w,'g1',2);
  assert.ok(Math.abs(bonusOf(w,'g1',3,false)-(1+COMBO_MAX+0))<1e-9||bonusOf(w,'g1',3,false)<=1+COMBO_MAX+.2+1e-9);
  recordServe(w,'g2',1);assert.equal(w.combo,0);
  breakCombo(w);assert.equal(w.combo,0);
});
test('regulars and rush guests pay more',()=>{
  const w=createWorld(cfg(),1,0);
  recordServe(w,'g2',3);recordServe(w,'g2',3);          // two 3-star drinks for the same guest
  assert.equal(w.regulars.g2,2);
  const base=bonusOf(createWorld(cfg(),1,0),'g2',1,false);
  assert.ok(bonusOf(w,'g2',1,false)>base);
  assert.equal(bonusOf(createWorld(cfg(),1,0),'g1',1,true),1.5);
  assert.equal(patienceOf(60,true),60*RUSH_PATIENCE);assert.equal(patienceOf(60,false),60);
});
test('a rush order is made impatient in a room: the bartender is fired sooner',()=>{
  const w=createWorld(cfg({mode:'practice'}),2,0);w.session.limit=100;w.session.chairs=4;
  w.seats[0].order={recipeId:'negroni',at:0,rush:true};w.seats[1].order={recipeId:'daiquiri',at:0,rush:false};
  w.seats[0].active=w.seats[1].active=true;
  claimSeat(w,'g0','p-a',0);claimSeat(w,'g1','p-b',0);
  const r=fireLate(w,100*RUSH_PATIENCE+3.5);
  assert.deepEqual(r.fired,['p-a']);
  assert.ok(w.seats[1].claim);
});
test('the served tip includes combo and rush in a room',()=>{
  const w=createWorld(cfg({mode:'practice'}),3,0);w.hostId='h';w.session.chairs=4;
  w.seats[0].order={recipeId:'negroni',at:0,rush:true};claimSeat(w,'g0','p-a',1);
  const r=applyServed(w,'g0','p-a',{rec:'negroni',stars:3,final:.95,tip:10000,ml:90,col:[.5,.5,.5]},2);
  assert.equal(r.tip,Math.round(10000*TIMES.prime.tipMult*1.5));
  assert.equal(w.combo,1);assert.equal(w.regulars.g0,1);
});

test('the bartending time limit can be switched on or off in every mode but the tale',()=>{
  // defaults: on with friends, off in practice
  assert.equal(limitOf(cfg({mode:'service',diff:'mid'})),45);
  assert.equal(limitOf(cfg({mode:'practice',diff:'mid'})),0);
  // explicit switches win
  assert.equal(limitOf(cfg({mode:'service',diff:'hard',timer:false})),0);
  assert.equal(limitOf(cfg({mode:'practice',diff:'hard',timer:true})),30);
  assert.equal(limitOf(cfg({mode:'practice',diff:'easy',timer:true})),60);
  // the story never has one
  assert.equal(limitOf(cfg({mode:'tale',diff:'hard',timer:true})),0);
});
