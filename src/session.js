/* Session config: the one serialisable object that describes a night (later: the online room settings).
   Language and units are per-player preferences, not part of it. */
const KEY='courte.session';

/* Per-hour look (lights, fog, windows) and gameplay (guest count, order pace, tip bonus, drinks per night). */
export const TIMES={
  golden:{id:'golden',clock:'18:00',every:[10,15],maxPending:2,guests:[1,2],lounge:[],tipMult:1,goal:6,suggest:'long',
    look:{hemi:[0xc08050,0x2a140c,.9],pend:[0xffbb80,1.0],key:[0xffd09a,1.2],bb:.9,lounge:1.6,stage:.9,fog:[0x2a1408,.02],bg:0x1a0c06,win:[1.3,1.05,.9],neon:.7,sky:'golden'}},
  prime:{id:'prime',clock:'22:00',every:[6,10],maxPending:3,guests:[0,1,2,3],lounge:[0,1],tipMult:1.2,goal:10,suggest:'all',
    look:{hemi:[0x6a3a2a,0x0e0605,.5],pend:[0xffb070,1.05],key:[0xffc285,1.15],bb:.9,lounge:1.3,stage:1.6,fog:[0x120806,.024],bg:0x0b0504,win:[.85,.85,.95],neon:1,sky:'night'}},
  last:{id:'last',clock:'01:00',every:[4,7],maxPending:4,guests:[0,1,2,3],lounge:[0],tipMult:1.5,goal:8,suggest:'stirred',
    look:{hemi:[0x4a3a58,0x0a0608,.38],pend:[0xff9e5a,.85],key:[0xffb070,.95],bb:.75,lounge:.8,stage:.5,fog:[0x0c0a10,.03],bg:0x07050a,win:[.75,.8,1],neon:1.15,sky:'rain'}}
};
export const TIME_ORDER=['golden','prime','last'];

/* Menu families = which recipes the guests order. null = everything. */
export const FAMILIES={
  all:null,
  sours:['daiquiri','margarita','tommys','gimlet','whiskeysour','cosmopolitan','amberhour','velvetrose','espressomartini'],
  stirred:['negroni','oldfashioned','manhattan','boulevardier','whitenegroni','mezcalnegroni','courtenoir'],
  long:['highball','paloma','tomcollins','mojito','moscowmule','americano'],
  agave:['margarita','tommys','paloma','mezcalnegroni','amberhour'],
  gin:['negroni','gimlet','tomcollins','whitenegroni','velvetrose'],
  house:['courtenoir','amberhour','velvetrose']
};
export const FAM_ORDER=['all','sours','stirred','long','agave','gin','house'];

export const MODES=['service','practice','lab'];
export const DEFAULT={time:'prime',menu:'all',mode:'service',guide:'full'};

export function loadSession(){
  let c={};
  try{c=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){}
  const s=Object.assign({},DEFAULT,c);
  if(!TIMES[s.time])s.time=DEFAULT.time;
  if(!(s.menu in FAMILIES))s.menu=DEFAULT.menu;
  if(s.mode!=='service'&&s.mode!=='practice')s.mode=DEFAULT.mode;
  if(s.guide!=='full'&&s.guide!=='instinct')s.guide=DEFAULT.guide;
  return s;
}
export function saveSession(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(_){}}

export function poolFor(cfg,recipes){
  const ids=FAMILIES[cfg.menu];
  const p=ids?recipes.filter(r=>ids.indexOf(r.id)>=0):recipes.slice();
  return p.length?p:recipes.slice();
}
