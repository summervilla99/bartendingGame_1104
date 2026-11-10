import * as THREE from 'three';
import {canvasTex} from './three-utils.js';

/* The world outside the big windows: a snowy Myeongdong seen from a high floor (about the 8th), in real 3D so it has parallax and depth.
   The bar's floor is y=0 and the street is 24 m below. +z is outward from the front wall (z=12).
   Left window (world x>0): Myeongdong Cathedral on its hill with low neon rooftops in front. Right window (x<0): towers fading into the haze, Jongno-style.
   Everything is MeshBasicMaterial with fog off (the bar's fog would swallow it); distance haze is a few transparent gradient planes. */
const G=-24;                                                   // street level
let sd=977;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
const rr=(a,b)=>a+rnd()*(b-a);

function winTex(hue){                                          // a tile = 4 columns x 8 rows of windows (12 m x 28 m)
  const t=canvasTex(128,256,(g,w,h)=>{
    g.fillStyle='#0c0e18';g.fillRect(0,0,w,h);
    for(let r=0;r<8;r++)for(let c=0;c<4;c++){
      const x=c*32+6,y=r*32+7;
      if(rnd()<.34){const k=rnd();g.fillStyle=hue==='warm'?'rgba(255,'+(190+k*40|0)+','+(120+k*50|0)+','+(.55+k*.4)+')':'rgba('+(200+k*40|0)+','+(215+k*30|0)+',255,'+(.5+k*.4)+')';}
      else g.fillStyle='rgba(30,36,56,.9)';
      g.fillRect(x,y,20,17);
    }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
function brickTex(){
  const t=canvasTex(128,128,(g,w,h)=>{
    g.fillStyle='#7a3d2c';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=8)for(let x=((y/8)%2)*8;x<w;x+=16){g.fillStyle='rgba('+(110+rnd()*40|0)+','+(52+rnd()*22|0)+','+(36+rnd()*16|0)+',1)';g.fillRect(x+1,y+1,14,6);}
    g.fillStyle='rgba(30,16,12,.5)';for(let y=0;y<h;y+=8)g.fillRect(0,y,w,1);
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
const glowT=canvasTex(128,128,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
function textTex(txt,color){
  return canvasTex(256,96,(g,w,h)=>{
    g.fillStyle='#0a0810';g.fillRect(0,0,w,h);
    g.shadowColor=color;g.shadowBlur=18;g.fillStyle=color;g.font='700 54px "Black Han Sans","Noto Sans KR",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,w/2,h/2+3);
    g.strokeStyle=color;g.lineWidth=4;g.strokeRect(5,5,w-10,h-10);
  });
}

export function makeOutside(){
  const group=new THREE.Group();group.name='outside';
  const mats=[];                                              // {mat, night:[r,g,b], dusk:[r,g,b]} tinted per hour
  const tint=(m,night,dusk)=>{mats.push({m,night:new THREE.Color(night),dusk:new THREE.Color(dusk)});m.color.set(night);return m;};
  const basic=(o)=>new THREE.MeshBasicMaterial(Object.assign({fog:false},o));
  const wtex={cool:winTex('cool'),warm:winTex('warm')},brick=brickTex();
  const snowMat=tint(basic({color:0xdfe6f5}),0xc9d2ea,0xf4d8c0);

  /* a box whose texture repeats by its real size (UVs are scaled per face) */
  const scaleUV=(geo,w,h,d,tw,th)=>{
    const uv=geo.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*dims[f][0]/tw,uv.getY(k)*dims[f][1]/th);}
    uv.needsUpdate=true;
  };
  const sideShade=[[.8,.8,.8],[.55,.55,.62]];
  function building(x,z,w,h,d,o){
    o=o||{};
    const geo=new THREE.BoxGeometry(w,h,d);scaleUV(geo,w,h,d,o.tw||12,o.th||28);
    const map=o.map||wtex[o.hue||'cool'];
    const fade=Math.max(.3,1-z/620);       // far towers get dimmer (aerial perspective)
    const mk=(shade,n,du)=>tint(basic({map,color:0xffffff}),new THREE.Color(n).multiplyScalar(shade*fade),new THREE.Color(du).multiplyScalar(shade*fade));
    const lit=mk(1,0xffffff,0x6a5a60),side=mk(.6,0xffffff,0x4a3e46);
    const m=new THREE.Mesh(geo,[side,side,snowMat,snowMat,lit,side]);
    m.position.set(x,G+h/2,z);group.add(m);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.5,d+.4),snowMat);cap.position.set(x,G+h+.1,z);group.add(cap);    // snow on the roof
    return m;
  }
  function sign(x,y,z,w,h,txt,color,ry){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),basic({map:textTex(txt,color),side:THREE.DoubleSide}));
    m.position.set(x,y,z);m.rotation.y=ry||0;group.add(m);
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(w*2.2,h*2.6),basic({map:glowT,color,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));
    gl.position.set(x,y,z-.2);gl.rotation.y=ry||0;group.add(gl);
  }

  /* ground: dark snowy blocks and avenues */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1400,1000),tint(basic({color:0x111119}),0x14141f,0x4a3c40));ground.rotation.x=-Math.PI/2;ground.position.set(0,G-.05,300);group.add(ground);

  /* ── left window: Myeongdong Cathedral (x ~ 18, z ~ 82), facade turned toward the bar ── */
  const cx=18,cz=82;
  const brickMat=(shade)=>{const mp=brick.clone();mp.needsUpdate=true;mp.repeat.set(1,1);return tint(basic({map:mp}),new THREE.Color(0xd8a890).multiplyScalar(shade),new THREE.Color(0x8a6a60).multiplyScalar(shade));};
  const slate=tint(basic({color:0x3c4358}),0x49506a,0x2e2a38);
  const stone=tint(basic({color:0xb8aa98}),0xe0c8a8,0x7a6a5a);
  const hill=new THREE.Mesh(new THREE.CylinderGeometry(34,58,15,24),tint(basic({color:0x1a1620}),0x20192a,0x4a3844));hill.position.set(cx,G+7,cz+4);group.add(hill);
  const hillTop=new THREE.Mesh(new THREE.CylinderGeometry(33.5,34,.6,24),snowMat);hillTop.position.set(cx,G+14.4,cz+4);group.add(hillTop);
  const base=G+14.5;                                           // the cathedral's ground
  const bx=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(cx+x,base+y,cz+z);group.add(m);return m;};
  const brickFront=brickMat(1),brickSide=brickMat(.62);
  const brickBox=(w,h,d,x,y,z)=>{const g=new THREE.BoxGeometry(w,h,d);scaleUV(g,w,h,d,6,6);const m=new THREE.Mesh(g,[brickSide,brickSide,slate,slate,brickFront,brickSide]);m.position.set(cx+x,base+y,cz+z);group.add(m);return m;};
  brickBox(19,17,46,0,8.5,23);                                  // the long nave
  const gable=new THREE.Shape();gable.moveTo(-10.2,0);gable.lineTo(10.2,0);gable.lineTo(0,9.5);gable.closePath();
  const roofGeo=new THREE.ExtrudeGeometry(gable,{depth:47,bevelEnabled:false});
  const roofM=new THREE.Mesh(roofGeo,[slate,slate]);roofM.position.set(cx,base+17,cz+0.5);group.add(roofM);
  const roofSnow=new THREE.Mesh(new THREE.ExtrudeGeometry(gable,{depth:47.2,bevelEnabled:false}),snowMat);roofSnow.scale.set(.98,.06,1);roofSnow.position.set(cx,base+26.2,cz+.4);group.add(roofSnow);
  /* facade: portals, rose window, buttresses */
  const front=-1;                                              // the facade is the -z face (toward the bar)
  const archShape=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.quadraticCurveTo(w/2,h,0,h+w*.35);s.quadraticCurveTo(-w/2,h,-w/2,h-w/2);s.closePath();return new THREE.ShapeGeometry(s);};
  const glowAmber=tint(basic({color:0xffc070,side:THREE.DoubleSide}),0xffc070,0x8a6a40);
  const lancet=(x,y,z,w,h,mat)=>{const m=new THREE.Mesh(archShape(w,h),mat||glowAmber);m.position.set(cx+x,base+y,cz+z+front*.15);m.rotation.y=Math.PI;group.add(m);return m;};
  [-6,0,6].forEach((x,i)=>lancet(x,.2,0,i===1?3.6:2.6,i===1?7:5.2));    // three portals
  const rose=new THREE.Mesh(new THREE.CircleGeometry(2.4,28),tint(basic({color:0xffd9a0}),0xffd9a0,0x6a5a48));rose.position.set(cx,base+19.5,cz-.2);rose.rotation.y=Math.PI;group.add(rose);
  [-6,-3,3,6].forEach(x=>{lancet(x,9,0,1.5,6);lancet(x,15.5,0,1.2,4);});
  [-9.6,-4.8,4.8,9.6].forEach(x=>brickBox(1.2,19,1.6,x,9.5,-1.6));    // buttresses
  /* towers: the tall central spire flanked by two smaller ones */
  const tower=(x,w,tw,spireH,lit)=>{
    brickBox(w,tw,w,x,tw/2,2);
    bx(w+1,.8,w+1,stone,x,tw,2);                                // belfry band
    for(const s of [-1,1])for(let k=0;k<2;k++){const wnd=lancet(x+s*w*.18,tw-5-k*6,2-w/2-.2+.2,w*.2,4.2,glowAmber);void wnd;}
    const cone=new THREE.Mesh(new THREE.ConeGeometry(w*.78,spireH,4,1),slate);cone.rotation.y=Math.PI/4;cone.position.set(cx+x,base+tw+.8+spireH/2,cz+2);group.add(cone);
    const snow=new THREE.Mesh(new THREE.ConeGeometry(w*.4,spireH*.55,4,1),snowMat);snow.rotation.y=Math.PI/4;snow.position.set(cx+x,base+tw+.8+spireH*.78,cz+2.02);group.add(snow);
    const cm=tint(basic({color:0xffe6b0}),0xffe6b0,0xaa9a78);
    const cv=new THREE.Mesh(new THREE.BoxGeometry(.35,3.2,.35),cm);cv.position.set(cx+x,base+tw+.8+spireH+1.2,cz+2);group.add(cv);
    const ch=new THREE.Mesh(new THREE.BoxGeometry(1.7,.35,.35),cm);ch.position.set(cx+x,base+tw+.8+spireH+1.7,cz+2);group.add(ch);
    return lit;
  };
  tower(0,7.5,28,19);                                          // central tower (cross reaches ~ base+52)
  tower(-9.2,5.4,17,10);
  tower(9.2,5.4,17,10);
  /* floodlights on the facade */
  [-9,-3,3,9].forEach(x=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(22,28),basic({map:glowT,color:0xffa860,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false}));f.position.set(cx+x,base+9,cz-3);f.rotation.y=Math.PI;group.add(f);});
  /* steps and the front plaza */
  for(let i=0;i<5;i++)bx(18-i*1.2,.5,2,snowMat,0,i*.5+.1,-3.2-(4-i)*1.6);

  /* ── near field: low Myeongdong shop buildings with neon rooftops (tops below the bar's eye level) ── */
  const near=[[2,24,14,16,12,'warm'],[18,24,12,13,14,'warm'],[-12,28,16,19,13,'cool'],[34,22,12,11,10,'warm'],[56,34,16,17,16,'cool'],[14,40,18,22,14,'cool'],[-26,34,14,15,12,'warm'],[-40,48,20,24,16,'cool']];
  near.forEach(([x,z,w,h,d,hue])=>building(x,z,w,h,d,{hue,tw:9,th:21}));
  sign(4,G+16.5+3,22.7,7,2.6,'명동','#ff4d8a',0);
  sign(19,G+13.8+3,22.7,6,2.4,'CAFE','#ffb347',0);
  sign(-11,G+19.8+3,26.7,6.4,2.4,'약국','#5ee6a8',0);
  sign(35,G+11.8+3,20.7,5.4,2.2,'호텔','#7ab8ff',0);
  sign(-25,G+15.8+3,32.7,6,2.2,'노래방','#d27aff',0);
  sign(55,G+17.8+3,32,6.4,2.4,'화장품','#ff6fb5',0);
  /* ── right window: towers receding into the haze ── */
  const rows=[[170,250,-6,-170,26,80],[300,400,-20,-260,50,125],[460,600,-40,-340,60,170]];
  rows.forEach(([z0,z1,xa,xb,hmin,hmax])=>{
    for(let x=xa-8;x>xb;x-=rr(14,34)){
      const w=rr(12,30),h=rr(hmin,hmax),z=rr(z0,z1),d=rr(14,30);
      building(x,z,w,h,d,{hue:rnd()<.45?'warm':'cool',tw:rr(8,11),th:20});
    }
  });
  [[-60,300,22,120],[-130,420,30,180],[-200,560,40,260]].forEach(([x,z,w,h])=>building(x,z,w,h,w,{hue:'cool',tw:10,th:24}));   // a few tall towers
  for(let x=150;x>36;x-=rr(18,32)){const z=rr(150,320),w=rr(14,26),h=rr(26,70);building(x,z,w,h,rr(16,26),{hue:'cool',tw:12,th:28});}   // skyline behind the cathedral
  /* Namsan and its tower, far away */
  const namsan=new THREE.Mesh(new THREE.ConeGeometry(180,70,20),tint(basic({color:0x0c0e18}),0x13162a,0x6a4a50));namsan.scale.set(1.6,1,.5);namsan.position.set(-130,G+20,760);group.add(namsan);
  const tw=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.6,48,8),tint(basic({color:0x1a1c2c}),0x1a1c2c,0x5a4048));tw.position.set(-130,G+95,760);group.add(tw);
  const pod=new THREE.Mesh(new THREE.CylinderGeometry(5,5,3.5,12),tint(basic({color:0xffe9c4}),0xffe9c4,0x9a8a74));pod.position.set(-130,G+110,760);group.add(pod);
  const tip=new THREE.Mesh(new THREE.CylinderGeometry(.18,.5,22,6),tint(basic({color:0xff5a4a}),0xff5a4a,0x8a4038));tip.position.set(-130,G+126,760);group.add(tip);

  /* streetlights and traffic: glowing dots along the avenues */
  const dots=[];const addLine=(x0,z0,x1,z1,n,y,col)=>{for(let i=0;i<n;i++){const k=i/(n-1);dots.push(x0+(x1-x0)*k,y,z0+(z1-z0)*k,col[0],col[1],col[2]);}};
  addLine(8,50,8,330,40,G+7,[1,.78,.5]);addLine(-8,50,-8,330,40,G+7,[1,.78,.5]);
  addLine(-6,50,-150,260,50,G+.6,[1,.25,.2]);addLine(6,50,150,260,50,G+.6,[1,.9,.7]);
  addLine(60,60,60,200,20,G+7,[1,.78,.5]);
  const dp=new Float32Array(dots.length/6*3),dc=new Float32Array(dots.length/6*3);
  for(let i=0;i<dots.length/6;i++){dp[i*3]=dots[i*6];dp[i*3+1]=dots[i*6+1];dp[i*3+2]=dots[i*6+2];dc[i*3]=dots[i*6+3];dc[i*3+1]=dots[i*6+4];dc[i*3+2]=dots[i*6+5];}
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));dg.setAttribute('color',new THREE.BufferAttribute(dc,3));
  const dotMat=new THREE.PointsMaterial({size:4,map:glowT,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
  group.add(new THREE.Points(dg,dotMat));

  /* sky dome + haze planes (fade the far layers) */
  const skyCv=document.createElement('canvas');skyCv.width=16;skyCv.height=256;
  const skyTex=new THREE.CanvasTexture(skyCv);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1000,24,16),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,fog:false,depthWrite:false}));sky.position.set(0,0,12);sky.renderOrder=-10;group.add(sky);
  const hazes=[130,260,420,620].map((z,i)=>{
    const c=document.createElement('canvas');c.width=4;c.height=128;const t=new THREE.CanvasTexture(c);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1600,420),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,fog:false,opacity:[.16,.24,.3,.34][i]}));
    m.position.set(0,G+130,z);m.rotation.y=Math.PI;m.renderOrder=3;group.add(m);return {c,t};
  });
  function paintSky(kind){
    const dusk=kind==='golden',g=skyCv.getContext('2d');
    const gr=g.createLinearGradient(0,0,0,256);                  // top of the dome to the bottom
    if(dusk){gr.addColorStop(0,'#2a2a5a');gr.addColorStop(.38,'#8a5070');gr.addColorStop(.47,'#e89a5c');gr.addColorStop(.52,'#f4c88a');gr.addColorStop(.6,'#3a2a30');gr.addColorStop(1,'#1a1214');}
    else{gr.addColorStop(0,'#03050c');gr.addColorStop(.3,'#0a1024');gr.addColorStop(.44,'#2a2644');gr.addColorStop(.49,'#5a405a');gr.addColorStop(.52,'#6a4a52');gr.addColorStop(.6,'#1a1420');gr.addColorStop(1,'#0e0a12');}
    g.fillStyle=gr;g.fillRect(0,0,16,256);skyTex.needsUpdate=true;
    hazes.forEach((h,i)=>{
      const hg=h.c.getContext('2d'),hr=hg.createLinearGradient(0,0,0,128);
      const col=dusk?'255,170,110':'110,80,120';
      hr.addColorStop(0,'rgba('+col+',0)');hr.addColorStop(.55,'rgba('+col+','+(dusk?.55:.5)+')');hr.addColorStop(1,'rgba('+col+','+(dusk?.8:.7)+')');
      hg.clearRect(0,0,4,128);hg.fillStyle=hr;hg.fillRect(0,0,4,128);h.t.needsUpdate=true;
    });
  }
  function setSky(kind){
    const dusk=kind==='golden';
    mats.forEach(o=>o.m.color.copy(dusk?o.dusk:o.night));
    dotMat.opacity=dusk?.35:.9;
    paintSky(kind);
  }
  /* 3D snow outside: flakes at many depths drifting down */
  const N=900,sp=new Float32Array(N*3),sv=[];
  for(let i=0;i<N;i++){sp[i*3]=rr(-60,70);sp[i*3+1]=rr(-20,40);sp[i*3+2]=rr(13,80);sv.push(rr(1.6,3.4),rr(0,6.28));}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const sm=new THREE.PointsMaterial({size:.55,map:glowT,color:0xffffff,transparent:true,opacity:.85,depthWrite:false,fog:false,sizeAttenuation:true});
  group.add(new THREE.Points(sg,sm));
  function update(dt,t){
    for(let i=0;i<N;i++){
      sp[i*3+1]-=sv[i*2]*dt;sp[i*3]+=Math.sin(t*.5+sv[i*2+1])*.8*dt;
      if(sp[i*3+1]<-22){sp[i*3+1]=40;sp[i*3]=rr(-60,70);}
    }
    sg.attributes.position.needsUpdate=true;
  }
  setSky('night');
  return {group,setSky,update};
}
