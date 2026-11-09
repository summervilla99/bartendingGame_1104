import {t,tr,onLang} from './i18n.js';
import {CHARS,FLAVOR} from './story/night1.js';
import {RECIPE_BY_ID} from './game/bartending.js';
import {MAX_HEARTS} from './story/engine.js';

/* Dialogue panel for the tale: speaker, typed-out text, choices, recommendation list, closing card. Text goes in with textContent only. */
export function createTaleUI(root,{onAdvance,onPick,onClose,onRetry,onExit}){
  let cur=null,open=false,timer=0,full='',typed=true;
  const box=root.querySelector('.tl-box'),whoEl=root.querySelector('#tl-who'),textEl=root.querySelector('#tl-text'),optsEl=root.querySelector('#tl-opts'),nextEl=root.querySelector('#tl-next');
  const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
  const stop=()=>{clearInterval(timer);timer=0;};
  function type(s){
    stop();full=s;typed=false;textEl.textContent='';let i=0;
    timer=setInterval(()=>{i+=2;textEl.textContent=full.slice(0,i);if(i>=full.length){stop();typed=true;nextEl.hidden=!(cur&&cur.kind==='say');}},22);
    nextEl.hidden=true;
  }
  function finishTyping(){if(typed)return false;stop();textEl.textContent=full;typed=true;nextEl.hidden=!(cur&&cur.kind==='say');return true;}
  function render(){
    if(!cur)return;
    const v=cur;optsEl.textContent='';box.className='tl-box k-'+v.kind;
    whoEl.hidden=true;
    if(v.kind==='say'){
      const narr=v.who==='narr';box.classList.toggle('narr',narr);
      if(!narr){whoEl.hidden=false;whoEl.textContent=tr(CHARS[v.who].name);whoEl.style.setProperty('--tone',CHARS[v.who].tone||'#c9a066');}
      type(tr(v.text));
    }else if(v.kind==='choice'){
      stop();typed=true;textEl.textContent=t('tale_choose');nextEl.hidden=true;
      v.opts.forEach((o,i)=>{const b=el('button','tl-opt');b.type='button';b.dataset.i=i;b.append(el('kbd','',String(i+1)),el('span','',tr(o.text)));optsEl.append(b);});
    }else if(v.kind==='recommend'){
      stop();typed=true;textEl.textContent=t('tale_recommend',{hint:tr(v.hint)});nextEl.hidden=true;
      whoEl.hidden=false;whoEl.textContent=tr(CHARS[v.who].name);whoEl.style.setProperty('--tone',CHARS[v.who].tone||'#c9a066');
      v.cands.forEach((id,i)=>{const b=el('button','tl-opt rec');b.type='button';b.dataset.i=i;b.append(el('kbd','',String(i+1)),el('span','',RECIPE_BY_ID[id].name),el('em','',FLAVOR[id]?tr(FLAVOR[id]):''));optsEl.append(b);});
    }else if(v.kind==='over'){
      stop();typed=true;nextEl.hidden=true;box.classList.add('close');
      textEl.textContent='';
      textEl.append(el('b','tl-ctitle',tr(v.title)),el('p','tl-note',tr(v.tip)));
      const r=el('button','btn primary',t('tale_retry'));r.type='button';r.dataset.retry='1';
      const x=el('button','btn sm',t('tale_exit'));x.type='button';x.dataset.exit='1';
      optsEl.append(r,x);
    }else if(v.kind==='close'){
      stop();typed=true;nextEl.hidden=true;box.classList.add('close');
      textEl.textContent='';
      textEl.append(el('b','tl-ctitle',tr(v.title)));
      const ul=el('ul','tl-hearts');
      Object.keys(v.hearts).filter(w=>CHARS[w]).forEach(w=>{
        const li=el('li'),n=v.hearts[w],g=v.gain[w]||0;
        li.append(el('span','',tr(CHARS[w].name)),el('span','tl-h',('♥'.repeat(n)+'♡'.repeat(MAX_HEARTS-n))+(g?'  +'+g:'')));
        ul.append(li);
      });
      textEl.append(ul,el('p','tl-note',tr(v.note)));
      const b=el('button','btn primary',t('tale_done'));b.type='button';b.dataset.close='1';optsEl.append(b);
    }
  }
  root.addEventListener('click',e=>{
    if(!open)return;
    const b=e.target.closest('button');
    if(b&&b.dataset.close){onClose();return;}
    if(b&&b.dataset.retry){onRetry();return;}
    if(b&&b.dataset.exit){onExit();return;}
    if(b&&b.dataset.i!=null){onPick(+b.dataset.i);return;}
    if(cur&&cur.kind==='say'){if(!finishTyping())onAdvance();}
  });
  window.addEventListener('keydown',e=>{
    if(!open||!cur||e.repeat)return;
    const k=e.code;
    if(cur.kind==='say'&&(k==='Space'||k==='Enter'||k==='KeyE'||k==='ArrowRight')){e.preventDefault();e.stopPropagation();if(!finishTyping())onAdvance();return;}
    const n=k.indexOf('Digit')===0?parseInt(k.slice(5),10):0;
    if((cur.kind==='choice'||cur.kind==='recommend')&&n>=1&&n<=optsEl.children.length){e.preventDefault();e.stopPropagation();onPick(n-1);}
  },true);
  onLang(()=>{if(open)render();});
  return {
    show(v){cur=v;open=true;root.hidden=false;render();},
    hide(){open=false;cur=null;stop();root.hidden=true;},
    isOpen:()=>open
  };
}
