import * as THREE from 'three';
import {canvasTex,M} from './three-utils.js';

/* Shows one still from story/stills.js: builds the temporary characters and props, hides the real guests if asked, and returns the camera. */
export function createStillStage({scene,STILLS,CHARS,anchorOf,makeCharacter,poseSit,reachArm,setFace,makeProp,hideOthers}){
  let group=null,curId=null;
  const rel=(at,p)=>{const a=anchorOf(at),c=Math.cos(a.yaw),s=Math.sin(a.yaw);return new THREE.Vector3(a.x+p[0]*c+p[2]*s,(a.y||0)+p[1],a.z-p[0]*s+p[2]*c);};
  function paper(){
    const tx=canvasTex(128,96,(g,w,h)=>{g.fillStyle='#f2e8d2';g.fillRect(0,0,w,h);g.fillStyle='#6b5a44';for(let i=0;i<9;i++)g.fillRect(12,14+i*8,i%4===3?60:104,3);g.fillStyle='#a02a2a';g.beginPath();g.arc(100,78,8,0,7);g.fill();});
    const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.006,.22),M(0xffffff,{map:tx,roughness:.9}));return m;
  }
  function stool(){
    const g=new THREE.Group(),wood=M(0x2a1710,{roughness:.5}),seat=M(0x5e1a17,{roughness:.5});
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.05,20),seat);top.position.y=.46;g.add(top);
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2,l=new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,.44,6),wood);l.position.set(Math.cos(a)*.13,.22,Math.sin(a)*.13);g.add(l);}
    return g;
  }
  function clear(){
    if(group){scene.remove(group);group=null;}
    if(curId){hideOthers(false);curId=null;}
  }
  function show(id){
    const def=STILLS[id];if(!def)return null;
    clear();curId=id;
    group=new THREE.Group();scene.add(group);
    if(def.alone)hideOthers(true);
    (def.props||[]).forEach(p=>{
      const o=p.type==='paper'?paper():p.type==='stool'?stool():makeProp(p.type);if(!o)return;
      const w=rel(p.at,p.pos);o.position.copy(w);o.rotation.y=(anchorOf(p.at).yaw||0)+(p.yaw||0);group.add(o);
    });
    (def.figs||[]).forEach(f=>{
      const fig=makeCharacter(CHARS[f.who].look),a=anchorOf(f.at),w=rel(f.at,f.pos);
      fig.position.copy(w);fig.rotation.y=(a.yaw||0)+(f.yaw||0);
      if(f.pose==='sit')poseSit(fig,.6);
      setFace(fig,f.face||'neutral');
      if(f.head){fig.userData.head.rotation.y=f.head[0]||0;fig.userData.head.rotation.x=f.head[1]||0;}
      group.add(fig);fig.updateMatrixWorld(true);
      const fy=fig.rotation.y,fwd=new THREE.Vector3(Math.sin(fy),0,Math.cos(fy)),side=new THREE.Vector3(Math.cos(fy),0,-Math.sin(fy));
      [0,1].forEach(i=>{
        const sd=i?1:-1;let t=null;
        if(f.arms==='keys')t=w.clone().addScaledVector(fwd,.5).addScaledVector(side,sd*.08).setY(.84);
        else if(f.arms==='face'){const hp=new THREE.Vector3();fig.userData.head.getWorldPosition(hp);t=hp.addScaledVector(fwd,.1).addScaledVector(side,sd*.045).add(new THREE.Vector3(0,-.04,0));}
        else if(f.arms==='lap')t=w.clone().addScaledVector(fwd,.3).addScaledVector(side,sd*.08).add(new THREE.Vector3(0,.88,0));
        if(t)reachArm(fig,i,t,1);
      });
    });
    const c=def.cam,pos=rel(c.at,c.pos),look=rel(c.at,c.look);
    return {pos,look,fov:c.fov||40,off:.04,cap:def.cap,tone:def.tone||''};
  }
  return {show,clear,get id(){return curId;}};
}
