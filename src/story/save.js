/* Tale progress: which nights are done, hearts per regular, remembered choices. Replays do not change the hearts. */
const KEY='courte.tale';
export function loadTale(){
  try{const o=JSON.parse(localStorage.getItem(KEY)||'{}')||{};return {done:o.done||{},hearts:o.hearts||{},flags:o.flags||{}};}
  catch(_){return {done:{},hearts:{},flags:{}};}
}
export function commitNight(night,st){
  const s=loadTale();
  if(!s.done[night]){s.hearts=Object.assign({},st.hearts);s.flags=Object.assign({},st.flags);}
  s.done[night]=true;
  try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}
  return s;
}
export const isNightOpen=(night,save)=>night===1||!!save.done[night-1];
