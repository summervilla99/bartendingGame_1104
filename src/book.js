/* The bar notebook: a guestbook of polaroids (three-star serves) and a coaster for every cocktail you have made.
   Pure data + localStorage; no DOM. Stored under courte.book. */
const KEY='courte.book',MAX_PHOTOS=24;
const blank=()=>({photos:[],coasters:{}});
export function loadBook(storage){
  try{
    const st=storage||(typeof localStorage!=='undefined'?localStorage:null);if(!st)return blank();
    const o=JSON.parse(st.getItem(KEY)||'{}')||{};
    return {photos:Array.isArray(o.photos)?o.photos.filter(p=>p&&typeof p.who==='string'&&typeof p.rec==='string').slice(0,MAX_PHOTOS):[],
      coasters:o.coasters&&typeof o.coasters==='object'?o.coasters:{}};
  }catch(_){return blank();}
}
export function saveBook(b,storage){try{(storage||localStorage).setItem(KEY,JSON.stringify(b));}catch(_){}}
/* record one finished drink; returns what is new so the screen can say so */
export function recordServe(b,who,rec,stars,now){
  const out={coaster:false,photo:false,best:false};
  if(!rec||!(stars>=1))return out;
  const c=b.coasters[rec]||(b.coasters[rec]={n:0,best:0});
  if(c.n===0)out.coaster=true;
  c.n++;if(stars>c.best){c.best=stars;if(!out.coaster)out.best=true;}
  if(stars>=3&&who){
    const i=b.photos.findIndex(p=>p.who===who&&p.rec===rec);
    if(i<0)out.photo=true;else b.photos.splice(i,1);          // a repeat of the same guest and drink refreshes the photo instead of piling up
    b.photos.unshift({who:String(who).slice(0,20),rec,stars:3,ts:now||Date.now()});
    if(b.photos.length>MAX_PHOTOS)b.photos.length=MAX_PHOTOS;
  }
  return out;
}
