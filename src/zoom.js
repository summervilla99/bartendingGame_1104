/* Screen scale: pinch with two fingers, or scroll the wheel (Ctrl/Cmd + wheel is left to the browser's own page zoom). */
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
  canvas.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();set(get()*Math.exp(-e.deltaY*.0012));},{passive:false});
}
