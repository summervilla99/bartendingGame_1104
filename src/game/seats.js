/* Where players can sit and where they can take a photo. Pure data (no three.js) so it is shared by the client and the tests.
   Seats are numbered 1..SEAT_MAX on the wire (0 = standing). y is the avatar's vertical offset while seated. */
export const STOOL_Z=1.25;
export const COUNTER_STOOL_X=[-3.7,-2.6,-1.5,1.5,2.6,3.7];
export const NPC_STOOL_X=[-3.7,-1.5,1.5,2.6];          // taken by the counter guests

const S=(id,kind,x,z,yaw,y,lean,sx,sz,name)=>({id,kind,x,z,yaw,y,lean,stand:{x:sx,z:sz},name});
export const SEATS=[];
COUNTER_STOOL_X.filter(x=>NPC_STOOL_X.indexOf(x)<0).forEach(x=>
  SEATS.push(S('stool'+x,'stool',x,STOOL_Z,Math.PI,-.11,.95,x,2.3,{ko:'바 스툴',en:'Bar stool'})));
SEATS.push(S('armchair','chair',-6.2,8.2,Math.PI/2,-.46,.25,-5.1,8.2,{ko:'라운지 의자',en:'Lounge chair'}));
[1.5,2.8,4.1].forEach(z=>{
  SEATS.push(S('benchL'+z,'bench',-9.5,z,Math.PI/2,-.46,.25,-8.3,z,{ko:'소파 자리',en:'Sofa seat'}));
  SEATS.push(S('benchR'+z,'bench',9.5,z,-Math.PI/2,-.46,.25,8.3,z,{ko:'소파 자리',en:'Sofa seat'}));
});
export const SEAT_MAX=SEATS.length;
export const seatByWireId=n=>(Number.isInteger(n)&&n>=1&&n<=SEAT_MAX)?SEATS[n-1]:null;

/* face = direction the avatar faces; the photo camera sits in front of that, so the spot ends up behind the avatar. */
export const PHOTO_SPOTS=[
  {id:'piano',x:6.5,z:6.7,face:Math.PI,name:{ko:'피아노 앞',en:'By the piano'}},
  {id:'windowR',x:5.2,z:10.2,face:Math.PI,name:{ko:'창가',en:'By the window'}},
  {id:'windowL',x:-5.2,z:10.2,face:Math.PI,name:{ko:'창가',en:'By the window'}},
  {id:'sign',x:0,z:3.0,face:0,name:{ko:'네온 사인 앞',en:'Under the sign'}}
];
