import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT} from '../src/session.js';
import {createWorld,snapshot,restore,orderRecipe,tickOrders} from '../src/game/world.js';
import {jointToast,giftDrink,pruneSocial,TOAST_BONUS,TOAST_COOLDOWN,GIFT_BONUS,GIFT_COOLDOWN} from '../src/game/social.js';
import {parseGameMessage} from '../src/game/shared.js';

const mk=()=>createWorld(Object.assign({},DEFAULT,{mode:'service',chairs:3}),7,0);

test('joint toast pays a bonus once per pair per cooldown',()=>{
  const w=mk(),ids=['pa','pb','pc'];
  const r=jointToast(w,'pa','pb',ids,10);
  assert.ok(r);assert.equal(w.tips,TOAST_BONUS);assert.equal(w.night.tips,TOAST_BONUS);
  assert.equal(jointToast(w,'pb','pa',ids,12),null,'same pair, either order, is on cooldown');
  assert.ok(jointToast(w,'pa','pc',ids,12),'another pair is fine');
  assert.ok(jointToast(w,'pa','pb',ids,10+TOAST_COOLDOWN+1),'cooldown ends');
});
test('joint toast needs two different people who are in the room',()=>{
  const w=mk();
  assert.equal(jointToast(w,'pa','pa',['pa'],1),null);
  assert.equal(jointToast(w,'pa','ghost',['pa','pb'],1),null);
  assert.equal(w.tips,0);
});
test('gift goes only to someone at a station, with a per-giver cooldown',()=>{
  const w=mk();
  assert.equal(giftDrink(w,'pa','pb',1),null,'pb is not bartending');
  w.stations[0]='pb';
  assert.ok(giftDrink(w,'pa','pb',1));assert.equal(w.tips,GIFT_BONUS);
  assert.equal(giftDrink(w,'pa','pb',5),null);
  assert.ok(giftDrink(w,'pc','pb',5),'a different giver can');
  assert.ok(giftDrink(w,'pa','pb',1+GIFT_COOLDOWN+1));
  assert.equal(giftDrink(w,'pb','pb',999),null,'cannot gift yourself');
});
test('social state survives a snapshot and old cooldowns are pruned',()=>{
  const w=mk();w.stations[0]='pb';giftDrink(w,'pa','pb',1);
  const back=restore(snapshot(w,null)).world;
  assert.equal(back.social.gift.b,'pb');
  pruneSocial(back,1000);assert.deepEqual(back.social.cool,{});
});
test('toast and gift messages are validated',()=>{
  assert.deepEqual(parseGameMessage({t:'g',id:'x',k:'toast',with:'p1'}),{k:'toast',id:'x',with:'p1'});
  assert.equal(parseGameMessage({t:'g',id:'x',k:'toast',with:'<b>'}),null);
  assert.equal(parseGameMessage({t:'g',id:'x',k:'gift',to:5}),null);
  assert.ok(parseGameMessage({t:'g',id:'x',k:'gift',to:'p_2'}));
});
test('practice pick: orderRecipe places any recipe on a free guest, or nothing when all are busy',()=>{
  const w=createWorld(Object.assign({},DEFAULT,{mode:'practice'}),3,0);
  const ev=orderRecipe(w,'snowyespresso',1);
  assert.equal(ev.recipeId,'snowyespresso');
  assert.equal(w.seats.find(s=>s.id===ev.seatId).order.recipeId,'snowyespresso');
  assert.equal(orderRecipe(w,'nope',1),null);
  for(let i=0;i<8;i++)orderRecipe(w,'negroni',1);
  assert.equal(orderRecipe(w,'negroni',1),null);
});
