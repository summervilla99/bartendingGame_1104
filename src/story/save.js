/* Tale progress: which nights are done, hearts per regular, remembered choices, and the endings seen.
   Replays do not change the hearts; the endings seen are kept even when the story is started over. */
const KEY='courte.tale';
const blank=()=>({done:{},hearts:{},flags:{},endings:{}});
export function loadTale(){
  try{const o=JSON.parse(localStorage.getItem(KEY)||'{}')||{};return {done:o.done||{},hearts:o.hearts||{},flags:stripEndings(o.flags),endings:o.endings||{}};}
  catch(_){return blank();}
}
const stripEndings=f=>{const o={};Object.keys(f||{}).forEach(k=>{if(k.indexOf('ending_')!==0)o[k]=f[k];});return o;};      // an ending belongs to one playthrough of night 7, never to the saved memories
const store=s=>{try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}return s;};
export function commitNight(night,st){
  const s=loadTale();
  if(!s.done[night]){s.hearts=Object.assign({},st.hearts);s.flags=stripEndings(st.flags);}
  s.done[night]=true;
  Object.keys(st.flags).forEach(f=>{if(f.indexOf('ending_')===0)s.endings[f]=true;});      // seen endings are kept for the gallery
  return store(s);
}
/* Start the story over (new choices, new bond) but keep the endings already seen. */
export function resetTale(){const s=blank();s.endings=loadTale().endings;return store(s);}
export const isNightOpen=(night,save)=>night===1||!!save.done[night-1];
