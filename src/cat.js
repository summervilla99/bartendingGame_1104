import * as THREE from 'three';
import {M,hdr} from './three-utils.js';

/* The counter cat: a small black cat that sits at the end of the bar, sways its tail, blinks, and reacts to how a drink turned out. */
export function makeCat(){
  const group=new THREE.Group();
  const fur=M(0x17110f,{roughness:.8,envMapIntensity:.25}),inner=M(0x6a3a3a,{roughness:.7}),eyeM=new THREE.MeshBasicMaterial({color:hdr(0xffc23a,1.3)}),pupilM=new THREE.MeshBasicMaterial({color:0x050302});
  const body=new THREE.Mesh(new THREE.SphereGeometry(.1,18,14),fur);body.scale.set(1,1.2,1.05);body.position.set(0,.13,0);group.add(body);
  const haunch=new THREE.Mesh(new THREE.SphereGeometry(.085,14,10),fur);haunch.scale.set(1.15,.85,1.15);haunch.position.set(0,.075,-.03);group.add(haunch);
  [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.02,.022,.1,8),fur);p.position.set(s*.04,.05,.085);group.add(p);});
  const head=new THREE.Group();head.position.set(0,.29,.035);group.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.075,18,14),fur);skull.scale.set(1.12,.95,1);head.add(skull);
  const ears=[-1,1].map(s=>{const g=new THREE.Group();g.position.set(s*.048,.062,-.004);g.rotation.z=-s*.28;const o=new THREE.Mesh(new THREE.ConeGeometry(.028,.058,4),fur);o.position.y=.02;g.add(o);const i=new THREE.Mesh(new THREE.ConeGeometry(.015,.04,4),inner);i.position.set(0,.017,.008);g.add(i);head.add(g);return g;});
  const eyes=[-1,1].map(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),eyeM);e.scale.set(1,1.15,.5);e.position.set(s*.032,.008,.066);const p=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),pupilM);p.scale.set(.5,1.4,.4);p.position.set(0,0,.01);e.add(p);head.add(e);return e;});
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),M(0xc77c84,{roughness:.5}));nose.position.set(0,-.014,.073);head.add(nose);
  /* santa hat for the holidays */
  const hat=new THREE.Group();hat.position.set(0,.065,-.005);hat.rotation.x=-.25;hat.visible=false;head.add(hat);
  const red=M(0xc4202c,{roughness:.8}),wh=M(0xf4f0e6,{roughness:.95});
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.05,.1,14),red);cone.position.set(0,.045,-.01);cone.rotation.x=-.3;hat.add(cone);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.05,.011,8,16),wh);band.rotation.x=Math.PI/2;hat.add(band);
  const pom=new THREE.Mesh(new THREE.SphereGeometry(.015,8,6),wh);pom.position.set(0,.09,-.04);hat.add(pom);
  /* tail: a chain of beads that sways */
  const tail=[];for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.02-i*.0007,8,6),fur);group.add(b);tail.push(b);}
  let hop=0,away=0,blink=0,nextBlink=2,purr=0;
  function react(stars){if(stars>=3){hop=1;}else if(stars<=1){away=2.4;}else{hop=.4;}}
  function update(dt,t){
    nextBlink-=dt;if(nextBlink<=0){blink=.14;nextBlink=2+Math.random()*3.5;}
    blink=Math.max(0,blink-dt);eyes.forEach(e=>{e.scale.y=blink>0?.12:1.15;});
    hop=Math.max(0,hop-dt*1.6);away=Math.max(0,away-dt);
    const jump=hop>0?Math.sin((1-hop)*Math.PI)*.12*Math.min(1,hop*1.6+.2):0;
    group.position.y=group.userData.baseY+jump;
    body.scale.y=1.2+Math.sin(t*1.8)*.02;
    const turn=away>0?Math.min(1,away*1.5)*.9:Math.sin(t*.35)*.12;
    head.rotation.y+=(turn-head.rotation.y)*Math.min(1,dt*6);
    head.rotation.z=Math.sin(t*.7)*.04;
    ears[0].rotation.x=Math.max(0,Math.sin(t*5.3)-.93)*4;ears[1].rotation.x=Math.max(0,Math.sin(t*4.1+1)-.95)*4;
    for(let i=0;i<tail.length;i++){const u=i/(tail.length-1),a=Math.sin(t*1.6-u*2.2)*.5*u*(1+(hop>0?1.5:0));tail[i].position.set(.09+Math.sin(u*2.3)*.07+a*.08,.03+u*.06,-.07-u*.14+Math.cos(u*2.3)*.03);if(i>5)tail[i].position.y+=(u-.6)*.18;}
  }
  group.userData.baseY=0;
  return {group,update,react,setXmas(on){hat.visible=!!on;}};
}
