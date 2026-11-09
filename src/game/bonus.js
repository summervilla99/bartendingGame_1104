/* Tip multipliers: combo (consecutive 2+ star drinks), regulars (a guest you made 3-star drinks for twice) and rush guests. Pure. */
export const COMBO_STEP=.1,COMBO_MAX=.5,REGULAR_BONUS=.2,RUSH_BONUS=.5,RUSH_PATIENCE=.7;
export const comboAfter=(world,stars)=>stars>=2?(world.combo||0)+1:0;
/* Multiplier for a drink that is about to be recorded (does not change the world). */
export function bonusOf(world,seatId,stars,rush){
  const c=comboAfter(world,stars),combo=c>=2?Math.min(COMBO_MAX,COMBO_STEP*(c-1)):0;
  const reg=(world.regulars&&world.regulars[seatId]>=2)?REGULAR_BONUS:0;
  return (1+combo+reg)*(rush?1+RUSH_BONUS:1);
}
/* Record a served drink: advance the combo and the regular counter. */
export function recordServe(world,seatId,stars){
  world.combo=comboAfter(world,stars);
  if(stars===3&&seatId.charAt(1)<4){world.regulars=world.regulars||{};world.regulars[seatId]=(world.regulars[seatId]||0)+1;}
}
/* A guest left or the bartender failed: the combo breaks. */
export const breakCombo=world=>{world.combo=0;};
export const patienceOf=(limit,rush)=>limit*(rush?RUSH_PATIENCE:1);
