import {t,tr,getLang,setLang,onLang} from './i18n.js';
import {TALE_TIME,TIMES,TIME_ORDER,FAM_ORDER,DIFFS,poolFor} from './session.js';
import {normalizeCode,CODE_LEN} from './net/room.js';
import {NIGHTS,ENDINGS} from './story/nights.js';
import {loadTale,isNightOpen,resetTale} from './story/save.js';

/* "Open the bar" screen. Three ways to play: the story, a room with friends, and cocktail practice. */
const KINDS=['tale','room','practice'];
export function createStart({root,recipes,getCfg,onPreview,onStart,onFirstTap,getMusic,onMusic,initialOnline,roomLock}){
  let cfg=null,open=false,err='',view='main',confirmReset=false,tapped=false;
  /* online choice lives outside the session config (it is per player, not part of the night) */
  const onl=Object.assign({mode:'solo',code:'',name:'',chairs:4,npc:true},initialOnline||{});
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const opt=(k,v,on,cls,inner,dis)=>'<button type="button" class="st-opt '+(cls||'')+(on?' on':'')+'" data-k="'+k+'" data-v="'+v+'"'+(dis?' disabled':'')+' aria-pressed="'+(on?'true':'false')+'">'+inner+'</button>';
  /* which of the three the screen is showing */
  const kindOf=()=>(roomLock&&roomLock())||onl.mode!=='solo'?'room':cfg.mode==='tale'?'tale':'practice';
  const previewTime=()=>onPreview(kindOf()==='tale'?TALE_TIME:cfg.time);
  function render(){
    const T=TIMES[cfg.time],kind=kindOf(),lock=roomLock?roomLock():null;
    const times=TIME_ORDER.map(id=>{
      const x=TIMES[id];
      return opt('time',id,cfg.time===id,'st-time sky-'+x.look.sky,
        '<span class="st-sky"></span><b>'+t('time_'+id)+'</b><i>'+x.clock+'</i><span class="st-d">'+t('time_'+id+'_d')+'</span><span class="st-tag">'+t('time_'+id+'_t')+'</span>');
    }).join('');
    const fams=FAM_ORDER.map(id=>{
      const n=poolFor({menu:id},recipes).length;
      return opt('menu',id,cfg.menu===id,'st-fam',t('fam_'+id)+'<em>'+n+'</em>'+(T.suggest===id?'<u>'+t('suggested')+'</u>':''));
    }).join('');
    const tale=loadTale();
    const nights=Array.from({length:7},(_,i)=>{
      const n=i+1,def=NIGHTS.find(x=>x.n===n),done=tale.done[n],ok=!!def&&isNightOpen(n,tale);
      return opt('night',n,ok&&(cfg.night||1)===n,'st-night'+(ok?'':' soon'),'<b>'+n+'</b><span>'+(def?tr(def.title):t('tale_soon'))+'</span><i>'+(done?t('tale_done_tag'):(def&&!ok?t('night_lock'):''))+'</i>',!ok);
    }).join('');
    const kinds=KINDS.map(id=>opt('kind',id,kind===id,'st-mode','<b>'+t('kind_'+id)+'</b><span class="st-d">'+t('kind_'+id+'_d')+'</span>')).join('');
    const timerOn=(kind==='room'?cfg.timers.room:cfg.timers.practice)===true;
    const limitRow=['off','easy','mid','hard'].map(d=>opt('limit',d,d==='off'?!timerOn:(timerOn&&cfg.diff===d),'st-guide',d==='off'?t('limit_off'):t('diff_'+d))).join('');
    const limitHtml='<h2>'+t('st_limit')+'</h2><div class="st-row st-diffs">'+limitRow+'</div><p class="st-note">'+t('limit_note')+'</p>';
    const hourMenu='<h2>'+t('st_time')+'</h2><div class="st-row st-times">'+times+'</div><h2>'+t('st_menu')+'</h2><div class="st-row st-fams">'+fams+'</div>';
    let body='';
    if(kind==='tale'){
const seen=ENDINGS.filter(e=>tale.endings[e.id]).length;
      body='<h2>'+t('st_tale')+'</h2><div class="st-nights">'+nights+'</div><p class="st-note">'+t('tale_note')+'</p>'
        +'<div class="st-row st-tools"><button type="button" class="btn sm" data-act="gallery">'+t('gal_btn',{n:seen,m:ENDINGS.length})+'</button>'
        +(confirmReset?'<span class="st-confirm">'+t('tale_reset_q')+' <button type="button" class="btn sm" data-act="reset-yes">'+t('tale_reset_yes')+'</button> <button type="button" class="btn sm" data-act="reset-no">'+t('tale_reset_no')+'</button></span>'
          :'<button type="button" class="btn sm" data-act="reset">'+t('tale_reset')+'</button>')+'</div>';
    }else if(kind==='practice'){
      body=hourMenu+limitHtml;
    }else{
      const sub=['create','join'].map(id=>opt('online',id,onl.mode===id,'st-guide',t('onl_'+id))).join('');
      body='<h2>'+t('st_online')+'</h2>'+(lock?'<p class="st-note">'+t('onl_locked',{code:lock})+'</p>':'<div class="st-row st-onl">'+sub+'</div>');
      if(!lock){
        body+='<div class="st-fields"><label class="st-field"><span>'+t('onl_name')+'</span><input class="st-input" id="st-name" maxlength="16" autocomplete="off" value="'+esc(onl.name)+'"></label>'
          +(onl.mode==='join'?'<label class="st-field"><span>'+t('onl_code')+'</span><input class="st-input st-code" id="st-code" maxlength="'+CODE_LEN+'" autocomplete="off" autocapitalize="characters" spellcheck="false" value="'+esc(onl.code)+'"></label>':'')
          +'</div>'
          +(onl.mode==='create'?'<div class="st-fields"><div class="st-field"><span>'+t('st_chairs')+'</span><div class="st-row st-chairs">'+[2,3,4,5,6].map(n=>opt('chairs',n,onl.chairs===n,'st-guide',n)).join('')+'</div></div><div class="st-field"><span>'+t('st_npc')+'</span><div class="st-row st-chairs">'+opt('npc','on',onl.npc!==false,'st-guide',t('npc_on'))+opt('npc','off',onl.npc===false,'st-guide',t('npc_off'))+'</div></div></div><p class="st-note">'+t('st_npc_note')+'</p>':'')
          +'<p class="st-note">'+t(onl.mode==='create'?'onl_hint_create':'onl_hint_join')+' '+t('onl_note')+'</p>'+(err?'<p class="st-err">'+esc(err)+'</p>':'');
      }
      if(lock||onl.mode==='create')body+=hourMenu+limitHtml;
    }
    if(view==='gallery'){
      const tl=loadTale();
      root.innerHTML='<div class="st-card" role="dialog" aria-labelledby="st-h">'
        +'<div class="st-head"><span class="neon">Bar Coda</span><button class="btn sm" id="st-lang" type="button" aria-label="'+esc(t('lang_aria'))+'"><span data-l="ko">KO</span>/<span data-l="en">EN</span></button></div>'
        +'<h1 id="st-h">'+t('gal_title')+'</h1><p class="st-sub">'+t('gal_sub')+'</p>'
        +'<div class="st-gallery">'+ENDINGS.map(e=>{
          const ok=!!tl.endings[e.id];
          return '<article class="st-end'+(ok?'':' locked')+'"><h3>'+(ok?tr(e.title):'???')+'</h3>'
            +(ok?e.text.map(x=>'<p>'+esc(tr(x))+'</p>').join(''):'<p class="st-hint">'+t('gal_locked')+' · '+esc(tr(e.hint))+'</p>')+'</article>';}).join('')+'</div>'
        +'<button class="btn lg primary st-go" id="st-back" type="button">'+t('gal_back')+'</button></div>';
      return;
    }
    const mus=getMusic?getMusic():'jazz';
    const musicHtml=(kind==='room'&&onl.mode==='join'&&!lock)?'':'<h2>'+t('st_music')+'</h2><div class="st-row st-music">'+['jazz','classical','house','off'].map(g=>opt('music',g,mus===g,'st-guide',t('mus_'+g))).join('')+'</div>';
    root.innerHTML='<div class="st-card" role="dialog" aria-labelledby="st-h">'
      +'<div class="st-head"><span class="neon">Bar Coda</span><button class="btn sm" id="st-lang" type="button" aria-label="'+esc(t('lang_aria'))+'"><span data-l="ko">KO</span>/<span data-l="en">EN</span></button></div>'
      +'<h1 id="st-h">'+t('st_title')+'</h1><p class="st-sub">'+t('st_sub')+'</p>'
      +'<h2>'+t('st_kind')+'</h2><div class="st-row st-modes st-kinds">'+kinds+'</div>'
      +body
      +musicHtml
      +'<button class="btn lg primary st-go" id="st-go" type="button">'+t('open_bar')+'</button></div>';
  }
  root.addEventListener('click',e=>{
    if(!open)return;
    if(!tapped){tapped=true;if(onFirstTap)onFirstTap();}
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='st-lang'){setLang(getLang()==='ko'?'en':'ko');return;}
    if(b.id==='st-back'){view='main';render();return;}
    if(b.dataset.act){
      const a=b.dataset.act;
      if(a==='gallery')view='gallery';
      else if(a==='reset')confirmReset=true;
      else if(a==='reset-no')confirmReset=false;
      else if(a==='reset-yes'){resetTale();confirmReset=false;cfg.night=1;}
      render();return;
    }
    if(b.id==='st-go'){
      const locked=roomLock&&roomLock(),kind=kindOf();
      if(!locked&&kind==='room'&&onl.mode==='join'&&onl.code.length!==CODE_LEN){err=t('onl_bad');render();return;}
      if(kind==='tale'){onl.mode='solo';cfg.mode='tale';cfg.time=TALE_TIME;cfg.timer=false;}
      else if(kind==='practice'){onl.mode='solo';cfg.mode='practice';cfg.timer=cfg.timers.practice===true;}
      else{cfg.mode='service';cfg.timer=cfg.timers.room!==false;}
      err='';hide();onStart(Object.assign({},cfg),locked?{mode:'keep',code:'',name:onl.name}:Object.assign({},onl));return;
    }
    if(b.dataset.k&&!b.disabled){
      const card=root.querySelector('.st-card'),y=card?card.scrollTop:0;
      const k=b.dataset.k,v=b.dataset.v;
      if(k==='kind'){
        if(v==='tale'){cfg.mode='tale';onl.mode='solo';}
        else if(v==='practice'){cfg.mode='practice';onl.mode='solo';}
        else{cfg.mode='service';if(onl.mode==='solo')onl.mode='create';}
        err='';previewTime();
      }else if(k==='online'){onl.mode=v;err='';}
      else if(k==='chairs')onl.chairs=+v;
      else if(k==='npc')onl.npc=v==='on';
      else if(k==='music'){if(onMusic)onMusic(v);}
      else if(k==='limit'){const kd=kindOf()==='room'?'room':'practice';if(v==='off')cfg.timers[kd]=false;else{cfg.timers[kd]=true;cfg.diff=v;}}
      else{cfg[k]=v;if(k==='time')previewTime();}
      render();const c2=root.querySelector('.st-card');if(c2)c2.scrollTop=y;
    }
  });
  root.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='st-name')onl.name=el.value;
    else if(el.id==='st-code'){onl.code=normalizeCode(el.value);el.value=onl.code;}
  });
  onLang(()=>{if(open)render();});
  function nextNight(){const tl=loadTale();const n=NIGHTS.find(x=>!tl.done[x.n]&&isNightOpen(x.n,tl));return n?n.n:NIGHTS[NIGHTS.length-1].n;}
  function show(){
    view='main';confirmReset=false;
    cfg=Object.assign({},getCfg());cfg.night=nextNight();
    cfg.timers=Object.assign({room:true,practice:false},cfg.timers);                 // remembered per kind of play
    if(onl.mode!=='solo')cfg.mode='service';                       // joining or creating a room
    else if(cfg.mode!=='tale')cfg.mode='practice';                 // anything else is solo practice
    open=true;root.hidden=false;render();previewTime();const g=root.querySelector('#st-go');if(g)g.focus({preventScroll:true});
  }
  function hide(){open=false;root.hidden=true;}
  return {show,hide,isOpen:()=>open};
}
