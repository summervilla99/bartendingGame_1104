import * as THREE from 'three';
import {makeCharacter,setFace} from './figures.js';

/* Bust portraits of the story characters, rendered once with a tiny private renderer and kept as data URLs (for the intro and heart cards). */
let renderer=null,scn=null,camera=null;
const cache={};
function setup(){
  if(renderer)return true;
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    renderer.setSize(200,240,false);renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);
    scn=new THREE.Scene();
    scn.add(new THREE.AmbientLight(0xffe8d0,.75));
    const key=new THREE.DirectionalLight(0xffd2a0,1.1);key.position.set(-1.5,2.4,2.5);scn.add(key);
    const rim=new THREE.DirectionalLight(0x7aa0ff,.5);rim.position.set(2,1.5,-2);scn.add(rim);
    camera=new THREE.PerspectiveCamera(24,200/240,.1,20);
    return true;
  }catch(_){renderer=null;return false;}
}
export function portraitOf(key,look,face){
  const k=key+':'+(face||'neutral');
  if(cache[k]!==undefined)return cache[k];
  if(!look||!setup())return (cache[k]=null);
  const fig=makeCharacter(look);fig.rotation.y=0;setFace(fig,face||'neutral');scn.add(fig);fig.updateMatrixWorld(true);
  const hp=new THREE.Vector3();fig.userData.head.getWorldPosition(hp);
  camera.position.set(hp.x+.04,hp.y+.02,hp.z+1.05);camera.lookAt(hp.x,hp.y-.01,hp.z);
  renderer.render(scn,camera);
  let url=null;try{url=renderer.domElement.toDataURL('image/png');}catch(_){}
  scn.remove(fig);
  return (cache[k]=url);
}
