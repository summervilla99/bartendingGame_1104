import * as THREE from 'three';
import {M,hdr,canvasTex} from './three-utils.js';

/* Christmas decoration: a lit tree with presents, garlands on the counter and the back bar, a wreath on the door.
   No extra scene lights: the glow is emissive materials and soft sprites only. */
export function buildXmas(scene){
  const root=new THREE.Group();root.visible=false;scene.add(root);
  const green=M(0x1d5f33,{roughness:.85,envMapIntensity:.2}),deep=M(0x14472a,{roughness:.9,envMapIntensity:.15});
  const red=M(0xb3202a,{roughness:.35,envMapIntensity:.7}),gold=M(0xd9a840,{roughness:.25,metalness:1,envMapIntensity:1.2});
  const cream=M(0xf0e4cc,{roughness:.4,envMapIntensity:.6});
  const bulbs=[0xffe2a8,0xff8a55,0xff6f9a,0x9fd8ff].map(c=>new THREE.MeshBasicMaterial({color:hdr(c,1.7)}));
  const softTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  const glow=(size,color,op)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(size,size,1);return s;};
  const add=(m,p)=>{(p||root).add(m);return m;};

  /* tree */
  const tree=new THREE.Group();tree.position.set(-9.0,0,-.95);tree.scale.setScalar(1.05);root.add(tree);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.4,10),M(0x3a2214)),tree).position.y=.2;
  const skirt=add(new THREE.Mesh(new THREE.CylinderGeometry(.62,.66,.05,28),red),tree);skirt.position.y=.03;
  const tiers=[[.78,.95,.35],[.62,.85,.85],[.48,.75,1.3],[.34,.65,1.72]];
  tiers.forEach(([r,h,y],i)=>{const c=add(new THREE.Mesh(new THREE.ConeGeometry(r,h,22),i%2?deep:green),tree);c.position.y=y+h/2-.05;});
  const star=add(new THREE.Mesh(new THREE.OctahedronGeometry(.1,0),new THREE.MeshBasicMaterial({color:hdr(0xffd36a,2)})),tree);star.position.y=2.42;star.scale.set(1,1.25,.45);
  const sg=glow(.9,0xffd070,.55);sg.position.y=2.42;tree.add(sg);
  /* lights spiralling up, baubles hanging on the tips */
  const lampsList=[];
  for(let i=0;i<46;i++){
    const u=i/46,y=.5+u*1.85,r=(.8-u*.72)*.93,a=u*Math.PI*2*5.5;
    const m=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),bulbs[i%4]);m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);tree.add(m);lampsList.push(m);
  }
  const bauMat=[red,gold,cream];
  for(let i=0;i<22;i++){
    const u=(i+.5)/22,y=.55+u*1.6,r=(.8-u*.72)*.88,a=i*2.4;
    const m=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),bauMat[i%3]);m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);tree.add(m);
  }
  const gl=glow(2.6,0xffb060,.16);gl.position.y=1.3;tree.add(gl);
  /* presents */
  [[.62,.0,.22,.2,.17,0xb3202a,0xe8c15a],[.42,.45,.17,.16,.14,0x1d5f33,0xe8c15a],[-.55,.38,.25,.2,.2,0xf0e4cc,0xb3202a],[-.2,.72,.16,.14,.15,0x2a3f7a,0xf0e4cc]].forEach(([x,z,w,h,d,c,rb],i)=>{
    const g=new THREE.Group();g.position.set(x,h/2+.05,z);g.rotation.y=i*.7;tree.add(g);
    add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c,{roughness:.5})),g);
    const rm=M(rb,{roughness:.3,metalness:.5,envMapIntensity:.9});
    add(new THREE.Mesh(new THREE.BoxGeometry(w+.004,h+.004,.02),rm),g);add(new THREE.Mesh(new THREE.BoxGeometry(.02,h+.004,d+.004),rm),g);
    const bow=add(new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),rm),g);bow.position.y=h/2+.01;bow.scale.set(1.4,.7,1);
  });

  /* garlands: tube along a sagging curve with bulbs and berries */
  function swag(x0,y0,x1,y1,z,sag,withLights){
    const pts=[];for(let i=0;i<=12;i++){const u=i/12;pts.push(new THREE.Vector3(x0+(x1-x0)*u,y0+(y1-y0)*u-Math.sin(u*Math.PI)*sag,z));}
    const curve=new THREE.CatmullRomCurve3(pts);
    add(new THREE.Mesh(new THREE.TubeGeometry(curve,30,.03,6,false),deep));
    for(let k=0;k<10;k++){const p=curve.getPoint((k+.5)/10);const b=add(new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),k%2?red:gold));b.position.copy(p).add(new THREE.Vector3(0,-.02,.025));}
    if(withLights)for(let k=0;k<14;k++){const p=curve.getPoint((k+.5)/14);const m=add(new THREE.Mesh(new THREE.SphereGeometry(.012,6,5),bulbs[k%4]));m.position.copy(p).add(new THREE.Vector3(0,.02,.03));lampsList.push(m);}
  }
  for(let i=0;i<8;i++){const x0=-5.9+i*1.475;swag(x0,1.02,x0+1.475,1.02,.72,.13,true);}          // along the counter front
  for(let i=0;i<7;i++){const x0=-5.4+i*1.54;swag(x0,3.98,x0+1.54,3.98,-2.5,.12,true);}           // over the back bar
  /* wreath on the door */
  const wr=new THREE.Group();wr.position.set(0,2.35,11.86);wr.rotation.y=Math.PI;root.add(wr);
  add(new THREE.Mesh(new THREE.TorusGeometry(.28,.07,10,32),green),wr);
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2;const b=add(new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),k%2?red:gold),wr);b.position.set(Math.cos(a)*.28,Math.sin(a)*.28,.065);}
  [-1,1].forEach(s=>{const r=add(new THREE.Mesh(new THREE.BoxGeometry(.18,.06,.02),red),wr);r.position.set(s*.1,-.3,.06);r.rotation.z=s*-.5;});
  add(new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),red),wr).position.set(0,-.28,.07);

  function animate(t){
    if(!root.visible)return;
    bulbs.forEach((m,i)=>{const k=.55+.45*Math.sin(t*2.2+i*1.7);m.color.copy(new THREE.Color([0xffe2a8,0xff8a55,0xff6f9a,0x9fd8ff][i])).multiplyScalar(1.1+k*1.1);});
    star.rotation.y=t*.8;sg.material.opacity=.45+.15*Math.sin(t*3);
  }
  return {root,animate,setOn(on){root.visible=!!on;},tree};
}
