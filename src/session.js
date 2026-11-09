/* Session config: the one serialisable object that describes a night (later: the online room settings).
   Language and units are per-player preferences, not part of it. */
const KEY='courte.session';

/* Per-hour look (lights, fog, windows) and gameplay (guest count, order pace, tip bonus, drinks per night). */
export const TIMES={
  golden:{id:'golden',clock:'18:00',every:[10,15],maxPending:2,guests:[0,1,2,3],lounge:[],tipMult:1,goal:6,suggest:'long',
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

/* Modes: story = solo scenario (stages), service = a free night with a goal, practice = no limits, lab = soon. */
export const MODES=['story','service','practice','lab'];
export const DEFAULT={time:'prime',menu:'all',mode:'story',guide:'full',diff:'easy',stage:'s1'};

/* Difficulty = how long a drink may take (seconds). Practice has no limit. */
export const DIFFS={easy:60,mid:45,hard:30};
export const limitOf=cfg=>cfg.mode==='practice'?0:(DIFFS[cfg.diff]||DIFFS.easy);

/* Scenario: easiest drinks first, then the classics, then the complicated ones. */
export const STAGES=[
  {id:'s1',goal:5,minStars:1.5,recipes:['highball','americano','gimlet','daiquiri','whiskeysour'],
   name:{ko:'첫 손님',en:'First guests'},desc:{ko:'재료가 적은 쉬운 칵테일부터 시작해요.',en:'Start with easy drinks that need few ingredients.'}},
  {id:'s2',goal:7,minStars:1.8,recipes:['negroni','oldfashioned','manhattan','margarita','tommys','boulevardier','tomcollins','mojito'],
   name:{ko:'클래식의 밤',en:'Classics night'},desc:{ko:'바텐더라면 꼭 알아야 할 클래식 칵테일이에요.',en:'The classic cocktails every bartender should know.'}},
  {id:'s3',goal:8,minStars:2,recipes:['paloma','cosmopolitan','moscowmule','espressomartini','whitenegroni','mezcalnegroni','courtenoir','amberhour','velvetrose'],
   name:{ko:'마스터의 시험',en:"The master's test"},desc:{ko:'재료가 많고 까다로운 칵테일에 도전해요.',en:'Complex drinks with many ingredients.'}}
];
export const stageOf=cfg=>STAGES.find(s=>s.id===cfg.stage)||STAGES[0];
/* How many drinks end the night. */
export const goalOf=cfg=>cfg.mode==='story'?stageOf(cfg).goal:TIMES[cfg.time].goal;

const STORY_KEY='courte.story';
export function loadStory(){try{const o=JSON.parse(localStorage.getItem(STORY_KEY)||'{}');return {cleared:(o&&o.cleared)||{}};}catch(_){return {cleared:{}};}}
export function clearStage(id,avg){
  const p=loadStory();p.cleared[id]=Math.max(p.cleared[id]||0,+avg.toFixed(2));
  try{localStorage.setItem(STORY_KEY,JSON.stringify(p));}catch(_){}
  return p;
}
export const isUnlocked=(id,progress)=>{const i=STAGES.findIndex(s=>s.id===id);return i===0||(i>0&&progress.cleared[STAGES[i-1].id]!=null);};

export function loadSession(){
  let c={};
  try{c=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){}
  const s=Object.assign({},DEFAULT,c);
  if(!TIMES[s.time])s.time=DEFAULT.time;
  if(!(s.menu in FAMILIES))s.menu=DEFAULT.menu;
  if(MODES.indexOf(s.mode)<0||s.mode==='lab')s.mode=DEFAULT.mode;
  if(!DIFFS[s.diff])s.diff=DEFAULT.diff;
  if(!STAGES.some(x=>x.id===s.stage)||!isUnlocked(s.stage,loadStory()))s.stage=DEFAULT.stage;
  s.guide='full';                                   // measures are always shown
  return s;
}
export function saveSession(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(_){}}

export function poolFor(cfg,recipes){
  if(cfg.mode==='story'){const ids=stageOf(cfg).recipes;return recipes.filter(r=>ids.indexOf(r.id)>=0);}
  const ids=FAMILIES[cfg.menu];
  const p=ids?recipes.filter(r=>ids.indexOf(r.id)>=0):recipes.slice();
  return p.length?p:recipes.slice();
}
