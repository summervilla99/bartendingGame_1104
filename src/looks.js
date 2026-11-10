import {CHARS} from './story/chars.js';

/* Playable character designs, taken from the story's cast (two women, three men). The player picks one on the start screen; online, the index travels as the look number. */
const WHO=['seoyun','yunha','yoonjae','kkangi','taesik'];
const strip=l=>{const o=Object.assign({},l,{name:'나'});delete o.blush;return o;};     // the player never wears another character's blush or name
export const DESIGNS=WHO.map((who,i)=>({id:'d'+(i+1),who,name:CHARS[who].name,look:strip(CHARS[who].look)}));
/* online look numbers: the five designs first, then three plain extras kept for older clients */
export const LOOKS=DESIGNS.map(d=>d.look).concat([
  {skin:0xf0c8aa,top:0x2e4a3c,dress:true,sheen:true,hair:0x3b1f16,long:true,shoes:0x2a0d0d},
  {skin:0xe2b291,top:0x1f3b52,shirt:0xe9dfcc,tie:0xc9a066,pants:0x1c1c20,hair:0x17100c},
  {skin:0xb8805e,top:0x2b3a2a,shirt:0xe6e0d4,tie:0x9c7239,pants:0x1a1c18,hair:0x120c10}
]);
