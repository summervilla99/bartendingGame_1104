import {VESSEL_CAP} from './data.js';
import * as THREE from 'three';
import {clamp,lerp,rand} from './util.js';
import {M,lathe} from './three-utils.js';

/* Glassware (lathe-built shells + liquid that rebuilds to a fill level), ice and garnishes. */
export const GL={
  mixing:{outer:[[0,0],[.07,0],[.078,.012],[.088,.3],[.092,.32]],inner:[[0,.014],[.068,.014],[.078,.03],[.086,.3]],cap:VESSEL_CAP.mixing},
  rocks:{outer:[[0,0],[.048,0],[.054,.012],[.064,.14],[.067,.145]],inner:[[0,.03],[.046,.03],[.058,.045],[.063,.14]],cap:VESSEL_CAP.rocks,ice:3},
  collins:{outer:[[0,0],[.034,0],[.037,.012],[.039,.29],[.0405,.298]],inner:[[0,.022],[.032,.022],[.0355,.04],[.0375,.292]],cap:VESSEL_CAP.collins,ice:5},
  mug:{outer:[[0,0],[.05,0],[.054,.01],[.064,.14],[.066,.148]],inner:[[0,.02],[.048,.02],[.058,.035],[.0625,.14]],cap:VESSEL_CAP.mug,ice:5,opaque:true,handle:true},
  martini:{outer:[[0,0],[.06,0],[.062,.008],[.012,.02],[.01,.1],[.012,.108],[.095,.205],[.1,.21]],inner:[[0,.118],[.02,.12],[.092,.2]],cap:VESSEL_CAP.martini},
  tumbler:{outer:[[0,0],[.056,0],[.062,.012],[.074,.125],[.077,.13]],inner:[[0,.032],[.052,.032],[.062,.046],[.071,.125]],cap:VESSEL_CAP.tumbler,bigIce:true},
  fashioned:{outer:[[0,0],[.05,0],[.056,.012],[.066,.12],[.068,.125]],inner:[[0,.034],[.046,.034],[.054,.048],[.0605,.12]],cap:VESSEL_CAP.fashioned,bigIce:true,seg:10},
  margarita:{outer:[[0,0],[.065,0],[.067,.01],[.02,.024],[.012,.1],[.014,.112],[.05,.128],[.056,.15],[.046,.166],[.078,.19],[.094,.214],[.097,.222]],
    inner:[[0,.122],[.03,.126],[.05,.14],[.044,.16],[.078,.188],[.092,.212]],cap:VESSEL_CAP.margarita,salt:true},
  nick:{outer:[[0,0],[.045,0],[.048,.008],[.012,.02],[.01,.07],[.012,.082],[.04,.098],[.062,.122],[.066,.146],[.063,.17],[.058,.18]],
    inner:[[0,.094],[.03,.099],[.054,.115],[.062,.14],[.06,.168],[.0565,.178]],cap:VESSEL_CAP.nick},
  highball:{outer:[[0,0],[.036,0],[.04,.012],[.047,.25],[.049,.255]],inner:[[0,.02],[.034,.02],[.043,.04],[.046,.25]],cap:VESSEL_CAP.highball,ice:5},
  coupe:{outer:[[0,0],[.075,0],[.078,.01],[.02,.026],[.012,.1],[.014,.115],[.04,.14],[.075,.17],[.095,.205],[.098,.215]],inner:[[0,.128],[.03,.133],[.065,.16],[.088,.195],[.094,.212]],cap:VESSEL_CAP.coupe}
};
const glassMat=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.14,roughness:.04,metalness:.2,envMapIntensity:2.2,side:THREE.DoubleSide,depthWrite:false});
const iceMat=new THREE.MeshStandardMaterial({color:0xe8f6ff,transparent:true,opacity:.55,roughness:.05,envMapIntensity:2});
const iceGeo=new THREE.BoxGeometry(.04,.04,.04),bigIceGeo=new THREE.BoxGeometry(.058,.058,.058);
const facetMat=glassMat.clone();facetMat.flatShading=true;facetMat.opacity=.22;
const saltMat=M(0xf4f0e6,{roughness:.95,envMapIntensity:.2});
const copperMat=new THREE.MeshStandardMaterial({color:0xb86a3c,metalness:1,roughness:.32,envMapIntensity:1.5,emissive:0x1a0c06,side:THREE.DoubleSide});
const steelMat=new THREE.MeshStandardMaterial({color:0xaab2bc,metalness:1,roughness:.4,envMapIntensity:1.1,emissive:0x20262c,side:THREE.DoubleSide});
/* Boston-style steel tin (scene scale = real x TK). Shake drinks are poured into this open tin, then a second tin is sealed on top. */
const TK=1.5,TIN_OUTER=[[0,0],[.034,0],[.037,.008],[.05,.15],[.052,.16]].map(p=>[p[0]*TK,p[1]*TK]);
GL.tin={outer:TIN_OUTER,inner:[[0,.012*TK],[.032*TK,.012*TK],[.0485*TK,.15*TK]],cap:VESSEL_CAP.tin,opaque:true,steel:true};
export function makeGlass(kind){
  const def=GL[kind],g=new THREE.Group();
  const metal=def.steel?steelMat:copperMat;
  const shell=new THREE.Mesh(lathe(def.outer,def.seg||40),def.opaque?metal:(def.seg?facetMat:glassMat));shell.renderOrder=3;
  if(def.handle){const h=new THREE.Mesh(new THREE.TorusGeometry(.036,.0075,8,18,Math.PI),copperMat);h.rotation.z=-Math.PI/2;h.position.set(.061,.078,0);g.add(h);}
  const liquid=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.9,roughness:.08,envMapIntensity:1.4}));
  liquid.castShadow=true;liquid.renderOrder=2;liquid.visible=false;
  const rimY=def.outer[def.outer.length-1][1],rimR=def.outer[def.outer.length-1][0];
  const rim=new THREE.Mesh(new THREE.TorusGeometry(rimR,.0035,8,44),def.opaque?metal:M(0xffffff,{roughness:.1,emissive:0x443a30,envMapIntensity:2}));
  rim.rotation.x=Math.PI/2;rim.position.y=rimY;
  const iceG=new THREE.Group();
  g.add(liquid,shell,rim,iceG);
  if(def.salt){const sr=new THREE.Mesh(new THREE.TorusGeometry(rimR,.0075,6,40),saltMat);sr.rotation.x=Math.PI/2;sr.position.y=rimY;g.add(sr);}
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
      if(def.bigIce&&n>1)n=1;
      this.ice=n;while(iceG.children.length)iceG.remove(iceG.children[0]);
      for(let i=0;i<n;i++){const m=new THREE.Mesh(def.bigIce?bigIceGeo:iceGeo,iceMat);m.userData.s=Math.random();m.rotation.set(rand(0,3),rand(0,3),rand(0,3));iceG.add(m);}
      this.placeIce();
    },
    placeIce(){
      const n=iceG.children.length;if(!n)return;
      iceG.children.forEach((m,i)=>{
        const y=clamp(this.level-(def.bigIce?.006:.02)-(i%3)*.012,y0+.025,y1);
        const r=def.bigIce?0:rAt(y)*.55,a=i/n*Math.PI*2+m.userData.s;
        m.position.set(Math.cos(a)*r*(i%2?.9:.4),y,Math.sin(a)*r*(i%2?.9:.4));
        m.visible=this.ml>1;
      });
    }
  };
  return obj;
}

/* Tin-on-tin shaker: the pour tin with a smaller tin sealed upside-down on top. The cap hides while pouring out.
   Same silhouette as GL.tin so swapping from the pour vessel to the sealed shaker looks like closing the lid. */
export function makeShaker(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(lathe(TIN_OUTER,40),steelMat);
  const capPts=[[.0505,.13],[.0502,.16],[.043,.215],[.036,.255],[.034,.262],[0,.262]].map(p=>[p[0]*TK,p[1]*TK]);
  const cap=new THREE.Mesh(lathe(capPts,40),steelMat);
  const seam=new THREE.Mesh(new THREE.TorusGeometry(.0525*TK,.0035*TK,8,40),steelMat);seam.rotation.x=Math.PI/2;seam.position.y=.158*TK;cap.add(seam);
  g.add(body,cap);
  shadowsOn(g);
  return {group:g,cap,rimY:.16*TK,rimR:.052*TK};
}
function shadowsOn(o){o.traverse(m=>{if(m.isMesh)m.castShadow=true;});}

export function makeGarnish(kind){
  const g=new THREE.Group();
  if(kind==='orange'){
    const m=new THREE.Mesh(new THREE.TorusGeometry(.032,.0065,6,18,Math.PI*1.45),M(0xff8a1f,{roughness:.5,emissive:0x4a1a00,envMapIntensity:.6}));
    m.rotation.set(.4,0,.6);g.add(m);
  }else if(kind==='lime'){
    const d=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,.008,26),M(0xa9df4f,{roughness:.5,emissive:0x1d3a08}));
    const r=new THREE.Mesh(new THREE.TorusGeometry(.042,.005,6,26),M(0x3a8a2a,{roughness:.5}));r.rotation.x=Math.PI/2;
    d.add(r);g.add(d);g.rotation.z=.55;
  }else if(kind==='lemon'){
    const d=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,.008,26),M(0xf3da4a,{roughness:.5,emissive:0x3a3008}));
    const r=new THREE.Mesh(new THREE.TorusGeometry(.042,.005,6,26),M(0xd9b81a,{roughness:.5}));r.rotation.x=Math.PI/2;
    d.add(r);g.add(d);g.rotation.z=.55;
  }else if(kind==='mint'){
    const lm=M(0x2f8a3a,{roughness:.55,emissive:0x0c2a10,side:THREE.DoubleSide});
    [[0,0,.5],[.02,.012,-.4],[-.015,.024,.1]].forEach(([x,y,r])=>{const l=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),lm);l.scale.set(1,.12,.62);l.position.set(x,y,0);l.rotation.set(.3,r,.4);g.add(l);});
  }else if(kind==='cherry'){
    const c=new THREE.Mesh(new THREE.SphereGeometry(.022,16,12),M(0xb0102a,{roughness:.18,emissive:0x34000a,envMapIntensity:1.2}));
    const s=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.07,6),M(0x3a2a14));s.position.set(.012,.04,0);s.rotation.z=-.3;
    g.add(c,s);
  }
  return g;
}
