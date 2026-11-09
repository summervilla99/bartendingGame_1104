import {RECIPES} from '../data.js';
import {TIMES,poolFor} from '../session.js';
import {nextRandom,randRange,pickFrom} from './rng.js';

/* The serialisable state of one night. Everything the rules need is here (or in the active drink); the renderer only reads it.
   world = {v, seed, rng, session, nextOrderAt, orderNo, tips, night:{served,ordered,stars,tips,best}, seats:[{id,active,order,last,reaction}]} */
export const VERSION=2;
export const SEAT_COUNT=4,STATION_COUNT=2;

export function createWorld(session,seed,now){
  const T=TIMES[session.time],s=(seed==null?(Math.random()*4294967296)>>>0:seed>>>0);
  return {v:VERSION,seed:s,rng:s,rev:1,hostId:null,stations:Array(STATION_COUNT).fill(null),session:Object.assign({},session),nextOrderAt:now+2.5,orderNo:0,tips:0,
    night:{served:0,ordered:0,stars:0,tips:0,best:null},
    seats:Array.from({length:SEAT_COUNT},(_,i)=>({id:'g'+i,active:T.guests.indexOf(i)>=0,order:null,last:null,reaction:null,claim:null,served:null}))};
}

export const pendingSeats=world=>world.seats.filter(s=>s.order).sort((a,b)=>a.order.at-b.order.at);

/* Called every frame. Returns {seatId, recipeId} when a guest orders, else null. */
export function tickOrders(world,now){
  if(now<world.nextOrderAt)return null;
  const T=TIMES[world.session.time],N=world.night;
  const more=world.session.mode!=='service'||N.ordered<T.goal;
  const free=world.seats.filter(s=>s.active&&!s.order&&(!s.reaction||now>s.reaction.until));
  let ev=null;
  if(more&&free.length&&pendingSeats(world).length<T.maxPending){
    const seat=pickFrom(world,free),pool=poolFor(world.session,RECIPES);
    let r;do{r=pickFrom(world,pool);}while(r.id===seat.last&&pool.length>1);
    seat.order={recipeId:r.id,at:now};seat.last=r.id;seat.reaction=null;seat.served=null;N.ordered++;world.rev++;
    ev={seatId:seat.id,recipeId:r.id};
  }
  world.nextOrderAt=now+randRange(world,T.every[0],T.every[1]);
  return ev;
}

/* Drink handed over: the seat is free again; the guest reacts for a few seconds and the next order comes a bit sooner. */
export function releaseSeat(world,seatId,now,stars){
  const seat=world.seats.find(s=>s.id===seatId);
  if(!seat)return;
  seat.order=null;seat.reaction={stars,until:now+7};world.rev++;
  world.nextOrderAt=Math.min(world.nextOrderAt,now+randRange(world,2.5,5));
}

export const nightOver=world=>world.session.mode==='service'&&world.night.served>=TIMES[world.session.time].goal;

export function nightSummary(world){
  const N=world.night,avg=N.served?N.stars/N.served:0;
  return {served:N.served,avg,level:avg>=2.6?3:avg>=1.8?2:avg>=.9?1:0,tips:N.tips,best:N.best};
}

/* JSON snapshot of the whole game (world + active drink) and a validating restore. */
export function snapshot(world,drink){
  return JSON.parse(JSON.stringify({v:VERSION,world,drink:drink||null}));
}
export function restore(snap){
  if(!snap||snap.v!==VERSION||!snap.world||!TIMES[snap.world.session&&snap.world.session.time])return null;
  const ok=id=>RECIPES.some(r=>r.id===id);
  const w=snap.world;
  if(!Array.isArray(w.seats)||w.seats.length!==SEAT_COUNT)return null;
  if(w.seats.some(s=>s.order&&!ok(s.order.recipeId)))return null;
  if(!Array.isArray(w.stations)||w.stations.length!==STATION_COUNT||typeof w.rev!=='number')return null;
  if(snap.drink&&!ok(snap.drink.recipeId))return null;
  return {world:w,drink:snap.drink||null};
}
export {nextRandom};
