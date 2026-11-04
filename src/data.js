import * as THREE from 'three';

/* Ingredients, recipes, garnishes and display names. */
export const INGR=[
  {id:'gin',name:'진',color:'#dbe9ea',lab:'#2f9c8e',rate:30,prof:0},
  {id:'rum',name:'화이트 럼',color:'#efe8d4',lab:'#e8a33a',rate:30,prof:1},
  {id:'bourbon',name:'버번',color:'#c47a1d',lab:'#b5481f',rate:30,prof:2},
  {id:'tequila',name:'데킬라',color:'#ece6b6',lab:'#6aa84f',rate:30,prof:0},
  {id:'campari',name:'캄파리',color:'#c4102c',lab:'#c4102c',rate:30,prof:1},
  {id:'vermouth',name:'스위트 베르뭇',color:'#6e2812',lab:'#7b3a8f',rate:30,prof:0},
  {id:'triple',name:'트리플 섹',color:'#f2ab49',lab:'#ff7a1a',rate:30,prof:2},
  {id:'lime',name:'라임즙',color:'#c8e37c',lab:'#3f9a3a',rate:30,prof:1},
  {id:'syrup',name:'심플 시럽',color:'#f3e2a3',lab:'#d7a21c',rate:20,prof:2},
  {id:'bitters',name:'비터스',color:'#5a1a14',lab:'#8c1d2b',rate:5,prof:2,small:true},
  {id:'soda',name:'소다',color:'#e6f4f6',lab:'#3a7bd5',rate:45,prof:1}
];
export const ING=Object.fromEntries(INGR.map(i=>[i.id,i]));
INGR.forEach(i=>{const c=new THREE.Color(i.color);i.rgb=[c.r,c.g,c.b];});
export const RECIPES=[
  {id:'negroni',name:'네그로니',method:'stir',glass:'rocks',parts:{gin:30,campari:30,vermouth:30},garnish:'orange'},
  {id:'daiquiri',name:'다이키리',method:'shake',glass:'coupe',parts:{rum:50,lime:25,syrup:15},garnish:'lime'},
  {id:'oldfashioned',name:'올드 패션드',method:'stir',glass:'rocks',parts:{bourbon:60,syrup:10,bitters:2},garnish:'orange'},
  {id:'margarita',name:'마가리타',method:'shake',glass:'coupe',parts:{tequila:50,triple:20,lime:25},garnish:'lime'},
  {id:'gimlet',name:'김렛',method:'shake',glass:'coupe',parts:{gin:60,lime:20,syrup:20},garnish:'lime'},
  {id:'highball',name:'버번 하이볼',method:'build',glass:'highball',parts:{bourbon:45,soda:135},garnish:'lime'}
];
export const GARNISH=[{id:'none',name:'없음'},{id:'orange',name:'오렌지 필'},{id:'lime',name:'라임 휠'},{id:'cherry',name:'체리'}];
export const GARNISH_NAME=Object.fromEntries(GARNISH.map(g=>[g.id,g.name]));
export const GLASS_NAME={rocks:'록스 잔',coupe:'쿠페 잔',highball:'하이볼 잔'};
export const METHOD_NAME={shake:'셰이크',stir:'스터',build:'빌드'};
