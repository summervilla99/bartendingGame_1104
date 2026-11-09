import * as THREE from 'three';
import './styles.css';
import {clamp,lerp,ease,rand,pick,won,reduceMotion} from './util.js';
import {M,lathe} from './three-utils.js';
import {INGR,ING,RECIPES,GARNISH,GARNISH_NAME,GLASS_NAME,METHOD_NAME,CATS,serveOf,ratioOf} from './data.js';
import {t,tr,getLang,setLang,onLang,applyDom} from './i18n.js';
import {fmtVol,fmtRatio} from './units.js';
import {makeGlass,makeGarnish,makeShaker,GL} from './glass.js';
import {makeCharacter,poseSit,poseWalk,reachArm,resetArms,GUEST_CFG,LOUNGE_CFG,PLAYER_CFG,BARTENDER_CFG} from './figures.js';
import {Snd} from './audio.js';
import {buildEnv} from './env.js';
import {createComposer} from './composer.js';
import {buildRoom,brass,COUNTER_TOP,STOOL_Z,BAR_ZONE,ROOM} from './room.js';
import {makeBottle} from './bottles.js';
import {TIMES,loadSession,saveSession,poolFor} from './session.js';
import {createStart} from './start.js';
import {createTransport} from './net/transport.js';
import {createRoom,makeCode,normalizeCode} from './net/room.js';
import {smooth as smoothPeer} from './net/peers.js';
import {claimSeat,releaseClaim,expireClaims,applyServed,autoServe,hostMissing,electHost,acceptSnapshot,parseGameMessage,tipFor} from './game/shared.js';
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
  const npc={cfg,x:p.x,fig,seat,active:true,order:null,orderAt:0,reaction:null,talk:null,talkIdx:0,drink:null,cheer:0,ph:i*1.7,
    anchor:new THREE.Vector3(p.x,seat==='stool'?1.95:1.55,p.z),baseYaw:fig.rotation.y};
  Object.defineProperty(npc,'name',{get:()=>tr(cfg.nm)});
  return npc;
}
const guests=GUEST_CFG.map((c,i)=>makeNpc(c,i,'stool'));
const loungers=LOUNGE_CFG.map((c,i)=>makeNpc(c,i+4,'lounge'));
const npcs=guests.concat(loungers);

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
function camTarget(){return S.mode==='bar'?(portraitNow()?PRE.barP:PRE.bar):player.view;}
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
  const f=fovFor(camFov);if(Math.abs(camera.fov-f)>.01){camera.fov=f;camera.updateProjectionMatrix();}
  if(camOff>.001)camera.setViewOffset(W,H,0,Math.round(camOff*H),W,H);
  else if(camera.view&&camera.view.enabled)camera.clearViewOffset();
}

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
  b.innerHTML='<span class="sw" style="background:'+({none:'#d6c3a0',orange:'#e0802a',lime:'#9cc24a',lemon:'#f0d23a',mint:'#3f9a4a',cherry:'#8a1020'}[gn.id])+'"></span><span class="nm"></span><span class="ml">&nbsp;</span>';b.querySelector('.nm').textContent=gn.name;
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

const bubbleEls=npcs.map(()=>{const b=document.createElement('div');b.className='bubble';el.bubbles.appendChild(b);return b;});

function pendingGuests(){return guests.filter(g=>g.order&&!g.claimBy).sort((a,b)=>a.orderAt-b.orderAt);}
function updateWalkUI(){
  el.tips.textContent=won(S.world?S.world.tips:0);
  if(S.session&&S.world){
    const ns=$('#night-stat');ns.hidden=false;
    $('#night-lb').textContent='';
    $('#night-prog').textContent=S.session.mode==='service'?t('night_prog',{time:t('time_'+S.time.id),n:S.world.night.served,goal:S.time.goal}):t('night_free',{time:t('time_'+S.time.id)});
  }
  el.orders.innerHTML=pendingGuests().map(g=>'<li>'+g.name+'<b>'+g.order.name+'</b></li>').join('');
}

/* ───────────── orders ───────────── */
const guestById=id=>guests[+id.slice(1)];
function updateOrders(){
  if(S.paused)return;
  if(net.active){if(isHost())hostTick();return;}
  const ev=tickOrders(S.world,time);
  if(!ev)return;
  const g=guestById(ev.seatId);
  g.order=RECIPE_BY_ID[ev.recipeId];g.orderAt=time;
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
    else if(g.reaction&&time<g.reaction.until){key='r'+g.reaction.si;cls='bubble react';html='<small>'+g.name+'</small>'+t('say'+g.reaction.si);}
    else if(g.order&&g.claimName){key='c'+g.order.id+g.claimName;html='<small>'+g.name+'</small><b>'+g.order.name+'</b><em>'+t('bubble_making',{name:g.claimName})+'</em>';}
    else if(g.order){key='o'+g.order.id;html='<small>'+g.name+'</small>'+t('bubble_order',{name:'<b>'+g.order.name+'</b>'});}
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
  npcs.forEach(g=>{if(!g.active)return;const d=Math.hypot(g.fig.position.x-player.pos.x,g.fig.position.z-player.pos.z);if(d<bd){bd=d;best=g;}});
  return best;
}
function updateAction(){
  let a=null;
  if(S.mode==='walk'&&!S.paused){
    if(inBarZone(player.pos)){const n=pendingGuests().length,full=net.active&&S.world.stations.every(Boolean);a=full?{type:'wait',label:t('act_full')}:n?{type:'bar',label:t('act_bar',{n})}:{type:'wait',label:t('act_wait')};}
    else{const g=nearestNpc();if(g)a={type:'talk',g,label:t('act_talk',{name:g.name})};}
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
  else if(a.type==='talk'){
    const g=a.g;let rec=null,idx=g.talkIdx;
    if(g.order&&!g.askedOrder){g.askedOrder=true;rec=g.order;}
    else g.talkIdx++;
    g.talk={rec,idx,until:time+4.5};
  }
}

/* ───────────── mode switching ───────────── */
function enterBar(g){
  Snd.init();
  S.mode='bar';S.guest=g;S.recipe=g.order;S.drink=startDrink(S.world,'g'+guests.indexOf(g),S.claimInfo?S.claimInfo.orderNo:undefined);g.askedOrder=false;
  player.st.enabled=false;player.st.drag=null;
  playerFig.position.copy(BAR_STAND);playerFig.rotation.y=0;poseWalk(playerFig,0,0,time);
  resetBar();
  el.uiWalk.hidden=true;el.uiBar.hidden=false;el.act.hidden=true;S.actionKey='';
  el.ticket.open=window.innerWidth>=900||S.session.mode==='practice';
  setTab(ING[Object.keys(S.recipe.parts)[0]].cat);layoutRail(true);
  goCam();updateTicket();
  if(!S.hinted){S.hinted=true;toast(t('toast_hint'),3200);}
}
function leaveBar(){
  if(S.claimSeat){sendAct({k:'unclaim',seat:S.claimSeat});S.claimSeat=null;}
  S.claimInfo=null;
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
  const r=S.recipe;S.stirAngle=0;S.strainT=0;S.serveT=0;S.pourId=null;S.mixKey=null;S.strainColor=null;S.shakeOff=0;S.strainStream=false;
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
  refreshTicket();
}
function refreshTicket(){
  const r=S.recipe;if(!r)return;
  [...el.tkLines.children].forEach(li=>{
    const id=li.dataset.id,tg=r.parts[id],cur=S.drink.poured[id]||0,ratio=cur/tg;
    li.querySelector('.amt').textContent=S.session&&S.session.guide==='instinct'?fmtVol(tg):fmtRatio(cur,tg);
    const bar=li.querySelector('i');bar.style.width=clamp(ratio/1.5*100,0,100)+'%';
    bar.className=ratio>1.1?'over':(ratio>=.9?'ok':'');
  });
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
      Snd.pour(true);
      if(S.drink.total>=v.cap-.01){toast(t('toast_full'));stopPour();}
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
    S.vessel.setIce(iceFor(r.glass));
    goGarnish();return;
  }
  setStage('mix');
  if(r.method==='shake'){
    S.vessel.group.visible=false;
    S.shaker=makeShaker();S.shaker.group.position.copy(VP);scene.add(S.shaker.group);S.src=S.shaker;
    Snd.clink(.4);
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
  if(t>=.35&&sv.ice===0&&iceFor(S.recipe.glass))sv.setIce(iceFor(S.recipe.glass));
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
    if(id==='cherry')go.position.set(.02,sv.level+.005,0);else go.position.set(sv.rimR*.82,sv.rimY+.005,0);
    sv.group.add(go);S.garnishObj=go;
    if(!silent)Snd.clink(.4);
  }
}

/* ───────────── serving + scoring ───────────── */
function serveDrink(){
  if(S.stage!=='garnish')return;
  gameServe(S.drink);setStage('serve');S.serveT=0;
  el.pGar.hidden=true;Snd.clink(1);
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
  $('#r-say').textContent=t('say'+r.stars);
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
  S.stage='result';
  if(net.active){
    const rawTip=r.tip;r.tip=tipFor(S.world.session,rawTip);S.drink.stage='result';
    sendAct({k:'served',seat:S.drink.seatId,rec:S.drink.recipeId,stars:r.stars,final:r.final,tip:rawTip,ml:S.serv.ml,col:S.strainColor||blendColor()||[.5,.5,.5]});
    S.claimSeat=null;
  }else settleDrink(S.world,S.drink);
  renderResult();
  $('#btn-r-next').disabled=pendingGuests().filter(x=>x!==g).length<1;
  el.result.hidden=false;
  Snd.clink(1);
  g.cheer=1.2;
}
function spawnDrinkProp(g,d){
  const rc=RECIPE_BY_ID[d.recipeId];
  const prop=makeGlass(rc.glass);prop.group.scale.setScalar(.8);prop.group.position.set(g.x,COUNTER_TOP,.45);
  prop.setLevel(d.ml);prop.setColor(d.col);if(iceFor(rc.glass))prop.setIce(iceFor(rc.glass));
  scene.add(prop.group);if(g.drink)scene.remove(g.drink.group);g.drink=prop;
}
function finishService(){
  const g=S.guest,sv=S.serv,r=S.drink.result;
  scene.remove(sv.group);
  if(S.garnishObj&&S.garnishObj.parent)S.garnishObj.parent.remove(S.garnishObj);
  if(!net.active){
    spawnDrinkProp(g,{recipeId:S.drink.recipeId,ml:sv.ml,col:S.strainColor||blendColor()});
    g.order=null;g.reaction={si:r.stars,until:time+7};releaseSeat(S.world,S.drink.seatId,time,r.stars);updateWalkUI();
  }
  S.vessel&&S.vessel.group.parent&&S.vessel.group.parent.remove(S.vessel.group);
  S.vessel=S.serv=null;S.garnishObj=null;
}

/* ───────────── bar-mode per-frame ───────────── */
function updateBar(dt,t){
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
function cheers(){
  if(S.mode!=='walk')return;
  Snd.init();Snd.clink(1);player.st.cheer=1.2;net.emote();
  npcs.forEach((g,i)=>{if(g.active&&g.fig.position.distanceTo(player.pos)<5)setTimeout(()=>{g.cheer=1.2;},120+i*110);});
  setTimeout(()=>Snd.clink(.7),380);
  toast(t('toast_cheers'));
}

/* ───────────── events ───────────── */
el.act.addEventListener('click',doAction);
$('#btn-cheers').addEventListener('click',cheers);
$('#btn-leave').addEventListener('click',leaveBar);
$('#btn-reset').addEventListener('click',()=>{
  if(S.stage!=='pour')return;
  stopPour();clearPour(S.drink);S.vessel.setLevel(0);dirtyUI=true;
});
$('#btn-next-pour').addEventListener('click',afterPour);
$('#btn-strain').addEventListener('click',goStrain);
$('#btn-serve').addEventListener('click',serveDrink);
function nightOver(){return worldNightOver(S.world);}
$('#btn-r-leave').addEventListener('click',()=>{finishService();leaveBar();if(nightOver())showSummary();});
$('#btn-r-next').addEventListener('click',()=>{
  finishService();el.result.hidden=true;
  if(net.active){leaveBar();const ng=pendingGuests()[0];if(ng&&!nightOver())beginBartending(ng);else if(nightOver())showSummary();return;}
  const g=pendingGuests()[0];
  if(g&&!nightOver())enterBar(g);else{leaveBar();if(nightOver())showSummary();}
});
function refreshMusic(){$('#music-lb').textContent=t(Snd.on?'music_off':'music_on');el.music.setAttribute('aria-pressed',Snd.on?'true':'false');}
el.music.addEventListener('click',()=>{
  const on=!Snd.on;if(!Snd.music(on)){toast(t('toast_nosound'));return;}
  refreshMusic();
});
$('#btn-lang').addEventListener('click',()=>setLang(getLang()==='ko'?'en':'ko'));
/* Re-render every piece of dynamic text (language or unit change). */
function refreshAll(){
  INGR.forEach(ing=>{chipEls[ing.id].querySelector('.nm').textContent=ing.name;});
  GARNISH.forEach(gn=>{garnEls[gn.id].querySelector('.nm').textContent=gn.name;});
  CATS.forEach(c=>{tabEls[c.id].textContent=t(c.key);});
  paintAllLabels();updateWalkUI();S.actionKey='';
  if(S.recipe&&S.mode==='bar'){updateTicket();if(S.stage&&S.stage!=='result')setStage(S.stage);if(S.mixKey)el.mixSay.textContent=t(S.mixKey);if(S.drink.result&&!el.result.hidden)renderResult();}
  refreshRoomUI();refreshChips();refreshMusic();
}
onLang(refreshAll);
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&S.mode==='bar'&&el.result.hidden)leaveBar();
  if(e.code==='KeyE'&&!e.repeat&&S.mode==='walk'&&!S.paused)doAction();
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
if(DEBUG)window.__courte={get net(){return net;},snapshot:()=>snapshot(S.world,S.drink),S,enterBar,leaveBar,guests,npcs,player,doAction,RECIPES,makeGlass,makeShaker,scene,COUNTER_TOP,setTab,setLang};
let last=performance.now(),firstFrame=true;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(DT_MAX,(now-last)/1000);last=now;time+=dt;
  if(S.mode==='walk'){if(!S.paused)player.update(dt,time);player.view.off=portraitNow()?.12:0;}
  updateCamera(dt);room.animate(dt,time);
  if(S.mode==='bar'){updateRail(dt);updateBar(dt,time);}
  updateNpcs(dt,time);updateOrders();updateAction();updateBubbles();syncRemotes(dt,time);
  finalPass.uniforms.time.value=time%50;
  composer.render(dt);
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
  if(changed)commitWorld();
  else if(time-S.lastBeat>2.5){broadcastWorld();S.lastBeat=time;}
}
/* Make the guests, drinks and bubbles match the world. quiet = first snapshot (no cheering for old drinks). */
function syncSeats(quiet){
  if(!S.world)return;
  S.world.seats.forEach((seat,i)=>{
    const g=guests[i],want=seat.order?seat.order.recipeId:null,have=g.order?g.order.id:null;
    if(want!==have){
      if(want){g.order=RECIPE_BY_ID[want];g.orderAt=seat.order.at;if(g.drink){scene.remove(g.drink.group);g.drink=null;}g.reaction=null;}
      else g.order=null;
    }
    g.claimBy=seat.claim?seat.claim.by:null;
    g.claimName=seat.claim&&seat.claim.by!==net.me.id?nameOf(seat.claim.by):'';
    const sv=seat.served;
    if(sv&&sv.rev!==g.servedRev){
      g.servedRev=sv.rev;
      spawnDrinkProp(g,sv);
      if(!quiet){g.reaction={si:sv.stars,until:time+7};g.cheer=1.2;}
    }
  });
  updateWalkUI();
}
function checkNightEnd(){
  if(!net.active||!S.world||S.summaryFor===S.world.seed)return;
  if(worldNightOver(S.world)&&S.mode==='walk'&&!S.paused)showSummary();
}
function adoptWorld(w){
  const first=!S.synced,newSession=!S.session||w.session.time!==S.session.time||w.session.menu!==S.session.menu||w.session.mode!==S.session.mode||w.session.guide!==S.session.guide;
  const newNight=!S.world||w.seed!==S.world.seed;
  S.world=w;S.synced=true;
  if(first||newSession||newNight)adoptSession(w.session);
  if(newNight&&!$('#summary').hidden){$('#summary').hidden=true;S.paused=false;player.st.enabled=true;}
  syncSeats(first||newNight);
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
  toast(t(taken||stale?'claim_fail':'claim_lost'));
  if(S.mode==='bar')leaveBar();else S.claimInfo=null;
}
function beginBartending(g){
  if(!net.active){enterBar(g);return;}
  const seatId='g'+guests.indexOf(g);
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
function refreshRoomUI(){
  const chip=$('#room-chip');chip.hidden=!net.active;$('#row-room').hidden=!net.active;chip.classList.toggle('wait',transport.status==='connecting');
  if(net.active){chip.textContent=net.code+' · '+net.count+(isHost()?' ★':'');chip.setAttribute('aria-label',t('room_aria',{code:net.code,n:net.count}));}
}
function connectRoom(onl){
  if(onl.mode==='keep')return;
  if(onl.mode==='solo'){if(net.active){net.leave();setRoomParam(null);}return;}
  if(net.active&&(onl.mode==='create'||normalizeCode(onl.code)===net.code))return;
  const name=(onl.name||'').trim()||t('guest_default');
  try{localStorage.setItem(NAME_KEY,name);}catch(_){}
  const code=onl.mode==='create'?makeCode():normalizeCode(onl.code);
  net.join(code,name,myLook());setRoomParam(code);
  if(onl.mode==='create'){S.world.hostId=net.me.id;S.world.rev++;S.synced=true;commitWorld();refreshRoomUI();}
  else{S.synced=false;S.syncWait=0;S.world.hostId=null;net.sendGame({k:'need'});}
  toast(t(onl.mode==='create'?'room_open':'room_joined',{code}),3200);
}
const STATION_X=[-.9,.9];
const myState=()=>({x:S.mode==='bar'&&S.claimInfo?STATION_X[S.claimInfo.station]:playerFig.position.x,z:playerFig.position.z,yaw:playerFig.rotation.y,sp:S.mode==='walk'?Math.min(1.25,player.st.amt):0});
function syncRemotes(dt,t){
  if(!net.active&&!remotes.size)return;
  net.update(myState());
  const nowT=performance.now(),rect=canvas.getBoundingClientRect(),showTags=S.mode==='walk'&&cam.t>=.7;
  net.peers.forEach((p,id)=>{
    let r=remotes.get(id);
    if(!r){
      const fig=makeCharacter(LOOKS[p.c]);scene.add(fig);
      const tag=document.createElement('div');tag.className='nametag';el.bubbles.appendChild(tag);
      r={fig,tag};remotes.set(id,r);
    }
    smoothPeer(p,dt);
    r.fig.position.set(p.x,room.groundAt(p.x,p.z),p.z);r.fig.rotation.y=p.yaw;
    poseWalk(r.fig,p.ph,Math.min(1,p.sp),t);
    const l=p.emoteUntil>nowT?Math.sin(Math.min(1,(p.emoteUntil-nowT)/1200)*Math.PI):0;
    if(l>0){const a=r.fig.userData.arms[1];a.sh.rotation.x=-2.5*l;a.el.rotation.x=-.6*l;}
    if(r.tag.textContent!==p.name)r.tag.textContent=p.name;
    tagV.set(p.x,r.fig.position.y+1.95,p.z).project(camera);
    if(!showTags||tagV.z>1||Math.abs(tagV.x)>1.2){r.tag.style.display='none';}
    else{r.tag.style.display='block';r.tag.style.transform='translate('+((tagV.x*.5+.5)*rect.width).toFixed(1)+'px,'+((-tagV.y*.5+.5)*rect.height).toFixed(1)+'px) translate(-50%,-100%)';}
  });
  remotes.forEach((r,id)=>{if(!net.peers.has(id)){scene.remove(r.fig);r.tag.remove();remotes.delete(id);}});
}
$('#room-chip').addEventListener('click',()=>{
  if(!net.active)return;
  const u=new URL(location.href);u.search='';u.searchParams.set('room',net.code);const url=u.toString();
  (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast(t('room_copied')),()=>toast(url,4000));
});
$('#btn-room-leave').addEventListener('click',()=>{if(S.mode==='bar')leaveBar();net.leave();setRoomParam(null);toggleSettings(false);toast(t('room_left'));});
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
  S.session=cfg;S.time=TIMES[cfg.time];
  applyLook(cfg.time);
  guests.forEach((g,i)=>{g.active=S.time.guests.indexOf(i)>=0;});
  loungers.forEach((g,i)=>{g.active=S.time.lounge.indexOf(i)>=0;});
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
  const old=S.world;S.world=createWorld(cfg,DEBUG_SEED,time);S.drink=null;S.recipe=null;S.claimSeat=null;S.claimInfo=null;
  if(old)S.world.rev=old.rev+1;
  if(net.active){S.world.hostId=net.me.id;}
  S.synced=true;
  adoptSession(cfg);
  updateWalkUI();
  if(net.active)broadcastWorld();
}
const startUI=createStart({root:$('#start'),recipes:RECIPES,getCfg:()=>S.session||loadSession(),
  onPreview:applyLook,
  roomLock:()=>net.active?net.code:null,
  initialOnline:(()=>{let nm='';try{nm=localStorage.getItem(NAME_KEY)||'';}catch(_){}const rc=normalizeCode(new URLSearchParams(location.search).get('room'));return {mode:rc.length===5?'join':'solo',code:rc,name:nm};})(),
  onStart:(cfg,onl)=>{applySession(cfg);S.paused=false;player.st.enabled=true;connectRoom(onl);}});
function openStart(){
  if(S.mode!=='walk')return;
  if(net.active&&!isHost()){toast(t('host_only'));return;}
  S.paused=true;player.st.enabled=false;$('#summary').hidden=true;startUI.show();
}
$('#btn-night').addEventListener('click',openStart);
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
  $('#summary').hidden=false;Snd.clink(1);
}
$('#btn-sum-again').addEventListener('click',()=>{$('#summary').hidden=true;applySession(Object.assign({},S.session));S.paused=false;player.st.enabled=true;});
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
  Promise.all([document.fonts.load('150px Yellowtail'),document.fonts.load('56px "Black Han Sans"','Courte 라운지')]).then(()=>{room.drawNeon();paintAllLabels();}).catch(()=>{});
  document.fonts.ready.then(()=>{room.drawNeon();paintAllLabels();});
}
