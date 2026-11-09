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
  {id:'sign',x:0,z:3.0,face:0,name:{ko:'네온 사인 앞',en:'Under the sign'}}
];
