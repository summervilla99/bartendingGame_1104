import * as THREE from 'three';
import {hdr} from './three-utils.js';

/* Fake studio environment map: warm amber softboxes, a dim rose strip, a cool window so glass, brass and lacquer read as expensive. */
export function buildEnv(renderer,scene){
  const es=new THREE.Scene();es.background=new THREE.Color(0x120806);
  const add=(w,h,col,k,x,y,z,rx,ry)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:hdr(col,k),side:THREE.DoubleSide}));
    m.position.set(x,y,z);m.rotation.set(rx,ry,0);es.add(m);
  };
  add(9,3,0xffa860,3.2,0,6,0,Math.PI/2,0);
  add(1.4,6,0xc8506a,2.2,-7,2,-1,0,Math.PI/2);
  add(1.4,6,0xffb070,2.6,7,2,-1,0,-Math.PI/2);
  add(6,2,0xffc890,2.6,0,2.5,-7,0,0);
  add(3,1.4,0x8aa0d0,1.4,0,2,8,0,Math.PI);
  const pm=new THREE.PMREMGenerator(renderer);
  const rt=pm.fromScene(es,0.03);
  scene.environment=rt.texture;
  pm.dispose();
}
