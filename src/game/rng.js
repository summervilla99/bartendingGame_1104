/* Seeded RNG (mulberry32) whose state lives inside the world object, so a server and a client replaying the same events agree. */
export function nextRandom(world){
  const t=(world.rng+0x6D2B79F5)>>>0;
  world.rng=t;
  let r=Math.imul(t^(t>>>15),1|t);
  r=(r+Math.imul(r^(r>>>7),61|r))^r;
  return((r^(r>>>14))>>>0)/4294967296;
}
export const randRange=(world,a,b)=>a+nextRandom(world)*(b-a);
export const pickFrom=(world,arr)=>arr[Math.floor(nextRandom(world)*arr.length)];
