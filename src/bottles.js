import * as THREE from 'three';
import {canvasTex,M} from './three-utils.js';
import {clamp,lerp} from './util.js';

/* Realistic spirit bottles: superellipse lofts (round or rounded-square), glass shell + liquid inside, caps, labels.
   Dimensions are real-world metres; SC scales them up to sit right next to the (oversized) glassware. */
export const SC=1.5;

export function loft(st,N){
  const rows=st.length,pos=[],idx=[],uv=[];
  st.forEach(([y,hw,n,dr],r)=>{
    for(let i=0;i<=N;i++){
      const a=i/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a),e=2/(n||2);
      pos.push(Math.sign(c)*Math.pow(Math.abs(c),e)*hw,y,Math.sign(s)*Math.pow(Math.abs(s),e)*hw*(dr||1));
      uv.push(i/N,r/(rows-1));
    }
  });
  for(let r=0;r<rows-1;r++)for(let i=0;i<N;i++){
    const a=r*(N+1)+i,b=a+1,c=a+N+1,d=c+1;
    idx.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  return g;
}
const close=st=>st.concat([[st[st.length-1][0],0,2]]);
function clipTo(st,y,inset){
  const out=[];
  for(let i=0;i<st.length;i++){
    if(st[i][0]<y)out.push([st[i][0],Math.max(.002,st[i][1]-inset),st[i][2],st[i][3]]);
    else{
      const a=st[i-1],b=st[i],t=clamp((y-a[0])/(b[0]-a[0]),0,1);
      out.push([y,Math.max(.002,lerp(a[1],b[1],t)-inset),lerp(a[2]||2,b[2]||2,t),b[3]]);break;
    }
  }
  return out.concat([[out[out.length-1][0],0,2]]);
}
const hwAt=(st,y)=>{for(let i=1;i<st.length;i++)if(y<=st[i][0]){const a=st[i-1],b=st[i];return lerp(a[1],b[1],clamp((y-a[0])/(b[0]-a[0]||1),0,1));}return st[st.length-1][1];};

/* st: [y, halfWidth, exponent(2=round, 4-6=rounded square)] */
export const SPECS={
  jackSq:{st:[[0,.034,5],[.004,.0375,5],[.145,.0375,5],[.175,.03,4],[.2,.0175,2.5],[.208,.0145,2],[.262,.0145,2]],fill:.215,liq:0xb4601a,
    cap:{k:'cyl',y0:.236,y1:.278,r:.0165,c:0x0c0a0a},label:{y0:.045,y1:.15,w:.062,t:'flat'},lab:{bg:'#0e0b0a',fg:'#f2ecdf',ac:'#c9a066',t:'OLD NO. 7',s:'TENNESSEE WHISKEY'}},
  scotch:{st:[[0,.034,6],[.003,.037,6],[.17,.037,6],[.2,.029,3.5],[.222,.0165,2],[.286,.0155,2]],fill:.23,liq:0xc2801f,
    cap:{k:'cyl',y0:.268,y1:.3,r:.0172,c:0x120e0c},label:{y0:.075,y1:.165,w:.085,t:'diag'},lab:{bg:'#efe6d2',fg:'#2a1410',ac:'#a6241c',t:'SCOTCH',s:'BLENDED WHISKY'},band:{y:.245,c:0xc9a066}},
  makers:{st:[[0,.033,2],[.003,.0365,2],[.16,.0365,2],[.19,.027,2],[.215,.016,2],[.25,.016,2]],fill:.205,liq:0xb8651a,
    cap:{k:'wax',y0:.205,y1:.27,r:.0185,c:0xa5141a},label:{y0:.065,y1:.15,w:2.0,t:'wrap'},lab:{bg:'#efe2c4',fg:'#2a1410',ac:'#a5141a',t:'BOURBON',s:'SMALL BATCH'}},
  tequilaSq:{st:[[0,.04,2],[.004,.046,2],[.09,.048,2],[.115,.042,2],[.138,.021,2],[.15,.0185,2],[.19,.0185,2]],fill:.145,liq:0xece6c4,
    cap:{k:'cork',y0:.182,y1:.214,r:.0205,c:0xc79c62},label:{y0:.045,y1:.095,w:2.2,t:'wrap'},lab:{bg:'#14100e',fg:'#e9dcc0',ac:'#c9a066',t:'TEQUILA',s:'BLANCO'}},
  tequilaTall:{st:[[0,.034,2],[.004,.04,2],[.07,.046,2],[.105,.04,2],[.135,.0165,2],[.145,.0148,2],[.255,.0148,2]],fill:.19,liq:0xd9923c,
    cap:{k:'cyl',y0:.245,y1:.28,r:.0165,c:0x0e0b0a},label:{y0:.04,y1:.1,w:2.1,t:'wrap'},lab:{bg:'#f0e4c8',fg:'#1c120e',ac:'#8a1f1c',t:'AÑEJO',s:'TEQUILA'},band:{y:.243,c:0xc9a066}},
  tequilaRep:{st:[[0,.036,4],[.004,.04,4],[.15,.04,4],[.18,.03,3],[.2,.017,2],[.28,.0155,2]],fill:.215,liq:0xe0a850,
    cap:{k:'cyl',y0:.265,y1:.3,r:.0172,c:0x1a1210},label:{y0:.05,y1:.145,w:.066,t:'flat'},lab:{bg:'#1a1210',fg:'#f2e6c8',ac:'#c9a066',t:'REPOSADO',s:'TEQUILA'},band:{y:.262,c:0xc9a066}},
  ginBlue:{st:[[0,.034,4],[.003,.037,4],[.16,.037,4],[.19,.03,3],[.215,.016,2],[.255,.0145,2]],fill:.215,liq:0xa9c8ea,tint:0x2c62d6,op:.5,
    cap:{k:'cyl',y0:.238,y1:.268,r:.0165,c:0xd0d4d8,metal:1},label:{y0:.06,y1:.125,w:.056,t:'flat'},lab:{bg:'#e6eef8',fg:'#18386e',ac:'#2c62d6',t:'LONDON DRY',s:'GIN'}},
  ginGreen:{st:[[0,.038,3],[.004,.042,3],[.13,.042,3],[.18,.035,2.6],[.2,.018,2],[.255,.0155,2]],fill:.215,liq:0xcfe6d2,tint:0x2e7a3c,op:.45,
    cap:{k:'cyl',y0:.238,y1:.268,r:.0172,c:0x1f5a2c,metal:1},label:{y0:.06,y1:.15,w:2.0,t:'wrap'},lab:{bg:'#efe8d2',fg:'#1b4a26',ac:'#a6241c',t:'DRY GIN',s:'LONDON'}},
  rumDark:{st:[[0,.035,2],[.004,.038,2],[.14,.038,2],[.175,.028,2],[.2,.0175,2],[.27,.0155,2]],fill:.235,liq:0x6a3412,
    cap:{k:'cork',y0:.262,y1:.292,r:.0185,c:0x1c1410},label:{y0:.06,y1:.14,w:2.0,t:'wrap'},lab:{bg:'#e8d9b4',fg:'#2a1410',ac:'#7a3a10',t:'AGED RUM',s:'BARBADOS'}},
  rumWhite:{st:[[0,.036,2],[.004,.039,2],[.15,.039,2],[.18,.029,2],[.205,.0175,2],[.255,.0155,2]],fill:.22,liq:0xeef0ee,
    cap:{k:'cyl',y0:.24,y1:.27,r:.0168,c:0xc9a066,metal:1},label:{y0:.06,y1:.14,w:2.0,t:'wrap'},lab:{bg:'#f2efe6',fg:'#a6241c',ac:'#a6241c',t:'WHITE RUM',s:'SUPERIOR'}},
  vodka:{st:[[0,.036,4],[.004,.04,4],[.16,.04,4],[.2,.03,3],[.23,.016,2],[.265,.0148,2]],fill:.23,liq:0xeaf2f6,tint:0xe8f0f4,op:.42,
    cap:{k:'cyl',y0:.248,y1:.28,r:.0165,c:0xd0d4d8,metal:1},label:{y0:.07,y1:.14,w:.062,t:'flat'},lab:{bg:'#dde8f2',fg:'#143a66',ac:'#5a8ac6',t:'VODKA',s:'PREMIUM'}},
  campari:{st:[[0,.04,2],[.004,.043,2],[.13,.043,2],[.155,.032,2],[.175,.0185,2],[.2,.0185,2]],fill:.19,liq:0xc4102c,
    cap:{k:'cyl',y0:.192,y1:.222,r:.0198,c:0xb00d22},label:{y0:.04,y1:.115,w:2.2,t:'wrap'},lab:{bg:'#e8dfcf',fg:'#a6141c',ac:'#a6141c',t:'BITTER',s:'APERITIVO'}},
  vermouth:{st:[[0,.034,2],[.003,.036,2],[.2,.036,2],[.23,.025,2],[.255,.0155,2],[.29,.0155,2]],fill:.26,liq:0x6e2812,
    cap:{k:'cork',y0:.282,y1:.312,r:.0178,c:0x14100e},label:{y0:.07,y1:.17,w:2.0,t:'wrap'},lab:{bg:'#16110f',fg:'#e8d9b4',ac:'#a6241c',t:'ROSSO',s:'VERMOUTH'}},
  triple:{st:[[0,.036,5],[.004,.04,5],[.12,.04,5],[.16,.028,3],[.18,.0165,2],[.215,.0165,2]],fill:.19,liq:0xf2e4c0,
    cap:{k:'cyl',y0:.208,y1:.238,r:.0178,c:0xe0620e},label:{y0:.04,y1:.115,w:.066,t:'flat'},lab:{bg:'#e8741a',fg:'#fff4e0',ac:'#fff4e0',t:'TRIPLE SEC',s:'ORANGE'}},
  lime:{st:[[0,.03,2],[.003,.033,2],[.14,.033,2],[.165,.024,2],[.185,.015,2],[.21,.015,2]],fill:.15,liq:0xb4d848,
    cap:{k:'cyl',y0:.2,y1:.228,r:.0165,c:0x2f7a2a},label:{y0:.04,y1:.115,w:2.0,t:'wrap'},lab:{bg:'#eaf0d0',fg:'#2a5a1a',ac:'#4a9a2a',t:'LIME',s:'JUICE'}},
  syrup:{st:[[0,.034,2],[.003,.037,2],[.14,.037,2],[.17,.03,2],[.19,.018,2],[.215,.018,2]],fill:.19,liq:0xf0d890,
    cap:{k:'cork',y0:.208,y1:.238,r:.0195,c:0xc79c62},label:{y0:.05,y1:.125,w:2.0,t:'wrap'},lab:{bg:'#f2e6c8',fg:'#5a3a10',ac:'#c9a066',t:'SYRUP',s:'SIMPLE'}},
  bitters:{st:[[0,.028,2],[.003,.031,2],[.1,.031,2],[.115,.02,2],[.125,.0095,2],[.145,.0095,2]],fill:.11,liq:0x5a1a14,
    cap:{k:'cyl',y0:.14,y1:.158,r:.0108,c:0xd9b030},label:{y0:.012,y1:.105,w:3.2,t:'wrap',over:.0028},lab:{bg:'#f0e4c4',fg:'#2a1410',ac:'#a6241c',t:'BITTERS',s:'AROMATIC'}},
  soda:{st:[[0,.03,2],[.003,.032,2],[.17,.032,2],[.2,.026,2],[.235,.0125,2],[.255,.0125,2]],fill:.215,liq:0xdff1f4,
    cap:{k:'cyl',y0:.248,y1:.258,r:.0142,c:0xc4c8cc,metal:1},label:{y0:.06,y1:.15,w:2.0,t:'wrap'},lab:{bg:'#e6f0f6',fg:'#1a4a8a',ac:'#3a7bd5',t:'SODA',s:'WATER'}}
};
/* Recoloured variants of existing shapes (more rail ingredients). */
const V=(b,o)=>{const s=SPECS[b];return Object.assign({},s,o,{cap:Object.assign({},s.cap,o.cap),lab:Object.assign({},s.lab,o.lab)});};
SPECS.aperol=V('campari',{liq:0xe8571a,cap:{c:0xe0620e},lab:{bg:'#f2e2c8',fg:'#c2410c',ac:'#c2410c',t:'APERITIVO',s:'ORANGE BITTER'}});
SPECS.coffee=V('rumDark',{liq:0x1d0f09,cap:{c:0x1c1410},lab:{bg:'#1a1210',fg:'#e8d9b4',ac:'#c9a066',t:'COFFEE',s:'LIQUEUR'}});
SPECS.elder=V('triple',{liq:0xe9e2a2,cap:{c:0xc9a066,metal:1},lab:{bg:'#efe8c8',fg:'#4a5a2a',ac:'#a69a3a',t:'ELDERFLOWER',s:'LIQUEUR'}});
SPECS.lemon=V('lime',{liq:0xf0dc58,cap:{c:0xd9b81a},lab:{bg:'#f6f0c8',fg:'#7a5a0a',ac:'#d9b81a',t:'LEMON',s:'JUICE'}});
SPECS.grapefruit=V('lime',{liq:0xf0a6a0,cap:{c:0xd9546a},lab:{bg:'#f6e2dc',fg:'#a6243a',ac:'#d9546a',t:'GRAPEFRUIT',s:'JUICE'}});
SPECS.cranberry=V('lime',{liq:0xa8142c,cap:{c:0x8a0f24},lab:{bg:'#f2dcdc',fg:'#8a0f24',ac:'#a8142c',t:'CRANBERRY',s:'JUICE'}});
SPECS.ginger=V('soda',{liq:0xd9ac56,cap:{c:0xb8a060,metal:1},lab:{bg:'#f0e0b8',fg:'#5a3a10',ac:'#a8741a',t:'GINGER',s:'BEER'}});
SPECS.rum151=V('rumDark',{liq:0xd9b06a,cap:{c:0xb5261f},lab:{bg:'#f0dcc0',fg:'#7a1410',ac:'#b5261f',t:'151',s:'OVERPROOF RUM'}});
SPECS.cassis=V('triple',{liq:0x2e0b26,cap:{c:0x4a1238,metal:1},lab:{bg:'#ecdce6',fg:'#4a1238',ac:'#5a1a4a',t:'CASSIS',s:'BLACKCURRANT'}});
SPECS.espresso=V('syrup',{liq:0x25120a,cap:{c:0x1c1410},lab:{bg:'#14100e',fg:'#e8d9b4',ac:'#c9a066',t:'ESPRESSO',s:'COLD BREW'}});
SPECS.mezcal=V('tequilaSq',{liq:0xe8dfb8,tint:0x3a4a2a,op:.3,cap:{c:0x8a6a3a},lab:{bg:'#e6dcc0',fg:'#2a1a10',ac:'#6a4a2a',t:'MEZCAL',s:'ESPADIN'}});
SPECS.agave=V('syrup',{liq:0xd6a03c,cap:{c:0xa8742c},lab:{bg:'#f0e0b8',fg:'#6a4a10',ac:'#a8742c',t:'AGAVE',s:'NECTAR'}});
SPECS.blanc=V('vermouth',{liq:0xece2a0,cap:{c:0xc79c62},lab:{bg:'#f0ecd8',fg:'#5a4a1a',ac:'#c9a066',t:'BLANC',s:'VERMOUTH'}});
SPECS.gentian=V('campari',{liq:0xe6cf3a,cap:{c:0x2a2a2a},lab:{bg:'#f2e6a8',fg:'#3a3a10',ac:'#8a7a10',t:'GENTIAN',s:'LIQUEUR'}});
export const BACKBAR=['jackSq','scotch','makers','tequilaSq','tequilaTall','tequilaRep','ginBlue','ginGreen','rumDark','rumWhite','vodka','campari','vermouth','triple','scotch','jackSq','tequilaRep','makers'];

const labTexCache={};
export function labelTex(key){
  if(labTexCache[key])return labTexCache[key];
  const L=SPECS[key].lab;
  return labTexCache[key]=canvasTex(256,128,(g,w,h)=>{
    g.fillStyle=L.bg;g.fillRect(0,0,w,h);
    g.strokeStyle=L.ac;g.lineWidth=3;g.strokeRect(8,8,w-16,h-16);g.lineWidth=1;g.strokeRect(14,14,w-28,h-28);
    g.fillStyle=L.fg;g.textAlign='center';g.textBaseline='middle';
    g.font='bold 40px Georgia,"Times New Roman",serif';g.fillText(L.t,w/2,h/2-6);
    g.font='15px Georgia,serif';g.fillStyle=L.ac;g.fillText(L.s,w/2,h/2+28);
    g.fillStyle=L.ac;g.fillRect(w/2-26,h/2+10,52,2);
  });
}

const cache={};
function parts(key){
  if(cache[key])return cache[key];
  const s=SPECS[key],list=[];
  const add=(geo,mat,x,y,z,ry,rz,role,ro)=>{
    const m=new THREE.Matrix4().compose(new THREE.Vector3(x||0,y||0,z||0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry||0,rz||0)),new THREE.Vector3(1,1,1));
    list.push({geo,mat,m,role:role||'',ro:ro||0});
  };
  const glassM=new THREE.MeshStandardMaterial({color:s.tint||0xffffff,transparent:true,opacity:s.op||.14,roughness:.04,metalness:.15,envMapIntensity:2.4,depthWrite:false});
  const liqM=new THREE.MeshStandardMaterial({color:s.liq,color:new THREE.Color(s.liq).multiplyScalar(.82),emissive:new THREE.Color(s.liq).multiplyScalar(.04),roughness:.14,metalness:.05,envMapIntensity:1});
  add(loft(clipTo(s.st,s.fill,.0026),28),liqM,0,0,0,0,0,'liq',2);
  add(loft(close(s.st),28),glassM,0,0,0,0,0,'shell',3);
  const c=s.cap,cm=c.metal?new THREE.MeshStandardMaterial({color:c.c,metalness:1,roughness:.28,envMapIntensity:1.6}):M(c.c,{roughness:.4,envMapIntensity:.7});
  const h=c.y1-c.y0;
  if(c.k==='wax'){
    add(new THREE.CylinderGeometry(c.r,c.r*1.02,h,18),M(c.c,{roughness:.35,envMapIntensity:.8}),0,c.y0+h/2,0);
    add(new THREE.TorusGeometry(c.r*1.02,.0055,8,22),M(c.c,{roughness:.35}),0,c.y0+.004,0);
    list[list.length-1].m.compose(new THREE.Vector3(0,c.y0+.004,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0)),new THREE.Vector3(1,1,1));
  }else if(c.k==='cork'){
    add(new THREE.CylinderGeometry(c.r*.82,c.r*.8,h*.7,14),M(c.c,{roughness:.8,envMapIntensity:.15}),0,c.y0+h*.35,0);
    add(new THREE.CylinderGeometry(c.r,c.r,h*.3,16),M(c.c===0xc79c62?0x2a1a10:c.c,{roughness:.45,envMapIntensity:.6}),0,c.y0+h*.85,0);
  }else add(new THREE.CylinderGeometry(c.r,c.r,h,18),cm,0,c.y0+h/2,0);
  if(s.band)add(new THREE.CylinderGeometry(c.r*1.02,c.r*1.02,.008,18),new THREE.MeshStandardMaterial({color:s.band.c,metalness:1,roughness:.3,envMapIntensity:1.5}),0,s.band.y,0);
  const lb=s.label,lh=lb.y1-lb.y0,ly=(lb.y0+lb.y1)/2,hw=hwAt(s.st,ly)+(lb.over||0);
  const lm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,envMapIntensity:.15});
  if(lb.t==='wrap')add(new THREE.CylinderGeometry(hw+.0008,hw+.0008,lh,24,1,true,-lb.w*.5,lb.w),lm,0,ly,0,0,0,'label',4);
  else if(lb.t==='flat')add(new THREE.PlaneGeometry(lb.w,lh),lm,0,ly,hw+.0009,0,0,'label',4);
  else{add(new THREE.PlaneGeometry(lb.w,lh),lm,0,ly,hw+.0009,0,0,'label',4);list[list.length-1].m.compose(new THREE.Vector3(0,ly,hw+.0009),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,.42)),new THREE.Vector3(1,1,1));}
  return cache[key]={list,h:c.y1+.004,hw:Math.max(...s.st.map(p=>p[1])),mat:lm};
}

/* Interactive bottle (rail). opts: {flip, scale, labelMap} */
export function makeBottle(key,opts){
  opts=opts||{};
  const p=parts(key),g=new THREE.Group(),inner=new THREE.Group();
  const sc=SC*(opts.scale||1);
  p.list.forEach(it=>{
    let mat=it.mat;
    if(it.role==='label')mat=new THREE.MeshStandardMaterial({map:opts.labelMap||labelTex(key),roughness:.85,envMapIntensity:.15});
    const m=new THREE.Mesh(it.geo,mat);it.m.decompose(m.position,m.quaternion,m.scale);m.renderOrder=it.ro;
    if(it.role==='liq')m.castShadow=true;
    inner.add(m);
  });
  if(opts.flip)inner.rotation.y=Math.PI;
  g.add(inner);g.scale.setScalar(sc);
  g.userData.h=p.h*sc;g.userData.r=p.hw*sc;
  return g;
}

/* Many identical-spec bottles as InstancedMeshes (back bar). placements: [{x,y,z,ry,s}] */
export function instanceBottles(scene,key,placements){
  if(!placements.length)return;
  const p=parts(key),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
  p.list.forEach(it=>{
    const mat=it.role==='label'?new THREE.MeshStandardMaterial({map:labelTex(key),roughness:.85,envMapIntensity:.15}):it.mat;
    const im=new THREE.InstancedMesh(it.geo,mat,placements.length);im.renderOrder=it.ro;
    placements.forEach((pl,i)=>{
      q.setFromEuler(e.set(0,pl.ry||0,0));
      m4.compose(new THREE.Vector3(pl.x,pl.y,pl.z),q,new THREE.Vector3(SC*pl.s,SC*pl.s,SC*pl.s)).multiply(it.m);
      im.setMatrixAt(i,m4);
    });
    im.instanceMatrix.needsUpdate=true;scene.add(im);
  });
}
export const bottleWidth=(key,s)=>parts(key).hw*2*SC*s;
export const bottleHeight=(key,s)=>parts(key).h*SC*s;
