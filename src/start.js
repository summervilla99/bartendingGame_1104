import {t,tr,getLang,setLang,onLang} from './i18n.js';
import {TALE_TIME,TIMES,TIME_ORDER,FAM_ORDER,DIFFS,STAGES,stageOf,isUnlocked,loadStory,poolFor} from './session.js';
import {normalizeCode,CODE_LEN} from './net/room.js';
import {NIGHTS,ENDINGS} from './story/nights.js';
import {loadTale,isNightOpen,resetTale} from './story/save.js';
import {DESIGNS} from './looks.js';
import {portraitOf} from './portrait.js';

/* "Open the bar" screen. Three ways to play: the story, a room with friends, and cocktail practice. */
const KINDS=['tale','room','practice'];
export function createStart({root,recipes,getCfg,onPreview,onStart,onStill,onFirstTap,getMusic,onMusic,getDesign,onDesign,initialOnline,roomLock}){
  let cfg=null,open=false,err='',view='main',confirmReset=false,tapped=false,compact=false,more=false,design=0;
  /* someone with no saved nickname starts with a random anime character name, picked once per visit (they can type over it) */
  const PH_NAMES=['몽키 D.루피','로로노아 조로','나미','우솝','상디','토니토니 쵸파','니코 로빈','프랑키','브룩','포트거스 D.에이스','샹크스','트라팔가 로',
    '에렌 예거','미카사 아커만','아르민 아를레르트','리바이 아커만','한지 조에','엘빈 스미스','사샤 블라우스','코니 스프링거','장 키르슈타인','히스토리아','라이너 브라운','애니 레온하트',
    '프리렌','페른','슈타르크','힘멜','하이터','아이젠','자인','유벨'];
  const defaultName=PH_NAMES[Math.floor(Math.random()*PH_NAMES.length)];
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
    /* a waxing moon for night n of seven (the epilogues get a small star): fits the 'night' theme better than a bare numeral */
    const moon=(n,cls)=>'<b class="'+(cls||'')+' moon" style="--d:'+(1-Math.min(n,7)/7).toFixed(2)+'" aria-hidden="true"></b>';
    const star=cls=>'<b class="'+(cls||'')+' star" aria-hidden="true">✦</b>';
    const nightBtn=(def)=>{
      const n=def.n,done=tale.done[n],ok=isNightOpen(n,tale);
      return opt('night',n,ok&&(cfg.night||1)===n,'st-night'+(def.epilogue?' epi':'')+(ok?'':' soon'),(def.epilogue?star():moon(n))+'<span>'+(def.epilogue?tr(def.title).replace(/^(후일담|Epilogue)\s*[·:]\s*/,''):tr(def.title))+'</span><i>'+(done?t('tale_done_tag'):(!ok?t('night_lock'):''))+'</i>',!ok);
    };
    const nights=NIGHTS.filter(d=>!d.epilogue).map(nightBtn).join('');
    const epis=NIGHTS.filter(d=>d.epilogue).map(nightBtn).join('');
    const kinds=KINDS.map(id=>opt('kind',id,kind===id,'st-mode','<b>'+t('kind_'+id)+'</b><span class="st-d">'+t('kind_'+id+'_d')+'</span>')).join('');
    const timerOn=(kind==='room'?cfg.timers.room:cfg.timers.practice)===true;
    const limitRow=['off','easy','mid','hard'].map(d=>opt('limit',d,d==='off'?!timerOn:(timerOn&&cfg.diff===d),'st-guide',d==='off'?t('limit_off'):t('diff_'+d))).join('');
    const limitHtml='<h2>'+t('st_limit')+'</h2><div class="st-row st-diffs">'+limitRow+'</div><p class="st-note">'+t('limit_note')+'</p>';
    const hourMenu='<h2>'+t('st_time')+'</h2><div class="st-row st-times">'+times+'</div><h2>'+t('st_menu')+'</h2><div class="st-row st-fams">'+fams+'</div>';
    let body='';
    if(kind==='tale'){
const seen=ENDINGS.filter(e=>tale.endings[e.id]).length;
      body='<h2>'+t('st_tale')+'</h2><div class="st-nights">'+nights+'</div>'+(epis?'<h3 class="st-epi-h">'+t('epi_h')+'</h3><div class="st-epis">'+epis+'</div>':'')+'<p class="st-note">'+t('tale_note')+'</p>'
        +'<div class="st-row st-tools"><button type="button" class="btn sm" data-act="gallery">'+t('gal_btn',{n:seen,m:ENDINGS.length})+'</button>'
        +(confirmReset?'<span class="st-confirm">'+t('tale_reset_q')+' <button type="button" class="btn sm" data-act="reset-yes">'+t('tale_reset_yes')+'</button> <button type="button" class="btn sm" data-act="reset-no">'+t('tale_reset_no')+'</button></span>'
          :'<button type="button" class="btn sm" data-act="reset">'+t('tale_reset')+'</button>')+'</div>';
    }else if(kind==='practice'){
      const prog=loadStory(),isLevel=cfg.mode==='story',st=stageOf(cfg);
      const lv=STAGES.map((x,i)=>{const ok=isUnlocked(x.id,prog),done=prog.cleared[x.id]!=null;
        return opt('level',x.id,isLevel&&st.id===x.id,'st-night'+(ok?'':' soon'),'<b>'+(i+1)+'</b><span>'+tr(x.name)+'</span><i>'+(done?t('tale_done_tag'):(ok?'':t('night_lock')))+'</i>',!ok);}).join('')
        +opt('level','free',!isLevel,'st-night','<b>∞</b><span>'+t('lvl_free')+'</span><i>'+t('lvl_free_d')+'</i>');
      let detail='';
      if(isLevel){
        detail='<p class="st-note"><b>'+esc(tr(st.name))+'</b> · '+esc(tr(st.desc))+'<br>'+t('lvl_info',{g:st.guests,p:st.maxPending,l:st.limit?st.limit+t('sec'):t('limit_off'),n:st.goal,s:st.minStars})+'</p>'
          +'<h2>'+t('st_time')+'</h2><div class="st-row st-times">'+times+'</div>';
      }else{
        const gRow=['auto',1,2,3,4].map(v=>opt('guests',v,(cfg.guests||'auto')+''===v+'','st-guide',v==='auto'?t('auto'):v)).join('');
        const pRow=['auto','slow','mid','fast','rush'].map(v=>opt('pace',v,(cfg.pace||'auto')===v,'st-guide',v==='auto'?t('auto'):t('pace_'+v))).join('');
        detail='<h2>'+t('st_guests')+'</h2><div class="st-row st-chairs">'+gRow+'</div><h2>'+t('st_pace')+'</h2><div class="st-row st-chairs">'+pRow+'</div>'+hourMenu+limitHtml;
      }
      body='<h2>'+t('st_levels')+'</h2><div class="st-nights">'+lv+'</div>'+detail;
    }else{
      const subRow=ids=>'<div class="st-row st-onl">'+ids.map(id=>opt('online',id,onl.mode===id,'st-guide',t('onl_'+id))).join('')+'</div>';
      const sub=subRow(['create','join'])+subRow(['public1','public2']);      // the public halls sit on their own line
      body='<h2>'+t('st_online')+'</h2>'+(lock?'<p class="st-note">'+t('onl_locked',{code:lock})+'</p>':sub);
      if(!lock){
        body+='<div class="st-fields"><label class="st-field"><span>'+t('onl_name')+'</span><input class="st-input" id="st-name" maxlength="16" autocomplete="off" value="'+esc(onl.name)+'"></label>'
          +(onl.mode==='join'?'<label class="st-field"><span>'+t('onl_code')+'</span><input class="st-input st-code" id="st-code" maxlength="'+CODE_LEN+'" autocomplete="off" autocapitalize="characters" spellcheck="false" value="'+esc(onl.code)+'"></label>':'')
          +'</div>'
          +(onl.mode==='create'?'<div class="st-fields"><div class="st-field"><span>'+t('st_chairs')+'</span><div class="st-row st-chairs">'+[2,3,4,5,6].map(n=>opt('chairs',n,onl.chairs===n,'st-guide',n)).join('')+'</div></div><div class="st-field"><span>'+t('st_npc')+'</span><div class="st-row st-chairs">'+opt('npc','on',onl.npc!==false,'st-guide',t('npc_on'))+opt('npc','off',onl.npc===false,'st-guide',t('npc_off'))+'</div></div></div><p class="st-note">'+t('st_npc_note')+'</p>':'')
          +'<p class="st-note">'+t(onl.mode==='create'?'onl_hint_create':onl.mode.indexOf('public')===0?'onl_hint_public':'onl_hint_join')+' '+t('onl_note')+'</p>'+(err?'<p class="st-err">'+esc(err)+'</p>':'');
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
            +(ok?e.text.map(x=>'<p>'+esc(tr(x))+'</p>').join('')+(onStill&&e.still?'<button type="button" class="btn sm" data-still="'+e.still+'">'+t('gal_cut')+'</button>':''):'<p class="st-hint">'+t('gal_locked')+' · '+esc(tr(e.hint))+'</p>')+'</article>';}).join('')+'</div>'
        +'<button class="btn lg primary st-go" id="st-back" type="button">'+t('gal_back')+'</button></div>';
      return;
    }
    const designHtml=onDesign&&kind!=='tale'?'<h2>'+t('st_design')+'</h2><div class="st-row st-designs">'+DESIGNS.map((d,i)=>{
      const img=portraitOf('design:'+d.id,d.look,'smile');
      return opt('design',i,design===i,'st-design',(img?'<img src="'+img+'" alt="">':'<span class="st-ph"></span>')+'<b>'+t('design_n',{n:i+1})+'</b><i>'+esc(tr(d.name))+'</i>');
    }).join('')+'</div>':'';
    const mus=getMusic?getMusic():'jazz';
    const musicHtml=(kind==='room'&&onl.mode==='join'&&!lock)?'':'<h2>'+t('st_music')+'</h2><div class="st-row st-music">'+['jazz','classical','house','off'].map(g=>opt('music',g,mus===g,'st-guide',t('mus_'+g))).join('')+'</div>';
    /* a returning story player sees the next night first; every other menu folds away below it */
    const head='<div class="st-head"><span class="neon">Bar Coda</span><button class="btn sm" id="st-lang" type="button" aria-label="'+esc(t('lang_aria'))+'"><span data-l="ko">KO</span>/<span data-l="en">EN</span></button></div>';
    if(compact){
      const nn=cfg.night||nextNight(),def=NIGHTS.find(x=>x.n===nn),all=NIGHTS.every(x=>tale.done[x.n]),dn=Object.keys(tale.done).length;
      const full=designHtml+'<h2>'+t('st_kind')+'</h2><div class="st-row st-modes st-kinds">'+kinds+'</div>'+body+musicHtml
        +(kind==='tale'?'':'<button class="btn lg primary st-go" id="st-go" type="button">'+t('open_bar')+'</button>');
      root.innerHTML='<div class="st-card st-compact" role="dialog" aria-labelledby="st-h">'+head
        +'<h1 id="st-h">'+t(all?'st_replay':'st_next')+'</h1><p class="st-sub">'+t('st_next_note',{n:dn})+'</p>'
        +'<button class="st-next" id="st-next" type="button">'+(def&&def.epilogue?star('sn-n'):moon(nn,'sn-n'))+'<span class="sn-t"><em>'+t(def&&def.epilogue?'epi_h':'sn_next')+'</em>'+esc(def?tr(def.title).replace(/^(후일담|Epilogue)\s*[·:]\s*/,''):'')+'</span><i class="sn-go" aria-hidden="true">→</i></button>'
        +'<button class="btn sm st-more" id="st-more" type="button" aria-expanded="'+(more?'true':'false')+'">'+t(more?'st_more_close':'st_more_open')+' <i>'+(more?'▴':'▾')+'</i></button>'
        +(more?'<div class="st-moreBody">'+full+'</div>':'')+'</div>';
      return;
    }
    root.innerHTML='<div class="st-card" role="dialog" aria-labelledby="st-h">'
      +head
      +'<h1 id="st-h">'+t('st_title')+'</h1><p class="st-sub">'+t('st_sub')+'</p>'
      +designHtml
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
    if(b.dataset.still){root.classList.add('st-peek');onStill(b.dataset.still,()=>root.classList.remove('st-peek'));return;}
    if(b.id==='st-back'){view='main';render();return;}
    if(b.dataset.act){
      const a=b.dataset.act;
      if(a==='gallery')view='gallery';
      else if(a==='reset')confirmReset=true;
      else if(a==='reset-no')confirmReset=false;
      else if(a==='reset-yes'){resetTale();confirmReset=false;cfg.night=1;}
      render();return;
    }
    if(b.id==='st-more'){more=!more;render();return;}
    if(b.id==='st-next'){onl.mode='solo';cfg.mode='tale';cfg.time=TALE_TIME;cfg.timer=false;err='';hide();onStart(Object.assign({},cfg),Object.assign({},onl));return;}
    if(b.id==='st-go'){
      const locked=roomLock&&roomLock(),kind=kindOf();
      if(!locked&&kind==='room'&&onl.mode==='join'&&onl.code.length!==CODE_LEN){err=t('onl_bad');render();return;}
      if(kind==='tale'){onl.mode='solo';cfg.mode='tale';cfg.time=TALE_TIME;cfg.timer=false;}
      else if(kind==='practice'){onl.mode='solo';if(cfg.mode!=='story')cfg.mode='practice';cfg.timer=cfg.timers.practice===true;}
      else{cfg.mode='service';cfg.timer=cfg.timers.room!==false;}
      err='';hide();onStart(Object.assign({},cfg),locked?{mode:'keep',code:'',name:onl.name}:Object.assign({},onl));return;
    }
    if(b.dataset.k&&!b.disabled){
      const card=root.querySelector('.st-card'),y=card?card.scrollTop:0;
      const k=b.dataset.k,v=b.dataset.v;
      if(k==='kind'){
        if(v!=='tale')compact=false;
        if(v==='tale'){cfg.mode='tale';onl.mode='solo';}
        else if(v==='practice'){cfg.mode='story';onl.mode='solo';if(!isUnlocked(cfg.stage,loadStory()))cfg.stage='s1';}
        else{cfg.mode='service';if(onl.mode==='solo')onl.mode='create';}
        err='';previewTime();
      }else if(k==='online'){onl.mode=v;err='';}
      else if(k==='level'){if(v==='free')cfg.mode='practice';else{cfg.mode='story';cfg.stage=v;}}
      else if(k==='chairs')onl.chairs=+v;
      else if(k==='npc')onl.npc=v==='on';
      else if(k==='design'){design=+v;if(onDesign)onDesign(design);}
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
    view='main';confirmReset=false;more=false;design=getDesign?getDesign():0;
    cfg=Object.assign({},getCfg());cfg.night=nextNight();
    cfg.timers=Object.assign({room:true,practice:false},cfg.timers);                 // remembered per kind of play
    if(onl.mode!=='solo')cfg.mode='service';                       // joining or creating a room
    else if(cfg.mode!=='tale'&&cfg.mode!=='story')cfg.mode='practice';                 // anything else is solo practice (levels or free)
    compact=!(roomLock&&roomLock())&&onl.mode==='solo'&&Object.keys(loadTale().done).length>0;
    if(compact)cfg.mode='tale';
    open=true;root.hidden=false;if(!onl.name)onl.name=defaultName;render();previewTime();const g=root.querySelector('#st-go');if(g)g.focus({preventScroll:true});
  }
  function hide(){open=false;root.hidden=true;}
  return {show,hide,isOpen:()=>open};
}
