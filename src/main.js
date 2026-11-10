import * as THREE from 'three';
import './styles.css';
import {clamp,lerp,ease,rand,pick,won,reduceMotion} from './util.js';
import {M,lathe} from './three-utils.js';
import {INGR,ING,RECIPES,GARNISH,GARNISH_NAME,GLASS_NAME,METHOD_NAME,CATS,serveOf,ratioOf} from './data.js';
import {t,tr,getLang,setLang,onLang,applyDom} from './i18n.js';
import {fmtVol,fmtRatio} from './units.js';
import {makeGlass,makeGarnish,makeShaker,GL} from './glass.js';
import {NIGHTS,CHARS as TALE_CHARS} from './story/nights.js';
import {newState as taleNew,begin as taleBegin,view as taleView,advance as taleAdvance,pick as talePick,served as taleServedEv,drainEvents as taleDrain,retry as taleRetry} from './story/engine.js';
import {loadTale,commitNight} from './story/save.js';
import {createTaleUI} from './tale-ui.js';
import {makeProp} from './props.js';
import {createFx} from './fx.js';
import {buildXmas} from './xmas.js';
import {makeCat} from './cat.js';
import {portraitOf} from './portrait.js';
import {createStillStage} from './still-stage.js';
import {STILLS} from './story/stills.js';
import {loadBook,saveBook,recordServe} from './book.js';
import {setSantaHats,makeCharacter,setFace,poseSit,poseWalk,reachArm,resetArms,GUEST_CFG,LOUNGE_CFG,PLAYER_CFG,BARTENDER_CFG} from './figures.js';
import {Snd} from './audio.js';
import {buildEnv} from './env.js';
import {createComposer} from './composer.js';
import {buildRoom,brass,COUNTER_TOP,STOOL_Z,BAR_ZONE,ROOM} from './room.js';
import {makeBottle} from './bottles.js';
import {TIMES,loadSession,saveSession,poolFor,STAGES,stageOf,goalOf,limitOf,DIFFS,clearStage} from './session.js';
import {quip} from './game/quips.js';
import {patienceOf,breakCombo} from './game/bonus.js';
import {createZoom} from './zoom.js';
import {createStart} from './start.js';
import {createTransport} from './net/transport.js';
import {createRoom,makeCode,normalizeCode} from './net/room.js';
import {smooth as smoothPeer,EMOTES,EMOTE_MS,CHAT_SHOW_MS} from './net/peers.js';
import {SEATS,seatByWireId,PHOTO_SPOTS,layoutStools,isFree,setLoungeTaken,canOrderFrom,dropFor} from './game/seats.js';
import {claimSeat,releaseClaim,expireClaims,applyServed,autoServe,hostMissing,electHost,acceptSnapshot,parseGameMessage,tipFor,placeOrder,fireLate,FIRE_COOLDOWN} from './game/shared.js';
import {createWorld,tickOrders,releaseSeat,nightOver as worldNightOver,nightSummary,snapshot} from './game/world.js';
import {startDrink,pourStep,clearPour,shakeStroke,stirTurn,setGarnish,serveDrink as gameServe,settleDrink,pourVesselOf,RECIPE_BY_ID} from './game/bartending.js';
import {createPlayer} from './player.js';

const $=s=>document.querySelector(s);

/* ───────────── renderer / composer ───────────── */
const stageEl=$('#app'),canvas=$('#gl');
let W=stageEl.clientWidth||innerWidth,H=stageEl.clientHeight||innerHeight;
const PR=Math.min(window.devicePixelRatio||1,1.75);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(PR);
renderer.setSize(W,H,false);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b0504);
scene.fog=new THREE.FogExp2(0x120806,0.024);
const camera=new THREE.PerspectiveCamera(50,W/H,.08,60);
const {composer,finalPass}=createComposer(renderer,scene,camera,W,H,PR);
buildEnv(renderer,scene);

function cyl(rt,rb,h,mat,x,y,z,parent,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),mat);m.position.set(x,y,z);(parent||scene).add(m);return m;}

/* ───────────── room ───────────── */
const room=buildRoom(scene);
const fx=createFx(scene),xmas=buildXmas(scene);
const treeCol={min:new THREE.Vector3(-9.85,0,-1.8),max:new THREE.Vector3(-8.15,2.4,-.1)},treeBox={min:treeCol.min.clone(),max:treeCol.max.clone()};
room.colliders.push(treeCol);                       // the tree stands in the back-left corner beside the bar's right end (bartender's view), clear of the walkway; solid only while shown
const cat=makeCat();cat.group.position.set(-4.55,COUNTER_TOP,.12);cat.group.userData.baseY=COUNTER_TOP;cat.group.rotation.y=.35;scene.add(cat.group);
/* Christmas decoration: on by default, remembered once the player switches it */
const XMAS_KEY='courte.xmas';
let xmasOn=(()=>{try{return localStorage.getItem(XMAS_KEY)!=='off';}catch(_){return true;}})();
function setXmas(on,save){
  xmasOn=!!on;
  const show=xmasOn&&!(S.session&&S.session.mode==='tale');           // the story keeps its own quiet look
  xmas.setOn(show);cat.setXmas(show);setSantaHats(show);room.setSnow(show);document.body.classList.toggle('xmas',show);
  treeCol.min.copy(show?treeBox.min:new THREE.Vector3(1e4,0,1e4));treeCol.max.copy(show?treeBox.max:new THREE.Vector3(1e4+.1,.1,1e4+.1));
  const row=document.getElementById('row-xmas');if(row)row.hidden=!!(S.session&&S.session.mode==='tale');
  const b=document.getElementById('btn-xmas');if(b){b.textContent=t(xmasOn?'xmas_on':'xmas_off');b.setAttribute('aria-pressed',xmasOn?'true':'false');}
  if(save){try{localStorage.setItem(XMAS_KEY,xmasOn?'on':'off');}catch(_){}}
}

/* bar spoon (the shaker is built per drink) */
const spoon=new THREE.Group();
cyl(.004,.004,.44,brass,0,.22,0,spoon,8);
cyl(.016,.012,.02,brass,0,.01,0,spoon,12);
spoon.visible=false;scene.add(spoon);

/* ───────────── people ───────────── */
function makeNpc(cfg,i,seat){
  const fig=makeCharacter(cfg);
  if(seat==='stool'){fig.position.set(cfg.x,-.11,STOOL_Z);fig.rotation.y=Math.PI;poseSit(fig,.95);}
  else{fig.position.set(cfg.pos[0],-.46,cfg.pos[2]);fig.rotation.y=cfg.yaw;poseSit(fig,.25);}
  scene.add(fig);
  const p=fig.position;
  const npc={cfg,baseCfg:cfg,styled:false,x:p.x,fig,seat,active:true,nameOv:null,noTalk:false,order:null,orderAt:0,reaction:null,talk:null,talkIdx:0,drink:null,cheer:0,ph:i*1.7,
    anchor:new THREE.Vector3(p.x,seat==='stool'?1.95:1.55,p.z),baseYaw:fig.rotation.y};
  Object.defineProperty(npc,'name',{get:()=>tr(npc.nameOv||cfg.nm)});
  return npc;
}
const guests=GUEST_CFG.map((c,i)=>makeNpc(c,i,'stool'));
const loungers=LOUNGE_CFG.map((c,i)=>makeNpc(c,i+4,'lounge'));
const npcs=guests.concat(loungers);
guests.forEach((g,i)=>{g.seatId='g'+i;});
/* Seated players who ordered: same shape as a guest (order, claim, served drink) but no figure; g4-g7 in the world. */
const proxies=[0,1,2,3].map(i=>({seatId:'g'+(4+i),name:'',x:0,order:null,orderAt:0,reaction:null,drink:null,cheer:0,claimBy:null,claimName:'',servedRev:0,askedOrder:false,proxy:true}));
const allSeats=guests.concat(proxies);

const bartender=makeCharacter(BARTENDER_CFG);bartender.position.set(-3.6,0,-1.95);scene.add(bartender);
room.colliders.push({min:new THREE.Vector3(-3.85,0,-2.26),max:new THREE.Vector3(-3.35,2,-1.72)});

const playerFig=makeCharacter(PLAYER_CFG);scene.add(playerFig);
const player=createPlayer({fig:playerFig,colliders:room.colliders,groundAt:room.groundAt,canvas,joyEl:$('#joy'),ceiling:ROOM.h});

/* ingredient bottles on the counter rail */
const RAIL_Z=-.5,RAIL_Y=COUNTER_TOP+.02;
[[-1.4,2.0],[1.4,2.0]].forEach(([x,w])=>{const r=new THREE.Mesh(new THREE.BoxGeometry(w,.03,.3),M(0x1b1210,{roughness:.35,metalness:.6,envMapIntensity:.9}));r.position.set(x,COUNTER_TOP+.015,RAIL_Z);r.receiveShadow=true;scene.add(r);});
const labelCanvases={};
function paintLabel(ing){
  const c=labelCanvases[ing.id],g=c.getContext('2d');
  g.fillStyle='#f0e2c4';g.fillRect(0,0,256,128);
  g.fillStyle=ing.lab;g.fillRect(0,0,256,24);g.fillRect(0,104,256,24);
  g.fillStyle='#1a0f0c';g.textAlign='center';g.textBaseline='middle';
  let sz=56;g.font=sz+'px "Black Han Sans","Apple SD Gothic Neo",sans-serif';
  while(g.measureText(ing.name).width>226&&sz>22){sz-=3;g.font=sz+'px "Black Han Sans","Apple SD Gothic Neo",sans-serif';}
  g.fillText(ing.name,128,66);
  ing.labelTex.needsUpdate=true;
}
const bottles=INGR.map((ing,i)=>{
  const lc=document.createElement('canvas');lc.width=256;lc.height=128;labelCanvases[ing.id]=lc;
  ing.labelTex=new THREE.CanvasTexture(lc);ing.labelTex.anisotropy=8;
  const g=makeBottle(ing.bottle,{flip:true,scale:ing.small?.72:1,labelMap:ing.labelTex});
  const home=new THREE.Vector3(i<6?-.68-.28*i:.68+.28*(i-6),RAIL_Y,RAIL_Z);
  g.position.copy(home);g.userData.ingId=ing.id;scene.add(g);
  return {id:ing.id,cat:ing.cat,group:g,home,t:0,h:g.userData.h,side:-1,show:0,vis:0,baseScale:g.scale.x};
});
const portraitNow=()=>W/H<.85;
/* Only the active category's bottles stand on the rails (half left, half right, work area stays free). */
function layoutRail(snap){
  const list=bottles.filter(b=>b.cat===S.tab),pt=portraitNow(),sp=pt?.2:.28,x0=pt?.52:.68,nL=Math.ceil(list.length/2);
  list.forEach((b,i)=>{const left=i<nL,k=left?i:i-nL;b.home.set(left?-(x0+sp*k):x0+sp*k,RAIL_Y,RAIL_Z);b.side=left?-1:1;b.show=1;if(snap)b.vis=1;});
  bottles.forEach(b=>{if(b.cat!==S.tab){b.show=0;if(snap)b.vis=0;}});
  if(snap)updateRail(0);
}
function updateRail(dt){
  bottles.forEach(b=>{
    const d=b.show-b.vis;
    b.vis=Math.abs(d)<.01?b.show:b.vis+d*Math.min(1,dt*9);
    b.group.scale.setScalar(Math.max(.001,b.baseScale*b.vis));b.group.visible=b.vis>.02;
  });
}
function paintAllLabels(){INGR.forEach(paintLabel);}
paintAllLabels();

/* pour stream */
const stream=new THREE.Mesh(new THREE.CylinderGeometry(.015,.013,1,10),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9}));
stream.visible=false;scene.add(stream);

/* ───────────── game state ───────────── */
const S={mode:'walk',stage:null,guest:null,recipe:null,poured:{},total:0,vessel:null,serv:null,garnish:null,garnishObj:null,
  pourId:null,mixProg:0,mixCount:0,stirAngle:0,stirAcc:0,drag:null,strainT:0,serveT:0,result:null,tips:0,orderNo:0,action:null,tab:'spirit',mixKey:null};
layoutRail(true);
let dirtyUI=true,time=0;
/* Session: the serialisable night config (hour, menu family, mode, guide) + runtime pieces derived from it. */
S.paused=true;S.session=null;S.time=TIMES.prime;S.world=null;S.drink=null;
S.seat=null;S.emote=null;S.photo=null;S.myChat=null;S.barEnd=null;S.firedUntil=0;
S.synced=true;S.claimSeat=null;S.claimInfo=null;S.summaryFor=null;S.lastBeat=0;S.syncWait=0;
const VP=new THREE.Vector3(.25,COUNTER_TOP,-.05),SP=new THREE.Vector3(-.35,COUNTER_TOP,-.05);
const BAR_STAND=new THREE.Vector3(0,0,-1.05);

/* ───────────── camera ───────────── */
/* Bartender's point of view: behind the counter looking out at the guests. */
const PRE={bar:{pos:new THREE.Vector3(0,2.5,-2.15),look:new THREE.Vector3(0,1.12,.9),fov:40,off:.1},
  /* portrait phones: higher and steeper so both rails, the work area and the guests fit; scene lifted above the bottom sheet */
  barP:{pos:new THREE.Vector3(0,3.5,-2.1),look:new THREE.Vector3(0,1.15,.25),fov:40,off:.1}};
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3();let camFov=55,camOff=0;
const cam={from:null,t:1,dur:1.1};
const mouse={x:0,y:0},par={x:0,y:0};
const talkView={pos:new THREE.Vector3(),look:new THREE.Vector3(),fov:34,off:.24};
const stillView={pos:new THREE.Vector3(),look:new THREE.Vector3(),fov:40,off:.14};
const photoView={pos:new THREE.Vector3(),look:new THREE.Vector3(),fov:42,off:0};
function camTarget(){if(S.photo)return photoView;if(S.still&&S.mode==='walk')return stillView;if(S.talkCam&&S.mode==='walk')return talkView;return S.mode==='bar'?(portraitNow()?PRE.barP:PRE.bar):player.view;}
function goCam(){cam.from={pos:camPos.clone(),look:camLook.clone(),fov:camFov,off:camOff};cam.t=0;cam.dur=reduceMotion?.01:1.1;}
function fovFor(v0){
  const a=W/H,hf=2*Math.atan(Math.tan(v0*Math.PI/360)*(16/9));
  return clamp(2*Math.atan(Math.tan(hf/2)/a)*180/Math.PI,28,a<.85?92:80);
}
function updateCamera(dt){
  const to=camTarget();
  if(!cam.from){camPos.copy(to.pos);camLook.copy(to.look);camFov=to.fov;camOff=to.off;cam.from={pos:camPos.clone(),look:camLook.clone(),fov:camFov,off:camOff};}
  if(cam.t<1){
    cam.t=Math.min(1,cam.t+dt/cam.dur);const e=ease(cam.t);
    camPos.lerpVectors(cam.from.pos,to.pos,e);camLook.lerpVectors(cam.from.look,to.look,e);camFov=lerp(cam.from.fov,to.fov,e);camOff=lerp(cam.from.off,to.off,e);
  }else{camPos.copy(to.pos);camLook.copy(to.look);camFov=to.fov;camOff=to.off;}
  const k=(reduceMotion||S.mode!=='bar')?0:1;
  par.x=lerp(par.x,mouse.x,Math.min(1,dt*3));par.y=lerp(par.y,mouse.y,Math.min(1,dt*3));
  camera.position.set(camPos.x+par.x*.3*k,camPos.y+par.y*.1*k,camPos.z);
  camera.lookAt(camLook.x+par.x*.12*k,camLook.y,camLook.z);
  const f=fovFor(camFov/(S.mode==='bar'?S.zoom:1));if(Math.abs(camera.fov-f)>.01){camera.fov=f;camera.updateProjectionMatrix();}
  if(camOff>.001)camera.setViewOffset(W,H,0,Math.round(camOff*H),W,H);
  else if(camera.view&&camera.view.enabled)camera.clearViewOffset();
}

/* ───────────── screen zoom: pinch / wheel / slider ───────────── */
S.zoom=1;try{const z=parseFloat(localStorage.getItem('courte.zoom'));if(z>=.6&&z<=1.8)S.zoom=z;}catch(_){}
player.st.zoom=S.zoom;
function setZoom(z){
  S.zoom=clamp(z,.6,1.8);player.st.zoom=S.zoom;
  const r=$('#zoom-range');if(r)r.value=Math.round(S.zoom*100);
  try{localStorage.setItem('courte.zoom',String(S.zoom));}catch(_){}
}
createZoom(canvas,{get:()=>S.zoom,set:setZoom});
/* ───────────── UI helpers ───────────── */
const el={
  tips:$('#tips'),act:$('#btn-act'),actLabel:$('#act-label'),orders:$('#orders'),
  uiWalk:$('#ui-walk'),uiBar:$('#ui-bar'),bubbles:$('#bubbles'),ticket:$('#ticket'),
  tkNo:$('#tk-no'),tkName:$('#tk-name'),tkMeta:$('#tk-meta'),tkLines:$('#tk-lines'),tkExtra:$('#tk-extra'),
  steps:$('#steps'),pPour:$('#panel-pour'),pMix:$('#panel-mix'),pGar:$('#panel-garnish'),
  chips:$('#chips'),gChips:$('#garnish-chips'),mixSay:$('#mix-say'),mixFill:$('#mix-fill'),btnStrain:$('#btn-strain'),
  result:$('#result'),toast:$('#toast'),music:$('#btn-music')
};
let toastTimer=null;
function toast(msg,ms){el.toast.textContent=msg;el.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.toast.classList.remove('show'),ms||1800);}

const chipEls={};
INGR.forEach(ing=>{
  const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.id=ing.id;
  b.innerHTML='<span class="sw" style="background:'+ing.color+'"></span><span class="nm"></span><span class="ml"></span>';b.querySelector('.nm').textContent=ing.name;b.hidden=ing.cat!=='spirit';
  const start=e=>{e.preventDefault();Snd.init();try{b.setPointerCapture(e.pointerId);}catch(_){}startPour(ing.id);};
  const stop=()=>stopPour(ing.id);
  b.addEventListener('pointerdown',start);
  b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);
  b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();Snd.init();startPour(ing.id);}});
  b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')stopPour(ing.id);});
  el.chips.appendChild(b);chipEls[ing.id]=b;
});
const garnEls={};
GARNISH.forEach(gn=>{
  const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.id=gn.id;
  b.innerHTML='<span class="sw" style="background:'+({none:'#d6c3a0',orange:'#e0802a',lime:'#9cc24a',lemon:'#f0d23a',mint:'#3f9a4a',cherry:'#8a1020',beans:'#3a1f12'}[gn.id])+'"></span><span class="nm"></span><span class="ml">&nbsp;</span>';b.querySelector('.nm').textContent=gn.name;
  b.addEventListener('click',()=>{Snd.init();chooseGarnish(gn.id);});
  el.gChips.appendChild(b);garnEls[gn.id]=b;
});

const tabEls={};
CATS.forEach(c=>{
  const b=document.createElement('button');b.type='button';b.className='tab';b.setAttribute('role','tab');b.dataset.cat=c.id;b.textContent=t(c.key);
  b.addEventListener('click',()=>{Snd.init();setTab(c.id);});
  $('#tabs').appendChild(b);tabEls[c.id]=b;
});
function setTab(cat,force){
  if(!force&&S.tab===cat)return;
  stopPour();S.tab=cat;layoutRail(false);
  CATS.forEach(c=>{tabEls[c.id].classList.toggle('on',c.id===cat);tabEls[c.id].setAttribute('aria-selected',c.id===cat?'true':'false');});
  INGR.forEach(ing=>{chipEls[ing.id].hidden=ing.cat!==cat;});
}
setTab('spirit',true);

$('#zoom-range').value=Math.round(S.zoom*100);
$('#zoom-range').addEventListener('input',e=>setZoom(e.target.value/100));
const bubbleEls=npcs.map(()=>{const b=document.createElement('div');b.className='bubble';el.bubbles.appendChild(b);return b;});

function pendingGuests(){return allSeats.filter(g=>g.order&&!g.claimBy).sort((a,b)=>a.orderAt-b.orderAt);}
function updateWalkUI(){
  el.tips.textContent=won(S.world?S.world.tips:0);
  if(S.session&&S.world){
    const ns=$('#night-stat');ns.hidden=false;
    $('#night-lb').textContent='';
    const goalMode=S.session.mode==='service'||S.session.mode==='story';
    const prog=S.tale?t('tale_night',{time:t('time_'+S.time.id),n:S.tale.night.n}):goalMode?t('night_prog',{time:t('time_'+S.time.id),n:S.world.night.served,goal:goalOf(S.session)}):t('night_free',{time:t('time_'+S.time.id)});
    $('#night-prog').textContent=prog+(S.world.combo>=2?'  ·  '+t('combo',{n:S.world.combo}):'');
  }
  el.orders.innerHTML=pendingGuests().map(g=>'<li>'+g.name+'<b>'+g.order.name+'</b>'+(g.rush?'<i class="rush">'+t('rush_tag')+'</i>':'')+'</li>').join('');
}

/* ───────────── orders ───────────── */
const guestById=id=>allSeats[+id.slice(1)];
function updateOrders(){
  if(S.paused)return;
  if(net.active){if(isHost())hostTick();return;}
  const ev=tickOrders(S.world,time);
  if(!ev)return;
  const g=guestById(ev.seatId);
  g.order=RECIPE_BY_ID[ev.recipeId];g.orderAt=time;g.rush=!!ev.rush;
  if(g.drink){scene.remove(g.drink.group);g.drink=null;}
  g.reaction=null;updateWalkUI();
}
const tmpV=new THREE.Vector3();
function talkText(g){return g.talk.rec?t('talk_order',{drink:g.talk.rec.name}):tr(g.cfg.talk)[g.talk.idx%g.cfg.talk.ko.length];}
function updateBubbles(){
  const off=S.mode!=='walk'||cam.t<.7;
  el.bubbles.classList.toggle('off',off);
  if(off)return;
  const rect=canvas.getBoundingClientRect();
  npcs.forEach((g,i)=>{
    const b=bubbleEls[i];let key='',cls='bubble',html='';
    if(!g.active){b.style.display='none';b.dataset.k='';return;}
    if(g.talk&&time<g.talk.until){key='t'+g.talk.idx+(g.talk.rec?g.talk.rec.id:'');cls='bubble talk';html='<small>'+g.name+'</small>'+talkText(g);}
    else if(g.reaction&&time<g.reaction.until){key='r'+g.reaction.si+(g.reaction.q?g.reaction.q.ko:'');cls='bubble react';html='<small>'+g.name+'</small>'+(g.reaction.q?tr(g.reaction.q):t('say'+g.reaction.si));}
    else if(g.order&&g.claimName){key='c'+g.order.id+g.claimName;html='<small>'+g.name+'</small><b>'+g.order.name+'</b><em>'+t('bubble_making',{name:g.claimName})+'</em>';}
    else if(g.order){key='o'+g.order.id+(g.rush?'!':'');html='<small>'+g.name+'</small>'+t('bubble_order',{name:'<b>'+g.order.name+'</b>'})+(g.rush?'<em class="rushb">'+t('rush_bubble')+'</em>':'');}
    if(key)key+=getLang();
    if(!key||g.anchor.distanceTo(camera.position)>15){b.style.display='none';b.dataset.k='';return;}
    if(b.dataset.k!==key){b.dataset.k=key;b.className=cls;b.innerHTML=html;}
    tmpV.copy(g.anchor).project(camera);
    if(tmpV.z>1||tmpV.x<-1.2||tmpV.x>1.2){b.style.display='none';return;}
    const x=(tmpV.x*.5+.5)*rect.width,y=(-tmpV.y*.5+.5)*rect.height-14;
    b.style.display='block';b.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-100%)';
  });
}

/* ───────────── walk-mode interactions ───────────── */
function inBarZone(p){return p.x>BAR_ZONE.x0&&p.x<BAR_ZONE.x1&&p.z>BAR_ZONE.z0&&p.z<BAR_ZONE.z1;}
function nearestNpc(){
  let best=null,bd=1.8;
  npcs.forEach(g=>{if(!g.active||g.noTalk)return;const d=Math.hypot(g.fig.position.x-player.pos.x,g.fig.position.z-player.pos.z);if(d<bd){bd=d;best=g;}});
  return best;
}
function nearestSeat(){
  let best=null,bd=1.1;
  SEATS.forEach((seat,i)=>{
    if(!isFree(seat)||[...net.peers.values()].some(p=>p.st===i+1))return;
    const d=Math.hypot(seat.x-player.pos.x,seat.z-player.pos.z)-(seat.kind==='piano'?.5:0);if(d<bd){bd=d;best=seat;}
  });
  return best;
}
function nearestSpot(){
  let best=null,bd=1.1;
  PHOTO_SPOTS.forEach(sp=>{const d=Math.hypot(sp.x-player.pos.x,sp.z-player.pos.z);if(d<bd){bd=d;best=sp;}});
  return best;
}
function updateAction(){
  updateOrderBtn();
  {const b=$('#btn-music-pick'),show=!!(S.seat&&S.seat.kind==='piano');if(b.hidden===show)b.hidden=!show;}
  let a=null;
  if(S.mode==='walk'&&!S.paused&&!S.photo){
    if(S.seat)a={type:'stand',label:t('act_stand')};
    else if(inBarZone(player.pos)){const n=pendingGuests().length,full=net.active&&S.world.stations.every(Boolean);a=full?{type:'wait',label:t('act_full')}:n?{type:'bar',label:t('act_bar',{n})}:{type:'wait',label:t('act_wait')};}
    else{
      const seat=nearestSeat(),spot=nearestSpot();
      if(seat)a={type:'sit',seat,label:t('act_sit',{name:tr(seat.name)})};
      else if(spot)a={type:'photo',spot,label:t('act_photo',{name:tr(spot.name)})};
      else{const g=nearestNpc();if(g)a={type:'talk',g,label:t('act_talk',{name:g.name})};}
    }
  }
  const key=a?a.type+a.label:'';
  if(key!==(S.actionKey||'')){
    S.actionKey=key;el.act.hidden=!a;
    if(a){el.actLabel.textContent=a.label;el.act.disabled=a.type==='wait';}
  }
  S.action=a;
}
function doAction(){
  const a=S.action;if(!a||S.mode!=='walk')return;
  Snd.init();
  if(a.type==='bar'){const g=pendingGuests()[0];if(g)beginBartending(g);}
  else if(a.type==='sit')sitDown(a.seat);
  else if(a.type==='stand')standUp();
  else if(a.type==='photo')startPhoto(a.spot);
  else if(a.type==='talk'){
    const g=a.g;let rec=null,idx=g.talkIdx;
    if(g.order&&!g.askedOrder){g.askedOrder=true;rec=g.order;}
    else g.talkIdx++;
    g.talk={rec,idx,until:time+4.5};
  }
}

/* ───────────── mode switching ───────────── */
/* the player's own open/close choice on the recipe card is kept for later drinks */
let tkPref=null;
el.ticket.querySelector('summary').addEventListener('click',()=>setTimeout(()=>{tkPref=el.ticket.open;},0));
function enterBar(g){
  Snd.init();
  S.mode='bar';S.guest=g;S.recipe=g.order;S.drink=startDrink(S.world,g.seatId,S.claimInfo?S.claimInfo.orderNo:undefined);g.askedOrder=false;
  player.st.enabled=false;player.st.drag=null;
  playerFig.position.copy(BAR_STAND);playerFig.rotation.y=0;poseWalk(playerFig,0,0,time);
  resetBar();
  el.uiWalk.hidden=true;el.uiBar.hidden=false;el.act.hidden=true;S.actionKey='';
  el.ticket.open=tkPref!==null?tkPref:(window.innerWidth>=900||S.session.mode==='practice'||S.session.mode==='tale');
  setTab(ING[Object.keys(S.recipe.parts)[0]].cat);layoutRail(true);
  goCam();updateTicket();
  S.barLimit=S.world.session.limit>0?patienceOf(S.world.session.limit,g.rush):0;
  S.barEnd=S.barLimit>0?performance.now()+S.barLimit*1000:null;
  $('#bar-timer').hidden=!S.barEnd;
  if(!S.hinted){S.hinted=true;toast(t('toast_hint'),3200);}
}
function leaveBar(){
  if(S.claimSeat){sendAct({k:'unclaim',seat:S.claimSeat});S.claimSeat=null;}
  S.claimInfo=null;S.barEnd=null;$('#bar-timer').hidden=true;
  stopPour();bottles.forEach(b=>{b.t=0;b.group.position.copy(b.home);b.group.rotation.set(0,0,0);});clearBarObjects();S.mode='walk';S.stage=null;S.drag=null;
  el.uiBar.hidden=true;el.uiWalk.hidden=false;el.result.hidden=true;
  resetArms(playerFig);
  player.place(.6,-1.5,0,Math.PI);player.st.enabled=true;player.update(0,time);
  goCam();updateWalkUI();
}
function clearBarObjects(){
  [S.vessel,S.serv,S.shaker].forEach(o=>{if(o&&o.group.parent)o.group.parent.remove(o.group);});
  S.vessel=S.serv=S.shaker=S.src=null;S.garnishObj=null;
  spoon.visible=false;stream.visible=false;
}
function resetBar(){
  clearBarObjects();
  const r=S.recipe;S.stirAngle=0;S.strainT=0;S.serveT=0;S.pourId=null;S.liveId=null;S.mixKey=null;S.strainColor=null;S.shakeOff=0;S.strainStream=false;
  if(r.method==='build'){
    S.vessel=makeGlass(r.glass);S.serv=S.vessel;S.vessel.group.position.copy(VP);
  }else{
    S.vessel=makeGlass(pourVesselOf(r));S.vessel.group.position.copy(VP);
    S.serv=makeGlass(r.glass);S.serv.group.position.copy(SP);
    scene.add(S.serv.group);
  }
  scene.add(S.vessel.group);
  bottles.forEach(b=>{b.t=0;});
  setStage('pour');
  el.mixFill.style.width='0%';
  Object.keys(garnEls).forEach(k=>garnEls[k].classList.remove('sel'));
  dirtyUI=true;
}
function setStage(st){
  S.stage=st;
  const map={pour:'pour',mix:'mix',strain:'mix',garnish:'garnish',serve:'serve'};
  const order=['pour','mix','garnish','serve'],cur=order.indexOf(map[st]);
  [...el.steps.children].forEach(li=>{
    const i=order.indexOf(li.dataset.step);
    li.classList.toggle('on',i===cur);li.classList.toggle('done',i<cur);
    li.hidden=(li.dataset.step==='mix'&&S.recipe&&S.recipe.method==='build');
    if(li.dataset.step==='mix'&&S.recipe&&S.recipe.method!=='build')li.textContent=t(S.recipe.method==='shake'?'step_shake':'step_stir');
  });
  el.pPour.hidden=st!=='pour';el.pMix.hidden=st!=='mix';el.pGar.hidden=st!=='garnish';
}

/* ───────────── ticket ───────────── */
function updateTicket(){
  const r=S.recipe;if(!r)return;
  el.tkNo.textContent=t('ticket_no',{n:S.drink.orderNo,name:S.guest.name});
  $('#tk-tag').hidden=!r.house;
  el.tkName.textContent=r.name;
  const mb=$('#tk-method');mb.textContent=METHOD_NAME[r.method];mb.className='tk-method m-'+r.method;
  $('#tk-why').textContent=t('why_'+r.method);$('#tk-why').className='tk-why m-'+r.method;
  const kn=$('#tk-know'),ra=ratioOf(r),chip=(a,b)=>'<span class="k-chip">'+(a?'<i>'+a+'</i>':'')+b+'</span>';
  kn.innerHTML='<div class="k-row">'+chip('',t('serve_'+serveOf(r.glass)))+(ra?chip(t('k_ratio'),ra):'')+chip('',t('tech_'+r.method))+'</div>'+(r.tip?'<p class="k-tip">'+tr(r.tip)+'</p>':'');
  el.tkMeta.textContent=GLASS_NAME[r.glass]+' · '+(r.garnish==='none'?t('no_garnish'):GARNISH_NAME[r.garnish]);
  const st=$('#tk-story');st.hidden=!r.house;if(r.house)st.textContent=tr(r.story);
  el.tkLines.innerHTML='';
  Object.keys(r.parts).forEach(id=>{
    const li=document.createElement('li');li.dataset.id=id;
    li.innerHTML='<span class="in"></span><span class="amt"></span><div class="meter"><i></i></div>';
    li.querySelector('.in').textContent=ING[id].name;
    el.tkLines.appendChild(li);
  });
  refreshTicket();ticketFade();
}
/* fade the ticket's bottom edge only while there is more to scroll to */
function ticketFade(){const tk=el.ticket;tk.classList.toggle('fade',tk.open&&tk.scrollHeight>tk.clientHeight+2&&tk.scrollTop+tk.clientHeight<tk.scrollHeight-2);}
el.ticket.addEventListener('toggle',ticketFade);el.ticket.addEventListener('scroll',ticketFade);
window.addEventListener('resize',ticketFade);
function refreshTicket(){
  const r=S.recipe;if(!r)return;
  [...el.tkLines.children].forEach(li=>{
    const id=li.dataset.id,tg=r.parts[id],cur=S.drink.poured[id]||0,ratio=cur/tg;
    li.querySelector('.amt').textContent=S.session&&S.session.guide==='instinct'?fmtVol(tg):fmtRatio(cur,tg);
    const bar=li.querySelector('i');bar.style.width=clamp(ratio/1.5*100,0,100)+'%';
    bar.className=ratio>1.1?'over':(ratio>=.9?'ok':'');
  });
  const lv=$('#tk-live'),lid=S.pourId||S.liveId;
  if(S.pourId)S.liveId=S.pourId;
  if(lid&&(S.drink.poured[lid]||0)>0&&S.stage==='pour'){
    const tg=r.parts[lid],cur=S.drink.poured[lid];
    lv.hidden=false;lv.textContent=ING[lid].name+' '+(tg?(S.session&&S.session.guide==='instinct'?fmtVol(cur):fmtRatio(cur,tg)):fmtVol(cur));
  }else lv.hidden=true;
  let extra=0;Object.keys(S.drink.poured).forEach(id=>{if(!(id in r.parts))extra+=S.drink.poured[id];});
  el.tkExtra.hidden=extra<1;if(extra>=1)el.tkExtra.textContent=t('extra_ing',{v:fmtVol(extra)});
  refreshChips();
}

function refreshChips(){INGR.forEach(ing=>{chipEls[ing.id].querySelector('.ml').textContent=fmtVol(S.drink?S.drink.poured[ing.id]||0:0);});}

/* ───────────── pouring ───────────── */
function startPour(id){
  if(S.mode!=='bar'||S.stage!=='pour')return;
  if(S.drink.total>=S.vessel.cap-.5){toast(t('toast_full'));return;}
  S.pourId=id;chipEls[id].classList.add('on');
}
function stopPour(id){
  if(id&&S.pourId!==id)return;
  if(S.pourId&&chipEls[S.pourId])chipEls[S.pourId].classList.remove('on');
  S.pourId=null;Snd.pour(false);
}
function blendColor(){
  let r=0,g=0,b=0,t=0;
  for(const id in S.drink.poured){const c=ING[id].rgb,w=S.drink.poured[id];r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;t+=w;}
  return t?[r/t,g/t,b/t]:null;
}
const THETA=1.72;
function updateBottles(dt){
  const v=S.vessel;
  bottles.forEach(b=>{
    const active=S.mode==='bar'&&S.stage==='pour'&&S.pourId===b.id;
    const target=active?1:0;
    b.t+=(target-b.t)*Math.min(1,dt*(target?7:6));
    if(Math.abs(target-b.t)<.003)b.t=target;
    const e=b.t,g=b.group;
    if(e<=0){g.position.copy(b.home);g.rotation.set(0,0,0);return;}
    const rimTop=v?VP.y+v.rimY:VP.y+.32;
    const poseX=VP.x+b.side*b.h*Math.sin(THETA);
    const poseY=rimTop+.08-b.h*Math.cos(THETA);
    g.position.set(lerp(b.home.x,poseX,e),lerp(b.home.y,poseY,e)+Math.sin(Math.PI*e)*.28,lerp(b.home.z,VP.z,e));
    g.rotation.z=b.side*THETA*e+(active&&b.t>.95?Math.sin(time*34)*.012:0);
    g.rotation.y=0;
  });
  let showStream=false;
  if(S.mode==='bar'&&S.stage==='pour'&&S.pourId){
    const b=bottles.find(x=>x.id===S.pourId);
    if(b&&b.t>.9&&S.drink.total<S.drink.cap){
      showStream=true;
      const rimTop=VP.y+v.rimY,tipY=rimTop+.08,surf=VP.y+v.topY();
      pourStep(S.drink,S.pourId,dt);
      v.setLevel(S.drink.total);v.setColor(blendColor());dirtyUI=true;
      stream.material.color.setRGB.apply(stream.material.color,ING[S.pourId].rgb);
      const len=Math.max(.02,tipY-surf);stream.scale.set(1,len,1);stream.position.set(VP.x,surf+len/2,VP.z);
      Snd.pour(true,S.drink.total/v.cap);
      if(S.drink.total>=v.cap-.01){
        toast(t('toast_full'));
        const c=blendColor()||[.8,.6,.3];fx.burst({x:VP.x,y:v.group.position.y+(v.rimY||.1),z:VP.z,n:26,color:new THREE.Color(c[0],c[1],c[2]).getHex(),speed:.35,up:1.1,gravity:5,life:.7,spread:.03});Snd.splash();   // it brims over
        stopPour();
      }
    }else Snd.pour(false);
  }else if(S.stage==='strain'){
    showStream=S.strainStream;
  }
  stream.visible=showStream;
}

/* ───────────── mixing ───────────── */
function afterPour(){
  if(S.drink.total<1){toast(t('toast_empty'));return;}
  stopPour();
  const r=S.recipe;
  if(r.method==='build'){
    S.vessel.setIce(iceOf(r));
    goGarnish();return;
  }
  setStage('mix');
  if(r.method==='shake'){
    S.vessel.group.visible=false;
    S.shaker=makeShaker();S.shaker.group.position.copy(VP);scene.add(S.shaker.group);S.src=S.shaker;
    Snd.ice();
    S.mixKey='mix_shake';el.mixSay.textContent=t(S.mixKey);
  }else{
    S.vessel.setIce(5);S.src=S.vessel;
    spoon.visible=true;
    S.mixKey='mix_stir';el.mixSay.textContent=t(S.mixKey);
  }
  el.mixFill.style.width='0%';
}
function mixProgress(){
  const D=S.drink;el.mixFill.style.width=(D.mixProg*100)+'%';
  if(D.mixProg>=1&&S.stage==='mix'&&!D.mixDone){D.mixDone=true;toast(t('toast_mixed'));setTimeout(()=>{if(S.stage==='mix')goStrain();},650);}
}
function clientToNdc(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*2-1,y:-((e.clientY-r.top)/r.height)*2+1,cx:e.clientX-r.left,cy:e.clientY-r.top};}
const raycaster=new THREE.Raycaster();
canvas.addEventListener('pointerdown',e=>{
  Snd.init();if(S.mode!=='bar')return;
  const p=clientToNdc(e);
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  if(S.stage==='pour'){
    raycaster.setFromCamera({x:p.x,y:p.y},camera);
    const hit=raycaster.intersectObjects(bottles.filter(b=>b.show&&b.vis>.5).map(b=>b.group),true)[0];
    if(hit){let o=hit.object;while(o&&!o.userData.ingId)o=o.parent;if(o)startPour(o.userData.ingId);}
  }else if(S.stage==='mix'){
    S.drag={lastY:p.cy,midY:p.cy,dir:0,acc:0,counted:false,lastAng:null};
  }
});
canvas.addEventListener('pointermove',e=>{
  const p=clientToNdc(e);mouse.x=p.x;mouse.y=p.y;
  if(S.mode!=='bar'||S.stage!=='mix'||!S.drag)return;
  const d=S.drag;
  if(S.recipe.method==='shake'){
    const dy=p.cy-d.lastY;d.lastY=p.cy;d.midY+=(p.cy-d.midY)*.04;
    S.shakeOff=clamp(-(p.cy-d.midY)/170,-.3,.3);
    const dir=Math.sign(dy);
    if(dir!==0){
      if(dir===d.dir)d.acc+=Math.abs(dy);else{d.dir=dir;d.acc=Math.abs(dy);d.counted=false;}
      if(!d.counted&&d.acc>34){d.counted=true;shakeStroke(S.drink);Snd.shake();mixProgress();}
    }
  }else{
    const c=tmpV.set(VP.x,VP.y+.15,VP.z).project(camera),rect=canvas.getBoundingClientRect();
    const sx=(c.x*.5+.5)*rect.width,sy=(-c.y*.5+.5)*rect.height;
    const dx=p.cx-sx,dy=p.cy-sy,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
    if(d.lastAng!==null&&dist>26){
      let da=ang-d.lastAng;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;
      S.stirAngle+=da;const before=S.drink.stirAcc;stirTurn(S.drink,Math.abs(da));
      if(Math.floor(S.drink.stirAcc/1.6)!==Math.floor(before/1.6))Snd.stir();
      mixProgress();
    }
    d.lastAng=ang;
  }
});
function endDrag(){S.drag=null;S.shakeOff=0;stopPour();}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
window.addEventListener('pointerup',()=>{stopPour();});

function iceFor(glass){const d=GL[glass];return d?(d.bigIce?1:(d.ice||0)):0;}
const iceOf=r=>r.noIce?0:iceFor(r.glass);        // neat whiskey takes no ice
function goStrain(){
  if(S.stage!=='mix')return;
  setStage('strain');S.strainT=0;S.strainStream=false;S.drag=null;
  spoon.visible=false;
  if(S.shaker){S.shaker.cap.visible=false;S.shaker.group.rotation.set(0,0,0);}
  el.pMix.hidden=true;
  S.vessel.setIce(0);S.strainMl=S.drink.total;S.strainColor=blendColor();
  S.serv.setColor(S.strainColor);
}
/* Source vessel tilts about its lip over the serving glass. phi = tilt angle (rad), lip = world point of the lip. */
function poseSource(src,phi,lip){
  const dir=Math.sign(SP.x-VP.x)||1,s=Math.sin(phi),c=Math.cos(phi);
  const ox=dir*(src.rimR*c+src.rimY*s),oy=-src.rimR*s+src.rimY*c;
  src.group.rotation.set(0,0,-dir*phi);
  src.group.position.set(lip.x-ox,lip.y-oy,lip.z);
}
function updateStrain(dt){
  S.strainT=Math.min(1,S.strainT+dt/3.0);
  const t=S.strainT,src=S.src,sv=S.serv,dir=Math.sign(SP.x-VP.x)||1;
  const restLip=new THREE.Vector3(VP.x+dir*src.rimR,VP.y+src.rimY,VP.z);
  const pourLip=new THREE.Vector3(SP.x,SP.y+sv.rimY+.07,SP.z);
  const phiMax=S.shaker?1.55:1.3;
  let phi,lip=new THREE.Vector3(),pl=0;
  if(t<.25){const e=ease(t/.25);phi=.5*e;lip.lerpVectors(restLip,pourLip,e);}
  else if(t<.8){
    const q=ease(clamp((t-.25)/.3,0,1));phi=lerp(.5,phiMax,q);lip.copy(pourLip);
    pl=clamp((t-.33)/.42,0,1);
  }else{const e=ease((t-.8)/.2);phi=phiMax*(1-e);lip.lerpVectors(pourLip,restLip,e);pl=1;}
  poseSource(src,phi,lip);
  S.strainStream=t>.33&&t<.77;
  if(!S.shaker)S.vessel.setLevel(S.strainMl*(1-pl));
  sv.setLevel(S.strainMl*pl);
  if(S.strainStream){
    const surf=SP.y+sv.topY(),len=Math.max(.02,lip.y-surf);
    stream.material.color.setRGB(S.strainColor[0],S.strainColor[1],S.strainColor[2]);
    stream.scale.set(1,len,1);stream.position.set(lip.x,surf+len/2,lip.z);
  }
  if(t>=.35&&sv.ice===0&&iceOf(S.recipe))sv.setIce(iceOf(S.recipe));
  if(t>=1){
    S.strainStream=false;stream.visible=false;
    src.group.rotation.set(0,0,0);src.group.position.set(VP.x+.55,VP.y,VP.z);
    if(S.shaker)S.shaker.cap.visible=true;
    goGarnish();
  }
}
function goGarnish(){
  setStage('garnish');chooseGarnish('none',true);
}
function chooseGarnish(id,silent){
  setGarnish(S.drink,id);
  Object.keys(garnEls).forEach(k=>garnEls[k].classList.toggle('sel',k===id));
  const sv=S.serv;
  if(S.garnishObj&&S.garnishObj.parent)S.garnishObj.parent.remove(S.garnishObj);
  S.garnishObj=null;
  if(id!=='none'){
    const go=makeGarnish(id);
    if(id==='cherry'||id==='beans')go.position.set(.02,sv.level+.005,0);else go.position.set(sv.rimR*.82,sv.rimY+.005,0);
    sv.group.add(go);S.garnishObj=go;
    if(!silent){
      if(id==='orange'){const w=new THREE.Vector3();go.getWorldPosition(w);fx.flame(w.x,w.y+.05,w.z,.7);Snd.flame();}   // flamed orange peel
      else Snd.plop();
    }
  }
}

/* ───────────── serving + scoring ───────────── */
function serveDrink(){
  if(S.stage!=='garnish')return;
  gameServe(S.drink);setStage('serve');S.serveT=0;
  el.pGar.hidden=true;Snd.slide();setTimeout(()=>Snd.clink(.8),330);
}
function updateServe(dt){
  S.serveT=Math.min(1,S.serveT+dt/.9);
  const e=ease(S.serveT),g=S.guest,sv=S.serv;
  const from=S.recipe.method==='build'?VP:SP;
  const tx=clamp(g.x,-1.8,1.8);
  sv.group.position.set(lerp(from.x,tx,e),COUNTER_TOP,lerp(from.z,.5,e));
  if(S.serveT>=1)showResult();
}
function renderResult(){
  const r=S.drink.result,rc=S.recipe,g=S.guest;
  $('#r-who').textContent=t('r_who',{name:g.name});
  $('#r-title').textContent=rc.name;
  $('#r-stars').innerHTML=[0,1,2].map(i=>'<span class="'+(i<r.stars?'on':'')+'">★</span>').join('');
  $('#r-stars').setAttribute('aria-label',t('stars_aria',{n:r.stars}));
  $('#r-say').textContent=S.tale?'':tr(quip(r.stars,S.drink.orderNo*13+r.stars,S.drink.recipeId));
  const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const lines=Object.keys(rc.parts).map(id=>{
    const got=S.drink.poured[id]||0,tg=rc.parts[id],bad=Math.abs(got-tg)>tg*.12;
    return '<li class="'+(bad?'bad':'')+'"><span>'+esc(ING[id].name)+'</span><span>'+fmtRatio(got,tg)+'</span></li>';
  });
  let extra=0;Object.keys(S.drink.poured).forEach(id=>{if(!(id in rc.parts))extra+=S.drink.poured[id];});
  if(extra>=1)lines.push('<li class="bad"><span>'+t('r_extra')+'</span><span>'+fmtVol(extra)+'</span></li>');
  if(rc.method!=='build')lines.push('<li class="'+(r.mix<.9?'bad':'')+'"><span>'+METHOD_NAME[rc.method]+'</span><span>'+Math.round(r.mix*100)+'%</span></li>');
  lines.push('<li class="'+(r.gar?'':'bad')+'"><span>'+t('r_garnish')+'</span><span>'+t(r.gar?'r_match':'r_diff')+'</span></li>');
  $('#r-lines').innerHTML=lines.join('');
  $('#r-tip').textContent=won(r.tip);
}
function showResult(){
  const r=S.drink.result,g=S.guest;
  S.stage='result';S.barEnd=null;$('#bar-timer').hidden=true;
  if(net.active){
    const rawTip=r.tip;r.tip=tipFor(S.world.session,rawTip);S.drink.stage='result';
    sendAct({k:'served',seat:S.drink.seatId,rec:S.drink.recipeId,stars:r.stars,final:r.final,tip:rawTip,ml:S.serv.ml,col:S.strainColor||blendColor()||[.5,.5,.5]});
    S.claimSeat=null;
  }else settleDrink(S.world,S.drink);
  renderResult();
  $('#btn-r-next').disabled=S.tale?false:pendingGuests().filter(x=>x!==g).length<1;
  $('#btn-r-next').textContent=S.tale?t('tale_next'):t('r_next');$('#btn-r-leave').hidden=!!S.tale;
  el.result.hidden=false;
  Snd.clink(1);
  if(r.stars>=2){fx.burst({x:clamp(g.x,-1.8,1.8),y:COUNTER_TOP+.45,z:.5,n:r.stars>=3?70:34,rainbow:r.stars>=3,color:0xffd36a,speed:1.4,up:2.4,gravity:3.2,life:1.3,spread:.1});Snd.cheer(r.stars);}
  {const nb=loadBook(),who=S.tale?null:g.name,rec=S.drink.recipeId,got=recordServe(nb,S.tale?g.name:who,rec,r.stars);saveBook(nb);
    const nm=RECIPE_BY_ID[rec]?RECIPE_BY_ID[rec].name:rec;
    if(got.photo)toast(t('book_new_photo',{who:g.name}),3200);else if(got.coaster)toast(t('book_new_coaster',{name:nm}),3000);else if(got.best)toast(t('book_best',{name:nm}),2600);}
  cat.react(r.stars);if(r.stars!==2)Snd.meow(r.stars);
  g.cheer=1.2;
}
function spawnDrinkProp(g,d){
  const rc=RECIPE_BY_ID[d.recipeId];
  const prop=makeGlass(rc.glass);prop.group.scale.setScalar(.8);
  if(d.drop)prop.group.position.set(d.drop.x,d.drop.y,d.drop.z);else prop.group.position.set(g.x,COUNTER_TOP,.45);       // a cafe table for seats away from the bar
  prop.setLevel(d.ml);prop.setColor(d.col);if(iceOf(rc))prop.setIce(iceOf(rc));
  scene.add(prop.group);if(g.drink)scene.remove(g.drink.group);g.drink=prop;
}
function finishService(){
  const g=S.guest,sv=S.serv,r=S.drink.result;
  scene.remove(sv.group);
  if(S.garnishObj&&S.garnishObj.parent)S.garnishObj.parent.remove(S.garnishObj);
  if(!net.active){
    spawnDrinkProp(g,{recipeId:S.drink.recipeId,ml:sv.ml,col:S.strainColor||blendColor()});
    g.order=null;g.reaction={si:r.stars,until:time+7,q:quip(r.stars,S.drink.orderNo*13+r.stars,S.drink.recipeId)};releaseSeat(S.world,S.drink.seatId,time,r.stars);if(S.tale)g.reaction=null;updateWalkUI();
  }
  S.vessel&&S.vessel.group.parent&&S.vessel.group.parent.remove(S.vessel.group);
  S.vessel=S.serv=null;S.garnishObj=null;
}

/* ───────────── bar-mode per-frame ───────────── */
function updateBarTimer(){
  if(!S.barEnd)return;
  const left=Math.max(0,(S.barEnd-performance.now())/1000),lim=S.barLimit||1;
  const bt=$('#bar-timer');bt.querySelector('.tr i').style.width=(left/lim*100)+'%';bt.querySelector('.ts').textContent=Math.ceil(left)+'s';
  bt.classList.toggle('low',left<10);
  if(left<=0&&(S.stage==='pour'||S.stage==='mix'||S.stage==='strain'||S.stage==='garnish')){
    if(net.active){
      S.firedUntil=performance.now()+FIRE_COOLDOWN*1000;S.claimSeat&&sendAct({k:'unclaim',seat:S.claimSeat});S.claimSeat=null;
      leaveBar();toast(t('fired'),4500);
    }else{                                   // solo: the guest gives up and leaves
      const gu=S.guest;releaseSeat(S.world,gu.seatId,time,0);gu.order=null;
      gu.reaction={si:0,until:time+6,q:{ko:'너무 오래 걸려서 갈게요!',en:'Too slow, I am leaving!'}};
      S.world.night.ordered=Math.max(0,S.world.night.ordered-1);breakCombo(S.world);
      leaveBar();toast(t('guest_left'),4000);updateWalkUI();
    }
  }
}
function updateBar(dt,t){
  updateBarTimer();
  if(S.stage==='pour'||S.stage==='mix'||S.stage==='garnish'||S.stage==='strain'||S.stage==='serve')updateBottles(dt);
  if(S.stage==='mix'&&S.vessel){
    const v=S.vessel;
    if(S.shaker){
      const off=(S.shakeOff||0)*(S.drag?1:0);
      const jx=S.drag?Math.sin(t*38)*.006:0;
      S.shaker.group.position.set(VP.x+jx,VP.y+off+.02,VP.z);
      S.shaker.group.rotation.z=S.drag?Math.sin(t*30)*.04:0;
    }else if(spoon.visible){
      const a=S.stirAngle;
      spoon.position.set(VP.x+Math.cos(a)*.03,VP.y+.014,VP.z+Math.sin(a)*.03);
      spoon.rotation.set(Math.sin(a)*.1,0,-Math.cos(a)*.1);
      v.group.rotation.y=0;
    }
  }
  if(S.stage==='strain')updateStrain(dt);
  if(S.stage==='serve')updateServe(dt);
  updateBartenderArms(dt);
  if(dirtyUI){refreshTicket();dirtyUI=false;}
}

/* Bartender avatar: leans over the counter, hands follow whatever is being handled. */
const REST0=new THREE.Vector3(-.3,COUNTER_TOP+.03,-.55),REST1=new THREE.Vector3(.3,COUNTER_TOP+.03,-.55);
const hT0=new THREE.Vector3(),hT1=new THREE.Vector3();
function updateBartenderArms(dt){
  const u=playerFig.userData,k=Math.min(1,dt*12);
  u.torso.rotation.x=lerp(u.torso.rotation.x,.32,k);u.head.rotation.x=lerp(u.head.rotation.x,.2,k);
  hT0.copy(REST0);hT1.copy(REST1);
  const hold=o=>o.group.localToWorld(new THREE.Vector3(0,(o.rimY||.1)*.5,0));
  if(S.stage==='pour'){
    const b=bottles.find(x=>x.id===S.pourId&&x.t>.2);
    if(b){const p=b.group.localToWorld(new THREE.Vector3(0,b.h*.35/ b.group.scale.x,0));(b.side>0?hT1:hT0).copy(p);}
    else{hT1.copy(VP).add(new THREE.Vector3(.1,.1,-.1));}
  }else if(S.stage==='mix'){
    if(S.shaker){const c=hold(S.shaker);hT0.copy(c).add(new THREE.Vector3(-.05,0,-.02));hT1.copy(c).add(new THREE.Vector3(.05,0,-.02));}
    else{hT1.copy(spoon.position).add(new THREE.Vector3(0,.4,0));hT0.copy(VP).add(new THREE.Vector3(-.18,.1,-.1));}
  }else if(S.stage==='strain'&&S.src){
    const c=hold(S.src);hT0.copy(c).add(new THREE.Vector3(-.05,0,-.02));hT1.copy(c).add(new THREE.Vector3(.05,0,-.02));
  }else if(S.serv){
    const c=S.serv.group.position;hT1.set(c.x+.08,c.y+.1,c.z-.1);
  }
  reachArm(playerFig,0,hT0,k);reachArm(playerFig,1,hT1,k);
}

/* ───────────── people animation ───────────── */
function updateNpcs(dt,t){
  npcs.forEach(g=>{
    const u=g.fig.userData;
    let look=Math.sin(t*.45+g.ph)*.35;
    if(g.talk&&t<g.talk.until&&S.mode==='walk'){
      const a=Math.atan2(player.pos.x-g.fig.position.x,player.pos.z-g.fig.position.z)-g.baseYaw;
      look=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-1.1,1.1);
    }
    u.head.rotation.y=lerp(u.head.rotation.y,look,Math.min(1,dt*4));
    u.head.rotation.z=Math.sin(t*.8+g.ph)*.04;
    u.torso.scale.y=1+Math.sin(t*1.5+g.ph)*.012;
    if(g.cheer>0)g.cheer=Math.max(0,g.cheer-dt);
    const lift=g.cheer>0?Math.sin(Math.min(1,g.cheer/1.2)*Math.PI):0;
    const base=g.seat==='stool'?.95:.25;
    u.arms[1].sh.rotation.x=-(base+lift*1.6);
  });
  if(bartender.visible){
    poseWalk(bartender,0,0,t);
    const u=bartender.userData;
    u.head.rotation.y=Math.sin(t*.5)*.4;
    u.arms[0].sh.rotation.x=-.7+Math.sin(t*2.2)*.08;u.arms[0].el.rotation.x=-1.1;
    u.arms[1].sh.rotation.x=-.6;u.arms[1].el.rotation.x=-1.2+Math.sin(t*2.2+1)*.1;
  }
}
/* ───────────── social: emotes, sitting, chat, photos ───────────── */
function applyEmote(fig,kind,l,t){
  const u=fig.userData,a0=u.arms[0],a1=u.arms[1];
  if(kind==='cheers'){a1.sh.rotation.x=-2.5*l;a1.el.rotation.x=-.6*l;}
  else if(kind==='wave'){a1.sh.rotation.x=-2.7*l;a1.sh.rotation.z=(.35+Math.sin(t*10)*.45)*l;a1.el.rotation.x=-.4*l;}
  else if(kind==='clap'){[a0,a1].forEach((a,i)=>{a.sh.rotation.x=-1.15*l;a.sh.rotation.z=(i?-1:1)*(-.1+Math.sin(t*16)*.28)*l;a.el.rotation.x=-1.5*l;});}
  else if(kind==='bow'){u.torso.rotation.x+=.95*l;u.head.rotation.x+=.35*l;}
  else if(kind==='jump'){fig.position.y+=.55*l;a0.sh.rotation.x=a1.sh.rotation.x=-1.2*l;}
  else if(kind==='dance'){
    const w=Math.sin(t*7);
    a0.sh.rotation.x=-2.3*l*(w>0?1:.25);a1.sh.rotation.x=-2.3*l*(w<0?1:.25);a0.el.rotation.x=a1.el.rotation.x=-.5*l;
    u.torso.rotation.z=w*.2*l;u.head.rotation.z=-w*.25*l;u.pelvis.position.y+=Math.abs(w)*.07*l;
    u.legs[0].h.rotation.x=w*.55*l;u.legs[1].h.rotation.x=-w*.55*l;
  }
}
const relaxArms=fig=>{fig.userData.arms[0].sh.rotation.z=-.06;fig.userData.arms[1].sh.rotation.z=.06;};
function playEmote(kind){
  if(S.mode!=='walk'||S.photo||S.paused)return;
  Snd.init();S.emote={kind,until:performance.now()+EMOTE_MS[kind]};
  if(net.active)net.emote(kind);
  if(kind==='cheers'){
    Snd.clink(1);
    npcs.forEach((g,i)=>{if(g.active&&g.fig.position.distanceTo(player.pos)<5)setTimeout(()=>{g.cheer=1.2;},120+i*110);});
    setTimeout(()=>Snd.clink(.7),380);
    toast(t('toast_cheers'));
  }
}
function updatePlayerPose(){
  const nowT=performance.now();
  if(S.seat){
    playerFig.position.set(S.seat.x,room.groundAt(S.seat.x,S.seat.z)+S.seat.y,S.seat.z);playerFig.rotation.y=S.seat.yaw;poseSit(playerFig,S.seat.lean);
  }
  const e=S.emote;
  if(e&&nowT<e.until)applyEmote(playerFig,e.kind,Math.sin(Math.min(1,(e.until-nowT)/EMOTE_MS[e.kind])*Math.PI),time);
  else{if(e)S.emote=null;relaxArms(playerFig);}
  /* Moving stands you up, but only a fresh push: walking into a sofa with the stick or key still held, then pressing Sit, must not stand you straight back up. */
  if(S.seat){
    const it=player.st.intent;
    if(!S.sitArmed){if(it<.15)S.sitArmed=true;}
    else if(it>.35)standUp();
  }
}
function sitDown(seat){
  if(S.photo||S.mode!=='walk')return;
  S.seat=seat;S.emote=null;S.sitArmed=false;
  player.place(seat.x,seat.z,seat.yaw,seat.yaw+Math.PI);player.pos.y=seat.y;player.st.locked=true;S.actionKey='';
}
function standUp(){
  const seat=S.seat;if(!seat)return;
  S.seat=null;player.st.locked=false;
  player.place(seat.stand.x,seat.stand.z,seat.yaw+Math.PI,seat.yaw);resetArms(playerFig);S.actionKey='';
}
/* ordering from a bar stool (friends mode) */
const myOpenOrder=()=>S.world&&S.world.seats.find(x=>x.customer===net.me.id&&x.order);
function updateOrderBtn(){
  const show=!!(net.active&&canOrderFrom(S.seat)&&S.world&&S.world.session.chairs>0&&!myOpenOrder()&&!S.photo);
  const b=$('#btn-order');if(b.hidden===show)b.hidden=!show;
}
function openOrderMenu(){
  const list=$('#order-list');list.innerHTML='';
  poolFor(S.world.session,RECIPES).forEach(r=>{
    const b=document.createElement('button');b.type='button';b.className='oc';b.dataset.r=r.id;
    const n=document.createElement('b');n.textContent=r.name;
    const m=document.createElement('span');m.className='tk-method m-'+r.method;m.textContent=METHOD_NAME[r.method];
    const g=document.createElement('small');g.textContent=GLASS_NAME[r.glass];
    b.append(n,m,g);list.appendChild(b);
  });
  $('#order-menu').hidden=false;
}
$('#btn-order').addEventListener('click',openOrderMenu);
$('#order-close').addEventListener('click',()=>{$('#order-menu').hidden=true;});
$('#order-list').addEventListener('click',e=>{
  const b=e.target.closest('button[data-r]');if(!b)return;
  $('#order-menu').hidden=true;
  const r=sendAct({k:'order',rec:b.dataset.r});
  if(!(r&&!r.ok))toast(t('order_sent'),2500);else toast(t('order_full'));
});
/* music: the piano bench opens a picker; in a room the choice is shared */
S.musicSeen=null;
function refreshMusicUI(){
  const g=S.world&&S.world.session.music||Snd.genre;
  document.querySelectorAll('#genre-seg [data-g]').forEach(b=>b.classList.toggle('on',b.dataset.g===g&&Snd.on));
  document.querySelectorAll('#mood-seg [data-t]').forEach(b=>b.classList.toggle('on',!!S.world&&b.dataset.t===S.world.session.time));
}
const GENRE_KEY='courte.genre';
const savedGenre=()=>{try{const g=localStorage.getItem(GENRE_KEY);return g==='classical'||g==='house'||g==='jazz'?g:'jazz';}catch(_){return 'jazz';}};
const saveGenre=g=>{try{localStorage.setItem(GENRE_KEY,g);}catch(_){}};
Snd.setGenre(savedGenre());
/* what the start screen shows: the remembered genre, or 'off' */
const startMusicChoice=()=>musicPref()==='off'?'off':(Snd.on?Snd.genre:savedGenre());
const MUSIC_PREF='courte.music';          // 'off' once the player turned the music off; absent means on
const musicPref=()=>{try{return localStorage.getItem(MUSIC_PREF);}catch(_){return null;}};
const saveMusicPref=on=>{try{if(on)localStorage.removeItem(MUSIC_PREF);else localStorage.setItem(MUSIC_PREF,'off');}catch(_){}};
/* The bar opens with music unless the player turned it off. Called from the tap on 'Open the bar' (browsers only allow sound after a tap). */
let musicHinted=false;
function startMusicOnOpen(quiet){
  if(musicPref()==='off')return;
  if(!Snd.on){Snd.init();if(!Snd.music(true))return;refreshMusic();refreshMusicUI();}
  if(!quiet&&!musicHinted){musicHinted=true;toast(t('music_auto'),3800);}
}
function setMusic(g,remote){
  if(g==='off'){saveMusicPref(false);if(Snd.on){Snd.music(false);refreshMusic();}refreshMusicUI();return;}
  saveMusicPref(true);
  Snd.init();Snd.setGenre(g);if(!remote)saveGenre(g);
  if(!remote||Snd.on){if(Snd.music(true))refreshMusic();}
  refreshMusicUI();
}
function chooseMusic(g){
  setMusic(g,false);
  if(net.active){if(isHost()){S.world.session=Object.assign({},S.world.session,{music:g});S.world.rev++;S.musicSeen=g;commitWorld();}else net.sendGame({k:'music',genre:g});}
  toast('♪ '+t('mus_'+g));
}
$('#btn-music-pick').addEventListener('click',()=>{$('#music-menu').hidden=false;});
$('#music-close').addEventListener('click',()=>{$('#music-menu').hidden=true;});
$('#music-list').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(!b)return;$('#music-menu').hidden=true;chooseMusic(b.dataset.g);});
$('#genre-seg').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(b)chooseMusic(b.dataset.g);});
$('#mood-seg').addEventListener('click',e=>{
  const b=e.target.closest('button[data-t]');if(!b||!net.active||!isHost()||!TIMES[b.dataset.t])return;
  const id=b.dataset.t;
  S.world.session=Object.assign({},S.world.session,{time:id});S.world.rev++;S.session=S.world.session;S.time=TIMES[id];
  applyLook(id);refreshMusicUI();commitWorld();toast(t('mood_set',{time:t('time_'+id)}));
});
/* chat */
const chatForm=$('#chat-form'),chatInput=$('#chat-input'),chatFeed=$('#chatfeed');
const myChatEl=document.createElement('div');myChatEl.className='chatbubble';el.bubbles.appendChild(myChatEl);
const typing=e=>!!(e.target&&e.target.closest&&e.target.closest('input,textarea'));
function openChat(){if(!net.active||S.mode!=='walk'||S.paused||S.photo)return;$('#emotes').hidden=true;chatForm.hidden=false;chatInput.value='';chatInput.focus();}
function closeChat(){chatForm.hidden=true;chatInput.blur();}
/* chat history: every message stays for as long as you are in the room; a panel opens and closes on demand */
const chatLog=[];let chatUnread=0;
const histEl=$('#chat-hist'),histList=$('#chat-hist-list'),logBtn=$('#btn-chat-log'),badge=$('#chat-badge');
function updateLogBadge(){badge.hidden=!(chatUnread>0&&histEl.hidden);badge.textContent=chatUnread>9?'9+':String(chatUnread);}
function updateHistCount(){$('#chat-hist-n').textContent=chatLog.length?String(chatLog.length):'';$('#chat-hist-empty').hidden=chatLog.length>0;}
function pushLog(name,text,mine){
  const e={name,text,mine,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
  chatLog.push(e);
  if(chatLog.length>300){chatLog.shift();if(histList.firstChild)histList.firstChild.remove();}
  const near=histList.scrollHeight-histList.scrollTop-histList.clientHeight<48;
  const d=document.createElement('div');d.className='hl'+(mine?' me':'');
  const tm=document.createElement('time');tm.textContent=e.time;
  const b=document.createElement('b');b.textContent=name;
  d.append(tm,b,document.createTextNode(text));histList.appendChild(d);      // text nodes only: a message is never read as HTML
  if(!histEl.hidden){if(near||mine)histList.scrollTop=histList.scrollHeight;}
  else if(!mine){chatUnread++;}
  updateHistCount();updateLogBadge();
}
function openHist(){histEl.hidden=false;logBtn.setAttribute('aria-expanded','true');$('#app').classList.add('hist-open');chatUnread=0;updateLogBadge();histList.scrollTop=histList.scrollHeight;}
function closeHist(){histEl.hidden=true;logBtn.setAttribute('aria-expanded','false');$('#app').classList.remove('hist-open');updateLogBadge();}
function resetHist(){closeHist();chatLog.length=0;chatUnread=0;histList.textContent='';updateHistCount();updateLogBadge();}
logBtn.addEventListener('click',()=>{if(histEl.hidden)openHist();else closeHist();});
$('#chat-hist-x').addEventListener('click',closeHist);
function addFeed(name,text,mine){
  pushLog(name,text,mine);
  const d=document.createElement('div');d.className='cl'+(mine?' me':'');
  const b=document.createElement('b');b.textContent=name;d.append(b,' ',document.createTextNode(text));
  chatFeed.appendChild(d);while(chatFeed.children.length>5)chatFeed.firstChild.remove();
  setTimeout(()=>d.remove(),10000);
}
chatForm.addEventListener('submit',e=>{
  e.preventDefault();
  const clean=net.chat(chatInput.value);
  if(clean){S.myChat={text:clean,until:performance.now()+CHAT_SHOW_MS};myChatEl.textContent=clean;addFeed(net.me.name,clean,true);}
  closeChat();
});
$('#btn-chat').addEventListener('click',openChat);
/* emote menu */
const emoPop=$('#emotes');
$('#btn-dance').addEventListener('click',()=>playEmote('dance'));
$('#btn-jump').addEventListener('click',()=>playEmote('jump'));
$('#btn-emote').addEventListener('click',()=>{if(S.mode==='walk'&&!S.paused)emoPop.hidden=!emoPop.hidden;});
emoPop.addEventListener('click',e=>{const b=e.target.closest('button[data-e]');if(!b)return;emoPop.hidden=true;playEmote(b.dataset.e);});
document.addEventListener('pointerdown',e=>{if(!emoPop.hidden&&!emoPop.contains(e.target)&&!$('#btn-emote').contains(e.target))emoPop.hidden=true;});
/* photos: the camera swings round in front of the avatar, then the frame is captured with a watermark */
const canShare=(()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File([''],'a.jpg',{type:'image/jpeg'})]}));}catch(_){return false;}})();
function startPhoto(spot){
  if(S.mode!=='walk'||S.photo)return;
  if(S.seat)standUp();
  S.photo={spot,hold:0,shoot:false,shot:false,img:null};S.emote=null;
  player.place(spot.x,spot.z,spot.face,spot.face+Math.PI);player.st.locked=true;
  playerFig.position.set(spot.x,room.groundAt(spot.x,spot.z),spot.z);playerFig.rotation.y=spot.face;resetArms(playerFig);poseWalk(playerFig,0,0,time);
  photoView.pos.set(spot.x+Math.sin(spot.face)*2.5,1.5,spot.z+Math.cos(spot.face)*2.5);photoView.look.set(spot.x,1.15,spot.z);
  $('#app').classList.add('photo-mode');S.actionKey='';goCam();
}
function updatePhoto(dt){
  const ph=S.photo;if(!ph||ph.shot||cam.t<1)return;
  ph.hold+=dt;if(ph.hold>.55){ph.shot=true;ph.shoot=true;}
}
function capturePhoto(spot){
  const w=canvas.width,h=canvas.height,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');g.drawImage(canvas,0,0);
  const pad=Math.round(Math.min(w,h)*.045),bar=pad*2.5;
  const gr=g.createLinearGradient(0,h-bar*1.6,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.6)');
  g.fillStyle=gr;g.fillRect(0,h-bar*1.6,w,bar*1.6);
  g.textBaseline='middle';g.textAlign='left';g.fillStyle='#e6c98a';g.font=Math.round(pad*1.25)+'px Marcellus,"Cormorant Garamond",serif';
  g.fillText('Bar Coda',pad,h-pad*1.35);
  g.textAlign='right';g.fillStyle='#c9a066';g.font='600 '+Math.round(pad*.5)+'px "DM Sans","Noto Sans KR",sans-serif';
  const bits=[tr(spot.name),new Date().toLocaleDateString(getLang()==='ko'?'ko-KR':'en-US',{year:'numeric',month:'short',day:'numeric'})];
  if(net.active)bits.push(net.code);
  g.fillText(bits.join('  ·  '),w-pad,h-pad*1.35);
  return c.toDataURL('image/jpeg',.92);
}
function showPhoto(){
  const f=$('#flash');f.classList.add('on');setTimeout(()=>f.classList.remove('on'),60);
  $('#photo-img').src=S.photo.img;$('#btn-photo-share').hidden=!canShare;$('#photo').hidden=false;Snd.clink(.5);
}
function closePhoto(){
  $('#photo').hidden=true;S.photo=null;player.st.locked=false;
  $('#app').classList.remove('photo-mode');goCam();
}
$('#btn-photo-close').addEventListener('click',closePhoto);
$('#btn-photo-save').addEventListener('click',()=>{
  if(!S.photo||!S.photo.img)return;
  const a=document.createElement('a');a.href=S.photo.img;a.download='bar-coda-'+Date.now()+'.jpg';document.body.appendChild(a);a.click();a.remove();toast(t('toast_saved'));
});
$('#btn-photo-share').addEventListener('click',async()=>{
  if(!S.photo||!S.photo.img)return;
  try{const blob=await (await fetch(S.photo.img)).blob();await navigator.share({files:[new File([blob],'bar-coda.jpg',{type:'image/jpeg'})],title:'Bar Coda'});}catch(_){}
});

/* ───────────── events ───────────── */
el.act.addEventListener('click',doAction);
$('#btn-leave').addEventListener('click',leaveBar);
$('#btn-reset').addEventListener('click',()=>{
  if(S.stage!=='pour')return;
  stopPour();clearPour(S.drink);S.vessel.setLevel(0);dirtyUI=true;
});
$('#btn-next-pour').addEventListener('click',afterPour);
$('#btn-strain').addEventListener('click',goStrain);
$('#btn-serve').addEventListener('click',serveDrink);
function nightOver(){return worldNightOver(S.world);}
$('#btn-r-leave').addEventListener('click',()=>{const rs=S.drink&&S.drink.result?S.drink.result.stars:0;finishService();leaveBar();if(S.tale){taleAfterServe(rs);return;}if(nightOver())showSummary();});
$('#btn-r-next').addEventListener('click',()=>{
  if(S.tale){$('#btn-r-leave').click();return;}
  finishService();el.result.hidden=true;
  if(net.active){leaveBar();const ng=pendingGuests()[0];if(ng&&!nightOver())beginBartending(ng);else if(nightOver())showSummary();return;}
  const g=pendingGuests()[0];
  if(g&&!nightOver())enterBar(g);else{leaveBar();if(nightOver())showSummary();}
});
function refreshMusic(){$('#music-lb').textContent=t(Snd.on?'music_off':'music_on');el.music.setAttribute('aria-pressed',Snd.on?'true':'false');}
el.music.addEventListener('click',()=>{
  const on=!Snd.on;if(!Snd.music(on)){toast(t('toast_nosound'));return;}
  saveMusicPref(on);refreshMusic();
});
$('#btn-lang').addEventListener('click',()=>setLang(getLang()==='ko'?'en':'ko'));
/* Re-render every piece of dynamic text (language or unit change). */
function refreshAll(){
  setXmas(xmasOn,false);
  INGR.forEach(ing=>{chipEls[ing.id].querySelector('.nm').textContent=ing.name;});
  GARNISH.forEach(gn=>{garnEls[gn.id].querySelector('.nm').textContent=gn.name;});
  CATS.forEach(c=>{tabEls[c.id].textContent=t(c.key);});
  paintAllLabels();updateWalkUI();S.actionKey='';
  if(S.recipe&&S.mode==='bar'){updateTicket();if(S.stage&&S.stage!=='result')setStage(S.stage);if(S.mixKey)el.mixSay.textContent=t(S.mixKey);if(S.drink.result&&!el.result.hidden)renderResult();}
  refreshRoomUI();refreshChips();refreshMusic();
}
onLang(refreshAll);
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(!chatForm.hidden){closeChat();return;}
    if(!histEl.hidden){closeHist();return;}
    if(!$('#photo').hidden){closePhoto();return;}
    if(!emoPop.hidden){emoPop.hidden=true;return;}
    if(!inviteEl.hidden){closeInvite();return;}
    if(S.mode==='bar'&&el.result.hidden)leaveBar();
  }
  if(typing(e))return;
  if(e.code==='KeyE'&&!e.repeat&&S.mode==='walk'&&!S.paused)doAction();
  if(e.code==='Enter'&&!e.repeat&&net.active){e.preventDefault();openChat();}
  const n=e.code.indexOf('Digit')===0?parseInt(e.code.slice(5),10):0;
  if(n>=1&&n<=EMOTES.length&&!e.repeat)playEmote(EMOTES[n-1]);
  if(e.code==='Space'&&!e.repeat&&S.mode==='walk'&&!S.paused&&!S.seat){e.preventDefault();playEmote('jump');}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)Snd.pause();else Snd.resume();});

function resize(){
  W=stageEl.clientWidth||innerWidth;H=stageEl.clientHeight||innerHeight;if(!W||!H)return;
  renderer.setSize(W,H,false);composer.setSize(Math.round(W*PR),Math.round(H*PR));
  camera.aspect=W/H;camera.fov=fovFor(camFov);camera.updateProjectionMatrix();
  const pn=portraitNow();if(pn!==S.wasPortrait){S.wasPortrait=pn;layoutRail(true);}
}
if(window.ResizeObserver)new ResizeObserver(resize).observe(stageEl);else window.addEventListener('resize',resize);
resize();

/* ───────────── loop ───────────── */
/* ?debug exposes state on window.__courte; ?debug&dtmax=0.2 lets slow (software-GL) machines advance faster per frame. */
const QS=new URLSearchParams(location.search),DEBUG=QS.has('debug'),DEBUG_SEED=(DEBUG&&QS.has('seed'))?(parseInt(QS.get('seed'),10)>>>0):null,DT_MAX=(DEBUG&&parseFloat(QS.get('dtmax')))||.05;
if(DEBUG)window.__courte={setStill,STILLS,cutPush,Snd,get net(){return net;},taleServe:st=>{guests.forEach(g=>{g.order=null;});taleAfterServe(st);},snapshot:()=>snapshot(S.world,S.drink),S,enterBar,leaveBar,guests,npcs,player,doAction,RECIPES,makeGlass,makeShaker,scene,COUNTER_TOP,setTab,setLang};
let last=performance.now(),firstFrame=true;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(DT_MAX,(now-last)/1000);last=now;time+=dt;
  if(S.mode==='walk'){if(!S.paused){player.update(dt,time);updatePlayerPose();}player.view.off=portraitNow()?.12:0;}
  updatePhoto(dt);
  updateCamera(dt);room.animate(dt,time);xmas.animate(time);fx.update(dt);cat.update(dt,time);
  updateProps(dt);
  if(S.mode==='bar'){updateRail(dt);updateBar(dt,time);}
  updateNpcs(dt,time);updateOrders();updateAction();updateBubbles();syncRemotes(dt,time);
  finalPass.uniforms.time.value=time%50;
  composer.render(dt);
  if(S.photo&&S.photo.shoot){S.photo.shoot=false;S.photo.img=capturePhoto(S.photo.spot);showPhoto();}
  if(firstFrame){firstFrame=false;requestAnimationFrame(()=>$('#loading').classList.add('gone'));}
}
/* ───────────── online room: walking sync (transport is local-tab for now, Supabase later) ───────────── */
const NAME_KEY='courte.name',LOOK_KEY='courte.look';
const transport=createTransport();
const net=createRoom(transport,{now:()=>performance.now(),onChange:()=>refreshRoomUI()});
if(transport.onStatus)transport.onStatus(st=>{if(st==='error')toast(t('net_error'),4500);refreshRoomUI();});
const LOOKS=[
  {skin:0xe2b291,top:0x1f3b52,shirt:0xe9dfcc,tie:0xc9a066,pants:0x1c1c20,hair:0x17100c},
  {skin:0xc99372,top:0x5a1e1a,shirt:0xece2cf,pants:0x1e1a1c,hair:0x0e0806,hat:0x2b2522},
  {skin:0xf0c8aa,top:0x2e4a3c,dress:true,sheen:true,hair:0x3b1f16,long:true,shoes:0x2a0d0d},
  {skin:0xd9a885,top:0x3a2a4a,dress:true,sheen:true,hair:0x120a08,bun:true},
  {skin:0xe5b99a,top:0x6a4a2a,shirt:0xf0e6d6,tie:0x5a1e1a,pants:0x2a221e,hair:0x2a1a10},
  {skin:0xc89070,top:0x24262b,shirt:0xddd2bf,pants:0x161a24,hair:0x0e0a08,hat:0x4a3a2a},
  {skin:0xeac2a4,top:0x7a2a3a,dress:true,sheen:true,hair:0x2a1a10,long:true},
  {skin:0xb8805e,top:0x2b3a2a,shirt:0xe6e0d4,tie:0x9c7239,pants:0x1a1c18,hair:0x120c10}
];
const remotes=new Map(),tagV=new THREE.Vector3();
function myLook(){
  let v=NaN;try{v=parseInt(localStorage.getItem(LOOK_KEY),10);}catch(_){}
  if(!(v>=0&&v<LOOKS.length)){v=Math.floor(Math.random()*LOOKS.length);try{localStorage.setItem(LOOK_KEY,String(v));}catch(_){}}
  return v;
}
function setRoomParam(code){const u=new URL(location.href);if(code)u.searchParams.set('room',code);else u.searchParams.delete('room');history.replaceState(null,'',u);}

/* ───────────── shared night: the host runs the rules, everyone mirrors its snapshots ───────────── */
const isHost=()=>!net.active||(!!S.world&&S.world.hostId===net.me.id);
const nameOf=id=>id===net.me.id?net.me.name:((net.peers.get(id)||{}).name||'?');
function broadcastWorld(){if(net.active&&isHost()&&S.world)net.sendGame({k:'world',w:S.world});}
function commitWorld(){syncSeats(false);broadcastWorld();S.lastBeat=time;checkNightEnd();}
function hostTick(){
  if(!S.synced||!S.world)return;
  let changed=false;
  if(tickOrders(S.world,time))changed=true;
  if(autoServe(S.world,time))changed=true;
  const fl=fireLate(S.world,time);
  if(fl.changed){changed=true;if(fl.fired.indexOf(net.me.id)>=0){S.firedUntil=performance.now()+FIRE_COOLDOWN*1000;S.claimSeat=null;if(S.mode==='bar')leaveBar();toast(t('fired'),4500);}}
  if(changed)commitWorld();
  else if(time-S.lastBeat>2.5){broadcastWorld();S.lastBeat=time;}
}
/* Make the guests, drinks and bubbles match the world. quiet = first snapshot (no cheering for old drinks). */
function syncSeats(quiet){
  if(!S.world)return;
  S.world.seats.forEach((seat,i)=>{
    const g=allSeats[i],want=seat.order?seat.order.recipeId:null,have=g.order?g.order.id:null;
    if(g.proxy){g.x=seat.stoolX||g.x;if(seat.customer)g.name=nameOf(seat.customer);}
    if(want!==have){
      if(want){g.order=RECIPE_BY_ID[want];g.orderAt=seat.order.at;if(g.drink){scene.remove(g.drink.group);g.drink=null;}g.reaction=null;}
      else g.order=null;
    }
    g.rush=!!(seat.order&&seat.order.rush);
    g.claimBy=seat.claim?seat.claim.by:null;
    g.claimName=seat.claim&&seat.claim.by!==net.me.id?nameOf(seat.claim.by):'';
    const sv=seat.served;
    if(sv&&sv.rev!==g.servedRev){
      g.servedRev=sv.rev;
      if(g.proxy)g.x=sv.x||g.x;
      spawnDrinkProp(g,sv);
      if(!quiet&&sv.to===net.me.id)toast(t('drink_arrived',{stars:sv.stars}),3500);
      if(!quiet){g.reaction={si:sv.stars,until:time+7,q:quip(sv.stars,sv.rev,sv.recipeId)};g.cheer=1.2;}
    }
  });
  updateWalkUI();
}
function checkNightEnd(){
  if(!net.active||!S.world||S.summaryFor===S.world.seed)return;
  if(worldNightOver(S.world)&&S.mode==='walk'&&!S.paused)showSummary();
}
function adoptWorld(w){
  const first=!S.synced,newSession=!S.session||w.session.time!==S.session.time||w.session.menu!==S.session.menu||w.session.mode!==S.session.mode||w.session.chairs!==S.session.chairs;
  const newNight=!S.world||w.seed!==S.world.seed;
  S.world=w;S.synced=true;
  if(first||newSession||newNight)adoptSession(w.session);
  else if(S.session&&(w.session.limit!==S.session.limit||w.session.diff!==S.session.diff)){S.session=Object.assign({},S.session,{limit:w.session.limit,diff:w.session.diff,timer:w.session.limit>0});syncBarTimer();}      // the host changed the time limit
  if(newNight&&!$('#summary').hidden){$('#summary').hidden=true;S.paused=false;player.st.enabled=true;}
  syncSeats(first||newNight);
  if(w.session.music&&w.session.music!==S.musicSeen){S.musicSeen=w.session.music;setMusic(w.session.music,true);}
  refreshMusicUI();
  checkMyClaim(w);
  refreshRoomUI();checkNightEnd();
}
/* Host: apply a request from a player (or itself). */
function handleAct(from,m){
  if(!isHost()||!S.synced)return;
  const r0=S.world.rev;
  if(m.k==='claim'){
    const r=claimSeat(S.world,m.seat,from,time);
    commitWorld();return r;
  }
  if(m.k==='music'){S.world.session=Object.assign({},S.world.session,{music:m.genre});S.world.rev++;S.musicSeen=m.genre;setMusic(m.genre,true);commitWorld();return;}
  if(m.k==='order'){
    const seat=from===net.me.id?S.seat:seatByWireId((net.peers.get(from)||{}).st);
    if(!canOrderFrom(seat)||!isFree(seat))return;
    const drop=dropFor(seat),r=placeOrder(S.world,from,m.rec,drop?Math.max(-3.7,Math.min(3.7,drop.x)):seat.x,time,poolFor(S.world.session,RECIPES),drop);
    if(r.ok){commitWorld();}
    return r;
  }
  if(m.k==='unclaim')releaseClaim(S.world,m.seat,from);
  else if(m.k==='served')applyServed(S.world,m.seat,from,m,time);
  if(S.world.rev!==r0)commitWorld();
}
function sendAct(a){if(!net.active)return null;if(isHost())return handleAct(net.me.id,a)||null;net.sendGame(a);return null;}
net.onGame(raw=>{
  const m=parseGameMessage(raw);
  if(!m)return;
  if(m.k==='world'){
    if(m.w.hostId!==m.id)return;
    if(isHost()&&S.synced&&m.id>=net.me.id)return;          // two hosts: the lower id wins
    if(acceptSnapshot(S.world,m.w,S.synced)||(isHost()&&m.id<net.me.id))adoptWorld(m.w);
  }else if(m.k==='need'){if(isHost())broadcastWorld();}
  else if(m.k==='bar'){if(m.id!==net.me.id)remoteBarMsg(m.id,m);}      // visual only: every client draws it, the host does not act on it
  else if(isHost())handleAct(m.id,m);
});
/* Ticket claiming is optimistic: step behind the counter at once, the host confirms (or overrules) a moment later.
   A round trip to the server takes ~1 s, so waiting for the answer would feel stuck. */
function checkMyClaim(w){
  if(!S.claimSeat||!S.claimInfo)return;
  const seat=w.seats.find(x=>x.id===S.claimSeat);
  if(seat&&seat.claim&&seat.claim.by===net.me.id){
    if(S.claimInfo.tentative){
      S.claimInfo={station:seat.claim.station,orderNo:seat.claim.orderNo};
      if(S.drink){S.drink.orderNo=seat.claim.orderNo;if(S.mode==='bar')updateTicket();}
    }
    return;
  }
  const taken=!!(seat&&seat.claim),gone=!seat||!seat.order,stale=S.claimInfo.tentative&&performance.now()-S.claimInfo.since>8000;
  if(S.claimInfo.tentative&&!taken&&!gone&&!stale)return;      // host has not answered yet
  S.claimSeat=null;
  toast(t(w.fired&&w.fired[net.me.id]?'fired':taken||stale?'claim_fail':'claim_lost'),w.fired&&w.fired[net.me.id]?4500:undefined);
  if(S.mode==='bar')leaveBar();else S.claimInfo=null;
}
function beginBartending(g){
  if(!net.active){enterBar(g);return;}
  if((S.world.fired&&S.world.fired[net.me.id])||performance.now()<S.firedUntil){toast(t('fired_wait'));return;}
  const seatId=g.seatId;
  S.claimSeat=seatId;S.claimInfo={station:0,orderNo:S.world.orderNo+1,tentative:true,since:performance.now()};
  const r=sendAct({k:'claim',seat:seatId});
  if(r&&!r.ok){S.claimSeat=null;S.claimInfo=null;toast(t(r.reason==='full'?'act_full':'claim_fail'));return;}   // the host answered right away
  if(r&&r.ok)S.claimInfo={station:r.station,orderNo:r.orderNo};
  enterBar(g);
}
/* Once a second: ask for the world until synced, take over when the host is gone, free tickets of players who left. */
function becomeHost(){
  S.world.hostId=net.me.id;S.world.rev++;S.synced=true;
  expireClaims(S.world,net.ids());
  commitWorld();refreshRoomUI();toast(t('room_host_you'),3000);
}
setInterval(()=>{
  if(!net.active||!S.world)return;
  const ids=net.ids();
  checkMyClaim(S.world);
  if(!S.synced){
    net.sendGame({k:'need'});
    if(++S.syncWait>=6&&electHost(ids)===net.me.id)becomeHost();
    return;
  }
  if(hostMissing(S.world,ids)&&electHost(ids)===net.me.id){becomeHost();return;}
  if(isHost()){
    if(expireClaims(S.world,ids))commitWorld();
    if(document.hidden)broadcastWorld();
  }
},1000);
/* host switch: does the NPC guest at the left end of the bar order? */
function refreshNpcRow(){
  const row=$('#row-npc'),show=!!(net.active&&isHost()&&S.world&&S.world.session.chairs>0);
  row.hidden=!show;if(!show)return;
  const on=S.world.session.npcOrders!==false,b=$('#btn-npc');
  b.textContent=t(on?'npc_on':'npc_off');b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('on',on);
}
$('#btn-npc').addEventListener('click',()=>{
  if(!net.active||!isHost())return;
  const on=S.world.session.npcOrders===false;                    // flip
  S.world.session=Object.assign({},S.world.session,{npcOrders:on});S.world.rev++;commitWorld();
  refreshNpcRow();toast(t(on?'npc_toast_on':'npc_toast_off'),2400);
});
/* bartending time limit: off, or 60 / 45 / 30 s. Solo: anyone; in a room: the host. The tale has none. */
function limitState(){const lim=S.world?S.world.session.limit:0,d=Object.keys(DIFFS).find(k=>DIFFS[k]===lim);return lim>0?(d||'easy'):'off';}
function refreshLimitRow(){
  const row=$('#row-limit'),show=!!(S.world&&S.session&&S.session.mode!=='tale'&&(!net.active||isHost()));
  row.hidden=!show;if(!show)return;
  const cur=limitState();
  row.querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l===cur));
  row.querySelectorAll('[data-l=easy],[data-l=mid],[data-l=hard]').forEach(b=>{b.textContent=DIFFS[b.dataset.l]+t('sec');});
}
/* a running bartender follows a change at once: switching it off clears the clock, switching it on starts one */
function syncBarTimer(){
  if(S.mode!=='bar'||!S.recipe||!S.world)return;
  const lim=S.world.session.limit>0?patienceOf(S.world.session.limit,S.guest&&S.guest.rush):0;
  S.barLimit=lim;
  if(lim>0&&!S.barEnd&&S.stage&&S.stage!=='result')S.barEnd=performance.now()+lim*1000;
  if(!lim)S.barEnd=null;
  $('#bar-timer').hidden=!S.barEnd;
}
function setLimit(choice){
  if(!S.world||(net.active&&!isHost()))return;
  const lim=choice==='off'?0:DIFFS[choice],diff=choice==='off'?(S.session.diff||'easy'):choice;
  S.world.session=Object.assign({},S.world.session,{limit:lim,diff,timer:lim>0});
  S.session=Object.assign({},S.session,{limit:lim,diff,timer:lim>0});
  S.world.rev++;saveSession(Object.assign({},S.session,{limit:undefined}));
  if(net.active)commitWorld();
  syncBarTimer();refreshLimitRow();updateWalkUI();
  toast(lim>0?t('limit_on_toast',{s:lim}):t('limit_off_toast'),2600);
}
$('#limit-seg').addEventListener('click',e=>{const b=e.target.closest('button[data-l]');if(b)setLimit(b.dataset.l);});
function refreshRoomUI(){
  refreshNpcRow();refreshLimitRow();
  const chip=$('#room-chip');chip.hidden=!net.active;if(net.active){chip.querySelector('.rc-code').textContent=net.code;chip.querySelector('.rc-n').textContent='· '+net.count+(isHost()?' ★':'');}$('#row-room').hidden=!net.active;chip.classList.toggle('wait',transport.status==='connecting');$('#row-mood').hidden=!(net.active&&isHost());$('#row-genre').hidden=net.active&&!isHost();$('#btn-chat').hidden=!net.active;logBtn.hidden=!net.active;if(!net.active&&(chatLog.length||!histEl.hidden))resetHist();if(!net.active&&!chatForm.hidden)closeChat();
  if(net.active){chip.setAttribute('aria-label',t('inv_aria',{code:net.code,n:net.count}));}
}
function connectRoom(onl){
  if(onl.mode==='keep')return;
  if(onl.mode==='solo'){if(net.active)leaveRoom();return;}
  if(net.active&&(onl.mode==='create'||normalizeCode(onl.code)===net.code))return;
  const name=(onl.name||'').trim()||t('guest_default');
  try{localStorage.setItem(NAME_KEY,name);}catch(_){}
  const code=onl.mode==='create'?makeCode():normalizeCode(onl.code);
  net.join(code,name,myLook());setRoomParam(code);
  if(onl.mode==='create'){
    const limit=limitOf(S.session),chairs=Math.max(2,Math.min(6,(onl.chairs|0)||4));
    S.world.session=Object.assign({},S.world.session,{chairs,limit,npcOrders:onl.npc!==false});
    S.world.seats.forEach((st,i)=>{st.active=i===0;st.order=null;st.claim=null;});
    S.world.hostId=net.me.id;S.world.rev++;S.synced=true;
    adoptSession(S.world.session);commitWorld();refreshRoomUI();
  }
  else{S.synced=false;S.syncWait=0;S.world.hostId=null;net.sendGame({k:'need'});}
  toast(t(onl.mode==='create'?'room_open':'room_joined',{code}),3200);
  if(onl.mode==='create'){const g=startMusicChoice();if(g!=='off'&&isHost()){S.world.session=Object.assign({},S.world.session,{music:g});S.world.rev++;S.musicSeen=g;commitWorld();}setTimeout(openInvite,700);}                 // the host's first job is to invite someone
}
const STATION_X=[-.9,.9];
const myState=()=>({x:S.mode==='bar'&&S.claimInfo?STATION_X[S.claimInfo.station]:playerFig.position.x,z:playerFig.position.z,yaw:playerFig.rotation.y,sp:S.mode==='walk'?Math.min(1.25,player.st.amt):0,st:S.seat?SEATS.indexOf(S.seat)+1:0});
/* ── friends can watch you make a drink ──
   While you tend the bar, a small state (recipe, stage, liquid in each glass, what is being poured, shaking/stirring, garnish) goes out about five times a second
   and every other client draws a copy of your work at your station: glasses, bottle, shaker or spoon, and your hands. Nothing here changes the game state. */
let barWas=false,barLast='',barLastAt=0;
setInterval(()=>{
  if(!net.active)return;
  const inBar=S.mode==='bar'&&S.recipe&&S.drink&&S.stage;
  if(!inBar){if(barWas){net.sendGame({k:'bar',off:true});barWas=false;barLast='';}return;}
  const col=(S.strainColor||blendColor()||null),r3=v=>+v.toFixed(3);
  const msg={k:'bar',rec:S.recipe.id,stage:S.stage==='result'?'serve':S.stage,
    v:Math.round((S.vessel&&S.vessel.ml)||0),s:Math.round((S.serv&&S.serv!==S.vessel&&S.serv.ml)||0),
    col:col?col.map(r3):null,pour:S.pourId||'',drag:!!S.drag,mix:+(S.drink.mixProg||0).toFixed(2),gar:S.drink.garnish||'none',srv:+(S.serveT||0).toFixed(2)};
  const j=JSON.stringify(msg);
  if(j!==barLast||performance.now()-barLastAt>1500){net.sendGame(msg);barLast=j;barLastAt=performance.now();}
  barWas=true;
},200);
const remoteBars=new Map(),BAR_STALE_MS=3500;
function disposeBar(b){scene.remove(b.group);}
function remoteBarMsg(id,m){
  if(m.off){const b=remoteBars.get(id);if(b){disposeBar(b);remoteBars.delete(id);}return;}
  let b=remoteBars.get(id);
  if(b&&b.rec!==m.rec){disposeBar(b);remoteBars.delete(id);b=null;}
  if(!b){
    const rc=RECIPE_BY_ID[m.rec],group=new THREE.Group();scene.add(group);
    const vessel=makeGlass(pourVesselOf(rc)),serv=rc.method==='build'?null:makeGlass(rc.glass);
    vessel.group.position.set(VP.x,0,0);group.add(vessel.group);
    if(serv){serv.group.position.set(SP.x,0,0);group.add(serv.group);}
    let shaker=null,spoonG=null;
    if(rc.method==='shake'){shaker=makeShaker();shaker.group.position.set(VP.x,0,0);shaker.group.visible=false;group.add(shaker.group);}
    if(rc.method==='stir'){spoonG=new THREE.Group();cyl(.004,.004,.44,brass,0,.22,0,spoonG,8);spoonG.visible=false;group.add(spoonG);}
    const pivot=new THREE.Group();pivot.visible=false;group.add(pivot);
    const streamM=new THREE.Mesh(new THREE.CylinderGeometry(.013,.011,1,10),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85}));streamM.visible=false;group.add(streamM);
    b={rec:m.rec,rc,group,vessel,serv,shaker,spoon:spoonG,pivot,streamM,bottle:null,bottleId:'',garn:null,garnId:'none',lv:-1,ls:-1,iceSet:false,m,last:0};
    remoteBars.set(id,b);
  }
  b.m=m;b.last=performance.now();
}
const _rb=new THREE.Vector3();
function updateRemoteBar(id,r,t){
  const b=remoteBars.get(id);if(!b)return;
  if(performance.now()-b.last>BAR_STALE_MS){disposeBar(b);remoteBars.delete(id);return;}
  const m=b.m,rc=b.rc,tgt=b.serv||b.vessel;
  b.group.position.set(r.fig.position.x,COUNTER_TOP,VP.z);
  /* liquid */
  if(Math.abs(m.v-b.lv)>=1){b.vessel.setLevel(m.v);b.lv=m.v;}
  if(b.serv&&Math.abs(m.s-b.ls)>=1){b.serv.setLevel(m.s);b.ls=m.s;}
  if(m.col){b.vessel.setColor(m.col);if(b.serv)b.serv.setColor(m.col);}
  const shaking=rc.method==='shake'&&(m.stage==='mix'||m.stage==='strain'),stirring=rc.method==='stir'&&m.stage==='mix';
  /* ice: like the local flow (stirred drinks are chilled in the mixing glass, the rest goes in the serving glass at the end) */
  if(stirring&&!b.iceSet){b.vessel.setIce(5);b.iceSet=true;}
  if(m.stage==='garnish'||m.stage==='serve'){if(!b.iceFinal&&iceOf(rc)){tgt.setIce(iceOf(rc));b.iceFinal=true;}if(rc.method!=='build')b.vessel.setIce(0);}
  /* shaker: replaces the tin while shaking */
  if(b.shaker){
    b.shaker.group.visible=shaking;b.vessel.group.visible=!shaking;
    if(shaking){const w=m.drag?Math.sin(t*30):0;b.shaker.group.position.set(VP.x+(m.drag?Math.sin(t*38)*.006:0),(m.drag?.06+w*.05:0),0);b.shaker.group.rotation.z=m.drag?Math.sin(t*30)*.04:0;}
  }
  /* stirring spoon circles in the mixing glass */
  if(b.spoon){b.spoon.visible=stirring;if(stirring){const a=m.drag?t*7:0;b.spoon.position.set(VP.x+Math.cos(a)*.03,.014,Math.sin(a)*.03);b.spoon.rotation.set(Math.sin(a)*.1,0,-Math.cos(a)*.1);}}
  /* garnish on the serving glass */
  if(m.gar!==b.garnId){
    if(b.garn&&b.garn.parent)b.garn.parent.remove(b.garn);b.garn=null;b.garnId=m.gar;
    if(m.gar!=='none'){const go=makeGarnish(m.gar);if(m.gar==='cherry'||m.gar==='beans')go.position.set(.02,tgt.level+.005,0);else go.position.set(tgt.rimR*.82,tgt.rimY+.005,0);tgt.group.add(go);b.garn=go;}
  }
  /* the bottle being poured: tilted above the vessel, a stream down to the liquid */
  const pour=m.stage==='pour'?m.pour:'';
  if(pour&&pour!==b.bottleId){
    if(b.bottle)b.pivot.remove(b.bottle);
    const ing=ING[pour],bt=makeBottle(ing.bottle,{flip:true,scale:ing.small?.72:1,labelMap:ing.labelTex});
    bt.position.set(0,-(bt.userData.h||.3)*bt.scale.x,0);b.pivot.add(bt);b.bottle=bt;b.bottleId=pour;b.streamM.material.color.set(ing.color);
  }
  b.pivot.visible=!!pour&&!!b.bottle;b.streamM.visible=!!pour;
  if(pour){
    const lipY=b.vessel.rimY+.07,topY=b.vessel.level;
    b.pivot.position.set(VP.x,lipY,0);b.pivot.rotation.z=2.1;
    const len=Math.max(.02,lipY-topY);b.streamM.scale.set(1,len,1);b.streamM.position.set(VP.x,topY+len/2,0);
  }
  /* hands: one on the glass, the other on whatever is being handled */
  const fig=r.fig;
  const hand=(i,obj,dx,dy)=>{b.group.updateMatrixWorld(true);_rb.set(dx,dy,0);obj.localToWorld(_rb);reachArm(fig,i,_rb,.35);};
  const work=b.shaker&&shaking?b.shaker.group:b.spoon&&stirring?b.spoon:null;
  hand(0,b.vessel.group,-.07,.12);
  if(pour)hand(1,b.pivot,0,0);else if(work)hand(1,work,.0,.12);else hand(1,tgt.group,.07,.1);
}
function syncRemotes(dt,t){
  if(!net.active&&!remotes.size)return;
  net.update(myState());
  const nowT=performance.now(),rect=canvas.getBoundingClientRect(),showTags=S.mode==='walk'&&cam.t>=.7&&!S.photo;
  const place=(elm,x,y,z,lift)=>{
    tagV.set(x,y,z).project(camera);
    if(!showTags||tagV.z>1||Math.abs(tagV.x)>1.2){elm.style.display='none';return;}
    elm.style.display='block';
    elm.style.transform='translate('+((tagV.x*.5+.5)*rect.width).toFixed(1)+'px,'+((-tagV.y*.5+.5)*rect.height-lift).toFixed(1)+'px) translate(-50%,-100%)';
  };
  net.peers.forEach((p,id)=>{
    let r=remotes.get(id);
    if(!r){
      const fig=makeCharacter(LOOKS[p.c]);scene.add(fig);
      const tag=document.createElement('div');tag.className='nametag';el.bubbles.appendChild(tag);
      const chat=document.createElement('div');chat.className='chatbubble';el.bubbles.appendChild(chat);
      r={fig,tag,chat,seq:p.chatSeq};remotes.set(id,r);
    }
    smoothPeer(p,dt);
    const seat=seatByWireId(p.st);
    if(seat){
      r.fig.position.set(seat.x,room.groundAt(seat.x,seat.z)+seat.y,seat.z);r.fig.rotation.y=seat.yaw;poseSit(r.fig,seat.lean);
      if(S.seat===seat&&id<net.me.id)standUp();            // same seat picked twice: the lower id keeps it
    }else{
      r.fig.position.set(p.x,room.groundAt(p.x,p.z),p.z);r.fig.rotation.y=p.yaw;poseWalk(r.fig,p.ph,Math.min(1,p.sp),t);
    }
    const l=p.emoteUntil>nowT?Math.sin(Math.min(1,(p.emoteUntil-nowT)/(EMOTE_MS[p.emote]||1600))*Math.PI):0;
    if(l>0)applyEmote(r.fig,p.emote,l,t);else relaxArms(r.fig);
    if(remoteBars.has(id))updateRemoteBar(id,r,t);
    if(p.chatSeq!==r.seq){r.seq=p.chatSeq;if(p.chat)addFeed(p.name,p.chat.text,false);}
    const od=S.world&&S.world.seats.find(x=>x.customer===id&&x.order),tagText=p.name+(od?' · '+RECIPE_BY_ID[od.order.recipeId].name:'');
    if(r.tag.textContent!==tagText)r.tag.textContent=tagText;
    const hy=r.fig.position.y+1.95;
    place(r.tag,r.fig.position.x,hy,r.fig.position.z,0);
    if(p.chat&&nowT<p.chat.until){if(r.chat.textContent!==p.chat.text)r.chat.textContent=p.chat.text;place(r.chat,r.fig.position.x,hy,r.fig.position.z,26);}
    else r.chat.style.display='none';
  });
  remotes.forEach((r,id)=>{if(!net.peers.has(id)){scene.remove(r.fig);r.tag.remove();r.chat.remove();remotes.delete(id);const b=remoteBars.get(id);if(b){disposeBar(b);remoteBars.delete(id);}}});
  if(S.myChat&&nowT<S.myChat.until)place(myChatEl,playerFig.position.x,playerFig.position.y+1.95,playerFig.position.z,4);else myChatEl.style.display='none';
}
/* ── invite: one card, three ways in (the chip, the settings row, and automatically when you open a room) ── */
const inviteUrl=()=>{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('room',net.code);return u.toString();};
const inviteEl=$('#invite');
function openInvite(){
  if(!net.active)return;
  $('#inv-code').textContent=net.code;$('#inv-link').value=inviteUrl();
  $('#inv-share').hidden=!navigator.share;
  inviteEl.hidden=false;
}
function closeInvite(){inviteEl.hidden=true;}
async function copyText(txt){
  try{await navigator.clipboard.writeText(txt);return true;}
  catch(_){try{const i=$('#inv-link');i.value=txt;i.select();i.setSelectionRange(0,txt.length);const ok=document.execCommand('copy');i.value=inviteUrl();return ok;}catch(__){return false;}}
}
function flashLabel(btn,key){const lb=btn.dataset.lb||(btn.dataset.lb=btn.textContent);btn.textContent=t(key);clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.textContent=lb;delete btn.dataset.lb;},1700);}
$('#room-chip').addEventListener('click',openInvite);
$('#btn-room-invite').addEventListener('click',()=>{toggleSettings(false);openInvite();});
$('#inv-close').addEventListener('click',closeInvite);
$('#inv-copy').addEventListener('click',async e=>{const btn=e.currentTarget,ok=await copyText(inviteUrl());if(ok)flashLabel(btn,'inv_copied');else{$('#inv-link').select();toast(inviteUrl(),4200);}});      // keep the button: currentTarget is gone after the await
$('#inv-code').addEventListener('click',async()=>{const ok=await copyText(net.code);toast(ok?t('inv_code_copied'):net.code,2200);});
$('#inv-share').addEventListener('click',()=>{try{navigator.share({title:'Bar Coda',text:t('inv_share_text',{code:net.code}),url:inviteUrl()}).catch(()=>{});}catch(_){}});
$('#inv-link').addEventListener('focus',e=>e.target.select());

/* Back to the classic solo bar (six stools, the usual guests, no time limit). */
function leaveRoom(){
  if(S.mode==='bar')leaveBar();
  if(S.seat)standUp();
  net.leave();setRoomParam(null);
  if(S.world){
    const T=TIMES[S.world.session.time];
    S.world.session=Object.assign({},S.world.session,{chairs:0,limit:limitOf(S.world.session)});
    S.world.hostId=null;S.world.seats.forEach((st,i)=>{st.active=i<4&&T.guests.indexOf(i)>=0;st.order=null;st.claim=null;st.customer=null;});
    S.world.stations=[null,null];adoptSession(S.world.session);updateWalkUI();
  }
}
$('#btn-room-leave').addEventListener('click',()=>{leaveRoom();toggleSettings(false);toast(t('room_left'));});
addEventListener('pagehide',()=>net.leave());
/* background tabs stop requestAnimationFrame: keep the heartbeat on a timer so others do not drop us */
setInterval(()=>{if(net.active&&document.hidden)net.update(myState());},1000);

/* ───────────── session: apply config, start screen, summary ───────────── */
function applyLook(timeId){
  const L=TIMES[timeId].look;room.setTime(L);
  scene.background.setHex(L.bg);scene.fog.color.setHex(L.fog[0]);scene.fog.density=L.fog[1];
}
/* Look, guests and classes for a session config (also used when a room's host sets the night). */
function adoptSession(cfg){
  S.session=cfg;S.time=TIMES[cfg.time];setXmas(xmasOn,false);
  applyLook(cfg.time);
  room.setStools(layoutStools(cfg.chairs||0));
  guests.forEach((g,i)=>{g.active=cfg.mode==='tale'?false:cfg.chairs>0?i===0:S.time.guests.indexOf(i)>=0;g.nameOv=null;g.noTalk=false;restyleGuest(g,null);});
  proxies.forEach(g=>{g.order=null;g.claimBy=null;g.claimName='';g.servedRev=0;g.reaction=null;if(g.drink){scene.remove(g.drink.group);g.drink=null;}});
  loungers.forEach((g,i)=>{g.active=!(cfg.chairs>0)&&S.time.lounge.indexOf(i)>=0;});     // a friends room has one NPC guest, so the lounge chairs are free
  setLoungeTaken(loungers.map(g=>g.active));
  npcs.forEach(g=>{
    g.fig.visible=g.active;g.order=null;g.reaction=null;g.talk=null;g.askedOrder=false;g.claimBy=null;g.claimName='';g.servedRev=0;
    if(g.drink){scene.remove(g.drink.group);g.drink=null;}
  });
  $('#app').classList.toggle('instinct',cfg.guide==='instinct');
  $('#app').classList.toggle('practice',cfg.mode==='practice');
  S.actionKey='';
}
function applySession(cfg){
  saveSession(cfg);
  const old=S.world,keep=net.active&&old?{chairs:old.session.chairs,limit:old.session.limit}:{chairs:0,limit:limitOf(cfg)};
  cfg=Object.assign({},cfg,keep);
  setStill(null);Object.keys(taleProps).forEach(removeProp);clearPianist();Object.keys(taleSeat).forEach(k=>delete taleSeat[k]);S.tale=null;S.talkCam=null;taleUI.hide();playerFig.visible=true;el.uiWalk.hidden=S.mode!=='walk';
  S.world=createWorld(cfg,DEBUG_SEED,time);S.drink=null;S.recipe=null;S.claimSeat=null;S.claimInfo=null;
  if(old)S.world.rev=old.rev+1;
  if(net.active){S.world.hostId=net.me.id;}
  S.synced=true;
  adoptSession(cfg);
  updateWalkUI();refreshLimitRow();
  if(net.active)broadcastWorld();
}
/* ───────────── tale: dialogue-driven story nights ───────────── */
const taleUI=createTaleUI($('#tale'),{
  onAdvance:()=>{taleAdvance(S.tale.st,S.tale.graph);taleStep();},
  onPick:i=>{talePick(S.tale.st,S.tale.graph,i);taleStep();},
  onClose:()=>{
    commitNight(S.tale.st.night,S.tale.st);
    taleUI.hide();playerFig.visible=true;S.tale=null;el.uiWalk.hidden=false;openStart();
  },
  onRetry:()=>{taleRetry(S.tale.st,S.tale.graph);taleStep();},
  onExit:()=>{taleUI.hide();playerFig.visible=true;S.tale=null;el.uiWalk.hidden=false;openStart();}});
/* Swap a counter guest's figure for a story character's look (or back to the original). */
function restyleGuest(g,look){
  if(!look&&!g.styled)return;
  const old=g.fig,pos=old.position.clone(),rot=old.rotation.y;
  scene.remove(old);
  const fig=makeCharacter(look||g.baseCfg);fig.position.copy(pos);fig.rotation.y=rot;poseSit(fig,.95);fig.visible=g.active;
  scene.add(fig);g.fig=fig;g.styled=!!look;
}
/* Close-up on the guest who is talking; null goes back to the room view. */
function setTalkCam(g){
  if(g&&g.piano){                                   // the pianist is across the room: look at her from the front
    talkView.pos.set(6.2,2.8,9.4);talkView.look.set(7.05,1.7,7.7);   // in front of her and high, to see her face over the piano lid       // from her side: the grand piano is in front of her, so a front view looks at its lid
  }else if(g){
    const x=g.fig.position.x;
    talkView.pos.set(x*.62+.2,1.7,-.45);talkView.look.set(x,1.4,1.25);
  }
  if(S.talkCam===g)return;
  S.talkCam=g||null;goCam();
}
/* Props a story guest brings along: they pop onto the counter beside the guest and go away with them. */
const taleProps={};
function removeProp(who){const p=taleProps[who];if(p){scene.remove(p.group);delete taleProps[who];}}
function addProp(who,g){
  removeProp(who);
  const group=makeProp(TALE_CHARS[who].prop);if(!group)return;
  const dx=who==='taesik'?-.42:who==='kkangi'?-.4:who==='yoonjae'?.42:-.3;                 // clear of the guest's own drink and out of the close-up's line of sight
  group.position.set(g.x+dx,COUNTER_TOP,.55);group.rotation.y=who==='seoyun'?Math.PI+.25:-.5;
  group.scale.multiplyScalar(.01);scene.add(group);
  taleProps[who]={group,t:0,full:group.scale.x*100};
}
function updateProps(dt){
  Object.keys(taleProps).forEach(w=>{const p=taleProps[w];if(p.t>=1)return;p.t=Math.min(1,p.t+dt/.45);const e=ease(p.t),k=.01+.99*(1-Math.pow(1-e,3));p.group.scale.setScalar(p.full*k);});
}
/* Yunha plays the piano across the room: her own figure on the bench, not a counter guest. */
const pianist={piano:true,fig:null,active:false,x:7.1,nameOv:null,order:null};
let musicBefore=null;
function seatPianist(look){
  if(pianist.fig)scene.remove(pianist.fig);
  const seat=SEATS.find(s=>s.kind==='piano'),fig=makeCharacter(look);
  fig.position.set(seat.x,seat.y,seat.z);fig.rotation.y=seat.yaw;poseSit(fig,seat.lean);scene.add(fig);
  pianist.fig=fig;pianist.active=true;
}
function clearPianist(){
  if(pianist.fig){scene.remove(pianist.fig);pianist.fig=null;}
  pianist.active=false;
  if(musicBefore){Snd.setGenre(musicBefore);musicBefore=null;}
}
const taleSeat={};                 // where each story character currently sits (an entrance may override the default seat)
const taleGuest=who=>{const s=taleSeat[who]||TALE_CHARS[who].seat;return s==='piano'?pianist:guests[+s.slice(1)];};

/* ───── still cuts and heart / intro cards ───── */
const stillEl=$('#still');
const anchorOf=at=>{
  if(at&&at[0]==='g'&&guests[+at.slice(1)])return {x:guests[+at.slice(1)].x,z:0,yaw:0,y:0};
  if(at==='piano'){const s=SEATS.find(x=>x.kind==='piano');return {x:s.x,z:s.z,yaw:s.yaw,y:s.y};}
  return {x:0,z:0,yaw:0,y:0};
};
function stillHide(on){
  guests.forEach(g=>{g.fig.visible=on?false:g.active;});
  if(pianist.fig)pianist.fig.visible=!on;
  bartender.visible=!on;
  Object.values(taleProps).forEach(p=>{p.group.visible=!on;});
}
const stillStage=createStillStage({scene,STILLS,CHARS:TALE_CHARS,anchorOf,makeCharacter,poseSit,reachArm,setFace,makeProp,hideOthers:stillHide});
function setStill(id){
  if(id===undefined)return;
  if(!id){
    if(!S.still)return;
    stillStage.clear();S.still=null;stillEl.classList.remove('on');stillEl.dataset.tone='';
    setTimeout(()=>{if(!S.still)stillEl.hidden=true;},600);goCam();return;
  }
  if(stillStage.id===id)return;
  const v=stillStage.show(id);if(!v)return;
  stillView.pos.copy(v.pos);stillView.look.copy(v.look);stillView.fov=v.fov;stillView.off=v.off;
  S.still=stillView;stillEl.hidden=false;stillEl.dataset.tone=v.tone;
  stillEl.querySelector('.stl-cap').textContent=tr(v.cap);
  requestAnimationFrame(()=>stillEl.classList.add('on'));goCam();
}
const cutin={el:$('#cutin'),q:[],busy:false};
function cutPush(c){cutin.q.push(c);if(cutin.q.length>4)cutin.q.shift();cutNext();}
function cutNext(){
  if(cutin.busy||!cutin.q.length||!S.tale)return;
  const c=cutin.q.shift();cutin.busy=true;
  const e=cutin.el,pics=e.querySelector('.cut-pics');pics.textContent='';
  c.who.forEach(w=>{const u=portraitOf(w,TALE_CHARS[w]&&TALE_CHARS[w].look,c.face);if(u){const i=document.createElement('img');i.src=u;i.alt='';pics.appendChild(i);}});
  e.querySelector('.cut-name').textContent=c.name;e.querySelector('.cut-sub').textContent=c.sub;e.querySelector('.cut-hearts').textContent=c.hearts||'';
  e.className='cutin'+(c.heart?' heart':'');e.hidden=false;
  requestAnimationFrame(()=>e.classList.add('on'));
  setTimeout(()=>{e.classList.remove('on');setTimeout(()=>{e.hidden=true;cutin.busy=false;cutNext();},300);},c.heart?2300:2700);
}
function cutFromEvent(e){
  const MAXH=5;
  if(e.k==='enter'){const ch=TALE_CHARS[e.who];if(ch&&ch.look)cutPush({who:[e.who],face:'neutral',name:tr(ch.name),sub:ch.intro?tr(ch.intro):''});}
  else if(e.k==='heart'){
    const bond=e.who==='bond',ch=TALE_CHARS[e.who];if(!bond&&!(ch&&ch.look))return;
    cutPush({who:bond?['seoyun','yunha']:[e.who],face:e.n>0?'smile':'sad',heart:true,name:tr(ch.name),
      sub:t(bond?(e.n>0?'cut_bond':'cut_bond_down'):(e.n>0?'cut_up':'cut_down')),hearts:'♥'.repeat(e.now)+'♡'.repeat(Math.max(0,MAXH-e.now))+'  '+(e.n>0?'+':'')+e.n});
  }
}
function taleEvents(){
  taleDrain(S.tale.st).forEach(e=>{
    cutFromEvent(e);
    if(e.k==='heart')return;
    if(e.k==='enter')taleSeat[e.who]=e.seat||TALE_CHARS[e.who].seat;
    if(e.k==='music'){if(Snd.on){if(!musicBefore)musicBefore=Snd.genre;Snd.setGenre(e.genre);}return;}
    const g=taleGuest(e.who);
    if(g===pianist){
      if(e.k==='enter'){seatPianist(TALE_CHARS[e.who].look);setFace(pianist.fig,'neutral');setTalkCam(pianist);if(e.music&&Snd.on&&!musicBefore){musicBefore=Snd.genre;Snd.setGenre(e.music);}}
      else{setTalkCam(null);clearPianist();}
      return;
    }
    if(e.k==='enter'){g.active=true;restyleGuest(g,TALE_CHARS[e.who].look);g.fig.visible=true;g.nameOv=TALE_CHARS[e.who].name;g.noTalk=true;g.cheer=.6;Snd.clink(.35);setFace(g.fig,'neutral');setTalkCam(g);addProp(e.who,g);}
    else{removeProp(e.who);setTalkCam(null);g.active=false;g.fig.visible=false;restyleGuest(g,null);g.fig.visible=false;g.order=null;g.reaction=null;if(g.drink){scene.remove(g.drink.group);g.drink=null;}}
  });
}
function taleStep(){
  const T=S.tale;if(!T)return;
  taleEvents();
  const v=taleView(T.st,T.graph);
  if(v.kind==='wait'||v.kind==='over'||v.kind==='close')setStill(null);
  if(v.kind==='say')setStill(v.still);
  if(v.kind==='wait')return taleOrder(v);
  S.paused=true;player.st.enabled=false;el.uiWalk.hidden=true;el.act.hidden=true;S.actionKey='';playerFig.visible=false;
  if(v.kind==='say'&&TALE_CHARS[v.who]&&TALE_CHARS[v.who].seat){const g=taleGuest(v.who);if(g.active){setTalkCam(g);setFace(g.fig,v.face);}}
  else if(v.kind==='over'||v.kind==='close')setTalkCam(null);
  if(v.kind==='close'){const nx=NIGHTS.find(n=>n.n===T.night.n+1);if(nx)v.next=nx.title;}
  taleUI.show(v);
}
/* The talk is over for now: put the order on the board and let the player walk to the counter. */
function taleOrder(v){
  taleUI.hide();setTalkCam(null);playerFig.visible=true;el.uiWalk.hidden=false;S.paused=false;player.st.enabled=true;
  const g=taleGuest(v.who),rec=RECIPE_BY_ID[v.order.rec],seat=S.world.seats.find(s=>s.id===g.seatId);
  seat.active=true;seat.order={recipeId:rec.id,at:time,rush:false};seat.reaction=null;S.world.night.ordered++;S.world.rev++;
  g.order=rec;g.orderAt=time;g.rush=false;g.reaction=null;g.askedOrder=false;
  if(g.drink){scene.remove(g.drink.group);g.drink=null;}
  toast(t('tale_order',{name:g.name,drink:rec.name}),4200);
  updateWalkUI();
}
function taleAfterServe(stars){if(!S.tale)return;taleServedEv(S.tale.st,S.tale.graph,stars);taleStep();}
function taleStart(){
  const night=NIGHTS.find(n=>n.n===S.session.night)||NIGHTS[0];
  S.tale={st:taleNew(night.n,loadTale()),graph:night.graph,night};
  taleBegin(S.tale.st,night.graph,night.entry);
  player.place(.6,-1.5,0,Math.PI);player.update(0,time);
  updateWalkUI();taleStep();
}
const startUI=createStart({root:$('#start'),recipes:RECIPES,getCfg:()=>S.session||loadSession(),
  onFirstTap:()=>startMusicOnOpen(true),
  getMusic:startMusicChoice,onMusic:g=>setMusic(g,false),          // the first tap on the start screen is the browser's cue to let the music begin
  onPreview:applyLook,
  roomLock:()=>net.active?net.code:null,
  initialOnline:(()=>{let nm='';try{nm=localStorage.getItem(NAME_KEY)||'';}catch(_){}const rc=normalizeCode(new URLSearchParams(location.search).get('room'));return {mode:rc.length===5?'join':'solo',code:rc,name:nm};})(),
  onStart:(cfg,onl)=>{if(cfg.mode==='tale'&&net.active){cfg=Object.assign({},cfg,{mode:'service'});toast(t('tale_online'),3600);}applySession(cfg);S.paused=false;player.st.enabled=true;connectRoom(onl);startMusicOnOpen();if(cfg.mode==='tale'){taleStart();return;}if(cfg.mode==='story'&&onl.mode==='solo'){const st=stageOf(cfg);toast(tr(st.name)+' · '+tr(st.desc),4500);}}});
function openStart(){
  if(S.mode!=='walk')return;
  if(net.active&&!isHost()){toast(t('host_only'));return;}
  S.paused=true;player.st.enabled=false;$('#summary').hidden=true;startUI.show();
}
$('#btn-night').addEventListener('click',openStart);
/* bar notebook: polaroid guestbook + coaster collection */
const bookEl=$('#book'),bookBody=$('#book-body');let bookTab='photos';
function hue(id){let h=0;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))%360;return h;}
function renderBook(){
  const b=loadBook();bookBody.textContent='';
  bookEl.querySelectorAll('[data-bt]').forEach(x=>x.classList.toggle('on',x.dataset.bt===bookTab));
  const mk=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
  if(bookTab==='photos'){
    if(!b.photos.length){bookBody.append(mk('p','bk-empty',t('book_empty_photos')));return;}
    const wall=mk('div','bk-wall');
    b.photos.forEach((p,i)=>{
      const rc=RECIPE_BY_ID[p.rec];if(!rc)return;
      const c=mk('figure','bk-photo');c.style.setProperty('--rot',((i*37%9)-4)+'deg');
      const img=mk('div','bk-img');img.style.setProperty('--h',hue(p.rec));img.append(mk('span','bk-glass','🍸'));
      const d=new Date(p.ts||0);
      c.append(mk('i','bk-tape'),img,mk('b','',rc.name),mk('span','bk-who',t('book_who',{who:p.who})),mk('em','bk-stars','★★★'),mk('small','',isNaN(d)?'':d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')));
      wall.append(c);
    });
    bookBody.append(wall);
  }else{
    const have=RECIPES.filter(r=>b.coasters[r.id]).length;
    bookBody.append(mk('p','bk-count',t('book_count',{n:have,m:RECIPES.length})));
    const grid=mk('div','bk-grid');
    RECIPES.forEach(r=>{
      const c=b.coasters[r.id],el2=mk('div','bk-coaster'+(c?'':' locked'));
      el2.style.setProperty('--h',hue(r.id));
      el2.append(mk('span','bk-disc',c?r.name.slice(0,1):'?'),mk('b','',c?r.name:'???'),mk('small','',c?'★'.repeat(c.best)+' · '+t('book_made',{n:c.n}):''));
      grid.append(el2);
    });
    bookBody.append(grid);
  }
}
function openBook(){bookEl.hidden=false;$('#settings').hidden=true;renderBook();}
function closeBook(){bookEl.hidden=true;}
$('#btn-book').addEventListener('click',openBook);$('#book-x').addEventListener('click',closeBook);
bookEl.addEventListener('click',e=>{const b=e.target.closest('[data-bt]');if(b){bookTab=b.dataset.bt;renderBook();}});
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!bookEl.hidden){closeBook();e.stopPropagation();}},true);
onLang(()=>{if(!bookEl.hidden)renderBook();});
$('#btn-xmas').addEventListener('click',()=>{setXmas(!xmasOn,true);toast(t(xmasOn?'xmas_toast_on':'xmas_toast_off'),2200);if(xmasOn){Snd.init();Snd.jingle();}});
setXmas(xmasOn,false);
/* settings popover (language, units, music) */
const setBtn=$('#btn-settings'),setPop=$('#settings');
function toggleSettings(open){setPop.hidden=!open;setBtn.setAttribute('aria-expanded',String(open));}
setBtn.addEventListener('click',()=>toggleSettings(setPop.hidden));
document.addEventListener('pointerdown',e=>{if(!setPop.hidden&&!setPop.contains(e.target)&&!setBtn.contains(e.target))toggleSettings(false);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!setPop.hidden)toggleSettings(false);});
function showSummary(){
  const N=S.world.night,sm=nightSummary(S.world),avg=sm.avg,lv=sm.level;
  S.paused=true;player.st.enabled=false;S.summaryFor=S.world.seed;
  const guestOnly=net.active&&!isHost();
  $('#btn-sum-again').disabled=guestOnly;$('#btn-sum-new').disabled=guestOnly;
  $('#sum-when').textContent=t('time_'+S.time.id)+' · '+S.time.clock;
  $('#sum-title').textContent=t('sum_title');
  $('#sum-stars').innerHTML=[0,1,2].map(i=>'<span class="'+(i<Math.round(avg)?'on':'')+'">★</span>').join('');
  $('#sum-say').textContent=t('sum_r'+lv);
  const lines=['<li><span>'+t('sum_drinks')+'</span><span>'+N.served+'</span></li>','<li><span>'+t('sum_stars')+'</span><span>'+avg.toFixed(1)+' / 3</span></li>'];
  if(N.best)lines.push('<li><span>'+t('sum_best')+'</span><span>'+RECIPE_BY_ID[N.best.recipeId].name+'</span></li>');
  $('#sum-lines').innerHTML=lines.join('');
  $('#sum-tip').textContent=won(N.tips);
  const nextBtn=$('#btn-sum-next');nextBtn.hidden=true;
  if(S.session.mode==='story'&&!net.active){
    const st=stageOf(S.session),clear=avg>=st.minStars;
    if(clear){clearStage(st.id,avg);const nx=STAGES[STAGES.indexOf(st)+1];if(nx){nextBtn.hidden=false;nextBtn.dataset.next=nx.id;}}
    $('#sum-title').textContent=t(clear?'story_clear':'story_retry',{stage:tr(st.name)});
    $('#sum-say').textContent=clear?t('story_clear_say'):t('story_retry_say',{n:st.minStars});
  }
  $('#summary').hidden=false;Snd.clink(1);
}
$('#btn-sum-again').addEventListener('click',()=>{$('#summary').hidden=true;applySession(Object.assign({},S.session));S.paused=false;player.st.enabled=true;});
$('#btn-sum-next').addEventListener('click',()=>{
  const id=$('#btn-sum-next').dataset.next;$('#summary').hidden=true;
  const cfg=Object.assign({},S.session,{stage:id});applySession(cfg);S.paused=false;player.st.enabled=true;
  toast(tr(stageOf(cfg).name)+' · '+tr(stageOf(cfg).desc),4500);
});
$('#btn-sum-new').addEventListener('click',openStart);
applySession(loadSession());
applyDom();refreshAll();
player.update(0,0);
player.st.enabled=false;
startUI.show();
updateWalkUI();
if(matchMedia('(pointer:coarse)').matches)setTimeout(()=>toast(t('hint_touch'),4500),1800);
requestAnimationFrame(frame);

/* fonts: repaint canvas text once the web fonts arrive */
if(document.fonts&&document.fonts.load){
  Promise.all([document.fonts.load('96px Marcellus','Bar Coda'),document.fonts.load('600 25px "Josefin Sans"','LISTENING LOUNGE'),document.fonts.load('56px "Black Han Sans"','Coda 라운지')]).then(()=>{room.drawNeon();paintAllLabels();}).catch(()=>{});
  document.fonts.ready.then(()=>{room.drawNeon();paintAllLabels();});
}
