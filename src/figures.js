import * as THREE from 'three';
import {M} from './three-utils.js';

/* Stylised low-poly people (seen mostly from behind) and the guest roster. */
export function makeFigure(cfg){
  const g=new THREE.Group();
  const skin=M(cfg.skin,{roughness:.6,envMapIntensity:.25});
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.56,18),M(cfg.shirt,{roughness:.75}));torso.position.y=1.03;g.add(torso);
  const head=new THREE.Group();head.position.y=1.5;g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(.125,20,16),skin));
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.137,20,16),M(cfg.hair,{roughness:.55}));hair.scale.set(1,.92,1);hair.position.set(0,.02,.025);head.add(hair);
  if(cfg.long){const l=new THREE.Mesh(new THREE.CylinderGeometry(.125,.1,.32,14),M(cfg.hair,{roughness:.55}));l.position.set(0,-.12,.065);head.add(l);}
  if(cfg.hat){const h=new THREE.Mesh(new THREE.CylinderGeometry(.15,.13,.05,18),M(cfg.hat,{roughness:.8}));h.position.set(.02,.12,0);h.rotation.z=.12;head.add(h);}
  g.userData={torso,head};
  return g;
}
export const GUEST_CFG=[
  {name:'민지',x:-3.7,shirt:0xe8452c,pants:0x221a2c,skin:0xe5b99a,hair:0x1a1015,long:true},
  {name:'도현',x:-1.5,shirt:0x1fa59a,pants:0x2a2230,skin:0xd9a885,hair:0x2a1a10,hat:0xf6e7c9},
  {name:'서윤',x:1.5,shirt:0xe3a72f,pants:0x1c1a28,skin:0xf0c8aa,hair:0xd9526f,long:true},
  {name:'지호',x:2.6,shirt:0x9b7fe0,pants:0x241c2a,skin:0xc99372,hair:0x120c10}
];
