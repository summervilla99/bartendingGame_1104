import * as THREE from 'three';
import {M,lathe} from './three-utils.js';

/* Articulated stylised character. Local forward is +z; pivots: hips, knees, shoulders, elbows, head. */
const HIP_Y=.95;
const torsoGeo=lathe([[0,0],[.15,0],[.158,.08],[.15,.2],[.17,.38],[.19,.47],[.17,.53],[.06,.56],[0,.56]],18);
const skirtGeo=lathe([[0,-.48],[.27,-.48],[.21,-.2],[.17,.02],[0,.02]],20);
const thighGeo=new THREE.CylinderGeometry(.072,.06,.44,10);
const shinGeo=new THREE.CylinderGeometry(.056,.044,.44,10);
const upperGeo=new THREE.CylinderGeometry(.047,.041,.3,10);
const foreGeo=new THREE.CylinderGeometry(.041,.034,.27,10);
const footGeo=new THREE.BoxGeometry(.09,.06,.22);
const handGeo=new THREE.SphereGeometry(.043,10,8);
const headGeo=new THREE.SphereGeometry(.105,18,14);
const hairGeo=new THREE.SphereGeometry(.116,18,14,0,Math.PI*2,0,Math.PI*.6);
const eyeGeo=new THREE.SphereGeometry(.0135,10,8);
const eyeMat=M(0x120806,{roughness:.3});
const browGeo=new THREE.BoxGeometry(.034,.006,.006),mouthGeo=new THREE.TorusGeometry(.024,.0055,6,16,Math.PI);
const hairBandGeo=new THREE.SphereGeometry(.118,22,6,Math.PI*.85,Math.PI*1.3,Math.PI*.4,Math.PI*.24);   // sides and back only, never the forehead
const lensGeo=new THREE.TorusGeometry(.03,.0032,6,18);

function limb(parent,geo,mat,len,y){
  const j=new THREE.Group();j.position.y=y||0;parent.add(j);
  const m=new THREE.Mesh(geo,mat);m.position.y=-len/2;j.add(m);
  return j;
}

/* Santa hats: every character gets one, hidden until the holiday decoration is on */
const santaRed=M(0xc4202c,{roughness:.8,envMapIntensity:.2}),santaWhite=M(0xf4f0e6,{roughness:.95,envMapIntensity:.15});
const hats=new Set();let hatsOn=false;
export function setSantaHats(on){hatsOn=!!on;hats.forEach(h=>{h.visible=hatsOn;});}
export function makeCharacter(cfg){
  const g=new THREE.Group();
  const skin=M(cfg.skin,{roughness:.62,envMapIntensity:.25});
  const top=M(cfg.top,{roughness:cfg.sheen?.42:.78,envMapIntensity:cfg.sheen?.6:.3});
  const pants=M(cfg.pants,{roughness:.8});
  const shoe=M(cfg.shoes||0x150b08,{roughness:.35,envMapIntensity:.6});
  const hairM=M(cfg.hair,{roughness:.5,envMapIntensity:.4});

  const pelvis=new THREE.Group();pelvis.position.y=HIP_Y;g.add(pelvis);
  const hip=new THREE.Mesh(new THREE.CylinderGeometry(.155,.16,.16,16),cfg.dress?top:pants);hip.scale.z=.75;pelvis.add(hip);
  const legs=[-1,1].map(s=>{
    const h=limb(pelvis,thighGeo,cfg.dress?skin:pants,.44);h.position.x=s*.088;
    const k=limb(h,shinGeo,cfg.dress?skin:pants,.44,-.44);
    const f=new THREE.Mesh(footGeo,shoe);f.position.set(0,-.46,.05);k.add(f);
    return {h,k};
  });
  if(cfg.dress){const sk=new THREE.Mesh(skirtGeo,top);sk.scale.z=.8;pelvis.add(sk);}

  const torso=new THREE.Group();torso.position.y=HIP_Y-.03;g.add(torso);
  const bw=cfg.w||1;
  const body=new THREE.Mesh(torsoGeo,top);body.scale.set(bw,1,.68);torso.add(body);
  if(cfg.belly){const b=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),top);b.scale.set(1.05*bw,.8,.8);b.position.set(0,.18,.07);torso.add(b);}
  if(cfg.shirt!=null){
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(.085,.2),M(cfg.shirt,{roughness:.8}));sh.position.set(0,.43,.122);sh.rotation.x=-.12;torso.add(sh);
    if(cfg.tie!=null){const t=new THREE.Mesh(new THREE.PlaneGeometry(.03,.16),M(cfg.tie,{roughness:.5}));t.position.set(0,cfg.loose?.38:.41,.126);t.rotation.x=-.12;torso.add(t);}
  }
  if(cfg.lapel!=null){                                   // blazer lapels: a V on the chest
    const lm=M(cfg.lapel,{roughness:.6});
    [-1,1].forEach(s=>{const l=new THREE.Mesh(new THREE.PlaneGeometry(.05,.22),lm);l.position.set(s*.05,.4,.13);l.rotation.set(-.1,0,-s*.3);torso.add(l);});
  }
  if(cfg.necklace!=null){const n=new THREE.Mesh(new THREE.TorusGeometry(.05,.0035,6,18),M(cfg.necklace,{roughness:.3,metalness:.8}));n.rotation.x=Math.PI/2+.25;n.position.set(0,.56,.02);torso.add(n);}
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.09,10),skin);neck.position.y=.6;torso.add(neck);

  const head=new THREE.Group();head.position.y=.72;torso.add(head);
  const hm=new THREE.Mesh(headGeo,skin);hm.scale.set(.95,1.08,1);head.add(hm);
  [-1,1].forEach(s=>{const e=new THREE.Mesh(eyeGeo,eyeMat);e.position.set(s*.038,.01,.096);head.add(e);});
  if(cfg.mature){                                         // an older, tired face: longer and narrower head, heavy lids, eye bags, a nose, faint lines
    hm.scale.set(.89,1.15,.98);
    const sh=new THREE.Color(cfg.skin).lerp(new THREE.Color(0x6a4a4c),.3),shM=M(sh.getHex(),{roughness:.8,envMapIntensity:.15});
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.013,10,8),skin);nose.scale.set(.9,1.5,1.1);nose.position.set(0,-.006,.104);head.add(nose);
    [-1,1].forEach(s=>{
      const bag=new THREE.Mesh(new THREE.SphereGeometry(.012,10,6),shM);bag.scale.set(1.8,.45,.35);bag.position.set(s*.038,-.012,.097);head.add(bag);
      const lid=new THREE.Mesh(new THREE.SphereGeometry(.0145,10,6,0,Math.PI*2,0,Math.PI*.5),skin);lid.scale.set(1,.6,1);lid.position.set(s*.038,.0135,.0965);lid.rotation.x=-.2;head.add(lid);
      const ln=new THREE.Mesh(new THREE.BoxGeometry(.003,.026,.002),shM);ln.position.set(s*.03,-.02,.099);ln.rotation.z=s*.35;head.add(ln);
    });
  }
  if(cfg.bald){                                           // thinning: hair only in a band round the sides and back
    const hb=new THREE.Mesh(hairBandGeo,hairM);hb.position.set(0,.012,-.012);hb.rotation.x=-.1;head.add(hb);
  }else{
    const hair=new THREE.Mesh(hairGeo,hairM);hair.position.set(0,.012,-.012);hair.rotation.x=cfg.slick?-.72:cfg.bob?-.62:-.35;if(cfg.slick)hair.position.z=-.03;head.add(hair);
  }
  if(cfg.bob){const l=new THREE.Mesh(new THREE.CylinderGeometry(.118,.112,.17,16,1,true,Math.PI*.3,Math.PI*1.4),hairM);l.position.set(0,-.04,-.012);l.material.side=THREE.DoubleSide;head.add(l);}
  if(cfg.glasses!=null){
    const gm=M(cfg.glasses,{roughness:.3,metalness:.7});
    [-1,1].forEach(s=>{const l=new THREE.Mesh(lensGeo,gm);l.position.set(s*.04,.012,.1);head.add(l);});
    const br=new THREE.Mesh(new THREE.BoxGeometry(.02,.003,.003),gm);br.position.set(0,.02,.103);head.add(br);
  }
  if(cfg.earring!=null){const em=M(cfg.earring,{roughness:.2,metalness:.5});[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),em);e.position.set(s*.1,-.025,.0);head.add(e);});}
  /* a face that can change: brows and a mouth (see setFace) */
  const browM=M(cfg.hair,{roughness:.6}),mouthM=M(cfg.lip||0x6a2a26,{roughness:.5});
  const brows=[-1,1].map(s=>{const b=new THREE.Mesh(browGeo,browM);b.position.set(s*.038,.042,.1);b.userData.s=s;head.add(b);return b;});
  const mouth=new THREE.Mesh(mouthGeo,mouthM);mouth.position.set(0,-.03,.098);head.add(mouth);
  if(cfg.long){const l=new THREE.Mesh(new THREE.CylinderGeometry(.11,.095,.3,14,1,true,Math.PI*.35,Math.PI*1.3),hairM);l.position.set(0,-.12,-.01);l.material.side=THREE.DoubleSide;head.add(l);}
  if(cfg.bun){const b=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),hairM);b.position.set(0,.08,-.1);head.add(b);}
  if(cfg.hat!=null){
    const hatM=M(cfg.hat,{roughness:.7});
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.012,20),hatM);brim.position.y=.085;head.add(brim);
    const crown=new THREE.Mesh(new THREE.CylinderGeometry(.09,.105,.1,18),hatM);crown.position.y=.135;head.add(crown);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(.106,.106,.022,18),M(0x2a120c));band.position.y=.1;head.add(band);
  }

  if(cfg.hat==null){                                   // a Santa hat that the holiday switch shows or hides
    const hat=new THREE.Group();hat.position.set(0,.085,-.012);hat.rotation.x=-.22;hat.visible=hatsOn;
    const cone=new THREE.Mesh(new THREE.ConeGeometry(.098,.21,16),santaRed);cone.position.set(0,.1,-.012);cone.rotation.x=-.28;
    const band=new THREE.Mesh(new THREE.TorusGeometry(.099,.019,8,20),santaWhite);band.rotation.x=Math.PI/2;
    const pom=new THREE.Mesh(new THREE.SphereGeometry(.027,10,8),santaWhite);pom.position.set(0,.19,-.075);
    hat.add(cone,band,pom);head.add(hat);hats.add(hat);if(hats.size>160)hats.delete(hats.values().next().value);
  }

  const arms=[-1,1].map(s=>{
    const sh=limb(torso,upperGeo,top,.3,.5);sh.position.x=s*.2*bw;sh.rotation.z=s*.06;
    const el=limb(sh,foreGeo,top,.27,-.3);
    const hand=new THREE.Mesh(handGeo,skin);hand.position.y=-.29;el.add(hand);
    if(cfg.watch&&s>0){const w=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.02,12),M(0xb8b8bc,{roughness:.25,metalness:.8}));w.position.y=-.23;el.add(w);}
    return {sh,el};
  });

  g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
  if(cfg.h)g.scale.y=cfg.h;
  g.userData={pelvis,torso,head,legs,arms,brows,mouth,walkPh:0};
  return g;
}

/* Walk cycle; amt 0..1 blends from idle to full stride. */
export function poseWalk(fig,ph,amt,t){
  const u=fig.userData,sw=Math.sin(ph);
  u.legs.forEach((l,i)=>{
    const s=i?-sw:sw;
    l.h.rotation.x=-s*.55*amt;
    l.k.rotation.x=Math.max(0,Math.sin(ph+(i?Math.PI:0)+1.2))*.8*amt;
  });
  u.arms.forEach((a,i)=>{
    const s=i?sw:-sw;
    a.sh.rotation.x=-s*.42*amt;a.el.rotation.x=-.2-.25*amt;
  });
  const bob=Math.abs(Math.cos(ph))*.035*amt;
  u.pelvis.position.y=HIP_Y-bob;u.torso.position.y=HIP_Y-.03-bob;
  u.torso.rotation.y=sw*.06*amt;u.torso.rotation.x=.04*amt;
  u.head.rotation.x=0;u.head.rotation.y=-sw*.04*amt;
  u.torso.scale.y=1+Math.sin(t*1.6)*.008*(1-amt);
}

/* Seated on a stool; elbows rest forward on the counter. */
export function poseSit(fig,lean){
  const u=fig.userData;
  u.legs.forEach((l,i)=>{l.h.rotation.x=-Math.PI/2+.06;l.h.rotation.z=(i?-1:1)*-.08;l.k.rotation.x=Math.PI/2-.12;});
  u.arms.forEach(a=>{a.sh.rotation.x=-(lean==null?.75:lean);a.el.rotation.x=-.9;});
  u.torso.rotation.x=.08;
}

/* Two-bone arm IK: hand of arm i reaches a world-space target; k = smoothing 0..1. */
const _v=new THREE.Vector3(),_d=new THREE.Vector3(),_p=new THREE.Vector3(),_u=new THREE.Vector3(),_f=new THREE.Vector3(),_dn=new THREE.Vector3(0,-1,0);
const _qu=new THREE.Quaternion(),_qf=new THREE.Quaternion(),_qe=new THREE.Quaternion();
export function reachArm(fig,i,target,k){
  const a=fig.userData.arms[i],tor=fig.userData.torso,A=.3,B=.3;
  fig.updateMatrixWorld(true);
  _v.copy(target);tor.worldToLocal(_v);_v.sub(a.sh.position);
  const d=Math.min(Math.max(_v.length(),.12),A+B-.012);
  _d.copy(_v).normalize();
  const al=Math.acos(Math.max(-1,Math.min(1,(A*A+d*d-B*B)/(2*A*d))));
  _p.copy(_dn).addScaledVector(_d,-_d.dot(_dn));
  if(_p.lengthSq()<1e-4)_p.set(0,0,-1);_p.normalize();
  _u.copy(_d).multiplyScalar(Math.cos(al)).addScaledVector(_p,Math.sin(al));
  _f.copy(_d).multiplyScalar(d).addScaledVector(_u,-A).normalize();
  _qu.setFromUnitVectors(_dn,_u);_qf.setFromUnitVectors(_dn,_f);
  _qe.copy(_qu).invert().multiply(_qf);
  const kk=k==null?1:k;
  a.sh.quaternion.slerp(_qu,kk);a.el.quaternion.slerp(_qe,kk);
}
export function resetArms(fig){
  fig.userData.arms.forEach((a,i)=>{a.sh.rotation.set(0,0,(i?1:-1)*.06);a.el.rotation.set(0,0,0);});
}

export const PLAYER_CFG={name:'나',skin:0xe2b291,top:0x24262b,shirt:0xe9dfcc,tie:0x6b1f1c,pants:0x1c1c20,hair:0x17100c};
export const BARTENDER_CFG={name:'바텐더',skin:0xd6a27e,top:0x1c1414,shirt:0xece2cf,tie:0x9c7239,pants:0x141010,hair:0x0e0806,bun:true};

/* Counter guests (x = stool) and lounge guests (pos + yaw). nm/talk are {ko,en}: small-talk lines when you walk up. */
export const GUEST_CFG=[
  {nm:{ko:'민지',en:'Minji'},x:-3.7,skin:0xe5b99a,top:0x1f4a3c,dress:true,sheen:true,hair:0x1a1015,long:true,shoes:0x2a0d0d,
   talk:{ko:['이 바, 조명이 정말 좋죠? 혼자 와도 어색하지 않아요.','다음엔 친구들 데려올래요. 여기 기억해 둘게요.'],
         en:['The lighting here is lovely, isn\'t it? Never awkward coming alone.','Next time I\'m bringing friends. I\'ll remember this place.']}},
  {nm:{ko:'도현',en:'Dohyun'},x:-1.5,skin:0xd9a885,top:0x5a1e1a,shirt:0xe8dcc6,pants:0x1e1a1c,hair:0x2a1a10,hat:0x2b2522,
   talk:{ko:['재즈는 라이브가 최고인데, 여긴 레코드 소리도 따뜻하네요.','혹시 위스키도 잘 아세요? 다음엔 추천 좀 해 줘요.'],
         en:['Jazz is best live, but the records sound warm in here too.','Do you know your whiskey? Recommend me something next time.']}},
  {nm:{ko:'서윤',en:'Seoyun'},x:1.5,skin:0xf0c8aa,top:0x8a6a4a,shirt:0xf0e6d6,pants:0x2a221e,hair:0x3b1f16,bun:true,
   talk:{ko:['저는 디자이너예요. 이런 공간 보면 영감이 와요.','명함 한 장 드릴까요? 다음에 같이 작업해요.'],
         en:['I\'m a designer. Places like this give me ideas.','Can I give you my card? Let\'s work together sometime.']}},
  {nm:{ko:'지호',en:'Jiho'},x:2.6,skin:0xc99372,top:0x1d2433,shirt:0xe6e0d4,tie:0x5a1e1a,pants:0x161a24,hair:0x120c10,
   talk:{ko:['퇴근하고 한 잔이 제일 맛있죠.','여기 바텐더 실력 좋던데요? 아, 당신이었어요?'],
         en:['A drink after work tastes the best.','The bartender here is pretty good. Oh, that was you?']}}
];
export const LOUNGE_CFG=[
  {nm:{ko:'하은',en:'Haeun'},pos:[-6.2,0,6.6],yaw:Math.PI*.5,skin:0xeac2a4,top:0x2e1a2a,dress:true,sheen:true,hair:0x120a08,long:true,
   talk:{ko:['저 피아노, 금요일마다 연주가 있대요.','여긴 사람들이 다 조용히 이야기해서 좋아요.'],
         en:['They say there\'s live piano every Friday.','I like that everyone talks quietly here.']}},
  {nm:{ko:'태오',en:'Teo'},pos:[-4.4,0,6.6],yaw:-Math.PI*.5,skin:0xc89070,top:0x4a3a2a,shirt:0xddd2bf,pants:0x221a14,hair:0x0e0a08,
   talk:{ko:['스타트업 하고 있어요. 여기서 좋은 사람들 많이 만났죠.','칵테일 하나 추천해 줄래요? 아직 잘 몰라서요.'],
         en:['I run a startup. I\'ve met a lot of good people here.','Could you recommend a cocktail? I\'m still learning.']}}
];

/* Facial expression: neutral | smile | surprised | sad | angry. */
const FACES={
  neutral:{a:0,by:0,my:-.034,rz:Math.PI,sx:.9,sy:.22},
  smile:{a:0,by:.004,my:-.028,rz:Math.PI,sx:1.1,sy:1},
  surprised:{a:0,by:.016,my:-.045,rz:0,sx:.55,sy:1.7},
  sad:{a:-.35,by:.004,my:-.052,rz:0,sx:.8,sy:.8},
  angry:{a:.42,by:-.006,my:-.052,rz:0,sx:1,sy:.9}
};
export function setFace(fig,name){
  const u=fig.userData,f=FACES[name]||FACES.neutral;
  if(!u.brows)return;
  u.brows.forEach(b=>{b.rotation.z=f.a*b.userData.s;b.position.y=.042+f.by;});
  u.mouth.rotation.z=f.rz;u.mouth.position.y=f.my;u.mouth.scale.set(f.sx,f.sy,1);
}
