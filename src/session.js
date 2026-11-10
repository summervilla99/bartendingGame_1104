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
export const TALE_TIME='prime';          // the tale always happens at the same hour

/* Menu families = which recipes the guests order. null = everything. */
export const FAMILIES={
  all:null,
  classic:['negroni','daiquiri','oldfashioned','margarita','manhattan','whiskeysour','boulevardier','tomcollins','mojito','americano','cosmopolitan','moscowmule','martini','sidecar','gimlet','whiterussian','blackrussian','french75','aperolspritz','mimosa','kirroyale','cubalibre','ginandtonic','pinacolada','maitai','longisland','paloma','espressomartini'],
  sours:['daiquiri','margarita','tommys','gimlet','whiskeysour','cosmopolitan','amberhour','velvetrose','espressomartini'],
  stirred:['negroni','faust','oldfashioned','manhattan','boulevardier','whitenegroni','mezcalnegroni','courtenoir'],
  long:['highball','paloma','tomcollins','mojito','moscowmule','americano'],
  agave:['margarita','tommys','paloma','mezcalnegroni','amberhour'],
  gin:['negroni','gimlet','tomcollins','whitenegroni','velvetrose'],
  house:['courtenoir','amberhour','velvetrose'],
  sparkling:['aperolspritz','french75','mimosa','kirroyale','sbagliato','poinsettia','maesilspritz'],
  creamy:['whiterussian','blackrussian','mudslide','pinacolada','godfather','amarettosour','makgeollicolada','whitechristmas','snowyespresso'],
  korean:['sojufizz','sojutonic','yuzuhighball','grapefruitsoju','maesilhighball','maesilspritz','makgeollimojito','makgeollisour','makgeollicolada','yuzumartini','sojunegroni','maesilfashioned'],
  xmas:['poinsettia','christmasmule','whitechristmas','cranberrysidecar','mistletoemojito','snowyespresso']
};
export const FAM_ORDER=['classic','all','sours','stirred','long','agave','gin','sparkling','creamy','korean','xmas','house'];

/* Modes: story = solo scenario (stages), service = a free night with a goal, practice = no limits, lab = soon. */
export const MODES=['tale','practice','service','story'];     // story = the tale, practice = solo cocktail practice, service = a room with friends
export const DEFAULT={time:'prime',menu:'all',mode:'tale',guide:'full',diff:'easy',stage:'s1'};

/* Difficulty = how long a drink may take (seconds). Practice has no limit. */
export const DIFFS={easy:60,mid:45,hard:30};
/* The bartending time limit can be switched on or off (cfg.timer). Default: on with friends, off in practice; the tale never has one. */
export const limitOf=cfg=>{
  if(cfg.mode==='tale')return 0;
  if(cfg.mode==='story')return stageOf(cfg).limit;
  const on=cfg.timer===undefined?cfg.mode!=='practice':!!cfg.timer;
  return on?(DIFFS[cfg.diff]||DIFFS.easy):0;
};

/* Practice levels (solo): eight steps from one calm guest to a full, fast bar. Each level sets how many guests sit at the counter,
   how often they order, how many orders may be open at once, how many are rushed, the time limit per drink, the drinks that can be
   ordered (everything from earlier levels stays on the menu) and the goal. Clearing a level (average stars >= minStars) opens the next.
   ids stay s1..s8 because earlier progress is stored under them. */
const L=(id,goal,minStars,guests,every,maxPending,limit,rushP,add,ko,en,dko,den)=>({id,goal,minStars,guests,every,maxPending,limit,rushP,add,name:{ko,en},desc:{ko:dko,en:den}});
const LEVEL_DEFS=[
  L('s1',4,1.2,1,[14,20],1,0,0,['highball','americano','gimlet','daiquiri','neat','screwdriver','ginandtonic','cubalibre'],'첫 손님','First guest','손님 한 명, 재료가 적은 쉬운 칵테일부터. 시간 제한 없이 천천히.','One guest and easy drinks with few ingredients. No time limit.'),
  L('s2',5,1.4,2,[12,17],2,0,0,['whiskeysour','blackrussian','sojufizz','sojutonic','kamikaze','ginrickey','mimosa','greyhound'],'두 번째 자리','A second seat','손님이 두 명으로 늘고, 셰이크가 처음 나와요.','Two guests, and the first shaken drinks.'),
  L('s3',6,1.5,2,[10,14],2,0,0,['margarita','tommys','oldfashioned','negroni','tomcollins','mojito','godfather','seabreeze'],'클래식 입문','Classics 101','바텐더라면 꼭 아는 클래식. 스터와 셰이크를 번갈아 만나요.','The classics every bartender should know.'),
  L('s4',7,1.6,3,[9,13],2,60,0,['manhattan','boulevardier','paloma','cosmopolitan','moscowmule','whiterussian','lemondrop','sidecar','beesknees','goldrush'],'저녁 장사','Evening trade','손님 세 명, 드디어 제한시간(60초)이 생겨요.','Three guests, and now a 60-second limit per drink.'),
  L('s5',9,1.7,3,[7,11],3,60,.15,['espressomartini','whitenegroni','mezcalnegroni','aperolspritz','french75','bramble','sbagliato','mexicanmule','kentuckymule','brownderby','hemingway'],'피크 타임','Peak hour','주문이 동시에 세 개까지. 급한 손님이 가끔 와요.','Up to three orders at once, and the occasional rushed guest.'),
  L('s6',10,1.8,3,[6,10],3,45,.2,['sojuHolder'],'한국 술의 밤','Korean spirits night','소주·막걸리·매실주로 만드는 칵테일. 제한시간 45초.','Cocktails from soju, makgeolli and plum liqueur. 45 seconds each.'),
  L('s7',12,1.9,4,[5,8],4,45,.25,['pinacolada','maitai','longisland','mudslide','amarettosour','faust','kirroyale','tequilasunrise','sojuRest'],'라스트 콜','Last call','손님 네 명이 꽉 찬 바. 주문이 쉴 새 없이 들어와요.','A full counter of four, with orders nonstop.'),
  L('s8',14,2,4,[4,7],4,30,.3,['courtenoir','amberhour','velvetrose','xmasHolder'],'마스터의 시험','The Master’s test','가장 빠르고 까다로운 밤. 제한시간 30초, 크리스마스 한정 메뉴까지.','The fastest, hardest night: 30 seconds, plus the seasonal menu.')
];
export const STAGES=LEVEL_DEFS;
/* pools are cumulative; placeholders are resolved from the recipe data in poolOfStage */
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

/* the drinks a level can order: its own plus everything from the levels before it (placeholders = recipe groups) */
export function stageRecipes(stage,recipes){
  const upTo=STAGES.indexOf(stage),out=[];
  const korean=recipes.filter(r=>r.korean).map(r=>r.id),season=recipes.filter(r=>r.season).map(r=>r.id);
  for(let i=0;i<=upTo;i++)STAGES[i].add.forEach(id=>{
    if(id==='sojuHolder')korean.forEach(k=>out.push(k));else if(id==='xmasHolder')season.forEach(k=>out.push(k));
    else if(id==='sojuRest'){}else out.push(id);
  });
  /* anything still unassigned (new recipes) joins the last two levels so no drink is unreachable */
  if(upTo>=STAGES.length-2)recipes.forEach(r=>{if(out.indexOf(r.id)<0&&!r.season)out.push(r.id);});
  return out.filter((id,i)=>out.indexOf(id)===i);
}
export function poolFor(cfg,recipes){
  if(cfg.mode==='story'){const ids=stageRecipes(stageOf(cfg),recipes);return recipes.filter(r=>ids.indexOf(r.id)>=0);}
  const ids=FAMILIES[cfg.menu];
  const p=ids?recipes.filter(r=>ids.indexOf(r.id)>=0):recipes.filter(r=>!r.season);   // seasonal drinks only come with their own menu
  return p.length?p:recipes.slice();
}

/* Order pace for a night: the hour's defaults, replaced by the level's (story) or the practice sliders (cfg.guests 1-4, cfg.pace slow|mid|fast|rush). */
const SPREAD={1:[1],2:[0,2],3:[0,1,3],4:[0,1,2,3]};
const PACE={slow:{k:1.6,pend:1},mid:{k:1,pend:2},fast:{k:.6,pend:3},rush:{k:.4,pend:4}};
export function paramsOf(cfg){
  const T=TIMES[cfg.time]||TIMES[DEFAULT.time];
  const P={every:T.every,maxPending:T.maxPending,guests:T.guests,rushP:.2,tipMult:T.tipMult};
  if(cfg.mode==='story'){const st=stageOf(cfg);P.every=st.every;P.maxPending=st.maxPending;P.guests=SPREAD[st.guests];P.rushP=st.rushP;}
  else if(cfg.mode==='practice'){
    const n=+cfg.guests;if(n>=1&&n<=4)P.guests=SPREAD[n];
    const pc=PACE[cfg.pace];if(pc){P.every=[Math.max(2,Math.round(T.every[0]*pc.k)),Math.max(3,Math.round(T.every[1]*pc.k))];P.maxPending=Math.min(pc.pend,P.guests.length);}
    else P.maxPending=Math.min(P.maxPending,P.guests.length);
  }
  return P;
}
