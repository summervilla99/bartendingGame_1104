import {canvasTex} from './three-utils.js';

/* Colour-field wall paintings in the manner of Mark Rothko: two or three soft-edged, glowing rectangles floating on a stained ground.
   Drawn in code (homages, not copies): feathered rectangles built up in many thin translucent layers, then a fine canvas grain.
   The palette is the bar's own: oxblood, forest green, burnt orange, umber and brass. */
export const ROTHKO=[
  {id:'oxblood', title:{ko:'무제 (옥스블러드)',en:'Untitled (Oxblood)'},     ground:'#3b0e12',blocks:[[.10,.40,'#a3261d'],[.52,.38,'#5c1015']]},
  {id:'forest',  title:{ko:'무제 (포레스트)',en:'Untitled (Forest)'},       ground:'#0d2a20',blocks:[[.09,.44,'#2c7a52'],[.57,.33,'#103d2b']]},
  {id:'ember',   title:{ko:'무제 (불씨)',en:'Untitled (Ember)'},            ground:'#2b0b0b',blocks:[[.08,.30,'#d98a2b'],[.42,.22,'#b8431a'],[.70,.22,'#6a1414']]},
  {id:'seagram', title:{ko:'무제 (검은 마호가니)',en:'Untitled (Black on Mahogany)'},ground:'#4d1418',blocks:[[.12,.34,'#190a0b'],[.55,.34,'#2a0d10']]},
  {id:'umber',   title:{ko:'무제 (황동빛)',en:'Untitled (Brass)'},          ground:'#2a190b',blocks:[[.10,.36,'#c4923f'],[.53,.36,'#6b3f16']]},
  {id:'garnet',  title:{ko:'무제 (가넷과 초록)',en:'Untitled (Garnet and Green)'},ground:'#5a1219',blocks:[[.12,.30,'#1f5b3f'],[.50,.40,'#8f1d2a']]}
];

const mkRnd=seed=>{let s=seed|0||1;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};};

function paint(g,w,h,def,r){
  g.fillStyle=def.ground;g.fillRect(0,0,w,h);
  // the ground is stained, never flat: faint vertical washes
  for(let i=0;i<40;i++){g.fillStyle='rgba('+(r()<.5?'0,0,0':'255,200,150')+','+(.015+r()*.02)+')';g.fillRect(r()*w,0,w*(.05+r()*.2),h);}
  def.blocks.forEach(([y0,hh,col],bi)=>{
    const x0=w*.1,x1=w*.9;
    for(let k=0;k<26;k++){                                   // thin layers with slightly wandering edges = the breathing edge
      g.save();g.shadowColor=col;g.shadowBlur=w*.045;g.globalAlpha=.07+r()*.05;g.fillStyle=col;
      const jx=w*.02,jy=h*.015;
      g.fillRect(x0+(r()-.5)*jx*2,h*y0+(r()-.5)*jy*2,x1-x0+(r()-.5)*jx*2,h*hh+(r()-.5)*jy*2);
      g.restore();
    }
    g.save();g.globalAlpha=.16;                              // a lighter breath inside each block
    const gr=g.createLinearGradient(0,h*y0,0,h*(y0+hh));gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,230,200,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(x0+w*.03,h*y0+h*.02,x1-x0-w*.06,h*hh-h*.04);g.restore();
  });
  for(let i=0;i<9000;i++){g.fillStyle='rgba('+(r()<.5?'0,0,0':'255,235,210')+','+(.03+r()*.05)+')';g.fillRect(r()*w,r()*h,1+r()*1.5,1+r()*5);}   // canvas grain
}

/* a canvas texture for one painting */
export function rothkoTex(id,w=360,h=480){
  let seed=0;for(const c of id)seed=(seed*31+c.charCodeAt(0))|0;
  const r=mkRnd(Math.abs(seed)+11);
  const def=ROTHKO.find(m=>m.id===id)||ROTHKO[0];
  return canvasTex(w,h,(g,cw,ch)=>{
    paint(g,cw,ch,def,r);
    const vg=g.createRadialGradient(cw/2,ch/2,ch*.35,cw/2,ch/2,ch*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,4,2,.35)');g.fillStyle=vg;g.fillRect(0,0,cw,ch);
  });
}
