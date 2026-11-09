import {ING,RECIPES,VESSEL_CAP} from '../data.js';
import {TIMES} from '../session.js';

/* Pure drink-making rules. No three.js, no DOM: state is plain JSON so a server can run the same functions.
   drink = {recipeId, seatId, orderNo, stage, poured:{ing:ml}, total, cap, mixProg, mixCount, stirAcc, mixDone, garnish, result} */
export const RECIPE_BY_ID=Object.fromEntries(RECIPES.map(r=>[r.id,r]));
export const SHAKE_STROKES=14,STIR_TURNS=3;

/* What the ingredients are poured into: the serving glass (build), a steel tin (shake) or a mixing glass (stir). */
export const pourVesselOf=r=>r.method==='build'?r.glass:r.method==='shake'?'tin':'mixing';

export function startDrink(world,seatId){
  const seat=world.seats.find(s=>s.id===seatId);
  if(!seat||!seat.order)return null;
  const r=RECIPE_BY_ID[seat.order.recipeId];
  world.orderNo++;
  return {recipeId:r.id,seatId,orderNo:world.orderNo,stage:'pour',poured:{},total:0,cap:VESSEL_CAP[pourVesselOf(r)],
    mixProg:0,mixCount:0,stirAcc:0,mixDone:false,garnish:null,result:null};
}

/* One pouring step: ml added this step (0 when the vessel is full). */
export function pourStep(drink,ingId,dt){
  if(drink.total>=drink.cap)return 0;
  const add=Math.min(ING[ingId].rate*dt,drink.cap-drink.total);
  drink.poured[ingId]=(drink.poured[ingId]||0)+add;
  drink.total+=add;
  return add;
}
export function clearPour(drink){drink.poured={};drink.total=0;}

/* Mixing progress 0..1. Shake counts strokes, stir accumulates angle (radians). */
export function shakeStroke(drink){
  drink.mixCount++;
  return drink.mixProg=Math.min(1,drink.mixCount/SHAKE_STROKES);
}
export function stirTurn(drink,absAngle){
  drink.stirAcc+=absAngle;
  return drink.mixProg=Math.min(1,drink.stirAcc/(Math.PI*2*STIR_TURNS));
}
export function setGarnish(drink,id){drink.garnish=id;}

/* Accuracy 70% + mixing 20% + garnish 10%. Stars: >=.88 three, >=.68 two, >=.45 one. Tip = stars*3000 + accuracy*1000. */
export function scoreDrink(drink){
  const r=RECIPE_BY_ID[drink.recipeId];let diff=0,total=0;
  Object.keys(r.parts).forEach(id=>{diff+=Math.abs((drink.poured[id]||0)-r.parts[id]);total+=r.parts[id];});
  Object.keys(drink.poured).forEach(id=>{if(!(id in r.parts))diff+=drink.poured[id];});
  const acc=Math.max(0,Math.min(1,1-diff/total));
  const mix=r.method==='build'?1:drink.mixProg;
  const gar=drink.garnish===r.garnish?1:0;
  const final=acc*.7+mix*.2+gar*.1;
  const stars=final>=.88?3:final>=.68?2:final>=.45?1:0;
  return {acc,mix,gar,final,stars,tip:stars?stars*3000+Math.round(acc*1000):0};
}

/* Serve button: lock in the score (night totals are settled when the result card shows, see settleDrink). */
export function serveDrink(drink){
  drink.stage='serve';
  return drink.result=scoreDrink(drink);
}

/* Result card shown: apply the hour's tip bonus and add to the night totals. */
export function settleDrink(world,drink){
  const r=drink.result,N=world.night;
  r.tip=Math.round(r.tip*TIMES[world.session.time].tipMult);
  N.served++;N.stars+=r.stars;N.tips+=r.tip;world.tips+=r.tip;
  if(!N.best||r.final>N.best.final)N.best={final:r.final,stars:r.stars,recipeId:drink.recipeId};
  drink.stage='result';
  return r;
}
