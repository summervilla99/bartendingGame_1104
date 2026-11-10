import * as THREE from 'three';
import {canvasTex,M,shadows,hdr,lathe} from './three-utils.js';
import {rand,pick} from './util.js';
import {BACKBAR,instanceBottles,bottleWidth} from './bottles.js';

/* Walkable lounge: bar counter at z=0 (bartender side is -z), lounge toward the entrance at +z. */
export const COUNTER_TOP=1.15,STOOL_Z=1.25,STOOL_X=[-3.7,-2.6,-1.5,1.5,2.6,3.7];
export const ROOM={x0:-10,x1:10,z0:-3.1,z1:12,h:5.2};
export const BAR_ZONE={x0:-2.8,x1:2.8,z0:-2.3,z1:-.8};
const STAGE={x:6.5,z:8.6,r:2.3,h:.14};

export const brass=M(0x9c7239,{roughness:.36,metalness:1,envMapIntensity:1.15});

const glowTex=canvasTex(128,128,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.35,'rgba(255,255,255,.32)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
function glow(w,h,color,op){return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:glowTex,color,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));}

/* ── procedural textures ── */
function herringbone(){
  const S=512,L=128,Wd=32;
  return canvasTex(S,S,(g)=>{
    g.fillStyle='#120806';g.fillRect(0,0,S,S);
    const tones=['#3c1d12','#46231a','#341910','#4f2818','#3a1c11','#2e150d'];
    const plank=(x,y,w,h,vert)=>{
      for(const ox of [-S,0,S])for(const oy of [-S,0,S]){
        const px=x+ox,py=y+oy;if(px>S||py>S||px+w<0||py+h<0)continue;
        g.fillStyle=plank.c;g.fillRect(px+1,py+1,w-2,h-2);
        g.globalAlpha=.16;g.strokeStyle='#120604';g.lineWidth=1;
        for(let k=0;k<4;k++){g.beginPath();if(vert){const gx=px+4+k*7+plank.r*3;g.moveTo(gx,py+2);g.lineTo(gx+plank.r*2,py+h-2);}else{const gy=py+4+k*7+plank.r*3;g.moveTo(px+2,gy);g.lineTo(px+w-2,gy+plank.r*2);}g.stroke();}
        g.globalAlpha=1;
      }
    };
    for(let a=-24;a<24;a++)for(let b=-3;b<4;b++){
      const x=a*Wd+b*2*L,y=a*Wd;
      plank.c=pick(tones);plank.r=Math.random();plank(x,y,L,Wd,false);
      plank.c=pick(tones);plank.r=Math.random();plank(x,y+Wd,Wd,L,true);
    }
  });
}
function marble(w,h,base,veins){
  return canvasTex(w,h,(g)=>{
    g.fillStyle=base;g.fillRect(0,0,w,h);
    for(let i=0;i<60;i++){g.globalAlpha=.05;g.fillStyle=Math.random()<.5?'#000':'#3a2a24';g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,rand(30,140),rand(10,50),rand(0,3),0,Math.PI*2);g.fill();}
    veins.forEach(([col,n,lw])=>{
      for(let i=0;i<n;i++){
        let x=Math.random()*w,y=Math.random()*h,a=rand(-.6,.6);
        g.globalAlpha=rand(.08,.22);g.strokeStyle=col;g.lineWidth=rand(lw*.4,lw);g.beginPath();g.moveTo(x,y);
        for(let k=0;k<70;k++){a+=rand(-.35,.35);x+=Math.cos(a)*9;y+=Math.sin(a)*5;g.lineTo(x,y);}
        g.stroke();
      }
    });
    g.globalAlpha=1;
  });
}
function damask(){
  return canvasTex(256,256,(g,w,h)=>{
    g.fillStyle='#2f0e0d';g.fillRect(0,0,w,h);
    g.fillStyle='#3b1513';g.strokeStyle='#3b1513';g.lineWidth=2;
    const motif=(cx,cy)=>{
      g.beginPath();g.moveTo(cx,cy-46);g.bezierCurveTo(cx+30,cy-20,cx+26,cy+18,cx,cy+46);g.bezierCurveTo(cx-26,cy+18,cx-30,cy-20,cx,cy-46);g.stroke();
      g.beginPath();g.moveTo(cx,cy-24);g.bezierCurveTo(cx+12,cy-8,cx+10,cy+10,cx,cy+22);g.bezierCurveTo(cx-10,cy+10,cx-12,cy-8,cx,cy-24);g.fill();
      [[-1,1],[1,1]].forEach(([s])=>{g.beginPath();g.arc(cx+s*20,cy-34,4,0,Math.PI*2);g.fill();});
    };
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){motif(i*128,j*128);motif(i*128+64,j*128+64);}
    g.globalAlpha=.05;for(let k=0;k<1800;k++){g.fillStyle=Math.random()<.5?'#000':'#6a3020';g.fillRect(Math.random()*w,Math.random()*h,2,2);}
  });
}
function onyx(){
  return canvasTex(1024,384,(g,w,h)=>{
    const r=g.createRadialGradient(w/2,h*.55,20,w/2,h*.55,w*.62);
    r.addColorStop(0,'#ffcf8a');r.addColorStop(.45,'#d9813e');r.addColorStop(1,'#4a1a0c');
    g.fillStyle=r;g.fillRect(0,0,w,h);
    for(let i=0;i<46;i++){
      g.globalAlpha=rand(.05,.16);g.strokeStyle=Math.random()<.5?'#5a1f0c':'#fff0d0';g.lineWidth=rand(2,14);
      const y0=rand(-40,h+40),amp=rand(10,40),f=rand(.004,.012),ph=rand(0,6);
      g.beginPath();for(let x=0;x<=w;x+=16){const y=y0+Math.sin(x*f+ph)*amp+Math.sin(x*f*2.7)*amp*.3;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
    }
    g.globalAlpha=1;
  });
}
/* Window view: kind = 'golden' (sunset), 'night' or 'rain'. Repainted when the hour changes. */
function paintCity(g,w,h,kind){
  const gr=g.createLinearGradient(0,0,0,h);
  if(kind==='golden'){gr.addColorStop(0,'#2a2250');gr.addColorStop(.3,'#9a4a5c');gr.addColorStop(.58,'#f08a4a');gr.addColorStop(.78,'#f6c27a');gr.addColorStop(1,'#4a2c1c');}
  else if(kind==='rain'){gr.addColorStop(0,'#06080e');gr.addColorStop(.6,'#101a2a');gr.addColorStop(1,'#1c2030');}
  else{gr.addColorStop(0,'#05070f');gr.addColorStop(.6,'#0c1428');gr.addColorStop(1,'#1a1a2a');}
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  if(kind==='golden'){
    g.fillStyle='#1c0f0b';
    for(let x=0;x<w;x+=rand(18,34)){const bw=rand(18,34),bh=rand(70,190);g.fillRect(x,h-bh,bw,bh);}
    for(let i=0;i<60;i++){g.fillStyle='rgba(255,200,120,'+rand(.3,.8)+')';g.fillRect(Math.random()*w,rand(h*.65,h-6),3,4);}
  }else{
    const n=kind==='rain'?44:70;
    for(let i=0;i<n;i++){
      const x=Math.random()*w,y=rand(h*.35,h),rr=rand(4,18);
      const c=pick(kind==='rain'?['255,190,120','140,170,255','200,120,110']:['255,190,120','255,220,170','140,170,255','255,140,110']);
      const rg=g.createRadialGradient(x,y,0,x,y,rr);rg.addColorStop(0,'rgba('+c+','+rand(.3,.7)+')');rg.addColorStop(1,'rgba('+c+',0)');
      g.fillStyle=rg;g.fillRect(x-rr,y-rr,rr*2,rr*2);
    }
    if(kind==='rain'){
      g.strokeStyle='rgba(170,190,225,.28)';g.lineWidth=1.2;
      for(let i=0;i<150;i++){const x=Math.random()*w,y=Math.random()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x-5,y+rand(24,70));g.stroke();}
    }
  }
}
function nightCity(){return canvasTex(256,512,(g,w,h)=>paintCity(g,w,h,'night'));}
function rugTex(){
  return canvasTex(512,384,(g,w,h)=>{
    g.fillStyle='#3a0f10';g.fillRect(0,0,w,h);
    g.strokeStyle='#8a6232';g.lineWidth=10;g.strokeRect(16,16,w-32,h-32);
    g.strokeStyle='#5a1a16';g.lineWidth=18;g.strokeRect(42,42,w-84,h-84);
    g.strokeStyle='#8a6232';g.lineWidth=3;g.strokeRect(58,58,w-116,h-116);
    g.fillStyle='#4a1514';g.beginPath();g.ellipse(w/2,h/2,120,80,0,0,Math.PI*2);g.fill();
    g.strokeStyle='#7a5530';g.lineWidth=3;g.beginPath();g.ellipse(w/2,h/2,96,62,0,0,Math.PI*2);g.stroke();
    g.globalAlpha=.07;for(let k=0;k<5000;k++){g.fillStyle=Math.random()<.5?'#000':'#c08050';g.fillRect(Math.random()*w,Math.random()*h,2,2);}
  });
}
/* wall art styles unlocked as decor: each paints into the same 256x180 canvas */
const grain=(g,w,h)=>{g.globalAlpha=.08;for(let k=0;k<1500;k++){g.fillStyle=Math.random()<.5?'#000':'#fff';g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5);}g.globalAlpha=1;};
const ART={
  jazz:(g,w,h,seed)=>{
    g.fillStyle=['#14100c','#1a110d','#120e0c'][seed%3];g.fillRect(0,0,w,h);
    const cx=w*(.4+(seed%3)*.08),cy=h*.5,R=h*.4;
    g.fillStyle='#0a0807';g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.fill();
    g.strokeStyle='rgba(255,230,190,.09)';g.lineWidth=1;for(let r=R*.35;r<R;r+=3.2){g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();}
    g.fillStyle='#c9a066';g.beginPath();g.arc(cx,cy,R*.3,0,Math.PI*2);g.fill();g.fillStyle='#14100c';g.beginPath();g.arc(cx,cy,R*.04,0,Math.PI*2);g.fill();
    g.fillStyle='#c9a066';g.strokeStyle='#c9a066';g.lineWidth=3;
    [[.82,.28],[.9,.5]].forEach(([nx,ny])=>{g.beginPath();g.ellipse(w*nx,h*ny+14,7,5,-.4,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*nx+6,h*ny+12);g.lineTo(w*nx+6,h*ny-18);g.stroke();});
    grain(g,w,h);
  },
  moon:(g,w,h,seed)=>{
    const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0e1630');gr.addColorStop(1,'#35203f');g.fillStyle=gr;g.fillRect(0,0,w,h);
    const mx=w*(.62+(seed%3)*.07),my=h*.32;
    const gl=g.createRadialGradient(mx,my,4,mx,my,h*.5);gl.addColorStop(0,'rgba(255,240,200,.5)');gl.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gl;g.fillRect(0,0,w,h);
    g.fillStyle='#efe3c4';g.beginPath();g.arc(mx,my,h*.15,0,Math.PI*2);g.fill();
    g.fillStyle='#0a0710';let x=0;while(x<w){const bw=14+((x*7+seed*11)%22),bh=h*(.22+(((x*13+seed*5)%40)/100));g.fillRect(x,h-bh,bw,bh);g.fillStyle='#0a0710';x+=bw+2;}
    g.fillStyle='#e9b866';for(let k=0;k<26;k++){g.globalAlpha=.4+((k*37)%60)/100;g.fillRect(((k*53+seed*17)%(w-6)),h*(.68+((k*29)%30)/100),3,4);}g.globalAlpha=1;
    grain(g,w,h);
  },
  cats:(g,w,h,seed)=>{
    g.fillStyle=['#0f2418','#10261c','#0d2016'][seed%3];g.fillRect(0,0,w,h);
    g.fillStyle='rgba(201,160,102,.5)';g.beginPath();g.arc(w*.22,h*.26,h*.13,0,Math.PI*2);g.fill();
    const cx=w*(.5+(seed%3)*.06),by=h*.9;g.fillStyle='#07100a';
    g.beginPath();g.ellipse(cx,by-h*.2,h*.22,h*.26,0,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(cx,by-h*.58,h*.15,0,Math.PI*2);g.fill();
    g.beginPath();g.moveTo(cx-h*.14,by-h*.64);g.lineTo(cx-h*.1,by-h*.82);g.lineTo(cx-h*.02,by-h*.7);g.closePath();g.fill();
    g.beginPath();g.moveTo(cx+h*.14,by-h*.64);g.lineTo(cx+h*.1,by-h*.82);g.lineTo(cx+h*.02,by-h*.7);g.closePath();g.fill();
    g.strokeStyle='#07100a';g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(cx+h*.2,by-h*.1);g.bezierCurveTo(cx+h*.5,by-h*.1,cx+h*.42,by-h*.5,cx+h*.3,by-h*.42);g.stroke();
    g.fillStyle='#e8b04a';[-1,1].forEach(d=>{g.beginPath();g.ellipse(cx+d*h*.06,by-h*.59,h*.028,h*.04,0,0,Math.PI*2);g.fill();});
    grain(g,w,h);
  }
};
function painting(seed){
  return canvasTex(256,180,(g,w,h)=>{
    g.fillStyle=['#1c1410','#221614','#18120f'][seed%3];g.fillRect(0,0,w,h);
    const pal=[['#b86a2c','#6b1f1c','#d9b27a','#2a3a3a'],['#8a2a22','#c98a3a','#e6d0a8','#1e2a2e'],['#c27a3a','#4a1a14','#9c7239','#d8c4a0']][seed%3];
    g.globalAlpha=.9;g.fillStyle=pal[0];g.beginPath();g.arc(w*(.3+seed*.17%.4),h*.42,h*.26,0,Math.PI*2);g.fill();
    g.fillStyle=pal[1];g.beginPath();g.moveTo(w*.5,h);g.lineTo(w*.5,h*.45);g.arc(w*.68,h*.45,w*.18,Math.PI,0);g.lineTo(w*.86,h);g.closePath();g.fill();
    g.strokeStyle=pal[2];g.lineWidth=3;g.beginPath();g.moveTo(w*.08,h*.78);g.bezierCurveTo(w*.3,h*.6,w*.45,h*.95,w*.92,h*.7);g.stroke();
    g.fillStyle=pal[3];g.fillRect(w*.12,h*.15,w*.06,h*.6);
    g.globalAlpha=.08;for(let k=0;k<1500;k++){g.fillStyle=Math.random()<.5?'#000':'#fff';g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5);}
  });
}
function remapUV(geo,w,h,x0,y0){
  const p=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)-x0)/w,(p.getY(i)-y0)/h);
  uv.needsUpdate=true;
}

export function buildRoom(scene){
  const colliders=[];
  const col=(x0,x1,z0,z1,y0,y1)=>{const c={min:new THREE.Vector3(x0,y0||0,z0),max:new THREE.Vector3(x1,y1==null?2.2:y1,z1)};colliders.push(c);return c;};
  const add=(m,p)=>{(p||scene).add(m);return m;};
  const box=(w,h,d,mat,x,y,z,p)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return add(m,p);};
  const cyl=(rt,rb,h,mat,x,y,z,p,seg)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),mat);m.position.set(x,y,z);return add(m,p);};
  const grp=(x,y,z,ry,p)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry||0;return add(g,p);};

  const mahog=M(0x3a1810,{roughness:.48,envMapIntensity:.45});
  const mahogMid=M(0x56261a,{roughness:.42,envMapIntensity:.5});
  const trim=M(0x1e0d08,{roughness:.55,envMapIntensity:.3});
  const leather=M(0x5e1a17,{roughness:.38,envMapIntensity:.6});
  const cognac=M(0x6e3018,{roughness:.4,envMapIntensity:.55});
  const velvet=M(0x1b4a35,{roughness:.95,envMapIntensity:.1,side:THREE.DoubleSide});          // deep forest-green drapes
  const greenLeather=M(0x1d4a36,{roughness:.38,envMapIntensity:.6});                             // banquettes and lounge chairs
  const greenGlass=new THREE.MeshStandardMaterial({color:0x1f7a4d,emissive:new THREE.Color(0x1f8a58).multiplyScalar(.55),roughness:.12,transparent:true,opacity:.9,side:THREE.DoubleSide,envMapIntensity:1});
  const lacquer=M(0x070505,{roughness:.12,envMapIntensity:1.2});
  const warmBulb=new THREE.MeshBasicMaterial({color:hdr(0xffc890,3)});
  const amberStrip=new THREE.MeshBasicMaterial({color:hdr(0xff9a4a,1.6)});
  const marbleTex=marble(1024,256,'#120d0b',[['#5c4a36',16,1.8],['#8a7a66',9,.9]]);
  marbleTex.wrapS=marbleTex.wrapT=THREE.RepeatWrapping;
  const marbleMat=M(0xffffff,{map:marbleTex,roughness:.16,envMapIntensity:.9});

  /* floor */
  const W=ROOM.x1-ROOM.x0,D=ROOM.z1-ROOM.z0,CZ=(ROOM.z0+ROOM.z1)/2,H=ROOM.h;
  const ft=herringbone();ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(W/3.4,D/3.4);
  const floor=add(new THREE.Mesh(new THREE.PlaneGeometry(W,D),M(0xffffff,{map:ft,roughness:.34,envMapIntensity:.55})));
  floor.rotation.x=-Math.PI/2;floor.position.set(0,0,CZ);floor.receiveShadow=true;
  const rug=add(new THREE.Mesh(new THREE.PlaneGeometry(4.6,3.4),M(0xffffff,{map:rugTex(),roughness:1,envMapIntensity:0})));
  rug.rotation.x=-Math.PI/2;rug.position.set(-5.3,.006,7.1);rug.receiveShadow=true;

  /* ceiling with coffers */
  const ceil=add(new THREE.Mesh(new THREE.PlaneGeometry(W,D),M(0x140806,{roughness:1})));ceil.rotation.x=Math.PI/2;ceil.position.set(0,H,CZ);
  for(let x=-7.5;x<=7.5;x+=2.5)box(.2,.2,D,trim,x,H-.1,CZ);
  for(let z=-.6;z<ROOM.z1;z+=2.5)box(W,.2,.2,trim,0,H-.1,z);

  /* walls: wainscot below, damask above, brass rail, crown */
  const dm=damask();dm.wrapS=dm.wrapT=THREE.RepeatWrapping;
  const WALLS={
    back:{len:W,at:(u,d)=>[u,ROOM.z0+d],ry:0},
    front:{len:W,at:(u,d)=>[-u,ROOM.z1-d],ry:Math.PI},
    left:{len:D,at:(u,d)=>[ROOM.x0+d,CZ-u],ry:Math.PI/2},
    right:{len:D,at:(u,d)=>[ROOM.x1-d,CZ+u],ry:-Math.PI/2}
  };
  const onWall=(w,u,y,d)=>{const p=w.at(u,d);return grp(p[0],y,p[1],w.ry);};
  const panelGeo=new THREE.BoxGeometry(.92,.62,.03);
  Object.entries(WALLS).forEach(([name,w])=>{
    const g=onWall(w,0,0,0),len=w.len;
    const tex=dm.clone();tex.needsUpdate=true;tex.repeat.set(len/1.3,(H-1.15)/1.3);
    const up=new THREE.Mesh(new THREE.PlaneGeometry(len,H-1.15),M(0xffffff,{map:tex,roughness:.85,envMapIntensity:.15}));up.position.set(0,1.15+(H-1.15)/2,0);g.add(up);
    const lo=new THREE.Mesh(new THREE.PlaneGeometry(len,1.15),mahog);lo.position.set(0,.575,0);g.add(lo);
    const skip=name==='front'?[[-1.4,1.4],[-6.4,-4.0],[4.0,6.4]]:[];
    const xs=[];for(let x=-len/2+.65;x<len/2-.5;x+=1.1)if(!skip.some(([a,b])=>x>a-.5&&x<b+.5))xs.push(x);
    const im=new THREE.InstancedMesh(panelGeo,mahogMid,xs.length),m4=new THREE.Matrix4();
    xs.forEach((x,i)=>{m4.setPosition(x,.6,.02);im.setMatrixAt(i,m4);});g.add(im);
    box(len,.07,.08,mahogMid,0,1.17,.04,g);box(len,.012,.012,brass,0,1.21,.085,g);
    box(len,.14,.04,trim,0,.07,.02,g);
    box(len,.16,.16,trim,0,H-.08,.08,g);box(len,.012,.012,brass,0,H-.17,.165,g);
  });
  col(ROOM.x0-.5,ROOM.x1+.5,ROOM.z0-.5,ROOM.z0,0,H);col(ROOM.x0-.5,ROOM.x1+.5,ROOM.z1,ROOM.z1+.5,0,H);
  col(ROOM.x0-.5,ROOM.x0,ROOM.z0,ROOM.z1,0,H);col(ROOM.x1,ROOM.x1+.5,ROOM.z0,ROOM.z1,0,H);

  /* front wall: entrance door + arched night windows with velvet drapes */
  const city=nightCity();
  const glassMat=new THREE.MeshBasicMaterial({map:city,color:new THREE.Color(.85,.85,.95)});
  const archGeo=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.lineTo(-w/2,0);const g=new THREE.ShapeGeometry(s,24);remapUV(g,w,h,-w/2,0);return g;};
  /* falling snow outside the big windows (every mode): three scrolling layers of soft flakes at different scales and speeds give depth */
  const flakeTex=(n,r0,r1,seed)=>{
    const t=canvasTex(256,512,(g,w,h)=>{
      let sd=seed;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
      for(let i=0;i<n;i++){
        const x=rnd()*w,y=rnd()*h,r=r0+rnd()*(r1-r0),a=.35+rnd()*.55;
        for(const dx of [0,-w,w])for(const dy of [0,-h,h]){            // draw wrapped copies so the texture tiles without a seam
          const px=x+dx,py=y+dy;if(px<-r||px>w+r||py<-r||py>h+r)continue;
          const rg=g.createRadialGradient(px,py,0,px,py,r);rg.addColorStop(0,'rgba(255,255,255,'+a+')');rg.addColorStop(.45,'rgba(235,242,255,'+a*.55+')');rg.addColorStop(1,'rgba(235,242,255,0)');
          g.fillStyle=rg;g.fillRect(px-r,py-r,r*2,r*2);
        }
      }
    });
    t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  };
  const SNOW_LAYERS=[
    {tex:flakeTex(150,1.2,2.6,11),rep:[1.5,2.4],speed:.018,op:.55,z:.011},
    {tex:flakeTex(70,2.2,4.2,23),rep:[1.1,1.7],speed:.04,op:.7,z:.013},
    {tex:flakeTex(22,4.5,9,37),rep:[.8,1.2],speed:.085,op:.55,z:.015}
  ];
  const snowFall=[];                                   // {tex, layer, phase} per window and layer
  [-5.2,5.2].forEach((u,wi)=>{
    const g=onWall(WALLS.front,u,.85,.01);
    g.add(new THREE.Mesh(archGeo(2,3.4),glassMat));
    SNOW_LAYERS.forEach((L,li)=>{
      const tx=L.tex.clone();tx.needsUpdate=true;tx.repeat.set(L.rep[0],L.rep[1]);tx.offset.set(wi*.37+li*.21,wi*.5+li*.33);
      const mat=new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:L.op,depthWrite:false});
      const m=new THREE.Mesh(archGeo(2,3.4),mat);m.position.z=L.z;m.renderOrder=2;g.add(m);
      snowFall.push({tx,mat,L,ph:wi*1.7+li*2.3});
    });
    box(.06,2.4,.06,trim,0,1.2,.03,g);
    [.9,1.8].forEach(y=>box(2,.05,.05,trim,0,y,.03,g));
    [-1,1].forEach(s=>box(.12,2.4,.12,mahogMid,s*1.04,1.2,.05,g));
    box(2.3,.12,.22,mahogMid,0,-.02,.08,g);
    const arc=new THREE.Mesh(new THREE.TorusGeometry(1.04,.06,8,32,Math.PI),mahogMid);arc.position.set(0,2.4,.05);g.add(arc);
    const bokeh=glow(2.4,3,0x6f86c8,.12);bokeh.position.set(0,1.7,.3);g.add(bokeh);
  });
  const curtainGeo=new THREE.PlaneGeometry(.95,4.7,36,1);
  {const p=curtainGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*26)*.045+Math.sin(x*9)*.02);}curtainGeo.computeVertexNormals();}
  [-6.75,-3.65,3.65,6.75].forEach(u=>{const g=onWall(WALLS.front,u,2.45,.12);g.add(new THREE.Mesh(curtainGeo,velvet));});
  [-6.75,-3.65,3.65,6.75].forEach(u=>{const g=onWall(WALLS.front,u,4.86,.2);box(1.1,.06,.06,brass,0,0,0,g);});
  {
    const g=onWall(WALLS.front,0,0,.02);
    [-1,1].forEach(s=>{
      const leaf=box(.86,2.7,.06,mahogMid,s*.45,1.35,.03,g);
      box(.62,.9,.02,mahog,s*.45,.75,.07,g);box(.62,1.1,.02,mahog,s*.45,1.95,.07,g);
      box(.03,.7,.04,brass,s*.12,1.4,.11,g);
      void leaf;
    });
    [-1,1].forEach(s=>box(.14,3.0,.14,trim,s*.98,1.5,.07,g));
    box(2.1,.16,.16,trim,0,2.78,.07,g);
    const tr=new THREE.Mesh(archGeo(1.8,.9),glassMat);tr.position.set(-0,2.86,.02);tr.scale.y=.9;g.add(tr);
    const t=new THREE.Mesh(new THREE.TorusGeometry(.92,.05,8,32,Math.PI),trim);t.position.set(0,2.86,.06);t.scale.y=.85;g.add(t);
  }

  /* bar counter: fluted mahogany front, black marble top, brass rail, low amber strip */
  box(12,1.05,1.3,trim,0,.525,0);
  (function flutes(){
    const geo=new THREE.CylinderGeometry(.045,.045,.9,8),n=120,im=new THREE.InstancedMesh(geo,mahogMid,n),m4=new THREE.Matrix4();
    for(let i=0;i<n;i++){m4.setPosition(-5.95+i*.1,.56,.66);im.setMatrixAt(i,m4);}
    im.receiveShadow=true;add(im);
  })();
  box(12.05,.08,.06,brass,0,.08,.68);
  const mt=marbleTex.clone();mt.needsUpdate=true;mt.repeat.set(4,1);
  const top=box(12.3,.08,1.5,M(0xffffff,{map:mt,roughness:.2,envMapIntensity:.55}),0,1.11,0);top.receiveShadow=true;top.castShadow=true;
  box(12.3,.025,.025,brass,0,1.14,.76);
  box(11.9,.015,.015,amberStrip,0,1.04,.72);
  cyl(.03,.03,12,brass,0,.32,.98,null,12).rotation.z=Math.PI/2;
  [-5.5,-2.75,0,2.75,5.5].forEach(x=>{const b=cyl(.02,.02,.26,brass,x,.19,.9,null,8);b.rotation.x=.5;});
  col(-6.15,6.15,-.75,.78,0,1.2);

  /* back bar: cabinet, backlit onyx, glass-front shelves, fluted pilasters, cornice */
  box(11,1,.7,mahog,0,.5,-2.65);
  for(let x=-4.95;x<5;x+=1.1){box(.98,.8,.02,mahogMid,x,.5,-2.29);box(.02,.16,.02,brass,x+.38,.6,-2.27);}
  box(11.1,.06,.78,marbleMat,0,1.03,-2.65);
  col(-5.6,5.6,-3.1,-2.26,0,1.1);
  const onyxMat=new THREE.MeshBasicMaterial({map:onyx(),color:new THREE.Color(.8,.78,.74)});
  const onyxP=add(new THREE.Mesh(new THREE.PlaneGeometry(9.9,2.55),onyxMat));onyxP.position.set(0,2.62,ROOM.z0+.06);
  const shelfY=[1.95,2.62,3.29];
  shelfY.forEach(y=>{
    box(9.9,.04,.42,new THREE.MeshStandardMaterial({color:0x6a4a38,roughness:.05,metalness:.2,transparent:true,opacity:.5,envMapIntensity:1.2}),0,y,-2.88);
    box(9.9,.03,.03,brass,0,y+.005,-2.66);
  });
  col(-5.6,5.6,-3.1,-2.62,1.85,4.1);
  [-5.25,5.25].forEach(x=>{
    box(.6,4.0,.36,mahog,x,2.0,-2.92);
    for(let k=-2;k<=2;k++)cyl(.032,.032,3.6,mahogMid,x+k*.1,2.0,-2.73,null,8);
    box(.7,.12,.44,brass,x,4.04,-2.9);
  });
  box(11.2,.32,.5,mahog,0,4.15,-2.86);box(11.2,.02,.02,brass,0,3.99,-2.6);
  box(9.9,.02,.04,amberStrip,0,3.98,-2.68);
  (function backbarBottles(){
    const by={};
    shelfY.forEach(y=>{
      let x=-4.62+rand(0,.05);
      while(x<4.62){
        const key=pick(BACKBAR),s=rand(.94,1.04),w=bottleWidth(key,s);
        if(x+w>4.7)break;
        if(Math.random()<.93)(by[key]=by[key]||[]).push({x:x+w/2,y:y+.022,z:-2.9+rand(-.03,.03),ry:rand(-.25,.25),s});
        x+=w+rand(.035,.1);
      }
    });
    Object.keys(by).forEach(k=>instanceBottles(scene,k,by[k]));
  })();

  /* neon script (kept small and warm) */
  const neonCanvas=document.createElement('canvas');neonCanvas.width=1024;neonCanvas.height=300;
  const neonTex=new THREE.CanvasTexture(neonCanvas);
  function drawNeon(){
    const g=neonCanvas.getContext('2d');g.clearRect(0,0,1024,300);
    /* a brass-lettered sign on dark green enamel: double hairline frame, wide-tracked wordmark */
    const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
    const plate=g.createLinearGradient(0,30,0,270);plate.addColorStop(0,'#24402f');plate.addColorStop(1,'#122219');
    rr(30,30,964,240,16);g.fillStyle=plate;g.fill();
    g.strokeStyle='#d6b26a';g.lineWidth=3;rr(46,46,932,208,10);g.stroke();
    g.strokeStyle='rgba(214,178,106,.55)';g.lineWidth=1.2;rr(56,56,912,188,6);g.stroke();
    g.textAlign='left';g.textBaseline='alphabetic';g.font='96px Marcellus,"Cormorant Garamond",serif';
    const word='Bar Coda',sp=18,chars=[...word],widths=chars.map(c=>g.measureText(c).width),total=widths.reduce((a,b)=>a+b,0)+sp*(chars.length-1);
    const gold=g.createLinearGradient(0,80,0,150);gold.addColorStop(0,'#f6e3b2');gold.addColorStop(.6,'#dcb76f');gold.addColorStop(1,'#a98242');
    g.fillStyle=gold;let x=512-total/2;chars.forEach((c,i)=>{g.fillText(c,x,150);x+=widths[i]+sp;});
    g.strokeStyle='rgba(214,178,106,.7)';g.lineWidth=1.4;g.beginPath();g.moveTo(330,174);g.lineTo(694,174);g.stroke();
    g.font='600 25px "Josefin Sans","DM Sans",sans-serif';g.fillStyle='#d9b878';
    const sub='LISTENING LOUNGE',sw=[...sub].map(c=>g.measureText(c).width),sp2=13,st=sw.reduce((a,b)=>a+b,0)+sp2*(sub.length-1);
    let sx=512-st/2;[...sub].forEach((c,i)=>{g.fillText(c,sx,222);sx+=sw[i]+sp2;});
    neonTex.needsUpdate=true;
  }
  drawNeon();
  const neonMat=new THREE.MeshBasicMaterial({map:neonTex,transparent:true,toneMapped:false,color:new THREE.Color(1,1,1),depthWrite:false});
  const neon=add(new THREE.Mesh(new THREE.PlaneGeometry(3.4,1),neonMat));neon.position.set(0,4.72,-2.55);
  const neonGlow=add(glow(5.5,2.2,0xd9a860,.07));neonGlow.position.set(0,4.7,-2.58);

  /* art, sconces */
  const arts=[];
  const frame=(w,h,seed,p)=>{
    const g=new THREE.Group();
    box(w+.16,h+.16,.05,brass,0,0,0,g);box(w+.04,h+.04,.06,trim,0,0,.01,g);
    const tex=painting(seed);arts.push({tex,seed,classic:tex.image.getContext('2d').getImageData(0,0,256,180)});
    const pm=new THREE.Mesh(new THREE.PlaneGeometry(w,h),M(0xffffff,{map:tex,roughness:.9,envMapIntensity:0}));pm.position.z=.045;g.add(pm);
    p.add(g);return g;
  };
  const sconce=(p,y)=>{
    const g=new THREE.Group();g.position.y=y;p.add(g);
    cyl(.05,.05,.02,brass,0,0,.01,g,16).rotation.x=Math.PI/2;
    box(.02,.02,.16,brass,0,0,.09,g);
    const sh=new THREE.Mesh(lathe([[.05,0],[.09,.16],[.088,.16],[.048,0]],16),new THREE.MeshStandardMaterial({color:0xf0d0a0,emissive:new THREE.Color(0xffa860).multiplyScalar(.9),roughness:.9,side:THREE.DoubleSide}));
    sh.position.set(0,-.02,.18);g.add(sh);
    const w1=glow(1.1,1.9,0xffa050,.26);w1.position.set(0,.15,.015);g.add(w1);
    const w2=glow(.5,.5,0xffc080,.5);w2.position.set(0,.06,.2);g.add(w2);
  };
  /* side walls: u = CZ - z on the left wall, z - CZ on the right */
  const L=z=>CZ-z,R=z=>z-CZ;
  [[WALLS.back,-7.7,2.5,1.7,1.15,0],[WALLS.back,7.7,2.5,1.7,1.15,1],[WALLS.left,L(2.8),2.55,1.8,1.2,2],[WALLS.right,R(2.8),2.55,1.8,1.2,1],[WALLS.left,L(8.2),2.6,1.4,1.9,0]].forEach(([w,u,y,fw,fh,s])=>frame(fw,fh,s,onWall(w,u,y,.01)));
  [[WALLS.back,-9.1],[WALLS.back,-6.3],[WALLS.back,6.3],[WALLS.back,9.1],[WALLS.left,L(1.1)],[WALLS.left,L(4.5)],[WALLS.right,R(1.1)],[WALLS.right,R(4.5)],[WALLS.left,L(6.6)],[WALLS.left,L(10.2)],[WALLS.right,R(6.4)],[WALLS.right,R(10.4)],[WALLS.left,L(-1.6)],[WALLS.right,R(-1.6)]].forEach(([w,u])=>sconce(onWall(w,u,0,.01),2.35));

  /* record player + plant on the back bar */
  const platter=grp(-3.9,1.17,-2.65);
  box(.8,.1,.56,trim,-3.9,1.11,-2.65);
  cyl(.2,.2,.02,M(0x0b0a0c,{roughness:.2,metalness:.3,envMapIntensity:1}),0,0,0,platter,40);
  cyl(.07,.07,.024,M(0x6b1f1c,{roughness:.5}),0,.001,0,platter,24);
  box(.26,.012,.012,brass,-3.62,1.2,-2.5).rotation.y=.5;
  const palm=(x,z,s,y)=>{
    const g=grp(x,y||0,z);g.scale.setScalar(s);
    const pot=new THREE.Mesh(lathe([[0,0],[.2,0],[.26,.5],[.28,.52],[0,.52]],20),brass);g.add(pot);
    const leaf=M(0x22402a,{roughness:.6,side:THREE.DoubleSide}),stem=M(0x3a3020,{roughness:.8});
    for(let i=0;i<11;i++){
      const a=i/11*Math.PI*2+rand(-.2,.2),tilt=rand(.5,1.1),f=new THREE.Group();f.position.y=.5;f.rotation.set(0,a,0);g.add(f);
      const ff=new THREE.Group();ff.rotation.x=tilt;f.add(ff);
      const st=new THREE.Mesh(new THREE.CylinderGeometry(.008,.012,1.1,5),stem);st.position.y=.55;ff.add(st);
      for(let k=0;k<9;k++){const l=new THREE.Mesh(new THREE.PlaneGeometry(.05,.32),leaf);l.position.set(0,.3+k*.09,0);l.rotation.set(.5,0,(k%2?1:-1)*1.1);ff.add(l);}
    }
    return g;
  };
  palm(4.4,-2.62,.5,1.06);
  palm(-9.2,11.2,1.25);palm(9.2,11.2,1.25);palm(-9.2,-2.4,1.1);palm(9.2,-2.4,1.1);
  col(-9.6,-8.8,10.8,11.6);col(8.8,9.6,10.8,11.6);col(-9.6,-8.8,-2.8,-2);col(8.8,9.6,-2.8,-2);

  /* bar stools: oxblood leather with low back */
  const seatGeo=lathe([[0,0],[.25,0],[.27,.04],[.265,.09],[.22,.115],[0,.12]],28);
  const backGeo=new THREE.CylinderGeometry(.27,.27,.22,24,1,true,-Math.PI*.42,Math.PI*.84);
  const stools=[];
  STOOL_X.concat([0,0]).forEach(x=>{
    const g=grp(x,0,STOOL_Z);
    cyl(.24,.27,.03,brass,0,.015,0,g,28);
    cyl(.035,.035,.68,brass,0,.37,0,g,12);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.014,8,28),brass);ring.rotation.x=Math.PI/2;ring.position.y=.3;g.add(ring);
    cyl(.26,.26,.03,trim,0,.69,0,g,28);
    const s=new THREE.Mesh(seatGeo,leather);s.position.y=.68;g.add(s);
    const bk=new THREE.Mesh(backGeo,leather);bk.position.y=.92;bk.material.side=THREE.DoubleSide;g.add(bk);
    const bt=new THREE.Mesh(new THREE.TorusGeometry(.27,.012,6,24,Math.PI*.84),brass);bt.rotation.set(Math.PI/2,0,Math.PI*.08);bt.position.y=1.03;g.add(bt);
    shadows(g,true,true);
    stools.push({g,c:col(x-.3,x+.3,STOOL_Z-.3,STOOL_Z+.32,0,1.1)});
  });

  /* pendant domes over the counter */
  const domeGeo=lathe([[.01,.24],[.12,.21],[.24,.11],[.3,0],[.295,-.005],[.235,.1],[.115,.2],[0,.23]],28);
  const domeMat=new THREE.MeshStandardMaterial({color:0x9c7239,metalness:1,roughness:.32,envMapIntensity:1.1,side:THREE.DoubleSide});
  [-4.9,-2.5,0,2.5,4.9].forEach(x=>{
    const g=grp(x,3.15,.15);
    cyl(.006,.006,2.0,trim,0,1.1,0,g,6);
    g.add(new THREE.Mesh(domeGeo,domeMat));
    const b=new THREE.Mesh(new THREE.SphereGeometry(.07,14,10),warmBulb);b.position.y=.02;g.add(b);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(1.0,3.0,28,1,true),new THREE.MeshBasicMaterial({color:0xffa860,transparent:true,opacity:.016,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    cone.position.y=-1.5;g.add(cone);
  });

  /* banquettes with channel tufting + marble cafe tables */
  const channelGeo=new THREE.CylinderGeometry(.075,.075,.78,10);
  const candles=[];
  const table=(x,z,r)=>{
    const g=grp(x,0,z);
    cyl(.22,.26,.03,brass,0,.015,0,g,24);cyl(.035,.035,.7,brass,0,.37,0,g,10);
    const t=cyl(r,r,.04,marbleMat,0,.74,0,g,32);t.castShadow=true;t.receiveShadow=true;
    cyl(r+.005,r+.005,.012,brass,0,.72,0,g,32);
    const c=new THREE.Group();c.position.y=.76;g.add(c);
    cyl(.045,.04,.07,new THREE.MeshStandardMaterial({color:0x6a3a20,roughness:.1,transparent:true,opacity:.75}),0,.035,0,c,14);
    const fl=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),new THREE.MeshBasicMaterial({color:hdr(0xffb060,3)}));fl.scale.y=1.8;fl.position.y=.09;c.add(fl);
    const gl=glow(.5,.5,0xff9a40,.35);gl.position.y=.1;c.add(gl);
    candles.push({fl,gl,ph:rand(0,6)});
    col(x-r,x+r,z-r,z+r,0,.8);
    return g;
  };
  [-1,1].forEach(s=>{
    const x0=s<0?ROOM.x0:ROOM.x1,z0=.9,z1=4.7,len=z1-z0,cz=(z0+z1)/2;
    const g=grp(x0-s*.32,0,cz,s<0?Math.PI/2:-Math.PI/2);
    box(len,.36,.6,trim,0,.18,0,g);
    box(len,.12,.56,greenLeather,0,.42,.02,g);
    const n=Math.floor(len/.15),im=new THREE.InstancedMesh(channelGeo,greenLeather,n),m4=new THREE.Matrix4(),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.12,0,0));
    for(let i=0;i<n;i++){m4.compose(new THREE.Vector3(-len/2+.075+i*.15,.88,-.22),q,new THREE.Vector3(1,1,.7));im.setMatrixAt(i,m4);}
    im.castShadow=true;g.add(im);
    box(len,.04,.1,mahogMid,0,1.29,-.24,g);
    col(s<0?ROOM.x0:ROOM.x1-.65,s<0?ROOM.x0+.65:ROOM.x1,z0,z1,0,1.3);
    [1.8,3.8].forEach(z=>table(x0-s*1.15,z,.32));
  });

  /* lounge: cognac armchairs, side table, floor lamp */
  const armchair=(x,z,ry)=>{
    const g=grp(x,0,z,ry);
    [[-.34,-.3],[.34,-.3],[-.34,.3],[.34,.3]].forEach(([a,b])=>cyl(.02,.015,.12,brass,a,.06,b,g,8));
    box(.86,.2,.8,greenLeather,0,.2,0,g);
    box(.62,.12,.66,greenLeather,0,.36,.05,g);
    const bk=box(.86,.62,.16,greenLeather,0,.66,-.33,g);bk.rotation.x=-.12;
    [-1,1].forEach(s=>{box(.14,.3,.78,greenLeather,s*.37,.45,0,g);box(.16,.04,.8,greenLeather,s*.37,.61,0,g);});
    shadows(g,true,true);
    col(x-.48,x+.48,z-.48,z+.48,0,1);
  };
  /* banker's lamp: brass base, half-cylinder green glass shade, warm bulb inside (no extra scene light) */
  const bankersLamp=(x,y,z,ry,sc,p)=>{
    const g=grp(x,y,z,ry,p);g.scale.setScalar(sc||1);
    cyl(.1,.125,.03,brass,0,.015,0,g,24);cyl(.016,.016,.24,brass,0,.15,0,g,10);
    box(.3,.016,.03,brass,0,.27,0,g);
    const shade=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.36,24,1,true,0,Math.PI),greenGlass);shade.rotation.z=Math.PI/2;shade.position.y=.28;g.add(shade);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),warmBulb);bulb.position.y=.31;g.add(bulb);
    return g;
  };
  bankersLamp(-5.4,1.15,.28,0,1.5);bankersLamp(5.4,1.15,.28,0,1.5);bankersLamp(-5.18,.76,6.5,.6,1);
  armchair(-6.2,6.6,Math.PI/2);armchair(-4.4,6.6,-Math.PI/2);
  table(-5.3,6.6,.3);
  armchair(-6.2,8.2,Math.PI/2);
  {
    const g=grp(-7.0,0,7.55);
    cyl(.16,.18,.03,brass,0,.015,0,g,20);cyl(.014,.014,1.55,brass,0,.8,0,g,8);
    const sh=new THREE.Mesh(lathe([[.16,0],[.2,0],[.13,.3],[.1,.3]],20),new THREE.MeshStandardMaterial({color:0xe8c8a0,emissive:new THREE.Color(0xff9a50).multiplyScalar(.75),roughness:.9,side:THREE.DoubleSide}));
    sh.position.y=1.5;g.add(sh);
    const gl=glow(1.4,1.4,0xffa050,.3);gl.position.y=1.62;g.add(gl);
    col(-7.2,-6.8,7.35,7.75);
  }

  /* chandelier over the lounge */
  const chand=grp(0,4.05,6.9);
  cyl(.01,.01,1.1,brass,0,.6,0,chand,6);
  [.75,.45].forEach((r,i)=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.018,8,40),brass);ring.rotation.x=Math.PI/2;ring.position.y=-i*.28;chand.add(ring);
    const n=i?6:10;
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2;const b=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),warmBulb);b.position.set(Math.cos(a)*r,-i*.28+.06,Math.sin(a)*r);chand.add(b);}
  });
  const chGlow=glow(3,3,0xffa860,.2);chGlow.position.y=-.1;chand.add(chGlow);

  /* piano stage */
  let pianoG;
  const stage=grp(STAGE.x,0,STAGE.z);
  const st=cyl(STAGE.r,STAGE.r,STAGE.h,mahog,0,STAGE.h/2,0,stage,48);st.receiveShadow=true;
  const edge=new THREE.Mesh(new THREE.TorusGeometry(STAGE.r,.015,6,64),brass);edge.rotation.x=Math.PI/2;edge.position.y=STAGE.h;stage.add(edge);
  {
    const g=grp(.2,STAGE.h,-.3,2.54,stage);pianoG=g;
    const s=new THREE.Shape();
    s.moveTo(-.74,0);s.lineTo(.74,0);s.lineTo(.74,.5);s.bezierCurveTo(.74,1.15,.22,1.05,.06,1.5);s.bezierCurveTo(-.08,1.92,-.74,1.95,-.74,1.75);s.lineTo(-.74,0);
    const bodyGeo=new THREE.ExtrudeGeometry(s,{depth:.3,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:28});
    bodyGeo.rotateX(-Math.PI/2);
    const body=new THREE.Mesh(bodyGeo,lacquer);body.position.y=.6;g.add(body);
    const lidGeo=new THREE.ExtrudeGeometry(s,{depth:.018,bevelEnabled:false,curveSegments:28});lidGeo.rotateX(-Math.PI/2);lidGeo.translate(.74,0,0);
    const lid=new THREE.Group();lid.position.set(-.74,.92,0);g.add(lid);
    const lm=new THREE.Mesh(lidGeo,lacquer);lid.add(lm);lid.rotation.z=.6;
    const prop=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.82,6),lacquer);prop.position.set(.35,1.15,-.95);prop.rotation.z=.75;g.add(prop);
    box(1.5,.12,.32,lacquer,0,.62,.14,g);
    box(1.4,.03,.16,M(0xf2ece0,{roughness:.3}),0,.695,.18,g);
    const bk=new THREE.InstancedMesh(new THREE.BoxGeometry(.013,.02,.09),lacquer,36),m4=new THREE.Matrix4();
    for(let i=0;i<36;i++){const oct=Math.floor(i/5),k=i%5,x=-.68+oct*.196+[.02,.05,.11,.14,.17][k];m4.setPosition(x,.715,.13);bk.setMatrixAt(i,m4);}g.add(bk);
    box(1.48,.14,.03,lacquer,0,.77,.05,g);
    [[-.62,-.12],[.62,-.12],[-.3,-1.55]].forEach(([x,z])=>{cyl(.045,.035,.6,lacquer,x,.3,z,g,10);cyl(.03,.03,.04,brass,x,.02,z,g,10);});
    const bench=grp(0,0,.72,0,g);box(.82,.07,.34,lacquer,0,.48,0,bench);box(.8,.05,.3,leather,0,.53,0,bench);
    [[-.36,-.13],[.36,-.13],[-.36,.13],[.36,.13]].forEach(([x,z])=>cyl(.022,.018,.45,lacquer,x,.225,z,bench,8));
    const ms=box(.6,.26,.015,lacquer,0,1.08,.0,g);ms.rotation.x=-.3;
    shadows(g,true,true);
  }
  {
    const g=grp(1.3,STAGE.h,-1.0,0,stage);
    cyl(.14,.16,.02,brass,0,.01,0,g,16);cyl(.01,.01,1.4,brass,0,.71,0,g,8);
    const mic=new THREE.Mesh(new THREE.SphereGeometry(.04,12,10),M(0xb8b4b0,{metalness:1,roughness:.3,envMapIntensity:1.2}));mic.scale.y=1.6;mic.position.y=1.45;g.add(mic);
    col(STAGE.x+1.15,STAGE.x+1.45,STAGE.z-1.15,STAGE.z-.85,0,1.6);
  }
  stage.updateMatrixWorld(true);
  {
    const bb=new THREE.Box3(),v=new THREE.Vector3();
    [[-.8,.4],[.8,.4],[-.8,-1.95],[.8,-1.95],[-.45,.95],[.45,.95]].forEach(([x,z])=>bb.expandByPoint(pianoG.localToWorld(v.set(x,0,z))));
    col(bb.min.x,bb.max.x,bb.min.z,bb.max.z,0,1.6);
  }

  /* lights: hemisphere + 3 counter pendants + key spot + back bar + lounge + stage */
  const hemi=new THREE.HemisphereLight(0x6a3a2a,0x0e0605,.5);scene.add(hemi);
  const pend=[-3.4,0,3.4].map(x=>{const l=new THREE.PointLight(0xffb070,1.05,8,1.6);l.position.set(x,2.9,.3);scene.add(l);return l;});
  const key=new THREE.SpotLight(0xffc285,1.15,9,.55,.7,1.2);
  key.position.set(.7,3.5,1.7);key.target.position.set(0,1.15,.1);
  key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0005;key.shadow.camera.near=1;key.shadow.camera.far=7;
  scene.add(key,key.target);
  const bbLight=new THREE.PointLight(0xff9050,.9,7,1.6);bbLight.position.set(0,2.3,-2.2);scene.add(bbLight);
  const loungeLight=new THREE.PointLight(0xffa868,1.3,11,1.4);loungeLight.position.set(-1.5,3.4,7);scene.add(loungeLight);
  const stageLight=new THREE.SpotLight(0xffc08a,1.6,9,.5,.7,1.3);stageLight.position.set(STAGE.x-1.5,4.8,STAGE.z-1.5);stageLight.target.position.set(STAGE.x,.6,STAGE.z);scene.add(stageLight,stageLight.target);

  /* dust */
  const softTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  const DUST=220,dustPos=new Float32Array(DUST*3),dustSeed=[];
  for(let i=0;i<DUST;i++){dustPos[i*3]=rand(-9,9);dustPos[i*3+1]=rand(.6,4.8);dustPos[i*3+2]=rand(-2.6,11.5);dustSeed.push(rand(0,6.28));}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
  add(new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.05,map:softTex,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffc08a})));

  function animate(dt,t){
    platter.rotation.y+=dt*3.4;
    const flick=.97+.03*Math.sin(t*9)*Math.sin(t*3.1);
    neonMat.color.setScalar(1.15*flick*neonK);neonGlow.material.opacity=.12*flick*neonK;
    candles.forEach(c=>{const f=.85+.15*Math.sin(t*13+c.ph)*Math.sin(t*7.3+c.ph*2);c.fl.scale.set(f,1.8*f,f);c.gl.material.opacity=.35*f;});
    snowFall.forEach(f=>{f.tx.offset.y+=f.L.speed*dt;f.tx.offset.x+=Math.sin(t*.35+f.ph)*f.L.speed*.5*dt;});
    const dp=dustGeo.attributes.position.array;
    for(let i=0;i<DUST;i++){dp[i*3+1]+=dt*.03;dp[i*3]+=Math.sin(t*.3+dustSeed[i])*dt*.02;if(dp[i*3+1]>4.9)dp[i*3+1]=.6;}
    dustGeo.attributes.position.needsUpdate=true;
  }
  function groundAt(x,z){return Math.hypot(x-STAGE.x,z-STAGE.z)<STAGE.r-.05?STAGE.h:0;}
  /* Hour of the night: lights, window view, neon strength. look comes from session.js TIMES. */
  let neonK=1,curSky=null,lastLook=null,snow=false,tint=null;const tintC=new THREE.Color();
  /* snow behind the window glass is painted onto the city texture */
  function paintSnow(g,w,h){
    let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    g.fillStyle='rgba(255,255,255,.85)';
    for(let i=0;i<150;i++){g.globalAlpha=.35+rnd()*.6;g.beginPath();g.arc(rnd()*w,rnd()*h,.8+rnd()*2.1,0,Math.PI*2);g.fill();}
    g.globalAlpha=1;
  }
  function setSnow(on){snow=!!on;if(lastLook){curSky=null;setTime(lastLook);}}
  function setTime(look){
    lastLook=look;
    snowFall.forEach(f=>{f.mat.opacity=f.L.op*(look.sky==='golden'?.45:1);});
    hemi.color.setHex(look.hemi[0]);hemi.groundColor.setHex(look.hemi[1]);hemi.intensity=look.hemi[2];
    pend.forEach(l=>{l.color.setHex(look.pend[0]);if(tint!=null)l.color.lerp(tintC.setHex(tint),.55);l.intensity=look.pend[1];});
    key.color.setHex(look.key[0]);key.intensity=look.key[1];
    bbLight.intensity=look.bb;loungeLight.intensity=look.lounge;stageLight.intensity=look.stage;
    neonK=look.neon;
    glassMat.color.setRGB(look.win[0],look.win[1],look.win[2]);
    if(curSky!==look.sky){curSky=look.sky;const c=city.image;paintCity(c.getContext('2d'),c.width,c.height,look.sky);if(snow)paintSnow(c.getContext('2d'),c.width,c.height);city.needsUpdate=true;}
  }
  /* Bar stools follow the room's chair count: move, show or hide them (and their collision boxes). */
  function setStools(xs){
    stools.forEach((st,i)=>{
      const on=i<xs.length;st.g.visible=on;
      if(on){st.g.position.x=xs[i];st.c.min.x=xs[i]-.3;st.c.max.x=xs[i]+.3;st.c.min.z=STOOL_Z-.3;st.c.max.z=STOOL_Z+.32;}
      else{st.c.min.x=st.c.max.x=1e4;}
    });
  }
  /* decor: counter-pendant light colour (null = natural amber) and the wall art style */
  function setTint(hex){tint=hex==null?null:hex;if(lastLook)setTime(lastLook);}
  function setArt(style){
    arts.forEach(a=>{
      const c=a.tex.image,g=c.getContext('2d');
      if(ART[style])ART[style](g,c.width,c.height,a.seed);else g.putImageData(a.classic,0,0);
      a.tex.needsUpdate=true;
    });
  }
  return {colliders,animate,groundAt,drawNeon,setTime,setStools,setSnow,setTint,setArt};
}
