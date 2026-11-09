import {createPeers,applyMessage,expire,sanitizeName,LOOK_COUNT} from './peers.js';

/* Room client: joins a room over a transport, broadcasts where this player is, tracks everyone else. */
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LEN=5;
export const makeCode=()=>Array.from({length:CODE_LEN},()=>ALPHABET[Math.floor(Math.random()*ALPHABET.length)]).join('');
export const normalizeCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,CODE_LEN);

export function createRoom(transport,opts){
  const now=(opts&&opts.now)||Date.now,onChange=(opts&&opts.onChange)||(()=>{});
  const me={id:'p'+Math.random().toString(36).slice(2,10),name:'',c:0};
  const peers=createPeers();
  const iv=transport.intervals||{moving:100,idle:500};
  const gameHandlers=new Set();
  let code=null,unsub=null,lastSent=0,state={x:0,z:0,yaw:0,sp:0};

  const send=(t,extra)=>transport.send(Object.assign({t,id:me.id,name:me.name,c:me.c,x:state.x,z:state.z,yaw:state.yaw,sp:state.sp},extra));

  function join(c,name,look){
    leave();
    code=normalizeCode(c);me.name=sanitizeName(name);me.c=((look|0)%LOOK_COUNT+LOOK_COUNT)%LOOK_COUNT;
    transport.join(code);
    unsub=transport.on(raw=>{
      if(!raw||raw.id===me.id)return;
      if(raw.t==='g'){gameHandlers.forEach(h=>h(raw));return;}
      if(applyMessage(peers,raw,now()))onChange();
      if(raw.t==='hello')send('pos');
    });
    send('hello');lastSent=now();
    onChange();
    return code;
  }
  function leave(){
    if(!code)return;
    send('bye');
    if(unsub)unsub();unsub=null;
    transport.leave();peers.clear();code=null;
    onChange();
  }
  /* Call every frame with this player's state; sends at ~10 Hz while moving, ~2 Hz when idle. Uses the room's own clock. */
  function update(s){
    if(!code)return;
    const t=now();state=s;
    if(t-lastSent>=(s.sp>.02?iv.moving:iv.idle)){send('pos');lastSent=t;}
    if(expire(peers,t).length)onChange();
  }
  function emote(){if(code)send('emote',{e:'cheers'});}
  /* Game channel: opaque payloads for the shared night (validated by game/shared.js, not here). */
  function sendGame(payload){if(code)transport.send(Object.assign({},payload,{t:'g',id:me.id}));}
  function onGame(h){gameHandlers.add(h);return()=>gameHandlers.delete(h);}
  const ids=()=>code?[me.id].concat([...peers.keys()]):[];

  return {me,peers,join,leave,update,emote,sendGame,onGame,ids,get code(){return code;},get active(){return code!==null;},get count(){return peers.size+(code?1:0);}};
}
