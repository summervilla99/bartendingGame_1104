import {canvasTex} from './three-utils.js';

/* Impressionist wall paintings in the manner of Claude Monet (water lilies, Impression Sunrise, the Japanese footbridge, haystacks, a poppy field).
   They are drawn in code, not copies of the originals: a simple colour sketch of the scene is painted first, then re-painted with thousands of short brush strokes
   whose colours are sampled from the sketch and nudged, which gives the broken, shimmering colour of impressionism. */
export const MONET=[
  {id:'lilies',   title:{ko:'수련',en:'Water Lilies'}},
  {id:'sunrise',  title:{ko:'인상, 해돋이',en:'Impression, Sunrise'}},
  {id:'bridge',   title:{ko:'일본식 다리',en:'The Japanese Footbridge'}},
  {id:'haystacks',title:{ko:'건초더미',en:'Haystacks'}},
  {id:'poppies',  title:{ko:'개양귀비 들판',en:'Poppy Field'}},
  {id:'dusk',     title:{ko:'저녁의 수련 연못',en:'Water Lily Pond at Dusk'}}
];

const mkRnd=seed=>{let s=seed|0||1;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const grad=(g,x0,y0,x1,y1,stops)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,c])=>gr.addColorStop(o,c));return gr;};

/* the sketches ------------------------------------------------------------------- */
const SKETCH={
  lilies:(g,w,h,r)=>{
    g.fillStyle=grad(g,0,0,0,h,[[0,'#2b476b'],[.35,'#6f8fb4'],[.65,'#8fb0a0'],[1,'#2d5a4c']]);g.fillRect(0,0,w,h);
    for(let i=0;i<60;i++){g.fillStyle='rgba('+(30+r()*30|0)+','+(80+r()*50|0)+','+(60+r()*30|0)+','+(.35+r()*.3)+')';g.fillRect(r()*w,r()*h*.32,3+r()*6,h*(.06+r()*.2));}   // reflected willows
    for(let i=0;i<26;i++){const x=r()*w,y=h*(.34+r()*.62),rx=22+r()*50,ry=rx*(.18+r()*.1);
      g.fillStyle=r()<.5?'#3f7f4a':'#5f9c62';g.beginPath();g.ellipse(x,y,rx,ry,0,.2,Math.PI*2-.1);g.fill();
      if(r()<.55){g.fillStyle=r()<.6?'#f2a3c4':'#f8eef2';g.beginPath();g.ellipse(x+rx*.2,y-ry*.3,rx*.2,ry*.5,0,0,Math.PI*2);g.fill();}}
    for(let i=0;i<8;i++){g.fillStyle='rgba(215,228,245,.35)';g.beginPath();g.ellipse(r()*w,h*(.4+r()*.5),40+r()*60,6+r()*8,0,0,Math.PI*2);g.fill();}
  },
  dusk:(g,w,h,r)=>{
    g.fillStyle=grad(g,0,0,0,h,[[0,'#3a2f5f'],[.4,'#8a5c8c'],[.7,'#c07a7a'],[1,'#3a2f50']]);g.fillRect(0,0,w,h);
    for(let i=0;i<50;i++){g.fillStyle='rgba('+(40+r()*30|0)+','+(40+r()*30|0)+','+(80+r()*30|0)+','+(.3+r()*.3)+')';g.fillRect(r()*w,r()*h*.35,3+r()*6,h*(.06+r()*.2));}
    for(let i=0;i<24;i++){const x=r()*w,y=h*(.38+r()*.58),rx=24+r()*55,ry=rx*(.17+r()*.1);
      g.fillStyle=r()<.5?'#4a5f6f':'#5f7a7a';g.beginPath();g.ellipse(x,y,rx,ry,0,.2,Math.PI*2-.1);g.fill();
      if(r()<.5){g.fillStyle=r()<.5?'#f0b0a0':'#f6d4e0';g.beginPath();g.ellipse(x+rx*.2,y-ry*.3,rx*.2,ry*.5,0,0,Math.PI*2);g.fill();}}
    for(let i=0;i<10;i++){g.fillStyle='rgba(255,170,130,.3)';g.beginPath();g.ellipse(r()*w,h*(.4+r()*.5),50+r()*70,5+r()*7,0,0,Math.PI*2);g.fill();}
  },
  sunrise:(g,w,h,r)=>{
    g.fillStyle=grad(g,0,0,0,h*.55,[[0,'#7f93a6'],[1,'#c9b9a6']]);g.fillRect(0,0,w,h*.55);
    g.fillStyle=grad(g,0,h*.55,0,h,[[0,'#6c7e8e'],[1,'#3f4d5e']]);g.fillRect(0,h*.55,w,h*.45);
    g.fillStyle='rgba(60,70,85,.45)';for(let i=0;i<7;i++)g.fillRect(w*(.04+i*.04),h*(.3+r()*.08),3,h*.25);                         // cranes in the haze
    g.fillStyle='rgba(90,98,112,.55)';g.fillRect(0,h*.5,w*.45,h*.08);
    const sx=w*.56,sy=h*.44;const gl=g.createRadialGradient(sx,sy,0,sx,sy,h*.3);gl.addColorStop(0,'rgba(255,170,90,.7)');gl.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=gl;g.fillRect(0,0,w,h);
    g.fillStyle='#ff6a1a';g.beginPath();g.arc(sx,sy,h*.065,0,Math.PI*2);g.fill();
    for(let i=0;i<22;i++){const y=h*(.56+i*.018),ww=h*(.09-i*.002)+r()*6;g.fillStyle='rgba(255,120,40,'+(.7-i*.025)+')';g.fillRect(sx-ww/2+r()*8-4,y,ww,h*.012);}   // the orange reflection
    g.fillStyle='#232a35';[[.36,.7,60],[.7,.64,46],[.18,.78,70]].forEach(([bx,by,bw])=>{g.beginPath();g.ellipse(w*bx,h*by,bw*.5,5,0,0,Math.PI*2);g.fill();g.fillRect(w*bx-1,h*by-30,2,28);});
  },
  bridge:(g,w,h,r)=>{
    g.fillStyle='#244f30';g.fillRect(0,0,w,h);
    g.fillStyle='#a9c2d2';g.fillRect(0,0,w*.28,h*.22);
    for(let i=0;i<110;i++){const gcol=['#2f6a3a','#3f8548','#1f4a2c','#6aa05a','#a0b85a'][i%5];g.fillStyle=gcol;g.beginPath();g.ellipse(r()*w,r()*h*.62,18+r()*40,12+r()*26,r()*3,0,Math.PI*2);g.fill();}
    g.fillStyle=grad(g,0,h*.58,0,h,[[0,'#3a6f6a'],[1,'#2a5a52']]);g.fillRect(0,h*.58,w,h*.42);
    g.strokeStyle='#8fae94';g.lineWidth=h*.045;g.beginPath();g.moveTo(w*.08,h*.62);g.quadraticCurveTo(w*.5,h*.28,w*.92,h*.62);g.stroke();     // the arched bridge
    g.strokeStyle='#d8e4d4';g.lineWidth=3;for(let i=0;i<=12;i++){const t=i/12,x=w*(.08+.84*t),y=h*(.62-.34*(1-Math.pow(2*t-1,2))*.5*2*.5)-h*.05;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+h*.07);g.stroke();}
    for(let i=0;i<18;i++){const x=r()*w,y=h*(.66+r()*.3);g.fillStyle=r()<.5?'#5f9d5e':'#3f7c4c';g.beginPath();g.ellipse(x,y,24+r()*30,6+r()*5,0,0,Math.PI*2);g.fill();if(r()<.6){g.fillStyle='#f0a6c6';g.beginPath();g.arc(x,y-2,4+r()*3,0,Math.PI*2);g.fill();}}
  },
  haystacks:(g,w,h,r)=>{
    g.fillStyle=grad(g,0,0,0,h*.62,[[0,'#4b3d6e'],[.5,'#c8788c'],[1,'#f4b476']]);g.fillRect(0,0,w,h*.62);
    g.fillStyle='#6a5a78';g.fillRect(0,h*.55,w,h*.08);
    g.fillStyle=grad(g,0,h*.6,0,h,[[0,'#d9a65a'],[1,'#a8683c']]);g.fillRect(0,h*.6,w,h*.4);
    for(let i=0;i<14;i++){g.fillStyle='rgba(110,80,140,.35)';g.beginPath();g.ellipse(r()*w,h*(.65+r()*.3),50+r()*80,5+r()*6,0,0,Math.PI*2);g.fill();}
    [[.3,.66,.17],[.68,.7,.22]].forEach(([cx,cy,s])=>{const sw=w*s,sh=h*s*1.3;
      g.fillStyle='rgba(95,70,125,.55)';g.beginPath();g.ellipse(cx*w+sw*.7,cy*h+sh*.5,sw*.9,sh*.12,0,0,Math.PI*2);g.fill();
      g.fillStyle='#e9a85e';g.beginPath();g.moveTo(cx*w-sw/2,cy*h+sh*.5);g.quadraticCurveTo(cx*w-sw/2,cy*h-sh*.5,cx*w,cy*h-sh*.55);g.quadraticCurveTo(cx*w+sw/2,cy*h-sh*.5,cx*w+sw/2,cy*h+sh*.5);g.closePath();g.fill();
      g.fillStyle='rgba(120,80,140,.5)';g.beginPath();g.moveTo(cx*w+sw*.05,cy*h-sh*.54);g.quadraticCurveTo(cx*w+sw/2,cy*h-sh*.5,cx*w+sw/2,cy*h+sh*.5);g.lineTo(cx*w+sw*.1,cy*h+sh*.5);g.closePath();g.fill();});
  },
  poppies:(g,w,h,r)=>{
    g.fillStyle=grad(g,0,0,0,h*.42,[[0,'#8db8e4'],[1,'#d4e6f2']]);g.fillRect(0,0,w,h*.42);
    for(let i=0;i<9;i++){g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.ellipse(r()*w,h*(.06+r()*.26),30+r()*60,8+r()*12,0,0,Math.PI*2);g.fill();}
    g.fillStyle='#3d6e3c';g.fillRect(0,h*.4,w,h*.07);for(let i=0;i<10;i++){g.beginPath();g.ellipse(w*(.05+i*.1),h*.4,20+r()*14,26+r()*16,0,0,Math.PI*2);g.fill();}
    g.fillStyle='#d98a4a';g.fillRect(w*.58,h*.41,w*.08,h*.04);
    g.fillStyle=grad(g,0,h*.44,0,h,[[0,'#8db35a'],[1,'#4f8a3a']]);g.fillRect(0,h*.44,w,h*.56);
    for(let i=0;i<40;i++){g.fillStyle='rgba(215,220,90,.35)';g.beginPath();g.ellipse(r()*w,h*(.5+r()*.45),20+r()*40,4+r()*6,0,0,Math.PI*2);g.fill();}
    for(let i=0;i<520;i++){const y=h*(.46+Math.pow(r(),.7)*.52),s=1.5+(y/h-.4)*9;g.fillStyle=r()<.85?'#d9362a':'#f06a3a';g.beginPath();g.arc(r()*w,y,s*(.6+r()*.6),0,Math.PI*2);g.fill();}
    g.fillStyle='#2a2438';g.beginPath();g.ellipse(w*.8,h*.7,5,14,0,0,Math.PI*2);g.fill();g.fillStyle='#f4e8f0';g.beginPath();g.ellipse(w*.8,h*.62,18,8,.2,Math.PI,0);g.fill();
  }
};

/* turn a sketch into broken-colour brush strokes */
function impressionize(g,w,h,sketch,dir,r){
  const src=document.createElement('canvas');src.width=w;src.height=h;const sg=src.getContext('2d');sketch(sg,w,h,r);
  const data=sg.getImageData(0,0,w,h).data;
  g.drawImage(src,0,0);                                          // a soft base so no gap shows through
  const pass=(n,len,wid,jit,angle)=>{
    for(let i=0;i<n;i++){
      const x=r()*w,y=r()*h,k=((y|0)*w+(x|0))*4;
      let R=data[k],G=data[k+1],B=data[k+2];
      R+=(r()-.5)*jit;G+=(r()-.5)*jit;B+=(r()-.5)*jit;
      if(r()<.08){R+=30;B+=18;}else if(r()<.08){G+=14;B+=34;}  // warm and cool accents: the shimmer
      g.strokeStyle='rgb('+Math.max(0,Math.min(255,R|0))+','+Math.max(0,Math.min(255,G|0))+','+Math.max(0,Math.min(255,B|0))+')';
      g.lineWidth=wid*(.7+r()*.6);g.lineCap='round';
      const a=angle+(r()-.5)*.6,l=len*(.6+r()*.8);
      g.beginPath();g.moveTo(x-Math.cos(a)*l/2,y-Math.sin(a)*l/2);g.lineTo(x+Math.cos(a)*l/2,y+Math.sin(a)*l/2);g.stroke();
    }
  };
  const base=dir==='v'?Math.PI/2:dir==='d'?-.5:0;
  pass(1500,26,13,16,base);
  pass(4200,13,6.5,26,base);
  pass(4200,6.5,3.2,34,base+.2);
}

/* a canvas texture for one painting; aspect w:h chosen by the caller */
export function monetTex(id,w=512,h=360){
  let seed=0;for(const c of id)seed=(seed*31+c.charCodeAt(0))|0;
  const r=mkRnd(Math.abs(seed)+7);
  return canvasTex(w,h,(g,cw,ch)=>{
    impressionize(g,cw,ch,SKETCH[id]||SKETCH.lilies,id==='lilies'||id==='dusk'||id==='sunrise'?'h':id==='haystacks'?'d':'v',r);
    const vg=g.createRadialGradient(cw/2,ch/2,ch*.3,cw/2,ch/2,cw*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,10,5,.28)');g.fillStyle=vg;g.fillRect(0,0,cw,ch);   // an aged varnish glow at the edges
  });
}
