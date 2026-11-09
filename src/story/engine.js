/* Tale engine: a pure, JSON-only dialogue graph runner (no three.js, no DOM, no storage).
   graph = {id: node}. Visible nodes: say, choice, recommend, order, close. Automatic nodes: enter, leave, fx.
   Any node (or choice option) may carry hearts:{who:n} and flag:'name'; they apply when it is reached.
   state = {night, node, hearts, flags, gain, events, order} */
export const MAX_HEARTS=5;

export function newState(night,save){
  return {night,node:null,hearts:Object.assign({},save&&save.hearts),flags:Object.assign({},save&&save.flags),gain:{},events:[],order:null};
}

function addHearts(st,who,n){
  const cur=st.hearts[who]||0,next=Math.max(0,Math.min(MAX_HEARTS,cur+n));
  st.hearts[who]=next;st.gain[who]=(st.gain[who]||0)+(next-cur);
}
function applyFx(st,o){
  if(o.hearts)Object.keys(o.hearts).forEach(w=>addHearts(st,w,o.hearts[w]));
  if(o.flag)st.flags[o.flag]=true;
}

/* Move to a node, apply its effects, and run automatic nodes until something visible (or the end) is reached. */
export function goto(st,graph,id){
  for(let guard=0;guard<200;guard++){
    const n=graph[id];
    if(!n)throw new Error('tale: missing node '+id);
    st.node=id;st.order=null;applyFx(st,n);
    if(n.t==='enter'){st.check={node:id,hearts:Object.assign({},st.hearts),flags:Object.assign({},st.flags)};st.events.push({k:'enter',who:n.who,seat:n.seat});id=n.next;continue;}
    if(n.t==='leave'){st.events.push({k:'leave',who:n.who});id=n.next;continue;}
    if(n.t==='fx'){id=n.next;continue;}
    if(n.t==='order')st.order={who:n.who,rec:n.rec,match:n.match||'good'};
    return;
  }
  throw new Error('tale: loop at '+id);
}
export function begin(st,graph,entry){st.gain={};st.events=[];goto(st,graph,entry);}

/* What the screen should show now. */
export function view(st,graph){
  if(st.node==='@lead')return {kind:'say',who:st.lead.who,text:st.lead.text};
  const n=graph[st.node];
  if(!n)return {kind:'end'};
  if(n.t==='say')return {kind:'say',who:n.who,text:n.text};
  if(n.t==='choice')return {kind:'choice',opts:n.opts.map(o=>({text:o.text}))};
  if(n.t==='recommend'||n.t==='order'){
    if(st.order)return {kind:'wait',order:st.order,who:n.who};
    return {kind:'recommend',who:n.who,hint:n.hint,cands:n.cands.map(c=>c.id)};
  }
  if(n.t==='over')return {kind:'over',title:n.title,tip:n.tip};
  if(n.t==='close')return {kind:'close',title:n.title,note:n.note,gain:Object.assign({},st.gain),hearts:Object.assign({},st.hearts)};
  return {kind:'end'};
}

/* Tap on a say node. */
export function advance(st,graph){
  if(st.node==='@lead'){goto(st,graph,st.lead.next);return true;}
  const n=graph[st.node];
  if(!n||n.t!=='say')return false;
  goto(st,graph,n.next);return true;
}
/* Choose option i of a choice node, or candidate i of a recommend node. */
export function pick(st,graph,i){
  const n=graph[st.node];
  if(!n)return false;
  if(n.t==='choice'){
    const o=n.opts[i];if(!o)return false;
    applyFx(st,o);goto(st,graph,o.next);return true;
  }
  if(n.t==='recommend'&&!st.order){
    const c=n.cands[i];if(!c)return false;
    st.order={who:n.who,rec:c.id,match:c.match,lead:c.lead||null};return true;
  }
  return false;
}
/* Which reaction branch a served drink leads to: a mismatch caps the praise at two stars. */
/* Only a drink that really fits can earn the best reaction. */
export function reactStars(match,stars){return match==='good'?stars:Math.min(stars,2);}
export function served(st,graph,stars){
  const n=graph[st.node];
  if(!n||!st.order||(n.t!=='recommend'&&n.t!=='order'))return false;
  const o=st.order;
  let key=null;
  if(o.match==='miss'&&n.fail)key=n.fail;           // a drink that does not suit the guest: they walk out
  else{
    const eff=reactStars(o.match,stars);
    for(let s=eff;s>=0;s--)if(n.react[s]){key=n.react[s];break;}
    if(!key)for(let s=eff+1;s<=3;s++)if(n.react[s]){key=n.react[s];break;}
  }
  if(o.lead){st.lead={who:o.who,text:o.lead,next:key};st.node='@lead';st.order=null;return true;}   // the guest first comments on this very drink
  goto(st,graph,key);return true;
}
/* Events produced since the last call (enter/leave), for the renderer. */
export function drainEvents(st){const e=st.events;st.events=[];return e;}
/* After a guest walked out: start that guest's scene again with the hearts and memories they had before it. */
export function retry(st,graph){
  if(!st.check)return false;
  st.hearts=Object.assign({},st.check.hearts);st.flags=Object.assign({},st.check.flags);st.gain={};
  goto(st,graph,st.check.node);return true;
}
