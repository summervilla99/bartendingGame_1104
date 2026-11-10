import * as THREE from 'three';
import {M,lathe,canvasTex} from './three-utils.js';

/* Small props a story guest brings to the counter. Built from code like everything else; sizes match the oversized glassware. */
const SC=1.5;

/* A green soju bottle with a white label and a small shot glass. */
function makeSoju(){
  const g=new THREE.Group();
  const glass=new THREE.MeshStandardMaterial({color:0x2d7a46,roughness:.15,transparent:true,opacity:.86,envMapIntensity:1.1});
  g.add(new THREE.Mesh(lathe([[0,0],[.033,0],[.0355,.01],[.0355,.115],[.03,.148],[.0135,.178],[.0125,.215],[0,.215]],20),glass));
  const liq=new THREE.Mesh(lathe([[0,.004],[.03,.004],[.032,.11],[.026,.14],[.011,.17],[0,.17]],16),M(0xcfe6d4,{roughness:.2,transparent:true,opacity:.55}));
  g.add(liq);
  const lab=new THREE.Mesh(new THREE.CylinderGeometry(.0362,.0362,.065,20,1,true),new THREE.MeshStandardMaterial({
    map:canvasTex(256,64,(c,w,h)=>{c.fillStyle='#f3f0e6';c.fillRect(0,0,w,h);c.fillStyle='#1f6b3a';c.fillRect(0,0,w,10);c.fillRect(0,h-10,w,10);
      c.fillStyle='#1f6b3a';c.font='bold 30px "Black Han Sans","Apple SD Gothic Neo",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('소주',w/2,h/2+1);}),roughness:.6}));
  lab.position.y=.075;g.add(lab);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.0148,.0148,.014,14),M(0xd9d6cc,{roughness:.3,metalness:.7}));cap.position.y=.222;g.add(cap);
  const shot=new THREE.Mesh(lathe([[0,0],[.017,0],[.021,.045],[.0195,.046],[.0155,.004],[0,.004]],14),new THREE.MeshStandardMaterial({color:0xeaf3f1,roughness:.1,transparent:true,opacity:.5,envMapIntensity:1.2}));
  shot.position.set(.1,0,.02);g.add(shot);
  g.scale.setScalar(SC);
  return g;
}

/* An open notebook with scribbled lines and a ballpoint pen lying across it. */
function makeNotebook(){
  const g=new THREE.Group();
  const cover=new THREE.Mesh(new THREE.BoxGeometry(.4,.01,.28),M(0x3a1216,{roughness:.55,envMapIntensity:.5}));cover.position.y=.005;g.add(cover);
  [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.185,.012,.26),M(0xa89c82,{roughness:.95,envMapIntensity:.15}));p.position.set(s*.094,.016,0);p.rotation.z=-s*.018;g.add(p);});
  const lines=new THREE.Mesh(new THREE.PlaneGeometry(.37,.25),new THREE.MeshBasicMaterial({transparent:true,map:canvasTex(256,180,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.strokeStyle='rgba(60,70,110,.55)';c.lineWidth=2;
    for(let i=0;i<9;i++){const y=18+i*17;c.beginPath();c.moveTo(14,y);c.lineTo(w/2-10,y);c.stroke();c.beginPath();c.moveTo(w/2+10,y);c.lineTo(w-14,y);c.stroke();}
    c.strokeStyle='rgba(20,20,60,.8)';c.lineWidth=2.2;
    for(let i=0;i<6;i++){c.beginPath();let x=18;const y=16+i*17;c.moveTo(x,y);while(x<w/2-30-(i%3)*16){x+=5;c.lineTo(x,y-(Math.random()*5));}c.stroke();}
  })}));
  lines.rotation.x=-Math.PI/2;lines.position.y=.0235;g.add(lines);
  const pen=new THREE.Group();
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.0065,.0065,.15,10),M(0x14203a,{roughness:.25,metalness:.4}));barrel.rotation.z=Math.PI/2;pen.add(barrel);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.0065,.022,10),M(0xc9a066,{roughness:.2,metalness:.9}));tip.rotation.z=Math.PI/2;tip.position.x=-.086;pen.add(tip);
  const clip=new THREE.Mesh(new THREE.BoxGeometry(.05,.002,.004),M(0xc9a066,{roughness:.2,metalness:.9}));clip.position.set(.04,.007,0);pen.add(clip);
  pen.position.set(.07,.032,.04);pen.rotation.y=.5;g.add(pen);
  g.scale.setScalar(SC*.8);
  return g;
}
/* A glossy black motorcycle helmet with a tinted visor. */
function makeHelmet(){
  const g=new THREE.Group();
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.1,22,16),M(0x141416,{roughness:.2,metalness:.3,envMapIntensity:1}));shell.scale.set(1,.9,1.12);shell.position.y=.09;g.add(shell);
  const visor=new THREE.Mesh(new THREE.SphereGeometry(.102,20,10,-Math.PI*.42,Math.PI*.84,Math.PI*.3,Math.PI*.22),new THREE.MeshStandardMaterial({color:0x2a2f3a,roughness:.1,metalness:.6,envMapIntensity:1.4}));
  visor.scale.set(1,.9,1.12);visor.position.y=.09;visor.rotation.y=Math.PI;g.add(visor);
  const stripe=new THREE.Mesh(new THREE.TorusGeometry(.1,.006,6,24,Math.PI),M(0xb5261f,{roughness:.3}));stripe.rotation.set(Math.PI/2,0,Math.PI/2);stripe.position.y=.15;stripe.scale.set(1,1.12,1);g.add(stripe);
  g.scale.setScalar(SC);
  return g;
}
/* An open leather watch case with a gold watch lying in it. */
function makeWatchbox(){
  const g=new THREE.Group();
  const leather=M(0x1a1412,{roughness:.5,envMapIntensity:.6}),velvet=M(0x5a1a24,{roughness:.9,envMapIntensity:.1}),gold=M(0xd4af37,{roughness:.22,metalness:.9,envMapIntensity:1.2});
  const base=new THREE.Mesh(new THREE.BoxGeometry(.2,.05,.14),leather);base.position.y=.025;g.add(base);
  const cush=new THREE.Mesh(new THREE.BoxGeometry(.17,.012,.11),velvet);cush.position.y=.054;g.add(cush);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(.2,.012,.14),leather);lid.position.set(0,.09,-.085);lid.rotation.x=-1.25;g.add(lid);
  const strap=new THREE.Mesh(new THREE.TorusGeometry(.03,.006,6,18),gold);strap.rotation.x=Math.PI/2;strap.position.set(0,.064,0);g.add(strap);
  const face=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.01,18),gold);face.position.set(0,.07,0);g.add(face);
  g.scale.setScalar(SC*.9);g.rotation.y=.2;
  return g;
}
/* A brass key on a ring: the key to the bar. */
function makeKey(){
  const g=new THREE.Group();
  const brass=M(0xc9a066,{roughness:.25,metalness:.9,envMapIntensity:1.3});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.03,.007,8,22),brass);ring.rotation.x=Math.PI/2;ring.position.set(0,.009,0);g.add(ring);
  const shaft=new THREE.Mesh(new THREE.BoxGeometry(.012,.006,.1),brass);shaft.position.set(0,.009,.075);g.add(shaft);
  [.1,.082].forEach((z,i)=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.03,.006,.012),brass);t.position.set(.015,.009,z+.0);g.add(t);});
  g.scale.setScalar(SC);g.rotation.y=.4;
  return g;
}
export const makeProp=kind=>kind==='key'?makeKey():kind==='watchbox'?makeWatchbox():kind==='soju'?makeSoju():kind==='notebook'?makeNotebook():kind==='helmet'?makeHelmet():null;

/* A round coaster (decor): style = leather | brass | emerald | cat. Sits under a served drink. */
const coasterCache={};
export function makeCoaster(style){
  const top=coasterCache[style]||(coasterCache[style]=canvasTex(128,128,(g,w,h)=>{
    const base={leather:['#4a1514','#7a3a2a'],brass:['#a8803f','#e6c98a'],emerald:['#14402c','#c9a066'],cat:['#14100e','#c9a066']}[style]||['#3a2a20','#c9a066'];
    g.fillStyle=base[0];g.fillRect(0,0,w,h);
    g.strokeStyle=base[1];g.lineWidth=3;g.beginPath();g.arc(w/2,h/2,w*.4,0,Math.PI*2);g.stroke();
    if(style==='leather'){g.setLineDash([5,5]);g.beginPath();g.arc(w/2,h/2,w*.34,0,Math.PI*2);g.stroke();g.setLineDash([]);}
    g.fillStyle=base[1];g.textAlign='center';g.textBaseline='middle';
    if(style==='cat'){g.beginPath();g.arc(w/2,h*.56,w*.15,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*.38,h*.48);g.lineTo(w*.4,h*.3);g.lineTo(w*.49,h*.42);g.fill();g.beginPath();g.moveTo(w*.62,h*.48);g.lineTo(w*.6,h*.3);g.lineTo(w*.51,h*.42);g.fill();}
    else{g.font='bold 54px Georgia,serif';g.fillStyle=style==='brass'?'#3a2810':base[1];g.fillText('C',w/2,h/2+3);}
  }));
  const g=new THREE.Group();
  const side=new THREE.MeshStandardMaterial({color:0x1a1210,roughness:.6}),face=new THREE.MeshStandardMaterial({map:top,roughness:.45,metalness:style==='brass'?.5:.1});
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.008,28),[side,face,side]);
  m.position.y=.004;g.add(m);
  return g;
}
