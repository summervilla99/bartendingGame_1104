import {t} from './i18n.js';

/* Volume display: ml + oz, ml only, or oz only (persisted). Under 5 ml (bitters) oz is shown as dashes. */
const KEY='courte.unit',MODES=['both','ml','oz'];
let mode='both';
export const getUnit=()=>mode;
export function cycleUnit(){
  mode=MODES[(MODES.indexOf(mode)+1)%MODES.length];
  try{localStorage.setItem(KEY,mode);}catch(_){}
  return mode;
}
const mlN=v=>v>0&&v<10?String(+v.toFixed(1)):String(Math.round(v));
function ozN(ml){
  let x=ml/29.5735;const q=Math.round(x*4)/4;
  x=Math.abs(x-q)<=.07?q:Math.round(x*10)/10;
  return String(+x.toFixed(2));
}
const dashN=ml=>{const n=Math.round(ml);return t(n===1?'dash_one':'dash_many',{n});};
export function fmtVol(ml){
  if(ml<=.05)return mode==='ml'?'0 ml':mode==='oz'?'0 oz':'0 ml · 0 oz';
  const small=ml<5;
  if(mode==='ml')return mlN(ml)+' ml';
  if(mode==='oz')return small?dashN(ml):ozN(ml)+' oz';
  return mlN(ml)+' ml · '+(small?dashN(ml):ozN(ml)+' oz');
}
export function fmtRatio(cur,tg){
  const small=tg<5,ml=mlN(cur)+' / '+mlN(tg)+' ml';
  if(mode==='ml')return ml;
  if(mode==='oz')return small?Math.round(cur)+' / '+dashN(tg):ozN(cur)+' / '+ozN(tg)+' oz';
  return ml+' · '+(small?dashN(tg):ozN(cur)+' / '+ozN(tg)+' oz');
}
