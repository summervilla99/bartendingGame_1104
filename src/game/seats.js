/* Where players can sit and where they can take a photo. Pure data (no three.js) so it is shared by the client and the tests.
   Seats are numbered 1..SEAT_MAX on the wire (0 = standing). y is the avatar's vertical offset while seated.
   The first STOOL_MAX seats are bar stools; layoutStools() moves/hides them for the room's chair count. */
export const STOOL_Z=1.25,STOOL_MAX=6;
export const COUNTER_STOOL_X=[-3.7,-2.6,-1.5,1.5,2.6,3.7];
export const NPC_STOOL_X=[-3.7,-1.5,1.5,2.6];          // taken by the counter guests when playing solo

const mk=(id,kind,x,z,yaw,y,lean,sx,sz,name)=>({id,kind,x,z,yaw,y,lean,stand:{x:sx,z:sz},name,active:true,npc:false});
export const SEATS=[];
COUNTER_STOOL_X.forEach((x,i)=>SEATS.push(mk('stool'+i,'stool',x,STOOL_Z,Math.PI,-.11,.95,x,2.3,{ko:'바 스툴',en:'Bar stool'})));
SEATS.push(mk('armchair','chair',-6.2,8.2,Math.PI/2,-.46,.25,-5.1,8.2,{ko:'라운지 의자',en:'Lounge chair'}));
[1.5,2.8,4.1].forEach(z=>{
  SEATS.push(mk('benchL'+z,'bench',-9.5,z,Math.PI/2,-.46,.25,-8.3,z,{ko:'소파 자리',en:'Sofa seat'}));
  SEATS.push(mk('benchR'+z,'bench',9.5,z,-Math.PI/2,-.46,.25,8.3,z,{ko:'소파 자리',en:'Sofa seat'}));
});
SEATS.push(mk('piano','piano',7.1,7.7,-.6,.18,.6,7.7,6.7,{ko:'피아노 의자',en:'Piano bench'}));
/* the two armchairs on either side of the lounge table; the lounge guests (Haeun, Teo) sit there in some hours */
SEATS.push(mk('lounge0','chair',-6.2,6.6,Math.PI/2,-.46,.25,-6.2,5.6,{ko:'라운지 의자',en:'Lounge chair'}));
SEATS.push(mk('lounge1','chair',-4.4,6.6,-Math.PI/2,-.46,.25,-4.4,5.6,{ko:'라운지 의자',en:'Lounge chair'}));
export const LOUNGE_SEAT_IDS=['lounge0','lounge1'];
/* Ordering works from every seat except the piano bench. A bar stool gets its drink on the counter; any other seat gets it on the nearest cafe table (top at y .76). */
const TABLES=[[-8.85,1.8],[-8.85,3.8],[8.85,1.8],[8.85,3.8],[-5.3,6.6]];
export const canOrderFrom=s=>!!s&&s.kind!=='piano';
export function dropFor(seat){
  if(!seat||seat.kind==='stool')return null;
  let best=TABLES[0],bd=1e9;
  TABLES.forEach(t=>{const d=Math.hypot(t[0]-seat.x,t[1]-seat.z);if(d<bd){bd=d;best=t;}});
  const dx=seat.x-best[0],dz=seat.z-best[1],l=Math.hypot(dx,dz)||1;
  return {x:+(best[0]+dx/l*.16).toFixed(2),y:.78,z:+(best[1]+dz/l*.16).toFixed(2)};          // a little toward the seat, away from the candle
}
export function setLoungeTaken(flags){LOUNGE_SEAT_IDS.forEach((id,i)=>{const s=SEATS.find(x=>x.id===id);if(s)s.npc=!!flags[i];});}
export const SEAT_MAX=SEATS.length;
export const seatByWireId=n=>(Number.isInteger(n)&&n>=1&&n<=SEAT_MAX)?SEATS[n-1]:null;

/* Bar stool positions: solo keeps the classic six; in a room the chosen number is spread evenly (2..6). */
export const stoolXs=chairs=>{
  if(!chairs)return COUNTER_STOOL_X.slice();
  const n=Math.max(2,Math.min(STOOL_MAX,chairs|0));
  return Array.from({length:n},(_,i)=>+(-3.7+i*7.4/(n-1)).toFixed(2));
};
/* Apply a layout. Solo: guests sit on NPC_STOOL_X. Room: only the leftmost stool is taken (by the one NPC guest); the rest are for players. */
export function layoutStools(chairs){
  const xs=stoolXs(chairs);
  SEATS.slice(0,STOOL_MAX).forEach((s,i)=>{
    s.active=i<xs.length;
    if(s.active){s.x=xs[i];s.stand.x=xs[i];s.npc=chairs?i===0:NPC_STOOL_X.indexOf(xs[i])>=0;}
    else s.npc=false;
  });
  return xs;
}
layoutStools(0);
/* Seats a player may sit on right now. */
export const isFree=s=>s.active&&!s.npc;

/* face = direction the avatar faces; the photo camera sits in front of that, so the spot ends up behind the avatar. */
export const PHOTO_SPOTS=[
  {id:'piano',x:6.5,z:6.7,face:Math.PI,name:{ko:'피아노 앞',en:'By the piano'}},
  {id:'windowR',x:5.2,z:10.2,face:Math.PI,name:{ko:'창가',en:'By the window'}},
  {id:'windowL',x:-5.2,z:10.2,face:Math.PI,name:{ko:'창가',en:'By the window'}},
  {id:'sign',x:0,z:3.0,face:0,name:{ko:'간판 앞',en:'Under the sign'}}
];
