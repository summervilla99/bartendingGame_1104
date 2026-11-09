/* Pure peer bookkeeping for a room: validate untrusted messages, track other players, expire silent ones, smooth motion.
   No DOM, no three.js, no timers, so it runs the same in the browser, in Node tests and later on a server. */
export const STALE_MS=5000,MAX_PEERS=8,LOOK_COUNT=8,NAME_MAX=16;
const BOUNDS={x0:-9.7,x1:9.7,z0:-3,z1:11.7};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=v=>typeof v==='number'&&isFinite(v);

export const sanitizeName=s=>String(s==null?'':s).replace(/[\u0000-\u001f<>&"'`]/g,'').trim().slice(0,NAME_MAX);

/* Returns a clean message or null. Anything coming over the wire is untrusted. */
export function parse(msg){
  if(!msg||typeof msg!=='object')return null;
  if(typeof msg.id!=='string'||msg.id.length<4||msg.id.length>24)return null;
  const t=msg.t;
  if(t!=='hello'&&t!=='pos'&&t!=='emote'&&t!=='bye')return null;
  const out={t,id:msg.id};
  if(t==='bye')return out;
  if(t==='emote'){if(msg.e!=='cheers')return null;out.e='cheers';return out;}
  if(!num(msg.x)||!num(msg.z)||!num(msg.yaw))return null;
  out.x=clamp(msg.x,BOUNDS.x0,BOUNDS.x1);out.z=clamp(msg.z,BOUNDS.z0,BOUNDS.z1);out.yaw=msg.yaw;
  out.sp=num(msg.sp)?clamp(msg.sp,0,1.5):0;
  out.name=sanitizeName(msg.name);
  out.c=Number.isInteger(msg.c)?((msg.c%LOOK_COUNT)+LOOK_COUNT)%LOOK_COUNT:0;
  return out;
}

export const createPeers=()=>new Map();

/* Apply one incoming message. Returns true when the peer set or a peer changed. */
export function applyMessage(peers,raw,now){
  const m=parse(raw);
  if(!m)return false;
  if(m.t==='bye')return peers.delete(m.id);
  let p=peers.get(m.id);
  if(!p){
    if(m.t==='emote'||peers.size>=MAX_PEERS)return false;
    p={id:m.id,name:'',c:0,x:m.x,z:m.z,yaw:m.yaw,tx:m.x,tz:m.z,tyaw:m.yaw,sp:0,ph:0,last:now,emoteUntil:0,joined:now};
    peers.set(m.id,p);
  }
  p.last=now;
  if(m.t==='emote'){p.emoteUntil=now+1200;return true;}
  if(m.name)p.name=m.name;
  p.c=m.c;p.tx=m.x;p.tz=m.z;p.tyaw=m.yaw;p.sp=m.sp;
  return true;
}

/* Drop peers that went silent (closed tab, lost connection). Returns removed ids. */
export function expire(peers,now){
  const gone=[];
  peers.forEach((p,id)=>{if(now-p.last>STALE_MS)gone.push(id);});
  gone.forEach(id=>peers.delete(id));
  return gone;
}

/* Ease a peer toward its latest reported position (updates arrive ~10 Hz). */
export function smooth(p,dt){
  const k=Math.min(1,dt*10);
  p.x+=(p.tx-p.x)*k;p.z+=(p.tz-p.z)*k;
  let d=p.tyaw-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));
  p.yaw+=d*k;
  p.ph+=dt*(4.6+p.sp*1.6)*(p.sp>.05?1:0);
}
