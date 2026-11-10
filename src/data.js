import {tr} from './i18n.js';

/* Ingredients, recipes, garnishes and display names. Names are {ko,en}; `name` getters resolve to the current language. bottle = spec key in bottles.js. */
const N=(ko,en)=>({ko,en});
const locMap=src=>{const o={};Object.keys(src).forEach(k=>Object.defineProperty(o,k,{get:()=>tr(src[k]),enumerable:true}));return o;};
const withName=list=>{list.forEach(i=>Object.defineProperty(i,'name',{get(){return tr(i.n);},enumerable:true}));return list;};

export const CATS=[{id:'spirit',key:'tab_spirit'},{id:'liqueur',key:'tab_liqueur'},{id:'mixer',key:'tab_mixer'}];
const I=(id,cat,ko,en,color,lab,rate,bottle,extra)=>Object.assign({id,cat,n:N(ko,en),color,lab,rate,bottle},extra);
export const INGR=withName([
  I('gin','spirit','진','Gin','#dbe9ea','#2f9c8e',30,'ginBlue'),
  I('rum','spirit','화이트 럼','White Rum','#efe8d4','#e8a33a',30,'rumWhite'),
  I('bourbon','spirit','버번','Bourbon','#c47a1d','#b5481f',30,'makers'),
  I('tequila','spirit','데킬라','Tequila','#ece6b6','#6aa84f',30,'tequilaSq'),
  I('vodka','spirit','보드카','Vodka','#e9f0f2','#5a8ac6',30,'vodka'),
  I('mezcal','spirit','메스칼','Mezcal','#e9e2c0','#6a4a2a',30,'mezcal'),
  I('overproof','spirit','오버프루프 럼','Overproof Rum','#e6c07a','#b5261f',30,'rum151'),
  I('cassis','liqueur','크렘 드 카시스','Creme de Cassis','#3a0f2c','#5a1a4a',20,'cassis'),
  I('campari','liqueur','캄파리','Campari','#c4102c','#c4102c',30,'campari'),
  I('aperol','liqueur','아페롤','Aperol','#ef6a1c','#e8571a',30,'aperol'),
  I('vermouth','liqueur','스위트 베르뭇','Sweet Vermouth','#6e2812','#7b3a8f',30,'vermouth'),
  I('triple','liqueur','트리플 섹','Triple Sec','#f2ab49','#ff7a1a',30,'triple'),
  I('coffee','liqueur','커피 리큐르','Coffee Liqueur','#2a140c','#8a5a2a',20,'coffee'),
  I('elder','liqueur','엘더플라워 리큐르','Elderflower Liqueur','#ede6a8','#a69a3a',20,'elder'),
  I('blanc','liqueur','블랑 베르뭇','Blanc Vermouth','#efe3a8','#c9a066',30,'blanc'),
  I('gentian','liqueur','젠션 리큐르','Gentian Liqueur','#e8d43a','#8a7a10',20,'gentian'),
  I('lime','mixer','라임즙','Lime Juice','#c8e37c','#3f9a3a',30,'lime'),
  I('lemon','mixer','레몬즙','Lemon Juice','#f3e27a','#d9b81a',30,'lemon'),
  I('grapefruit','mixer','자몽 주스','Grapefruit Juice','#f2a2a0','#d9546a',30,'grapefruit'),
  I('cranberry','mixer','크랜베리 주스','Cranberry Juice','#a8142c','#a8142c',30,'cranberry'),
  I('syrup','mixer','심플 시럽','Simple Syrup','#f3e2a3','#d7a21c',20,'syrup'),
  I('agave','mixer','아가베 시럽','Agave Syrup','#d9a548','#a8742c',20,'agave'),
  I('bitters','mixer','비터스','Bitters','#5a1a14','#8c1d2b',5,'bitters',{small:true}),
  I('soda','mixer','소다','Soda','#e6f4f6','#3a7bd5',45,'soda'),
  I('ginger','mixer','진저 비어','Ginger Beer','#e2b65c','#a8741a',45,'ginger'),
  I('espresso','mixer','에스프레소','Espresso','#2b160d','#5a3a1a',20,'espresso')
]);
export const ING=Object.fromEntries(INGR.map(i=>[i.id,i]));
INGR.forEach(i=>{const h=parseInt(i.color.slice(1),16);i.rgb=[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];});

const R=(id,ko,en,method,glass,parts,garnish,extra)=>withName([Object.assign({id,n:N(ko,en),method,glass,parts,garnish},extra)])[0];
export const RECIPES=[
  R('negroni','네그로니','Negroni','stir','tumbler',{gin:30,campari:30,vermouth:30},'orange'),
  R('daiquiri','다이키리','Daiquiri','shake','coupe',{rum:50,lime:25,syrup:15},'lime'),
  R('oldfashioned','올드 패션드','Old Fashioned','stir','fashioned',{bourbon:60,syrup:10,bitters:2},'orange'),
  R('margarita','마가리타','Margarita','shake','margarita',{tequila:50,triple:20,lime:25},'lime'),
  R('gimlet','김렛','Gimlet','shake','nick',{gin:60,lime:20,syrup:20},'lime'),
  R('highball','버번 하이볼','Bourbon Highball','build','highball',{bourbon:45,soda:135},'lime'),
  R('manhattan','맨해튼','Manhattan','stir','coupe',{bourbon:60,vermouth:30,bitters:2},'cherry'),
  R('whiskeysour','위스키 사워','Whiskey Sour','shake','rocks',{bourbon:60,lemon:25,syrup:15},'cherry'),
  R('boulevardier','불바르디에','Boulevardier','stir','rocks',{bourbon:45,campari:30,vermouth:30},'orange'),
  R('paloma','팔로마','Paloma','build','highball',{tequila:50,lime:15,grapefruit:60,soda:40},'lime'),
  R('tomcollins','톰 콜린스','Tom Collins','build','collins',{gin:45,lemon:25,syrup:15,soda:90},'lemon'),
  R('mojito','모히또','Mojito','build','collins',{rum:50,lime:25,syrup:15,soda:60},'mint'),
  R('americano','아메리카노 칵테일','Americano','build','rocks',{campari:30,vermouth:30,soda:60},'orange'),
  R('cosmopolitan','코스모폴리탄','Cosmopolitan','shake','martini',{vodka:40,triple:15,lime:15,cranberry:30},'orange'),
  R('moscowmule','모스코 뮬','Moscow Mule','build','mug',{vodka:45,lime:15,ginger:120},'lime'),
  R('espressomartini','에스프레소 마티니','Espresso Martini','shake','martini',{vodka:50,coffee:20,espresso:30,syrup:10},'none'),
  R('tommys','토미스 마가리타','Tommy\'s Margarita','shake','rocks',{tequila:60,lime:30,agave:15},'lime'),
  R('whitenegroni','화이트 네그로니','White Negroni','stir','tumbler',{gin:45,blanc:30,gentian:15},'lemon'),
  R('mezcalnegroni','메스칼 네그로니','Mezcal Negroni','stir','tumbler',{mezcal:30,campari:30,vermouth:30},'orange'),
  R('neat','위스키 니트','Whiskey Neat','build','nick',{bourbon:60},'none',{noIce:true}),
  R('faust','파우스트','Faust','stir','fashioned',{overproof:30,rum:30,cassis:15},'none'),
  R('courtenoir','코다 누아','Coda Noir','stir','nick',{bourbon:40,coffee:20,vermouth:20,bitters:2},'cherry',
    {house:true,story:N('마지막 한 시간을 위한 쌉쌀하고 진한 스터. 마호가니 홀의 어둠을 닮았어요.','A rich, bittersweet stir for the last hour of the night, named for the dark mahogany room.')}),
  R('amberhour','앰버 아워','Amber Hour','shake','coupe',{tequila:40,aperol:20,grapefruit:30,lime:15,syrup:10},'orange',
    {house:true,story:N('해 질 녘 황금빛을 담은 데킬라 사워. 자몽의 쌉쌀함이 노을처럼 번져요.','A golden-hour tequila sour where grapefruit bitterness melts like a sunset.')}),
  R('velvetrose','벨벳 로즈','Velvet Rose','shake','nick',{gin:40,elder:20,cranberry:20,lemon:15},'lemon',
    {house:true,story:N('엘더플라워의 향과 크랜베리의 붉은 빛이 겹친 부드러운 진 칵테일.','A silky gin drink: elderflower perfume under a cranberry blush.')})
];

/* One-line "good to know" per recipe, shown on the ticket. */
const TIPS={
  negroni:N('같은 비율이라 외우기 쉬워요. 큰 얼음 하나로 천천히 희석돼요. 오렌지 껍질은 짜서 향을 입혀요.','Equal parts, easy to remember. One large cube dilutes slowly. Squeeze the orange peel over the glass for its oils.'),
  daiquiri:N('럼·라임·시럽의 균형이 전부예요. 아주 차갑게 흔들어 얼음 없이 쿠페에 따라요.','Rum, lime and syrup in balance. Shake very cold and strain into a coupe, no ice.'),
  oldfashioned:N('버번에 설탕과 비터스, 젓기만 해요. 흔들면 묽고 탁해져요.','Just bourbon, sugar and bitters, stirred. Shaking makes it watery and cloudy.'),
  margarita:N('라임이 들어가서 셰이크. 소금은 잔 바깥쪽 가장자리에만 묻혀요.','Lime means shake. Salt only the outer rim of the glass.'),
  gimlet:N('진과 라임에 시럽 한 스푼. 아주 차갑게 흔들어요.','Gin, lime and a touch of sweetness. Shake it very cold.'),
  highball:N('얼음을 먼저 채우고 소다는 마지막에. 탄산이 날아가니 거의 젓지 마세요.','Ice first, soda last. Barely stir to keep the fizz.'),
  manhattan:N('버번 2 : 베르뭇 1. 스터로 맑고 부드럽게, 체리로 마무리해요.','Two parts bourbon to one vermouth. Stir for a silky clarity and finish with a cherry.'),
  whiskeysour:N('레몬과 시럽이 들어가니 힘차게 셰이크. 질감이 살아나요.','Lemon and syrup call for a hard shake. It brings the texture to life.'),
  boulevardier:N('네그로니의 버번 버전. 쌉쌀함에 위스키의 따뜻함이 더해져요.','The bourbon cousin of the Negroni: bitterness with a warm whiskey backbone.'),
  paloma:N('자몽과 소다로 가볍게. 소금 림도 잘 어울려요.','Light and bright with grapefruit and soda. A salted rim suits it.'),
  tomcollins:N('레몬 사워를 소다로 길게 늘인 칵테일. 얼음 가득, 소다는 마지막에.','A lemon sour stretched with soda. Fill with ice, soda last.'),
  mojito:N('민트는 찢지 말고 살짝 눌러 향만 내요. 얼음은 가득 채워요.','Press the mint gently, never shred it. Pack the glass with ice.'),
  americano:N('캄파리와 베르뭇 1:1에 소다. 쌉쌀하고 가벼운 식전주예요.','Campari and vermouth 1:1 topped with soda. A light, bitter aperitivo.'),
  cosmopolitan:N('크랜베리로 분홍빛을, 라임으로 균형을. 아주 차갑게 내요.','Cranberry for the blush, lime for balance. Serve ice cold.'),
  moscowmule:N('구리 머그가 차가움을 오래 지켜 줘요. 진저 비어는 마지막에.','The copper mug keeps it ice cold. Add ginger beer last.'),
  espressomartini:N('거품이 포인트예요. 힘차게 흔들어 거품을 만들어요.','The foam is the point. Shake hard to build it.'),
  tommys:N('토미스는 오리지널보다 단순한 3재료. 아가베가 데킬라 맛을 살려요.','Tommy\'s keeps it pure: tequila, lime, agave. The agave lets the tequila shine.'),
  whitenegroni:N('진 + 블랑 베르뭇 + 젠션. 쌉쌀하지만 꽃 향이 나는 하얀 네그로니.','Gin, blanc vermouth and gentian: a pale, floral-bitter Negroni.'),
  mezcalnegroni:N('메스칼의 스모키함이 캄파리와 만나요. 같은 비율로 스터해요.','Mezcal\'s smoke meets Campari. Equal parts, stirred.'),
  neat:N('얼음도 물도 없이 위스키 그대로. 향을 먼저 맡고, 한 모금 머금어 천천히 마셔요.','Whiskey straight: no ice, no water. Nose it first, then sip slowly.'),
  faust:N('도수 높은 151 럼 뒤에 카시스의 달콤함이 숨어 있어요. 이름처럼 “악마의 유혹”이에요. 가볍게 저어 천천히 마셔요.','Overproof rum hides behind sweet cassis: true to its name, a devil’s temptation. Stir gently and sip slowly.'),
  courtenoir:N('커피 리큐르와 버번이 만든 쌉쌀한 밤. 조금 더 오래 저어 부드럽게.','Coffee liqueur and bourbon, bittersweet and dark. Stir a little longer for softness.'),
  amberhour:N('자몽과 아가베의 균형. 아주 차갑게 흔들어 쿠페에 따라요.','Grapefruit and agave in balance. Shake very cold into a coupe.'),
  velvetrose:N('엘더플라워 향과 크랜베리 빛. 차갑게 흔들어 닉앤노라에 담아요.','Elderflower perfume under a cranberry blush. Shake cold into a Nick & Nora.')
};
RECIPES.forEach(r=>{r.tip=TIPS[r.id]||null;});
const UP=['coupe','martini','nick','margarita'],ROCKS=['tumbler','fashioned','rocks'];
export const serveOf=glass=>UP.indexOf(glass)>=0?'up':ROCKS.indexOf(glass)>=0?'rocks':glass==='mug'?'mug':'tall';
/* Simplest whole-number ratio of the pourable parts (bitters excluded); null when it would be unwieldy. */
export function ratioOf(r){
  const ids=Object.keys(r.parts).filter(id=>ING[id].rate>5),v=ids.map(id=>Math.round(r.parts[id]));
  if(v.length<2)return null;
  const g=(a,b)=>b?g(b,a%b):a,d=v.reduce(g);
  const q=v.map(x=>x/d);
  return Math.max.apply(null,q)>14?null:q.join(' : ');
}
/* Vessel capacities (ml-equivalent units). Single source of truth: glass.js builds geometry from these, game/ validates against them. */
export const VESSEL_CAP={mixing: 250, rocks: 200, collins: 300, mug: 330, martini: 150, tumbler: 260, fashioned: 200, margarita: 200, nick: 130, highball: 220, coupe: 150, tin: 220};
export const GARNISH=withName([
  {id:'none',n:N('없음','None')},{id:'orange',n:N('오렌지 필','Orange peel')},{id:'lime',n:N('라임 휠','Lime wheel')},
  {id:'lemon',n:N('레몬 휠','Lemon wheel')},{id:'mint',n:N('민트','Mint')},{id:'cherry',n:N('체리','Cherry')}
]);
export const GARNISH_NAME=locMap(Object.fromEntries(GARNISH.map(g=>[g.id,g.n])));
export const GLASS_NAME=locMap({
  rocks:N('록스 잔','Rocks glass'),tumbler:N('더블 록스 잔','Double rocks glass'),fashioned:N('올드 패션드 잔','Old fashioned glass'),
  coupe:N('쿠페 잔','Coupe'),margarita:N('마가리타 잔','Margarita glass'),nick:N('닉앤노라 잔','Nick & Nora'),
  highball:N('하이볼 잔','Highball glass'),collins:N('콜린스 잔','Collins glass'),mug:N('구리 머그','Copper mug'),martini:N('마티니 잔','Martini glass')
});
export const METHOD_NAME=locMap({shake:N('셰이크','Shake'),stir:N('스터','Stir'),build:N('빌드','Build')});
