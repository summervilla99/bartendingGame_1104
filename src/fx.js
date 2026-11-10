import * as THREE from 'three';
import {canvasTex} from './three-utils.js';

/* Small particle bursts (sparks, droplets, confetti, snow glitter) and short flame puffs. Everything is additive and cheap. */
export function createFx(scene){
  const soft=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  const MAX=360,pos=new Float32Array(MAX*3),col=new Float32Array(MAX*3),vel=new Float32Array(MAX*3),life=new Float32Array(MAX),max=new Float32Array(MAX),grav=new Float32Array(MAX),base=new Float32Array(MAX*3);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.045,map:soft,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  pts.frustumCulled=false;pts.renderOrder=9;scene.add(pts);
  let head=0;
  const flameTex=canvasTex(64,96,(g,w,h)=>{const r=g.createRadialGradient(w/2,h*.62,2,w/2,h*.62,h*.5);r.addColorStop(0,'rgba(255,248,200,1)');r.addColorStop(.3,'rgba(255,170,60,.9)');r.addColorStop(.7,'rgba(220,70,20,.35)');r.addColorStop(1,'rgba(200,40,10,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  const flames=[];
  function burst(o){
    const n=o.n||24,c=new THREE.Color(o.color==null?0xffc060:o.color);
    for(let k=0;k<n;k++){
      const i=head;head=(head+1)%MAX;
      const a=Math.random()*Math.PI*2,sp=(o.speed||1.2)*(.4+Math.random()*.6),up=(o.up==null?.6:o.up)*(.5+Math.random());
      pos[i*3]=o.x+(Math.random()-.5)*(o.spread||0);pos[i*3+1]=o.y;pos[i*3+2]=o.z+(Math.random()-.5)*(o.spread||0);
      vel[i*3]=Math.cos(a)*sp;vel[i*3+1]=up;vel[i*3+2]=Math.sin(a)*sp;
      life[i]=max[i]=(o.life||.8)*(.7+Math.random()*.5);grav[i]=o.gravity==null?3:o.gravity;
      const j=o.mix?Math.random():0;base[i*3]=c.r*(1-j*.35);base[i*3+1]=c.g*(1-j*.35);base[i*3+2]=c.b*(1-j*.35);
      if(o.rainbow){const h=new THREE.Color().setHSL(Math.random(),.8,.6);base[i*3]=h.r;base[i*3+1]=h.g;base[i*3+2]=h.b;}
    }
  }
  function flame(x,y,z,dur){
    const m=new THREE.SpriteMaterial({map:flameTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(.001,.001,1);scene.add(s);flames.push({s,t:0,d:dur||.6});
    burst({x,y,z,n:16,color:0xffb040,speed:.5,up:1.2,gravity:2,life:.6,spread:.04});
  }
  function update(dt){
    for(let i=0;i<MAX;i++){
      if(life[i]<=0){col[i*3]=col[i*3+1]=col[i*3+2]=0;continue;}
      life[i]-=dt;const f=Math.max(0,life[i]/max[i]);
      vel[i*3+1]-=grav[i]*dt;pos[i*3]+=vel[i*3]*dt;pos[i*3+1]+=vel[i*3+1]*dt;pos[i*3+2]+=vel[i*3+2]*dt;
      col[i*3]=base[i*3]*f;col[i*3+1]=base[i*3+1]*f;col[i*3+2]=base[i*3+2]*f;
    }
    geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
    for(let k=flames.length-1;k>=0;k--){
      const f=flames[k];f.t+=dt;const u=f.t/f.d;
      if(u>=1){scene.remove(f.s);f.s.material.dispose();flames.splice(k,1);continue;}
      const sc=.2+.3*Math.sin(Math.min(1,u*1.4)*Math.PI);f.s.scale.set(sc*.7,sc*1.2,1);f.s.material.opacity=1-u*u;f.s.position.y+=dt*.18;
    }
  }
  return {burst,flame,update};
}
