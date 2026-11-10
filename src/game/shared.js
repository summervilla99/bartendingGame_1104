import {ING,GARNISH} from '../data.js';
import {TIMES} from '../session.js';
import {RECIPE_BY_ID} from './bartending.js';
import {restore,VERSION} from './world.js';
import {randRange} from './rng.js';
import {bonusOf,recordServe,breakCombo,patienceOf} from './bonus.js';
import {ID_RE} from './social.js';

/* Shared-night rules for a room. The host runs these on its copy of the world and broadcasts snapshots; everyone else only
   sends requests (claim / unclaim / served). Pure and JSON-only, so it is the same code a server would run. */
export const MUSIC=['jazz','house','classical','off'];
export const BAR_STAGES=['pour','mix','strain','garnish','serve'];
export const NPC_SERVE_AFTER=30,MAX_TIP=3*3000+1000,SEAT_RE=/^g[0-7]$/,FIRE_COOLDOWN=30,FIRE_GRACE=3;

export const tipFor=(session,rawTip)=>Math.round(rawTip*TIMES[session.time].tipMult);
const seatOf=(world,id)=>world.seats.find(s=>s.id===id);

/* Take a ticket: one bartender per ticket, one ticket per bartender, at most STATION_COUNT at once. */
export function claimSeat(world,seatId,by,now){
  const seat=seatOf(world,seatId);
  if(!seat||!seat.order)return {ok:false,reason:'none'};
  if(world.fired[by])return {ok:false,reason:'fired'};
  if(seat.claim)return seat.claim.by===by?{ok:true,station:seat.claim.station,orderNo:seat.claim.orderNo}:{ok:false,reason:'taken'};
  if(world.stations.indexOf(by)>=0)return {ok:false,reason:'busy'};
  const st=world.stations.indexOf(null);
  if(st<0)return {ok:false,reason:'full'};
  world.stations[st]=by;world.orderNo++;
  seat.claim={by,station:st,orderNo:world.orderNo,at:now};world.rev++;
  return {ok:true,station:st,orderNo:world.orderNo};
}
export function releaseClaim(world,seatId,by){
  const seat=seatOf(world,seatId);
  if(!seat||!seat.claim||seat.claim.by!==by)return false;
  world.stations[seat.claim.station]=null;seat.claim=null;world.rev++;
  return true;
}
/* Free tickets and stations held by players who are no longer in the room. */
export function expireClaims(world,activeIds){
  let n=0;
  world.seats.forEach(s=>{
    if(s.claim&&activeIds.indexOf(s.claim.by)<0){world.stations[s.claim.station]=null;s.claim=null;n++;}
    if(s.customer&&activeIds.indexOf(s.customer)<0){          // a seated customer left: their order is void
      if(s.claim){world.stations[s.claim.station]=null;s.claim=null;}
      s.order=null;s.customer=null;world.night.ordered=Math.max(0,world.night.ordered-1);n++;
    }
  });
  world.stations.forEach((u,i)=>{if(u&&activeIds.indexOf(u)<0){world.stations[i]=null;n++;}});
  if(n)world.rev++;
  return n;
}

function finishSeat(world,seat,served,now){
  if(seat.claim)world.stations[seat.claim.station]=null;
  seat.claim=null;seat.order=null;seat.reaction={stars:served.stars,until:now+7};
  world.rev++;seat.served=Object.assign({rev:world.rev,x:seat.stoolX||0,to:seat.customer||null,drop:seat.drop||null},served);
  seat.customer=null;seat.drop=null;
  world.nextOrderAt=Math.min(world.nextOrderAt,now+randRange(world,2.5,5));
}

/* A seated player orders from the menu. Takes the first free customer seat (g4-g7). */
export function placeOrder(world,from,rec,stoolX,now,pool,drop){
  if(!(world.session.chairs>0))return {ok:false,reason:'solo'};
  if(!pool.some(r=>r.id===rec))return {ok:false,reason:'menu'};
  if(world.seats.some(s=>s.customer===from))return {ok:false,reason:'busy'};
  const seat=world.seats.find((s,i)=>i>=4&&!s.order&&!s.customer);
  if(!seat)return {ok:false,reason:'full'};
  seat.customer=from;seat.stoolX=stoolX;seat.drop=drop||null;seat.order={recipeId:rec,at:now};seat.reaction=null;seat.served=null;
  world.night.ordered++;world.rev++;
  return {ok:true,seatId:seat.id};
}

/* Time limit: a bartender who takes too long loses the job for FIRE_COOLDOWN seconds. Also clears expired cooldowns.
   Returns {fired:[ids], changed}. */
export function fireLate(world,now){
  const limit=world.session.limit,fired=[];let changed=false;
  if(limit>0)world.seats.forEach(seat=>{
    if(seat.claim&&now-seat.claim.at>patienceOf(limit,seat.order&&seat.order.rush)+FIRE_GRACE){
      const by=seat.claim.by;world.stations[seat.claim.station]=null;seat.claim=null;
      world.fired[by]=now+FIRE_COOLDOWN;fired.push(by);changed=true;breakCombo(world);
    }
  });
  Object.keys(world.fired).forEach(id=>{if(now>world.fired[id]){delete world.fired[id];changed=true;}});
  if(changed)world.rev++;
  return {fired,changed};
}

/* The bartender finished a drink. Returns {tip} (hour bonus applied) or null when the request is invalid. */
export function applyServed(world,seatId,by,p,now){
  const seat=seatOf(world,seatId);
  if(!seat||!seat.order||!seat.claim||seat.claim.by!==by||p.rec!==seat.order.recipeId)return null;
  const rush=!!seat.order.rush,tip=Math.round(tipFor(world.session,p.tip)*bonusOf(world,seatId,p.stars,rush)),N=world.night;
  recordServe(world,seatId,p.stars);
  N.served++;N.stars+=p.stars;N.tips+=tip;world.tips+=tip;
  if(!N.best||p.final>N.best.final)N.best={final:p.final,stars:p.stars,recipeId:p.rec};
  finishSeat(world,seat,{stars:p.stars,recipeId:p.rec,ml:p.ml,col:p.col,by},now);
  return {tip};
}

const blendOf=r=>{
  let t=0;const c=[0,0,0];
  Object.keys(r.parts).forEach(id=>{const w=r.parts[id],g=ING[id].rgb;c[0]+=g[0]*w;c[1]+=g[1]*w;c[2]+=g[2]*w;t+=w;});
  return c.map(v=>+(v/t).toFixed(3));
};
/* The house bartender: orders nobody claimed within NPC_SERVE_AFTER seconds get an average drink and no tip.
   The order is voided from the night's count so the goal stays reachable. */
export function autoServe(world,now){
  let n=0;
  world.seats.forEach(seat=>{
    if(seat.order&&!seat.claim&&now-seat.order.at>NPC_SERVE_AFTER){
      const r=RECIPE_BY_ID[seat.order.recipeId],ml=Object.values(r.parts).reduce((a,b)=>a+b,0);
      finishSeat(world,seat,{stars:2,recipeId:r.id,ml,col:blendOf(r),by:'npc'},now);
      world.night.ordered=Math.max(0,world.night.ordered-1);n++;
    }
  });
  return n;
}

/* Host election: while the host is missing from the room the lowest id takes over. */
export const hostMissing=(world,ids)=>!world.hostId||ids.indexOf(world.hostId)<0;
export const electHost=ids=>ids.slice().sort()[0]||null;

/* Accept a snapshot from the host: always when unsynced, otherwise only newer revisions. */
export const acceptSnapshot=(local,incoming,synced)=>!synced||!local||incoming.rev>local.rev;

/* ── wire messages (game channel). Everything is validated: the sender is another player's browser. ── */
const num=(v,a,b)=>typeof v==='number'&&isFinite(v)&&v>=a&&v<=b;
export function parseGameMessage(raw){
  if(!raw||raw.t!=='g'||typeof raw.id!=='string')return null;
  const k=raw.k,out={k,id:raw.id};
  if(k==='need')return out;
  if(k==='music'){if(MUSIC.indexOf(raw.genre)<0)return null;out.genre=raw.genre;return out;}
  if(k==='order'){if(!RECIPE_BY_ID[raw.rec])return null;out.rec=raw.rec;return out;}
  if(k==='bar'){                                           // a friend's bartending, shown at their station: purely visual, never changes the night
    if(raw.off===true){out.off=true;return out;}
    if(!RECIPE_BY_ID[raw.rec]||BAR_STAGES.indexOf(raw.stage)<0)return null;
    out.rec=raw.rec;out.stage=raw.stage;
    out.v=num(raw.v,0,500)?raw.v:0;out.s=num(raw.s,0,500)?raw.s:0;
    out.col=Array.isArray(raw.col)&&raw.col.length===3&&raw.col.every(c=>num(c,0,1))?raw.col:null;
    out.pour=typeof raw.pour==='string'&&ING[raw.pour]?raw.pour:'';
    out.drag=raw.drag===true;out.mix=num(raw.mix,0,1)?raw.mix:0;out.srv=num(raw.srv,0,1)?raw.srv:0;
    out.gar=typeof raw.gar==='string'&&GARNISH.some(g=>g.id===raw.gar)?raw.gar:'none';
    return out;
  }
  if(k==='toast'){if(typeof raw.with!=='string'||!ID_RE.test(raw.with))return null;out.with=raw.with;return out;}
  if(k==='gift'){if(typeof raw.to!=='string'||!ID_RE.test(raw.to))return null;out.to=raw.to;return out;}
  if(k==='claim'||k==='unclaim'){if(!SEAT_RE.test(raw.seat))return null;out.seat=raw.seat;return out;}
  if(k==='served'){
    if(!SEAT_RE.test(raw.seat)||!RECIPE_BY_ID[raw.rec])return null;
    if(!Number.isInteger(raw.stars)||raw.stars<0||raw.stars>3||!num(raw.final,0,1)||!num(raw.tip,0,MAX_TIP)||!num(raw.ml,0,500))return null;
    if(!Array.isArray(raw.col)||raw.col.length!==3||!raw.col.every(v=>num(v,0,1)))return null;
    return Object.assign(out,{seat:raw.seat,rec:raw.rec,stars:raw.stars,final:raw.final,tip:raw.tip,ml:raw.ml,col:raw.col});
  }
  if(k==='world'){
    const r=restore({v:VERSION,world:raw.w});
    if(!r||!r.world.session)return null;
    out.w=r.world;return out;
  }
  return null;
}
