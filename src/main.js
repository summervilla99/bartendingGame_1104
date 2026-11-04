import * as THREE from 'three';
import './styles.css';
import {clamp,lerp,ease,rand,pick,won,reduceMotion} from './util.js';
import {canvasTex,M,shadows,hdr,lathe} from './three-utils.js';
import {INGR,ING,RECIPES,GARNISH,GARNISH_NAME,GLASS_NAME,METHOD_NAME} from './data.js';
import {makeGlass,makeGarnish} from './glass.js';
import {makeFigure,GUEST_CFG} from './figures.js';
import {Snd} from './audio.js';
import {buildEnv} from './env.js';
import {createComposer} from './composer.js';

const $=s=>document.querySelector(s);

/* ───────────── renderer / composer ───────────── */
const stageEl=$('#app'),canvas=$('#gl');
let W=stageEl.clientWidth||innerWidth,H=stageEl.clientHeight||innerHeight;
const PR=Math.min(window.devicePixelRatio||1,1.75);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(PR);
renderer.setSize(W,H,false);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b060d);
scene.fog=new THREE.FogExp2(0x140a16,0.028);
const camera=new THREE.PerspectiveCamera(50,W/H,.1,60);
const {composer,finalPass}=createComposer(renderer,scene,camera,W,H,PR);
buildEnv(renderer,scene);

/* helpers that need the scene */
function box(w,h,d,mat,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);(parent||scene).add(m);return m;}
function cyl(rt,rb,h,mat,x,y,z,parent,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),mat);m.position.set(x,y,z);(parent||scene).add(m);return m;}

/* ───────────── room ───────────── */
const floorTex=canvasTex(512,512,(g,w,h)=>{
  const s=w/2;
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){g.fillStyle=(i+j)%2?'#d9c392':'#1d4944';g.fillRect(i*s,j*s,s,s);}
  g.globalAlpha=.07;
  for(let k=0;k<2600;k++){g.fillStyle=Math.random()<.5?'#000':'#fff';g.fillRect(Math.random()*w,Math.random()*h,2,2);}
});
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(13,10);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,20),M(0xffffff,{map:floorTex,roughness:.26,metalness:.05,envMapIntensity:.8}));
floor.rotation.x=-Math.PI/2;floor.position.set(0,0,3.5);floor.receiveShadow=true;scene.add(floor);

const WALL_Z=-3.1;
box(26,6,.1,M(0x35142d,{roughness:.9}),0,2.7,WALL_Z-.06);
(function slats(){
  const geo=new THREE.BoxGeometry(.17,5.2,.1),mat=M(0x3b2117,{roughness:.55,envMapIntensity:.5});
  const n=44,im=new THREE.InstancedMesh(geo,mat,n),m4=new THREE.Matrix4();
  for(let i=0;i<n;i++){m4.setPosition(-10.75+i*.5,2.7,WALL_Z+.0);im.setMatrixAt(i,m4);}
  scene.add(im);
})();
const sideMat=M(0x143a3c,{roughness:.9});
[-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(16,6),sideMat);w.position.set(s*9,2.7,4);w.rotation.y=-s*Math.PI/2;scene.add(w);});
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(26,20),M(0x130a14,{roughness:1}));ceil.rotation.x=Math.PI/2;ceil.position.set(0,5.4,3.5);scene.add(ceil);
[-1,2,5].forEach(z=>box(26,.22,.28,M(0x2a1510,{roughness:.7}),0,5.28,z));

/* terrazzo counter top */
const terrazzo=canvasTex(512,512,(g,w,h)=>{
  g.fillStyle='#1c1219';g.fillRect(0,0,w,h);
  const cols=['#f6e7c9','#ff4d97','#37e3c6','#ffb561','#e8452c','#f6e7c9'];
  for(let i=0;i<170;i++){
    g.fillStyle=pick(cols);const x=Math.random()*w,y=Math.random()*h,r=rand(3,11),n=5+Math.floor(Math.random()*3);
    g.beginPath();
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2+Math.random()*.6,rr=r*rand(.6,1.15),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;k?g.lineTo(px,py):g.moveTo(px,py);}
    g.closePath();g.fill();
  }
});
terrazzo.wrapS=terrazzo.wrapT=THREE.RepeatWrapping;terrazzo.repeat.set(6,1);
const brass=M(0xd49b43,{roughness:.28,metalness:1,envMapIntensity:1.3});
const emissiveAmber=new THREE.MeshBasicMaterial({color:hdr(0xff9a3d,2.4)});

/* front counter */
const COUNTER_TOP=1.15;
box(12,1.05,1.3,M(0x21110b,{roughness:.7}),0,.525,0);
(function flutes(){
  const geo=new THREE.BoxGeometry(.075,.98,.07),mat=M(0x6a3b24,{roughness:.5,envMapIntensity:.5});
  const n=98,im=new THREE.InstancedMesh(geo,mat,n),m4=new THREE.Matrix4();
  for(let i=0;i<n;i++){m4.setPosition(-5.82+i*.12,.52,.67);im.setMatrixAt(i,m4);}
  scene.add(im);
})();
const topSlab=box(12.3,.1,1.5,M(0xffffff,{map:terrazzo,roughness:.3,metalness:.05,envMapIntensity:.6}),0,1.1,0);topSlab.receiveShadow=true;
box(12.3,.03,.03,brass,0,1.135,.755);
box(11.8,.02,.02,emissiveAmber,0,.97,.7);
cyl(.035,.035,12,brass,0,.3,.98,null,12).rotation.z=Math.PI/2;
[-5.5,-2.75,0,2.75,5.5].forEach(x=>cyl(.025,.025,.3,brass,x,.15,.98,null,10));

/* back bar */
box(11,1,.7,M(0x24120c,{roughness:.7}),0,.5,-2.65);
box(11.1,.06,.78,M(0xffffff,{map:terrazzo,roughness:.25,envMapIntensity:.7}),0,1.03,-2.65);
box(9.9,2.9,.03,new THREE.MeshStandardMaterial({color:0x3a2430,metalness:.75,roughness:.4,envMapIntensity:1.0}),0,2.55,WALL_Z+.08);
const shelfY=[1.95,2.65,3.35];
shelfY.forEach(y=>{
  box(9.6,.05,.42,M(0x5a3220,{roughness:.5}),0,y,-2.88);
  box(9.6,.025,.025,brass,0,y+.001,-2.67);
  box(9.4,.02,.02,emissiveAmber,0,y-.035,-2.74);
});
[-4.8,4.8].forEach(x=>box(.05,2.7,.4,M(0x5a3220,{roughness:.5}),x,2.35,-2.88));

const BOTTLE_PROFILES=[
  [[0,0],[.07,0],[.075,.02],[.075,.26],[.06,.32],[.026,.38],[.025,.48],[.03,.49],[0,.49]],
  [[0,0],[.06,0],[.063,.02],[.063,.3],[.04,.36],[.02,.4],[.02,.44],[.026,.45],[0,.45]],
  [[0,0],[.085,0],[.09,.02],[.09,.2],[.08,.25],[.03,.3],[.028,.4],[.034,.41],[0,.41]]
];
const BOTTLE_R=[.075,.063,.09];
const bottleGeos=BOTTLE_PROFILES.map(p=>lathe(p,20));
const bottleMats={};
function bottleMat(hex){
  if(!bottleMats[hex]){const c=new THREE.Color(hex);bottleMats[hex]=new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.7),emissive:c.clone().multiplyScalar(.1),roughness:.12,metalness:.1,envMapIntensity:1.4});}
  return bottleMats[hex];
}
const capMat=M(0xd49b43,{roughness:.3,metalness:1,envMapIntensity:1.2});
function makeBottle(pi,hex,scale){
  const g=new THREE.Group(),m=new THREE.Mesh(bottleGeos[pi],bottleMat(hex));m.castShadow=true;g.add(m);
  const pr=BOTTLE_PROFILES[pi],topY=pr[pr.length-2][1];
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.045,14),capMat);cap.position.y=topY+.012;cap.castShadow=true;g.add(cap);
  g.scale.setScalar(scale||1);g.userData.h=(topY+.03)*(scale||1);
  return g;
}
(function backbarBottles(){
  const cols=['#c47a1d','#2f6b3a','#9ad0d8','#c4102c','#4a2a14','#e6d28a','#3b5fb5','#e07b9a','#d9d4c0'];
  shelfY.forEach((y,si)=>{
    let x=-4.45+rand(0,.15);
    while(x<4.5){
      if(Math.random()<.9){const b=makeBottle(Math.floor(Math.random()*3),pick(cols),rand(.8,1.05));b.position.set(x,y+.025,-2.88+rand(-.04,.04));b.rotation.y=rand(0,6);scene.add(b);}
      x+=rand(.3,.42);
    }
  });
})();

/* neon sign */
const neonCanvas=document.createElement('canvas');neonCanvas.width=1280;neonCanvas.height=420;
const neonTex=new THREE.CanvasTexture(neonCanvas);
function drawNeon(){
  const g=neonCanvas.getContext('2d');g.clearRect(0,0,1280,420);
  g.save();g.translate(170,200);g.lineWidth=13;g.lineCap='round';g.lineJoin='round';g.strokeStyle='#8ffae6';g.shadowColor='#27e8c4';g.shadowBlur=30;
  g.beginPath();g.moveTo(-80,-100);g.lineTo(80,-100);g.lineTo(0,0);g.closePath();g.stroke();
  g.beginPath();g.moveTo(0,0);g.lineTo(0,98);g.moveTo(-48,100);g.lineTo(48,100);g.stroke();
  g.fillStyle='#ff8cc0';g.shadowColor='#ff4d97';g.beginPath();g.arc(22,-66,11,0,Math.PI*2);g.fill();
  g.restore();
  g.textAlign='left';g.textBaseline='alphabetic';
  g.font='215px Yellowtail,"Brush Script MT",cursive';
  [44,22,8].forEach(b=>{g.shadowColor='#ff2a86';g.shadowBlur=b;g.fillStyle='#ff7fb8';g.fillText('Last Call',320,250);});
  g.shadowBlur=0;g.fillStyle='#ffe9f3';g.fillText('Last Call',320,250);
  g.font='62px "Black Han Sans","Apple SD Gothic Neo",sans-serif';
  g.shadowColor='#27e8c4';g.shadowBlur=22;g.fillStyle='#9ffaea';g.fillText('라스트콜 라운지',334,350);
  g.shadowBlur=0;g.fillStyle='#e8fffa';g.fillText('라스트콜 라운지',334,350);
  neonTex.needsUpdate=true;
}
drawNeon();
const neonMat=new THREE.MeshBasicMaterial({map:neonTex,transparent:true,toneMapped:false,color:new THREE.Color(1.7,1.7,1.7),depthWrite:false});
const neon=new THREE.Mesh(new THREE.PlaneGeometry(4.3,1.41),neonMat);neon.position.set(0,4.55,WALL_Z+.12);scene.add(neon);
const glowTex=canvasTex(256,256,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,.85)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
const neonGlow=new THREE.Mesh(new THREE.PlaneGeometry(7.2,3.4),new THREE.MeshBasicMaterial({map:glowTex,color:0xff2a86,transparent:true,opacity:.34,blending:THREE.AdditiveBlending,depthWrite:false}));
neonGlow.position.set(0,4.5,WALL_Z+.09);scene.add(neonGlow);

/* arch posters */
function archPoster(pal,bg){
  const tex=canvasTex(256,360,(g,w,h)=>{
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    const arch=(x,y,ww,hh,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x,y+hh);g.lineTo(x,y+ww/2);g.arc(x+ww/2,y+ww/2,ww/2,Math.PI,0);g.lineTo(x+ww,y+hh);g.closePath();g.fill();};
    pal.forEach((c,i)=>arch(24+i*22,34+i*30,w-48-i*44,h-70-i*30,c));
    g.fillStyle='#f6e7c9';g.beginPath();g.arc(w/2,200,22,0,Math.PI*2);g.fill();
  });
  const g=new THREE.Group();
  box(1.5,2.1,.05,M(0x3b2117,{roughness:.5}),0,0,0,g);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.9),new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color(.8,.8,.8)}));p.position.z=.03;g.add(p);
  return g;
}
const posterL=archPoster(['#ff4d97','#ffb561','#37e3c6','#2a0f2e'],'#f6e7c9');posterL.position.set(-6.4,2.7,WALL_Z+.1);scene.add(posterL);
const posterR=archPoster(['#37e3c6','#e8452c','#ffb561','#2a0f2e'],'#f1d9b8');posterR.position.set(6.4,2.7,WALL_Z+.1);scene.add(posterR);

/* record player */
const platter=new THREE.Group();platter.position.set(-3.9,1.17,-2.65);scene.add(platter);
box(.8,.1,.56,M(0x1c0f0b,{roughness:.5}),-3.9,1.11,-2.65);
cyl(.2,.2,.02,M(0x0b0a0c,{roughness:.2,metalness:.3,envMapIntensity:1}),0,0,0,platter,40);
cyl(.07,.07,.024,M(0xff4d97,{roughness:.5}),0,.001,0,platter,24);
const arm=box(.26,.012,.012,brass,-3.62,1.2,-2.5);arm.rotation.y=.5;

/* plant */
(function plant(){
  const g=new THREE.Group();g.position.set(4.3,1.06,-2.55);scene.add(g);
  cyl(.15,.12,.24,M(0xe8452c,{roughness:.5}),0,.12,0,g,18);
  const lm=M(0x2c7a4a,{roughness:.55});
  for(let i=0;i<9;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),lm);l.scale.set(.2,1,.55);const a=i/9*Math.PI*2;l.position.set(Math.cos(a)*.12,.5+rand(0,.2),Math.sin(a)*.12);l.rotation.set(Math.sin(a)*.6,0,-Math.cos(a)*.6);g.add(l);}
})();

/* stools */
const STOOL_Z=1.25;
const STOOL_X=[-3.7,-2.6,-1.5,1.5,2.6,3.7];
STOOL_X.forEach((x,i)=>{
  const g=new THREE.Group();g.position.set(x,0,STOOL_Z);scene.add(g);
  cyl(.28,.3,.03,M(0x17110f,{roughness:.5}),0,.015,0,g,24);
  cyl(.035,.035,.68,brass,0,.37,0,g,12);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.015,8,28),brass);ring.rotation.x=Math.PI/2;ring.position.y=.3;g.add(ring);
  cyl(.27,.27,.1,M(i%2?0x1fa59a:0xe8452c,{roughness:.32,metalness:.1,envMapIntensity:.9}),0,.74,0,g,28);
  cyl(.285,.285,.02,brass,0,.69,0,g,28);
  shadows(g,true,true);
});

/* pendant lamps */
const lampXs=[-4.9,-2.5,2.5,4.9];
lampXs.forEach(x=>{
  const g=new THREE.Group();g.position.set(x,3.25,.2);scene.add(g);
  cyl(.007,.007,2.2,M(0x111111),0,1.1,0,g,6);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.3,.3,28,1,true),new THREE.MeshStandardMaterial({color:0xd49b43,metalness:1,roughness:.3,side:THREE.DoubleSide,envMapIntensity:1.2}));
  shade.position.y=.02;g.add(shade);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),new THREE.MeshBasicMaterial({color:hdr(0xffc98a,4)}));bulb.position.y=-.06;g.add(bulb);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(1.05,3.0,32,1,true),new THREE.MeshBasicMaterial({color:0xffb25e,transparent:true,opacity:.028,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  cone.position.y=-1.5;g.add(cone);
});

/* lights */
scene.add(new THREE.HemisphereLight(0x5a3f86,0x1c0f16,.6));
[-3.4,0,3.4].forEach(x=>{const l=new THREE.PointLight(0xffb56b,1.15,8.5,1.6);l.position.set(x,2.9,.3);scene.add(l);});
const key=new THREE.SpotLight(0xffc27a,1.9,9,.55,.65,1.2);
key.position.set(.7,3.5,1.7);key.target.position.set(0,1.15,.1);
key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0005;key.shadow.camera.near=1;key.shadow.camera.far=7;
scene.add(key,key.target);
const neonLight=new THREE.PointLight(0xff3d8e,1.6,10,1.5);neonLight.position.set(0,4.1,-2.2);scene.add(neonLight);
const tealLight=new THREE.PointLight(0x2ee6c4,.9,9,1.5);tealLight.position.set(-5.4,3,-1);scene.add(tealLight);

/* dust motes */
const softTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
const DUST=150,dustPos=new Float32Array(DUST*3),dustSeed=[];
for(let i=0;i<DUST;i++){dustPos[i*3]=rand(-5.5,5.5);dustPos[i*3+1]=rand(.8,4.6);dustPos[i*3+2]=rand(-2.5,4.5);dustSeed.push(rand(0,6.28));}
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.07,map:softTex,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffc98a})));

/* shaker tin + bar spoon */
const tin=new THREE.Mesh(new THREE.LatheGeometry([[.094,0],[.09,.015],[.075,.21],[.07,.222],[0,.225]].map(p=>new THREE.Vector2(p[0],p[1])),36),new THREE.MeshStandardMaterial({color:0xd5d9de,metalness:1,roughness:.22,envMapIntensity:1.5,side:THREE.DoubleSide}));
tin.castShadow=true;tin.visible=false;scene.add(tin);
const spoon=new THREE.Group();
cyl(.004,.004,.44,brass,0,.22,0,spoon,8);
cyl(.016,.012,.02,brass,0,.01,0,spoon,12);
spoon.visible=false;scene.add(spoon);

/* ───────────── people ───────────── */
const guests=GUEST_CFG.map((cfg,i)=>{
  const fig=makeFigure(cfg);fig.position.set(cfg.x,0,STOOL_Z);
  const hips=new THREE.Mesh(new THREE.CylinderGeometry(.2,.19,.2,18),M(cfg.pants));hips.position.y=.8;fig.add(hips);
  [-1,1].forEach(s=>{
    const th=new THREE.Mesh(new THREE.CylinderGeometry(.065,.06,.42,10),M(cfg.pants));th.rotation.x=Math.PI/2;th.position.set(s*.1,.8,-.2);fig.add(th);
    const sh=new THREE.Mesh(new THREE.CylinderGeometry(.055,.045,.46,10),M(cfg.pants));sh.position.set(s*.1,.55,-.4);fig.add(sh);
  });
  const arms=[-1,1].map(s=>{
    const a=new THREE.Group();a.position.set(s*.21,1.22,-.02);
    const m=new THREE.Mesh(new THREE.CylinderGeometry(.045,.04,.46,10),M(cfg.shirt,{roughness:.75}));m.rotation.x=Math.PI/2;m.position.set(0,0,-.23);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.05,12,10),M(cfg.skin));hand.position.set(0,0,-.47);
    a.add(m,hand);a.rotation.x=.25;fig.add(a);return a;
  });
  shadows(fig,true,false);scene.add(fig);
  return {cfg,name:cfg.name,x:cfg.x,fig,arms,order:null,reaction:null,drink:null,cheer:0,ph:i*1.7,anchor:new THREE.Vector3(cfg.x,2.0,STOOL_Z),nextAt:0};
});

const bartender=(function(){
  const g=makeFigure({skin:0xdcab88,shirt:0xf3ead6,hair:0x120c10,hat:0xff4d97});
  g.position.set(.9,0,-1.4);g.rotation.y=0;
  const vest=new THREE.Mesh(new THREE.CylinderGeometry(.205,.185,.5,22,1,true,-1.4,2.8),new THREE.MeshStandardMaterial({color:0x1b1620,roughness:.7,side:THREE.DoubleSide}));vest.position.y=1.0;g.add(vest);
  [-1,1].forEach(s=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,.88,10),M(0x17131c));l.position.set(s*.09,.44,0);g.add(l);});
  const tie=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),M(0xff4d97));tie.position.set(0,1.27,.19);g.add(tie);
  [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.ConeGeometry(.04,.08,8),M(0xff4d97));w.position.set(s*.06,1.27,.19);w.rotation.z=s*-Math.PI/2;g.add(w);});
  g.userData.head.rotation.y=Math.PI;
  const arm=new THREE.Group();arm.position.set(.22,1.2,0);
  const am=new THREE.Mesh(new THREE.CylinderGeometry(.05,.045,.5,10),M(0xf3ead6));am.position.y=-.25;arm.add(am);g.add(arm);g.userData.arm=arm;
  shadows(g,true,false);scene.add(g);return g;
})();

/* ingredient bottles on the counter rail */
const RAIL_Z=-.38,RAIL_Y=COUNTER_TOP+.02;
box(4.2,.04,.32,M(0x1b1316,{roughness:.4,metalness:.5,envMapIntensity:.8}),0,COUNTER_TOP+.02,RAIL_Z);
const labelCanvases={};
function paintLabel(ing){
  const c=labelCanvases[ing.id],g=c.getContext('2d');
  g.fillStyle='#f3e4c4';g.fillRect(0,0,256,128);
  g.fillStyle=ing.lab;g.fillRect(0,0,256,24);g.fillRect(0,104,256,24);
  g.fillStyle='#1a0f14';g.textAlign='center';g.textBaseline='middle';
  let sz=56;g.font=sz+'px "Black Han Sans","Apple SD Gothic Neo",sans-serif';
  while(g.measureText(ing.name).width>226&&sz>22){sz-=3;g.font=sz+'px "Black Han Sans","Apple SD Gothic Neo",sans-serif';}
  g.fillText(ing.name,128,66);
  ing.labelTex.needsUpdate=true;
}
const bottles=INGR.map((ing,i)=>{
  const sc=ing.small?.72:1;
  const g=makeBottle(ing.prof,ing.color,sc);
  const lc=document.createElement('canvas');lc.width=256;lc.height=128;labelCanvases[ing.id]=lc;
  ing.labelTex=new THREE.CanvasTexture(lc);ing.labelTex.anisotropy=8;
  const r=BOTTLE_R[ing.prof]+.0016;
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.12,18,1,true,-Math.PI*.42,Math.PI*.84),new THREE.MeshStandardMaterial({map:ing.labelTex,roughness:.8,envMapIntensity:.15}));
  lab.position.y=.13;g.add(lab);
  const home=new THREE.Vector3((i-5)*.36,RAIL_Y,RAIL_Z);
  g.position.copy(home);g.userData.ingId=ing.id;scene.add(g);
  return {id:ing.id,group:g,home,t:0,h:g.userData.h,side:home.x<0?-1:1};
});
function paintAllLabels(){INGR.forEach(paintLabel);}
paintAllLabels();
const bottleGroups=bottles.map(b=>b.group);

/* pour stream */
const stream=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,1,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85}));
stream.visible=false;scene.add(stream);

/* ───────────── game state ───────────── */
const S={mode:'guest',stage:null,guest:null,recipe:null,poured:{},total:0,vessel:null,serv:null,garnish:null,garnishObj:null,
  pourId:null,mixProg:0,mixCount:0,stirAngle:0,stirAcc:0,drag:null,strainT:0,serveT:0,result:null,tips:0,orderNo:0};
let dirtyUI=true,time=0,nextOrderAt=1.4;
const VP=new THREE.Vector3(0,COUNTER_TOP,.25),SP=new THREE.Vector3(.95,COUNTER_TOP,.25);

/* ───────────── camera ───────────── */
const PRE={
  guest:{pos:new THREE.Vector3(0,1.85,5.4),look:new THREE.Vector3(.3,2.0,-1.5),fov:50,off:0},
  bar:{pos:new THREE.Vector3(0,2.05,3.4),look:new THREE.Vector3(0,1.8,-1.0),fov:38,off:.2}
};
const camPos=PRE.guest.pos.clone(),camLook=PRE.guest.look.clone();let camFov=PRE.guest.fov,camOff=0;
const cam={from:{pos:camPos.clone(),look:camLook.clone(),fov:camFov,off:0},to:PRE.guest,t:1,dur:1.25};
const mouse={x:0,y:0},par={x:0,y:0};
function goCam(name){
  cam.from={pos:camPos.clone(),look:camLook.clone(),fov:camFov,off:camOff};cam.to=PRE[name];cam.t=0;cam.dur=reduceMotion?.01:1.25;
}
function fovFor(v0){
  const a=W/H,hf=2*Math.atan(Math.tan(v0*Math.PI/360)*(16/9));
  return clamp(2*Math.atan(Math.tan(hf/2)/a)*180/Math.PI,28,80);
}
function updateCamera(dt){
  if(cam.t<1)cam.t=Math.min(1,cam.t+dt/cam.dur);
  const e=ease(cam.t);
  camPos.lerpVectors(cam.from.pos,cam.to.pos,e);camLook.lerpVectors(cam.from.look,cam.to.look,e);camFov=lerp(cam.from.fov,cam.to.fov,e);camOff=lerp(cam.from.off,cam.to.off,e);
  const k=reduceMotion?0:1;
  par.x=lerp(par.x,mouse.x,Math.min(1,dt*3));par.y=lerp(par.y,mouse.y,Math.min(1,dt*3));
  camera.position.set(camPos.x+par.x*.3*k,camPos.y+par.y*.1*k,camPos.z);
  camera.lookAt(camLook.x+par.x*.12*k,camLook.y,camLook.z);
  const f=fovFor(camFov);if(Math.abs(camera.fov-f)>.01){camera.fov=f;camera.updateProjectionMatrix();}
  if(camOff>.001)camera.setViewOffset(W,H,0,Math.round(camOff*H),W,H);
  else if(camera.view&&camera.view.enabled)camera.clearViewOffset();
}

/* ───────────── UI helpers ───────────── */
const el={
  tips:$('#tips'),make:$('#btn-make'),makeLabel:$('#make-label'),badge:$('#make-badge'),hint:$('#guest-hint'),
  uiGuest:$('#ui-guest'),uiBar:$('#ui-bar'),bubbles:$('#bubbles'),ticket:$('#ticket'),
  tkNo:$('#tk-no'),tkName:$('#tk-name'),tkMeta:$('#tk-meta'),tkLines:$('#tk-lines'),tkExtra:$('#tk-extra'),
  steps:$('#steps'),pPour:$('#panel-pour'),pMix:$('#panel-mix'),pGar:$('#panel-garnish'),
  chips:$('#chips'),gChips:$('#garnish-chips'),mixSay:$('#mix-say'),mixFill:$('#mix-fill'),btnStrain:$('#btn-strain'),
  result:$('#result'),toast:$('#toast'),music:$('#btn-music')
};
let toastTimer=null;
function toast(msg,ms){el.toast.textContent=msg;el.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.toast.classList.remove('show'),ms||1800);}

const chipEls={};
INGR.forEach(ing=>{
  const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.id=ing.id;
  b.innerHTML='<span class="sw" style="background:'+ing.color+'"></span><span class="nm">'+ing.name+'</span><span class="ml">0 ml</span>';
  const start=e=>{e.preventDefault();Snd.init();try{b.setPointerCapture(e.pointerId);}catch(_){}startPour(ing.id);};
  const stop=()=>stopPour(ing.id);
  b.addEventListener('pointerdown',start);
  b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);
  b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();Snd.init();startPour(ing.id);}});
  b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')stopPour(ing.id);});
  el.chips.appendChild(b);chipEls[ing.id]=b;
});
const garnEls={};
GARNISH.forEach(gn=>{
  const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.id=gn.id;
  b.innerHTML='<span class="sw" style="background:'+({none:'#d9c6a0',orange:'#ff8a1f',lime:'#a9df4f',cherry:'#b0102a'}[gn.id])+'"></span><span class="nm">'+gn.name+'</span><span class="ml">&nbsp;</span>';
  b.addEventListener('click',()=>{Snd.init();chooseGarnish(gn.id);});
  el.gChips.appendChild(b);garnEls[gn.id]=b;
});

const bubbleEls=guests.map((g,i)=>{
  const b=document.createElement('button');b.type='button';b.className='bubble';b.setAttribute('aria-label',g.name+' 주문 받기');
  b.addEventListener('click',()=>{Snd.init();if(S.mode==='guest'&&g.order)enterBar(g);});
  el.bubbles.appendChild(b);return b;
});

function pendingGuests(){return guests.filter(g=>g.order);}
function updateGuestUI(){
  const n=pendingGuests().length;
  el.badge.hidden=n===0;el.badge.textContent=n;
  el.make.disabled=n===0;
  el.makeLabel.textContent=n?'칵테일 만들기':'주문 기다리는 중…';
  el.tips.textContent=won(S.tips);
}

/* ───────────── orders ───────────── */
function newOrderFor(g){
  const last=g.lastRecipe;let r;do{r=pick(RECIPES);}while(r===last&&RECIPES.length>1);
  g.order=r;g.lastRecipe=r;
  if(g.drink){scene.remove(g.drink.group);g.drink=null;}
  g.reaction=null;
}
function updateOrders(){
  if(time<nextOrderAt)return;
  const free=guests.filter(g=>!g.order&&(!g.reaction||time>g.reaction.until));
  if(free.length&&pendingGuests().length<3){newOrderFor(pick(free));updateGuestUI();}
  nextOrderAt=time+rand(5,9);
}
const tmpV=new THREE.Vector3();
function updateBubbles(){
  const off=S.mode!=='guest'||cam.t<.7;
  el.bubbles.classList.toggle('off',off);
  if(off)return;
  const rect=canvas.getBoundingClientRect();
  guests.forEach((g,i)=>{
    const b=bubbleEls[i];let show=false;
    if(g.order){
      show=true;
      if(b.dataset.k!=='o'+g.order.id){b.dataset.k='o'+g.order.id;b.className='bubble';b.innerHTML='<small>'+g.name+'</small><b>'+g.order.name+'</b> 한 잔 부탁해요';}
    }else if(g.reaction&&time<g.reaction.until){
      show=true;
      if(b.dataset.k!=='r'+g.reaction.text){b.dataset.k='r'+g.reaction.text;b.className='bubble react';b.innerHTML='<small>'+g.name+'</small>'+g.reaction.text;}
    }
    if(!show){b.style.display='none';b.dataset.k='';return;}
    tmpV.copy(g.anchor).project(camera);
    if(tmpV.z>1||tmpV.x<-1.2||tmpV.x>1.2){b.style.display='none';return;}
    const x=(tmpV.x*.5+.5)*rect.width,y=(-tmpV.y*.5+.5)*rect.height-14;
    b.style.display='block';b.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-100%)';
  });
}

/* ───────────── mode switching ───────────── */
function enterBar(g){
  Snd.init();
  S.mode='bar';S.guest=g;S.recipe=g.order;S.orderNo++;
  resetBar();
  bartender.visible=false;guests.forEach(g=>{g.fig.visible=false;});
  el.uiGuest.hidden=true;el.uiBar.hidden=false;
  el.ticket.open=window.innerWidth>=900;
  goCam('bar');updateTicket();
  if(!S.hinted){S.hinted=true;toast('재료를 꾹 누르고 있으면 따라져요',3200);}
}
function leaveBar(){
  stopPour();bottles.forEach(b=>{b.t=0;b.group.position.copy(b.home);b.group.rotation.set(0,0,0);});clearBarObjects();S.mode='guest';S.stage=null;S.drag=null;
  bartender.visible=true;guests.forEach(g=>{g.fig.visible=true;});el.uiBar.hidden=true;el.uiGuest.hidden=false;el.result.hidden=true;
  goCam('guest');updateGuestUI();
}
function clearBarObjects(){
  [S.vessel,S.serv].forEach(o=>{if(o&&o.group.parent)o.group.parent.remove(o.group);});
  S.vessel=S.serv=null;S.garnishObj=null;S.garnish=null;
  tin.visible=false;spoon.visible=false;stream.visible=false;
}
function resetBar(){
  clearBarObjects();
  const r=S.recipe;S.poured={};S.total=0;S.mixProg=0;S.mixCount=0;S.stirAngle=0;S.stirAcc=0;S.strainT=0;S.serveT=0;S.pourId=null;S.mixDone=false;S.strainColor=null;S.shakeOff=0;S.strainStream=false;
  if(r.method==='build'){
    S.vessel=makeGlass(r.glass);S.serv=S.vessel;S.vessel.group.position.copy(VP);
  }else{
    S.vessel=makeGlass('mixing');S.vessel.group.position.copy(VP);
    S.serv=makeGlass(r.glass);S.serv.group.position.copy(SP);
    scene.add(S.serv.group);
  }
  scene.add(S.vessel.group);
  bottles.forEach(b=>{b.t=0;});
  setStage('pour');
  el.mixFill.style.width='0%';
  Object.keys(garnEls).forEach(k=>garnEls[k].classList.remove('sel'));
  dirtyUI=true;
}
function setStage(st){
  S.stage=st;
  const map={pour:'pour',mix:'mix',strain:'mix',garnish:'garnish',serve:'serve'};
  const order=['pour','mix','garnish','serve'],cur=order.indexOf(map[st]);
  [...el.steps.children].forEach(li=>{
    const i=order.indexOf(li.dataset.step);
    li.classList.toggle('on',i===cur);li.classList.toggle('done',i<cur);
    li.hidden=(li.dataset.step==='mix'&&S.recipe&&S.recipe.method==='build');
  });
  el.pPour.hidden=st!=='pour';el.pMix.hidden=st!=='mix';el.pGar.hidden=st!=='garnish';
}

/* ───────────── ticket ───────────── */
function updateTicket(){
  const r=S.recipe;if(!r)return;
  el.tkNo.textContent='주문 #'+S.orderNo+' · '+S.guest.name;
  el.tkName.textContent=r.name;
  el.tkMeta.textContent=METHOD_NAME[r.method]+' · '+GLASS_NAME[r.glass]+' · '+(r.garnish==='none'?'가니시 없음':GARNISH_NAME[r.garnish]);
  el.tkLines.innerHTML='';
  Object.keys(r.parts).forEach(id=>{
    const li=document.createElement('li');li.dataset.id=id;
    li.innerHTML='<span>'+ING[id].name+'</span><span><b class="cur">0</b> / '+r.parts[id]+' ml</span><div class="meter"><i></i></div>';
    el.tkLines.appendChild(li);
  });
  refreshTicket();
}
function refreshTicket(){
  const r=S.recipe;if(!r)return;
  [...el.tkLines.children].forEach(li=>{
    const id=li.dataset.id,tg=r.parts[id],cur=S.poured[id]||0,ratio=cur/tg;
    li.querySelector('.cur').textContent=cur<10?cur.toFixed(1):Math.round(cur);
    const bar=li.querySelector('i');bar.style.width=clamp(ratio/1.5*100,0,100)+'%';
    bar.className=ratio>1.1?'over':(ratio>=.9?'ok':'');
  });
  let extra=0;Object.keys(S.poured).forEach(id=>{if(!(id in r.parts))extra+=S.poured[id];});
  el.tkExtra.hidden=extra<1;if(extra>=1)el.tkExtra.textContent='레시피에 없는 재료가 '+Math.round(extra)+' ml 들어갔어요.';
  INGR.forEach(ing=>{const c=chipEls[ing.id].querySelector('.ml'),v=S.poured[ing.id]||0;c.textContent=(v<10&&v>0?v.toFixed(1):Math.round(v))+' ml';});
}

/* ───────────── pouring ───────────── */
function startPour(id){
  if(S.mode!=='bar'||S.stage!=='pour')return;
  if(S.total>=S.vessel.cap-.5){toast('잔이 가득 찼어요');return;}
  S.pourId=id;chipEls[id].classList.add('on');
}
function stopPour(id){
  if(id&&S.pourId!==id)return;
  if(S.pourId&&chipEls[S.pourId])chipEls[S.pourId].classList.remove('on');
  S.pourId=null;Snd.pour(false);
}
function blendColor(){
  let r=0,g=0,b=0,t=0;
  for(const id in S.poured){const c=ING[id].rgb,w=S.poured[id];r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;t+=w;}
  return t?[r/t,g/t,b/t]:null;
}
const THETA=1.72;
function updateBottles(dt){
  const v=S.vessel;
  bottles.forEach(b=>{
    const active=S.mode==='bar'&&S.stage==='pour'&&S.pourId===b.id;
    const target=active?1:0;
    b.t+=(target-b.t)*Math.min(1,dt*(target?7:6));
    if(Math.abs(target-b.t)<.003)b.t=target;
    const e=b.t,g=b.group;
    if(e<=0){g.position.copy(b.home);g.rotation.set(0,0,0);return;}
    const rimTop=v?VP.y+v.rimY:VP.y+.32;
    const poseX=VP.x+b.side*b.h*Math.sin(THETA);
    const poseY=rimTop+.08-b.h*Math.cos(THETA);
    g.position.set(lerp(b.home.x,poseX,e),lerp(b.home.y,poseY,e)+Math.sin(Math.PI*e)*.28,lerp(b.home.z,VP.z,e));
    g.rotation.z=b.side*THETA*e+(active&&b.t>.95?Math.sin(time*34)*.012:0);
    g.rotation.y=0;
  });
  // streams
  let showStream=false;
  if(S.mode==='bar'&&S.stage==='pour'&&S.pourId){
    const b=bottles.find(x=>x.id===S.pourId);
    if(b&&b.t>.9&&S.total<v.cap){
      showStream=true;
      const rimTop=VP.y+v.rimY,tipY=rimTop+.08,surf=VP.y+v.topY();
      const add=Math.min(ING[S.pourId].rate*dt,v.cap-S.total);
      S.poured[S.pourId]=(S.poured[S.pourId]||0)+add;S.total+=add;
      v.setLevel(S.total);v.setColor(blendColor());dirtyUI=true;
      stream.material.color.setRGB.apply(stream.material.color,ING[S.pourId].rgb);
      const len=Math.max(.02,tipY-surf);stream.scale.set(1,len,1);stream.position.set(VP.x,surf+len/2,VP.z);
      Snd.pour(true);
      if(S.total>=v.cap-.01){toast('잔이 가득 찼어요');stopPour();}
    }else Snd.pour(false);
  }else if(S.stage==='strain'){
    showStream=S.strainStream;
  }
  stream.visible=showStream;
}

/* ───────────── mixing ───────────── */
function afterPour(){
  if(S.total<1){toast('먼저 재료를 따라 주세요');return;}
  stopPour();
  const r=S.recipe;
  if(r.method==='build'){
    S.vessel.setIce(r.glass==='highball'?5:3);
    goGarnish();return;
  }
  setStage('mix');
  S.vessel.setIce(5);
  if(r.method==='shake'){
    tin.visible=true;tin.position.set(VP.x,VP.y+S.vessel.def.outer[S.vessel.def.outer.length-1][1]-.05,VP.z);
    el.mixSay.textContent='셰이커를 위아래로 힘차게 흔들어 주세요. 화면을 누른 채 위아래로 드래그!';
  }else{
    spoon.visible=true;
    el.mixSay.textContent='잔 둘레를 따라 원을 그리며 저어 주세요. 화면을 누른 채 빙글빙글 드래그!';
  }
  el.mixFill.style.width='0%';
}
function mixProgress(p){
  S.mixProg=clamp(p,0,1);el.mixFill.style.width=(S.mixProg*100)+'%';
  if(S.mixProg>=1&&S.stage==='mix'&&!S.mixDone){S.mixDone=true;toast('좋아요, 잘 섞였어요');setTimeout(()=>{if(S.stage==='mix')goStrain();},650);}
}
function clientToNdc(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*2-1,y:-((e.clientY-r.top)/r.height)*2+1,cx:e.clientX-r.left,cy:e.clientY-r.top};}
const raycaster=new THREE.Raycaster();
canvas.addEventListener('pointerdown',e=>{
  Snd.init();if(S.mode!=='bar')return;
  const p=clientToNdc(e);
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  if(S.stage==='pour'){
    raycaster.setFromCamera({x:p.x,y:p.y},camera);
    const hit=raycaster.intersectObjects(bottleGroups,true)[0];
    if(hit){let o=hit.object;while(o&&!o.userData.ingId)o=o.parent;if(o)startPour(o.userData.ingId);}
  }else if(S.stage==='mix'){
    S.mixDone=S.mixDone||false;
    S.drag={lastY:p.cy,midY:p.cy,dir:0,acc:0,counted:false,lastAng:null};
  }
});
canvas.addEventListener('pointermove',e=>{
  const p=clientToNdc(e);mouse.x=p.x;mouse.y=p.y;
  if(S.mode!=='bar'||S.stage!=='mix'||!S.drag)return;
  const d=S.drag;
  if(S.recipe.method==='shake'){
    const dy=p.cy-d.lastY;d.lastY=p.cy;d.midY+=(p.cy-d.midY)*.04;
    S.shakeOff=clamp(-(p.cy-d.midY)/170,-.3,.3);
    const dir=Math.sign(dy);
    if(dir!==0){
      if(dir===d.dir)d.acc+=Math.abs(dy);else{d.dir=dir;d.acc=Math.abs(dy);d.counted=false;}
      if(!d.counted&&d.acc>34){d.counted=true;S.mixCount++;Snd.shake();mixProgress(S.mixCount/14);}
    }
  }else{
    const c=tmpV.set(VP.x,VP.y+.15,VP.z).project(camera),rect=canvas.getBoundingClientRect();
    const sx=(c.x*.5+.5)*rect.width,sy=(-c.y*.5+.5)*rect.height;
    const dx=p.cx-sx,dy=p.cy-sy,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
    if(d.lastAng!==null&&dist>26){
      let da=ang-d.lastAng;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;
      S.stirAngle+=da;S.stirAcc+=Math.abs(da);
      if(Math.floor(S.stirAcc/1.6)!==Math.floor((S.stirAcc-Math.abs(da))/1.6))Snd.stir();
      mixProgress(S.stirAcc/(Math.PI*2*3));
    }
    d.lastAng=ang;
  }
});
function endDrag(){S.drag=null;S.shakeOff=0;stopPour();}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
window.addEventListener('pointerup',()=>{stopPour();});

function goStrain(){
  if(S.stage!=='mix')return;
  setStage('strain');S.strainT=0;S.strainStream=false;S.drag=null;
  tin.visible=false;spoon.visible=false;
  el.pMix.hidden=true;
  S.vessel.setIce(0);S.strainMl=S.total;S.strainColor=blendColor();
  S.serv.setColor(S.strainColor);
}
function updateStrain(dt){
  S.strainT=Math.min(1,S.strainT+dt/2.2);
  const t=S.strainT,v=S.vessel,sv=S.serv;
  const aboveY=VP.y+.36;
  let px=VP.x,py=VP.y,pl=1;
  if(t<.25){const e=ease(t/.25);px=lerp(VP.x,SP.x,e);py=lerp(VP.y,aboveY,e);S.strainStream=false;}
  else if(t<.8){px=SP.x;py=aboveY;pl=1-(t-.25)/.55;S.strainStream=true;}
  else{const e=ease((t-.8)/.2);px=lerp(SP.x,-1.0,e);py=lerp(aboveY,VP.y,e);pl=0;S.strainStream=false;}
  v.group.position.set(px,py,VP.z);
  const ml=S.strainMl*clamp(pl,0,1);v.setLevel(ml);
  sv.setLevel(S.strainMl*(1-clamp(pl,0,1)));
  if(S.strainStream){
    const surf=SP.y+sv.topY(),startY=aboveY+.02,len=Math.max(.02,startY-surf);
    stream.material.color.setRGB(S.strainColor[0],S.strainColor[1],S.strainColor[2]);
    stream.scale.set(1,len,1);stream.position.set(SP.x,surf+len/2,SP.z);
  }
  if(t>=.3&&sv.ice===0&&S.recipe.glass==='rocks')sv.setIce(3);
  if(t>=1){S.strainStream=false;stream.visible=false;S.vessel.group.position.set(-1.0,VP.y,VP.z);goGarnish();}
}
function goGarnish(){
  setStage('garnish');chooseGarnish('none',true);
}
function chooseGarnish(id,silent){
  S.garnish=id;
  Object.keys(garnEls).forEach(k=>garnEls[k].classList.toggle('sel',k===id));
  const sv=S.serv;
  if(S.garnishObj&&S.garnishObj.parent)S.garnishObj.parent.remove(S.garnishObj);
  S.garnishObj=null;
  if(id!=='none'){
    const go=makeGarnish(id);
    if(id==='cherry')go.position.set(.02,sv.level+.005,0);else go.position.set(sv.rimR*.82,sv.rimY+.005,0);
    sv.group.add(go);S.garnishObj=go;
    if(!silent)Snd.clink(.4);
  }
}

/* ───────────── serving + scoring ───────────── */
function scoreDrink(){
  const r=S.recipe;let diff=0,total=0;
  Object.keys(r.parts).forEach(id=>{diff+=Math.abs((S.poured[id]||0)-r.parts[id]);total+=r.parts[id];});
  Object.keys(S.poured).forEach(id=>{if(!(id in r.parts))diff+=S.poured[id];});
  const acc=clamp(1-diff/total,0,1);
  const mix=r.method==='build'?1:S.mixProg;
  const gar=S.garnish===r.garnish?1:0;
  const final=acc*.7+mix*.2+gar*.1;
  const stars=final>=.88?3:final>=.68?2:final>=.45?1:0;
  return {acc,mix,gar,final,stars,tip:stars?stars*3000+Math.round(acc*1000):0};
}
const SAY=[
  '이건 제가 시킨 게 아닌 것 같은데요…',
  '음, 레시피를 한 번 더 볼까요?',
  '좋아요. 한 잔 더 시켜도 되겠는데요?',
  '완벽해요. 오늘 밤은 여기서 끝낼래요.'
];
function serveDrink(){
  if(S.stage!=='garnish')return;
  S.result=scoreDrink();setStage('serve');S.serveT=0;
  el.pGar.hidden=true;Snd.clink(1);
}
function updateServe(dt){
  S.serveT=Math.min(1,S.serveT+dt/.9);
  const e=ease(S.serveT),g=S.guest,sv=S.serv;
  const from=S.recipe.method==='build'?VP:SP;
  const tx=clamp(g.x,-1.8,1.8);
  sv.group.position.set(lerp(from.x,tx,e),COUNTER_TOP,lerp(from.z,.5,e));
  if(S.serveT>=1)showResult();
}
function showResult(){
  const r=S.result,rc=S.recipe,g=S.guest;
  S.stage='result';
  $('#r-who').textContent=g.name+'에게 서빙';
  $('#r-title').textContent=rc.name;
  $('#r-stars').innerHTML=[0,1,2].map(i=>'<span class="'+(i<r.stars?'on':'')+'">★</span>').join('');
  $('#r-stars').setAttribute('aria-label','별 3개 중 '+r.stars+'개');
  $('#r-say').textContent=SAY[r.stars];
  const lines=Object.keys(rc.parts).map(id=>{
    const got=S.poured[id]||0,tg=rc.parts[id],bad=Math.abs(got-tg)>tg*.12;
    return '<li class="'+(bad?'bad':'')+'"><span>'+ING[id].name+'</span><span>'+Math.round(got)+' / '+tg+' ml</span></li>';
  });
  let extra=0;Object.keys(S.poured).forEach(id=>{if(!(id in rc.parts))extra+=S.poured[id];});
  if(extra>=1)lines.push('<li class="bad"><span>레시피에 없는 재료</span><span>'+Math.round(extra)+' ml</span></li>');
  if(rc.method!=='build')lines.push('<li class="'+(r.mix<.9?'bad':'')+'"><span>'+METHOD_NAME[rc.method]+'</span><span>'+Math.round(r.mix*100)+'%</span></li>');
  lines.push('<li class="'+(r.gar?'':'bad')+'"><span>가니시</span><span>'+(r.gar?'맞음':'다름')+'</span></li>');
  $('#r-lines').innerHTML=lines.join('');
  $('#r-tip').textContent=won(r.tip);
  S.tips+=r.tip;
  $('#btn-r-next').disabled=pendingGuests().length<=1;
  el.result.hidden=false;
  Snd.clink(1);
  g.cheer=1.2;
}
function finishService(){
  const g=S.guest,sv=S.serv,r=S.result;
  // hand the glass to the guest
  scene.remove(sv.group);
  if(S.garnishObj&&S.garnishObj.parent)S.garnishObj.parent.remove(S.garnishObj);
  const prop=makeGlass(S.recipe.glass);prop.group.scale.setScalar(.8);prop.group.position.set(g.x,COUNTER_TOP,.45);
  prop.setLevel(sv.ml);prop.setColor(S.strainColor||blendColor());if(S.recipe.glass!=='coupe')prop.setIce(S.recipe.glass==='highball'?4:3);
  scene.add(prop.group);if(g.drink)scene.remove(g.drink.group);g.drink=prop;
  g.order=null;g.reaction={text:SAY[r.stars],until:time+7};updateGuestUI();
  S.vessel&&S.vessel.group.parent&&S.vessel.group.parent.remove(S.vessel.group);
  S.vessel=S.serv=null;S.garnishObj=null;
  nextOrderAt=Math.min(nextOrderAt,time+rand(2.5,5));
}

/* ───────────── bar-mode per-frame ───────────── */
function updateBar(dt,t){
  if(S.stage==='pour'||S.stage==='mix'||S.stage==='garnish'||S.stage==='strain'||S.stage==='serve')updateBottles(dt);
  if(S.stage==='mix'&&S.vessel){
    const v=S.vessel;
    if(S.recipe.method==='shake'&&tin.visible){
      const off=(S.shakeOff||0)*(S.drag?1:0);
      const jx=S.drag?Math.sin(t*38)*.006:0;
      v.group.position.set(VP.x+jx,VP.y+off,VP.z);
      tin.position.set(VP.x+jx,VP.y+off+v.rimY-.05,VP.z);
      tin.rotation.z=S.drag?Math.sin(t*30)*.03:0;
    }else if(spoon.visible){
      const a=S.stirAngle;
      spoon.position.set(VP.x+Math.cos(a)*.03,VP.y+.014,VP.z+Math.sin(a)*.03);
      spoon.rotation.set(Math.sin(a)*.1,0,-Math.cos(a)*.1);
      v.group.rotation.y=0;
    }
  }
  if(S.stage==='strain')updateStrain(dt);
  if(S.stage==='serve')updateServe(dt);
  if(dirtyUI){refreshTicket();dirtyUI=false;}
}

/* ───────────── room animation ───────────── */
function animateRoom(dt,t){
  platter.rotation.y+=dt*3.4;
  const flick=.94+.06*Math.sin(t*11)*Math.sin(t*3.7)+(Math.sin(t*.9)>.985?-.25:0);
  neonMat.color.setScalar(1.7*flick);neonGlow.material.opacity=.34*flick;neonLight.intensity=1.6*flick;
  const dp=dustGeo.attributes.position.array;
  for(let i=0;i<DUST;i++){
    dp[i*3+1]+=dt*.035;dp[i*3]+=Math.sin(t*.3+dustSeed[i])*dt*.02;
    if(dp[i*3+1]>4.8)dp[i*3+1]=.8;
  }
  dustGeo.attributes.position.needsUpdate=true;
  // bartender idle
  if(bartender.visible){
    bartender.userData.head.rotation.y=Math.PI+Math.sin(t*.5)*.4;
    bartender.userData.torso.scale.y=1+Math.sin(t*1.6)*.01;
    bartender.userData.arm.rotation.x=Math.sin(t*1.2)*.12;
  }
}
function updateGuests(dt,t){
  guests.forEach(g=>{
    const u=g.fig.userData;
    u.head.rotation.y=Math.sin(t*.45+g.ph)*.35;
    u.head.rotation.z=Math.sin(t*.8+g.ph)*.04;
    u.torso.scale.y=1+Math.sin(t*1.5+g.ph)*.012;
    if(g.cheer>0){g.cheer=Math.max(0,g.cheer-dt);}
    const lift=g.cheer>0?Math.sin(Math.min(1,g.cheer/1.2)*Math.PI)*1.1:0;
    g.arms[1].rotation.x=.25+lift;
  });
}
function cheers(){
  if(S.mode!=='guest')return;
  Snd.init();Snd.clink(1);
  guests.forEach((g,i)=>setTimeout(()=>{g.cheer=1.2;},i*120));
  setTimeout(()=>Snd.clink(.7),380);
  toast('짠!');
}

/* ───────────── events ───────────── */
el.make.addEventListener('click',()=>{const g=pendingGuests()[0];if(g)enterBar(g);});
$('#btn-cheers').addEventListener('click',cheers);
$('#btn-leave').addEventListener('click',leaveBar);
$('#btn-reset').addEventListener('click',()=>{
  if(S.stage!=='pour')return;
  stopPour();S.poured={};S.total=0;S.vessel.setLevel(0);dirtyUI=true;
});
$('#btn-next-pour').addEventListener('click',afterPour);
$('#btn-strain').addEventListener('click',goStrain);
$('#btn-serve').addEventListener('click',serveDrink);
$('#btn-r-leave').addEventListener('click',()=>{finishService();leaveBar();});
$('#btn-r-next').addEventListener('click',()=>{
  finishService();el.result.hidden=true;
  const g=pendingGuests()[0];
  if(g)enterBar(g);else leaveBar();
});
el.music.addEventListener('click',()=>{
  const on=!Snd.on;if(!Snd.music(on)){toast('이 브라우저에서는 소리를 켤 수 없어요');return;}
  el.music.textContent=on?'음악 끄기':'음악 켜기';el.music.setAttribute('aria-pressed',on?'true':'false');
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.mode==='bar'&&el.result.hidden)leaveBar();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)Snd.pause();else Snd.resume();});

function resize(){
  W=stageEl.clientWidth||innerWidth;H=stageEl.clientHeight||innerHeight;if(!W||!H)return;
  renderer.setSize(W,H,false);composer.setSize(Math.round(W*PR),Math.round(H*PR));
  camera.aspect=W/H;camera.fov=fovFor(camFov);camera.updateProjectionMatrix();
}
if(window.ResizeObserver)new ResizeObserver(resize).observe(stageEl);else window.addEventListener('resize',resize);
resize();

/* ───────────── loop ───────────── */
/* ?debug exposes state on window.__lastcall; ?debug&dtmax=0.2 lets slow (software-GL) machines advance faster per frame. */
const QS=new URLSearchParams(location.search),DEBUG=QS.has('debug'),DT_MAX=(DEBUG&&parseFloat(QS.get('dtmax')))||.05;
if(DEBUG)window.__lastcall={S,enterBar,leaveBar,guests,RECIPES};
let last=performance.now(),firstFrame=true;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(DT_MAX,(now-last)/1000);last=now;time+=dt;
  updateCamera(dt);animateRoom(dt,time);
  if(S.mode==='bar')updateBar(dt,time);
  updateGuests(dt,time);updateOrders();updateBubbles();
  finalPass.uniforms.time.value=time%50;
  composer.render(dt);
  if(firstFrame){firstFrame=false;requestAnimationFrame(()=>$('#loading').classList.add('gone'));}
}
updateGuestUI();
requestAnimationFrame(frame);

/* fonts: repaint canvas text once the web fonts arrive */
if(document.fonts&&document.fonts.load){
  Promise.all([document.fonts.load('200px Yellowtail'),document.fonts.load('56px "Black Han Sans"','라스트콜')]).then(()=>{drawNeon();paintAllLabels();}).catch(()=>{});
  document.fonts.ready.then(()=>{drawNeon();paintAllLabels();});
}
