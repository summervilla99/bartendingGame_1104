/* Bar decor you unlock with your lifetime tips: light colour, wall frames, coasters. Pure data + localStorage (no DOM, no three.js).
   The host's choice rides in the room's session (session.decor), so everyone sees the host's taste. */
const N=(ko,en)=>({ko,en});
export const DECOR={
  light:[
    {id:'amber',at:0,n:N('호박빛','Amber'),tint:null},
    {id:'rose',at:20000,n:N('장미빛','Rose'),tint:0xff7a98},
    {id:'emerald',at:60000,n:N('에메랄드','Emerald'),tint:0x62d69a},
    {id:'sapphire',at:120000,n:N('사파이어','Sapphire'),tint:0x7a9aff}
  ],
  frame:[
    {id:'classic',at:0,n:N('클래식 유화','Classic oils')},
    {id:'jazz',at:15000,n:N('재즈 레코드','Jazz records')},
    {id:'moon',at:45000,n:N('달밤 도시','Moonlit city')},
    {id:'cats',at:90000,n:N('고양이 실루엣','Cat silhouettes')}
  ],
  coaster:[
    {id:'none',at:0,n:N('없음','None')},
    {id:'leather',at:10000,n:N('가죽 코스터','Leather')},
    {id:'brass',at:30000,n:N('황동 코스터','Brass')},
    {id:'emerald',at:70000,n:N('에메랄드 코스터','Emerald')},
    {id:'cat',at:140000,n:N('고양이 코스터','Cat')}
  ]
};
export const DECOR_KINDS=['light','frame','coaster'];
export const DEFAULT_DECOR={light:'amber',frame:'classic',coaster:'none'};
const EARNED_KEY='courte.earned',DECOR_KEY='courte.decor';
const store=s=>s||(typeof localStorage!=='undefined'?localStorage:null);

export function loadEarned(storage){try{const v=+store(storage).getItem(EARNED_KEY);return v>0&&isFinite(v)?Math.floor(v):0;}catch(_){return 0;}}
export const optionOf=(kind,id)=>(DECOR[kind]||[]).find(o=>o.id===id)||null;
export const unlockedIn=(kind,earned)=>DECOR[kind].filter(o=>earned>=o.at);
/* add tips to the lifetime total; returns {total, fresh:[{kind,opt}]} for anything that just unlocked */
export function addEarned(n,storage){
  const before=loadEarned(storage),total=before+Math.max(0,Math.floor(n)||0),fresh=[];
  DECOR_KINDS.forEach(k=>DECOR[k].forEach(o=>{if(o.at>0&&before<o.at&&total>=o.at)fresh.push({kind:k,opt:o});}));
  try{store(storage).setItem(EARNED_KEY,String(total));}catch(_){}
  return {total,fresh};
}
/* a decor object from anywhere (storage, network): only known ids survive, the rest fall back to the defaults */
export function cleanDecor(d){
  const out=Object.assign({},DEFAULT_DECOR);
  if(d&&typeof d==='object')DECOR_KINDS.forEach(k=>{if(typeof d[k]==='string'&&optionOf(k,d[k]))out[k]=d[k];});
  return out;
}
/* my own choice: additionally limited to what I have unlocked */
export function loadDecor(storage,earned){
  let raw=null;try{raw=JSON.parse(store(storage).getItem(DECOR_KEY)||'null');}catch(_){}
  const d=cleanDecor(raw),e=earned==null?loadEarned(storage):earned;
  DECOR_KINDS.forEach(k=>{if(e<optionOf(k,d[k]).at)d[k]=DEFAULT_DECOR[k];});
  return d;
}
export function saveDecor(d,storage){try{store(storage).setItem(DECOR_KEY,JSON.stringify(cleanDecor(d)));}catch(_){}}
