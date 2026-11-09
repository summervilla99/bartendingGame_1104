import * as THREE from 'three';
import {clamp,lerp} from './util.js';
import {poseWalk} from './figures.js';
import {gesture} from './zoom.js';

const RADIUS=.28,WALK=2.1,RUN=3.9,CAM_DIST=2.9,SHOULDER=.42,PIVOT_Y=1.58;

/* Ray vs AABB slab test; returns entry distance or Infinity. */
function rayBox(o,d,b){
  let t0=0,t1=Infinity;
  for(const k of ['x','y','z']){
    if(Math.abs(d[k])<1e-6){if(o[k]<b.min[k]||o[k]>b.max[k])return Infinity;continue;}
    let a=(b.min[k]-o[k])/d[k],c=(b.max[k]-o[k])/d[k];if(a>c){const s=a;a=c;c=s;}
    t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return Infinity;
  }
  return t0;
}

export function createPlayer({fig,colliders,groundAt,canvas,joyEl,ceiling}){
  const pos=new THREE.Vector3(0,0,8.6);
  const vel=new THREE.Vector2();
  const st={camYaw:0,pitch:.26,yaw:Math.PI,ph:0,amt:0,enabled:true,drag:null,locked:false,intent:0,zoom:1};
  const keys=new Set();
  const joy={x:0,y:0,id:null};
  const view={pos:new THREE.Vector3(),look:new THREE.Vector3(),fov:55,off:0};
  const camSmooth=new THREE.Vector3();let camInit=false;
  const bodyCols=colliders.filter(c=>c.min.y<1);

  addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea'))return;keys.add(e.code);});
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>keys.clear());

  canvas.addEventListener('pointerdown',e=>{if(!st.enabled)return;st.drag={x:e.clientX,y:e.clientY,id:e.pointerId};try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
  canvas.addEventListener('pointermove',e=>{
    const d=st.drag;if(!d||d.id!==e.pointerId||!st.enabled||gesture.pinching)return;
    st.camYaw-=(e.clientX-d.x)*.0055;st.pitch=clamp(st.pitch+(e.clientY-d.y)*.004,-.12,.85);d.x=e.clientX;d.y=e.clientY;
  });
  const endDrag=e=>{if(st.drag&&st.drag.id===e.pointerId)st.drag=null;};
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);

  if(joyEl){
    const knob=joyEl.firstElementChild;
    const upd=e=>{const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/45,y=(e.clientY-cy)/45;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joy.x=x;joy.y=y;knob.style.transform='translate('+(x*35)+'px,'+(y*35)+'px)';};
    joyEl.addEventListener('pointerdown',e=>{joy.id=e.pointerId;try{joyEl.setPointerCapture(e.pointerId);}catch(_){}upd(e);});
    joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)upd(e);});
    const rel=e=>{if(e.pointerId!==joy.id)return;joy.id=null;joy.x=joy.y=0;knob.style.transform='';};
    joyEl.addEventListener('pointerup',rel);joyEl.addEventListener('pointercancel',rel);
  }

  function resolve(){
    for(let it=0;it<2;it++)for(const b of bodyCols){
      const cx=clamp(pos.x,b.min.x,b.max.x),cz=clamp(pos.z,b.min.z,b.max.z);
      const dx=pos.x-cx,dz=pos.z-cz,d2=dx*dx+dz*dz;
      if(d2>=RADIUS*RADIUS)continue;
      if(d2>1e-8){const d=Math.sqrt(d2),k=(RADIUS-d)/d;pos.x+=dx*k;pos.z+=dz*k;}
      else{
        const pen=[[pos.x-b.min.x+RADIUS,-1,0],[b.max.x-pos.x+RADIUS,1,0],[pos.z-b.min.z+RADIUS,0,-1],[b.max.z-pos.z+RADIUS,0,1]].sort((a,c)=>a[0]-c[0])[0];
        pos.x+=pen[1]*pen[0];pos.z+=pen[2]*pen[0];
      }
    }
  }

  const tmpO=new THREE.Vector3(),tmpD=new THREE.Vector3(),fwd=new THREE.Vector3(),right=new THREE.Vector3();
  function update(dt,t){
    let ix=0,iz=0;
    if(st.enabled){
      if(keys.has('KeyW')||keys.has('ArrowUp'))iz+=1;
      if(keys.has('KeyS')||keys.has('ArrowDown'))iz-=1;
      if(keys.has('KeyD'))ix+=1;
      if(keys.has('KeyA'))ix-=1;
      if(keys.has('ArrowLeft'))st.camYaw+=dt*1.8;
      if(keys.has('ArrowRight'))st.camYaw-=dt*1.8;
      ix+=joy.x;iz-=joy.y;
    }
    const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il;}
    st.intent=Math.min(1,il);
    fwd.set(-Math.sin(st.camYaw),0,-Math.cos(st.camYaw));right.set(Math.cos(st.camYaw),0,-Math.sin(st.camYaw));
    if(st.locked){vel.set(0,0);st.amt=0;}else{
    const run=keys.has('ShiftLeft')||keys.has('ShiftRight')||Math.hypot(joy.x,joy.y)>.92;
    const sp=(run?RUN:WALK)*Math.min(1,il);
    const tx=(fwd.x*iz+right.x*ix),tz=(fwd.z*iz+right.z*ix),tl=Math.hypot(tx,tz)||1;
    const k=Math.min(1,dt*(il>.01?9:7));
    vel.x=lerp(vel.x,tx/tl*sp,k);vel.y=lerp(vel.y,tz/tl*sp,k);
    pos.x+=vel.x*dt;pos.z+=vel.y*dt;resolve();
    pos.y=lerp(pos.y,groundAt(pos.x,pos.z),Math.min(1,dt*12));
    const speed=vel.length();
    if(speed>.15){let dy=Math.atan2(vel.x,vel.y)-st.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));st.yaw+=dy*Math.min(1,dt*10);}
    st.amt=lerp(st.amt,clamp(speed/WALK,0,1.25),Math.min(1,dt*8));
    st.ph+=dt*(4.6+speed*1.6)*(speed>.05?1:0);
    fig.position.copy(pos);fig.rotation.y=st.yaw;
    poseWalk(fig,st.ph,Math.min(1,st.amt),t);
    }

    /* shoulder camera with wall pull-in */
    const cp=Math.cos(st.pitch);
    tmpD.set(Math.sin(st.camYaw)*cp,Math.sin(st.pitch),Math.cos(st.camYaw)*cp);
    tmpO.set(pos.x,pos.y+PIVOT_Y,pos.z);
    let sh=SHOULDER;
    for(const b of colliders){const h=rayBox(tmpO,right,b);if(h<sh+.15)sh=Math.max(0,h-.15);}
    tmpO.addScaledVector(right,sh);
    let dist=CAM_DIST/(st.zoom||1);
    for(const b of colliders){const h=rayBox(tmpO,tmpD,b);if(h<dist)dist=h;}
    if(tmpD.y>0)dist=Math.min(dist,(ceiling-.15-tmpO.y)/tmpD.y);
    dist=Math.max(.35,dist-.22);
    const want=tmpO.clone().addScaledVector(tmpD,dist);
    if(!camInit){camSmooth.copy(want);camInit=true;}
    const dCur=camSmooth.distanceTo(tmpO);
    if(dist<dCur)camSmooth.copy(want);else camSmooth.lerp(want,Math.min(1,dt*6));
    view.pos.copy(camSmooth);
    view.look.copy(tmpO).addScaledVector(fwd,1.2).add(new THREE.Vector3(0,-.12,0));
    view.fov=55;view.off=0;
  }

  function place(x,z,yaw,camYaw){pos.set(x,groundAt(x,z),z);vel.set(0,0);st.yaw=yaw;st.camYaw=camYaw;st.pitch=.26;camInit=false;}
  return {pos,view,st,update,place,keys};
}
