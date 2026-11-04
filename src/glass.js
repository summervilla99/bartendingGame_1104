import * as THREE from 'three';
import {clamp,lerp,rand} from './util.js';
import {M,lathe} from './three-utils.js';

/* Glassware (lathe-built shells + liquid that rebuilds to a fill level), ice and garnishes. */
export const GL={
  mixing:{outer:[[0,0],[.07,0],[.078,.012],[.088,.3],[.092,.32]],inner:[[0,.014],[.068,.014],[.078,.03],[.086,.3]],cap:250},
  rocks:{outer:[[0,0],[.048,0],[.054,.012],[.064,.14],[.067,.145]],inner:[[0,.03],[.046,.03],[.058,.045],[.063,.14]],cap:200},
  highball:{outer:[[0,0],[.036,0],[.04,.012],[.047,.25],[.049,.255]],inner:[[0,.02],[.034,.02],[.043,.04],[.046,.25]],cap:220},
  coupe:{outer:[[0,0],[.075,0],[.078,.01],[.02,.026],[.012,.1],[.014,.115],[.04,.14],[.075,.17],[.095,.205],[.098,.215]],inner:[[0,.128],[.03,.133],[.065,.16],[.088,.195],[.094,.212]],cap:150}
};
const glassMat=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.14,roughness:.04,metalness:.2,envMapIntensity:2.2,side:THREE.DoubleSide,depthWrite:false});
const iceMat=new THREE.MeshStandardMaterial({color:0xe8f6ff,transparent:true,opacity:.55,roughness:.05,envMapIntensity:2});
const iceGeo=new THREE.BoxGeometry(.04,.04,.04);
export function makeGlass(kind){
  const def=GL[kind],g=new THREE.Group();
  const shell=new THREE.Mesh(lathe(def.outer,40),glassMat);shell.renderOrder=3;
  const liquid=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.9,roughness:.08,envMapIntensity:1.4}));
  liquid.castShadow=true;liquid.renderOrder=2;liquid.visible=false;
  const rimY=def.outer[def.outer.length-1][1],rimR=def.outer[def.outer.length-1][0];
  const rim=new THREE.Mesh(new THREE.TorusGeometry(rimR,.0035,8,44),M(0xffffff,{roughness:.1,emissive:0x443a30,envMapIntensity:2}));
  rim.rotation.x=Math.PI/2;rim.position.y=rimY;
  const iceG=new THREE.Group();
  g.add(liquid,shell,rim,iceG);
  const pts=def.inner,y0=pts[0][1],y1=pts[pts.length-1][1];
  const rAt=y=>{for(let i=1;i<pts.length;i++){if(y<=pts[i][1]||i===pts.length-1){const a=pts[i-1],b=pts[i],t=b[1]===a[1]?0:clamp((y-a[1])/(b[1]-a[1]),0,1);return lerp(a[0],b[0],t);}}return pts[pts.length-1][0];};
  const N=48,ys=[],vol=[0];
  for(let i=0;i<=N;i++)ys.push(lerp(y0,y1,i/N));
  for(let i=1;i<=N;i++){const r=rAt((ys[i]+ys[i-1])/2);vol.push(vol[i-1]+Math.PI*r*r*(ys[i]-ys[i-1]));}
  const total=vol[N];
  const obj={group:g,kind,def,ml:0,cap:def.cap,level:y0,rimY,rimR,ice:0,
    topY(){return this.level;},
    setLevel(ml){
      this.ml=ml;const f=clamp(ml/def.cap,0,1);
      if(f<=0.002){liquid.visible=false;this.level=y0;this.placeIce();return;}
      const target=f*total;let k=1;while(k<N&&vol[k]<target)k++;
      const t=(target-vol[k-1])/Math.max(1e-9,vol[k]-vol[k-1]);
      const yl=lerp(ys[k-1],ys[k],clamp(t,0,1));this.level=yl;
      const pp=[[0,y0]];
      for(let i=1;i<pts.length;i++){if(pts[i][1]<yl-1e-4)pp.push(pts[i]);}
      if(pp.length===1)pp.push([pts[1][0],y0]);
      pp.push([rAt(yl),yl]);pp.push([0,yl]);
      liquid.geometry.dispose();liquid.geometry=lathe(pp,32);liquid.visible=true;this.placeIce();
    },
    setColor(rgb){
      if(!rgb)return;const c=new THREE.Color(rgb[0],rgb[1],rgb[2]);
      liquid.material.color.copy(c);liquid.material.emissive.copy(c).multiplyScalar(.2);
    },
    setIce(n){
      this.ice=n;while(iceG.children.length)iceG.remove(iceG.children[0]);
      for(let i=0;i<n;i++){const m=new THREE.Mesh(iceGeo,iceMat);m.userData.s=Math.random();m.rotation.set(rand(0,3),rand(0,3),rand(0,3));iceG.add(m);}
      this.placeIce();
    },
    placeIce(){
      const n=iceG.children.length;if(!n)return;
      iceG.children.forEach((m,i)=>{
        const y=clamp(this.level-.02-(i%3)*.012,y0+.025,y1);
        const r=rAt(y)*.55,a=i/n*Math.PI*2+m.userData.s;
        m.position.set(Math.cos(a)*r*(i%2?.9:.4),y,Math.sin(a)*r*(i%2?.9:.4));
        m.visible=this.ml>1;
      });
    }
  };
  return obj;
}

export function makeGarnish(kind){
  const g=new THREE.Group();
  if(kind==='orange'){
    const m=new THREE.Mesh(new THREE.TorusGeometry(.032,.0065,6,18,Math.PI*1.45),M(0xff8a1f,{roughness:.5,emissive:0x4a1a00,envMapIntensity:.6}));
    m.rotation.set(.4,0,.6);g.add(m);
  }else if(kind==='lime'){
    const d=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,.008,26),M(0xa9df4f,{roughness:.5,emissive:0x1d3a08}));
    const r=new THREE.Mesh(new THREE.TorusGeometry(.042,.005,6,26),M(0x3a8a2a,{roughness:.5}));r.rotation.x=Math.PI/2;
    d.add(r);g.add(d);g.rotation.z=.55;
  }else if(kind==='cherry'){
    const c=new THREE.Mesh(new THREE.SphereGeometry(.022,16,12),M(0xb0102a,{roughness:.18,emissive:0x34000a,envMapIntensity:1.2}));
    const s=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.07,6),M(0x3a2a14));s.position.set(.012,.04,0);s.rotation.z=-.3;
    g.add(c,s);
  }
  return g;
}
