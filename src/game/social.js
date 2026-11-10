/* Social bonuses in a room: a joint toast (two players cheer together) and buying the bartender a drink.
   Pure, JSON-only rules; the host applies them and broadcasts the world. world.social = {n, cool:{key:until}, toast, gift}.
   toast/gift hold the latest event ({n, a, b, bonus}); clients show the effect once per n. */
export const TOAST_BONUS=2000,TOAST_COOLDOWN=20,TOAST_RANGE=4.5,TOAST_WINDOW_MS=2500;
export const GIFT_BONUS=1500,GIFT_COOLDOWN=45;
export const ID_RE=/^[\w.-]{1,64}$/;

function socialOf(world){
  if(!world.social||typeof world.social!=='object')world.social={n:0,cool:{},toast:null,gift:null};
  if(!world.social.cool)world.social.cool={};
  return world.social;
}
function pay(world,bonus){world.tips+=bonus;world.night.tips+=bonus;}

/* a and b cheered together. activeIds = players currently in the room. Same pair is on cooldown for TOAST_COOLDOWN seconds. */
export function jointToast(world,a,b,activeIds,now){
  if(a===b||activeIds.indexOf(a)<0||activeIds.indexOf(b)<0)return null;
  const so=socialOf(world),key='t:'+[a,b].sort().join('|');
  if(so.cool[key]&&now<so.cool[key])return null;
  so.cool[key]=now+TOAST_COOLDOWN;so.n++;so.toast={n:so.n,a,b,bonus:TOAST_BONUS};
  pay(world,TOAST_BONUS);world.rev++;
  return so.toast;
}
/* `from` buys the bartender `to` a drink. `to` must be standing at a station right now. One gift per giver per GIFT_COOLDOWN seconds. */
export function giftDrink(world,from,to,now){
  if(from===to||world.stations.indexOf(to)<0)return null;
  const so=socialOf(world),key='g:'+from;
  if(so.cool[key]&&now<so.cool[key])return null;
  so.cool[key]=now+GIFT_COOLDOWN;so.n++;so.gift={n:so.n,a:from,b:to,bonus:GIFT_BONUS};
  pay(world,GIFT_BONUS);world.rev++;
  return so.gift;
}
/* Drop expired cooldowns so the snapshot stays small. */
export function pruneSocial(world,now){
  const so=world.social;if(!so||!so.cool)return;
  Object.keys(so.cool).forEach(k=>{if(now>=so.cool[k])delete so.cool[k];});
}
