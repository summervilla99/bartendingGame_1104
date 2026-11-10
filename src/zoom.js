/* Screen scale: pinch with two fingers, or scroll the wheel (Cmd + wheel is left to the browser). */
export const gesture={pinching:false};
export function createZoom(canvas,{get,set}){
  const pts=new Map();let d0=0,z0=1;
  const dist=()=>{const a=[...pts.values()];return Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);};
  canvas.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){gesture.pinching=true;d0=dist();z0=get();}},true);
  canvas.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId))return;
    pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&d0>10)set(z0*dist()/d0);
  },true);
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)gesture.pinching=false;};
  canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',up,true);
  /* mouse wheel and a two-finger trackpad scroll zoom; a trackpad pinch arrives as ctrl+wheel (small deltas), which zooms the scene instead of the page. Cmd+wheel stays the browser's. */
  canvas.addEventListener('wheel',e=>{if(e.metaKey)return;e.preventDefault();const k=e.ctrlKey?.012:.0012;set(get()*Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*k));},{passive:false});
}
