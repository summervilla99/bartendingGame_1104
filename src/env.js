import * as THREE from 'three';
import {hdr} from './three-utils.js';

/* Fake studio environment map so glass, brass and liquid catch pink/teal/amber highlights. */
export function buildEnv(renderer,scene){
  const es=new THREE.Scene();es.background=new THREE.Color(0x140918);
  const add=(w,h,col,k,x,y,z,rx,ry)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:hdr(col,k),side:THREE.DoubleSide}));
    m.position.set(x,y,z);m.rotation.set(rx,ry,0);es.add(m);
  };
  add(9,3,0xffb066,4,0,6,0,Math.PI/2,0);
  add(1.4,6,0xff3d8e,5,-7,2,-1,0,Math.PI/2);
  add(1.4,6,0x2ee6c4,4,7,2,-1,0,-Math.PI/2);
  add(6,2,0xffd9a0,3,0,2.5,-7,0,0);
  add(3,1.2,0xffffff,2,0,2,8,0,Math.PI);
  const pm=new THREE.PMREMGenerator(renderer);
  const rt=pm.fromScene(es,0.03);
  scene.environment=rt.texture;
  pm.dispose();
}
