import {t,tr,getLang,setLang,onLang} from './i18n.js';
import {TIMES,TIME_ORDER,FAM_ORDER,FAMILIES,MODES,STAGES,DIFFS,loadStory,isUnlocked,poolFor} from './session.js';
import {normalizeCode,CODE_LEN} from './net/room.js';

/* "Open the bar" screen: pick the hour, the menu family, the mode and the guide level. */
export function createStart({root,recipes,getCfg,onPreview,onStart,initialOnline,roomLock}){
  let cfg=null,open=false,err='';
  /* online choice lives outside the session config (it is per player, not part of the night) */
  const onl=Object.assign({mode:'solo',code:'',name:'',chairs:4},initialOnline||{});
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const opt=(k,v,on,cls,inner,dis)=>'<button type="button" class="st-opt '+(cls||'')+(on?' on':'')+'" data-k="'+k+'" data-v="'+v+'"'+(dis?' disabled':'')+' aria-pressed="'+(on?'true':'false')+'">'+inner+'</button>';
  function render(){
    const T=TIMES[cfg.time];
    const times=TIME_ORDER.map(id=>{
      const x=TIMES[id];
      return opt('time',id,cfg.time===id,'st-time sky-'+x.look.sky,
        '<span class="st-sky"></span><b>'+t('time_'+id)+'</b><i>'+x.clock+'</i><span class="st-d">'+t('time_'+id+'_d')+'</span><span class="st-tag">'+t('time_'+id+'_t')+'</span>');
    }).join('');
    const fams=FAM_ORDER.map(id=>{
      const n=poolFor({menu:id},recipes).length;
      return opt('menu',id,cfg.menu===id,'st-fam',t('fam_'+id)+'<em>'+n+'</em>'+(T.suggest===id?'<u>'+t('suggested')+'</u>':''));
    }).join('');
    const modes=MODES.map(id=>{
      const lab=id==='lab';
      return opt('mode',id,cfg.mode===id,'st-mode',
        '<b>'+t('mode_'+id)+'</b><span class="st-d">'+t('mode_'+id+'_d',{n:T.goal})+'</span>'+(lab?'<u>'+t('soon')+'</u>':''),lab);
    }).join('');
    const onlModes=['solo','create','join'].map(id=>opt('online',id,onl.mode===id,'st-guide',t('onl_'+id))).join('');
    const lock=roomLock?roomLock():null;
    const prog=loadStory();
    const stages=STAGES.map(st=>{
      const un=isUnlocked(st.id,prog),avg=prog.cleared[st.id];
      return opt('stage',st.id,cfg.stage===st.id,'st-stage','<b>'+tr(st.name)+'</b><span class="st-d">'+tr(st.desc)+'</span><span class="st-tag">'+(un?(avg!=null?t('stage_cleared',{avg:avg.toFixed(1)}):t('stage_new',{n:st.goal})):t('stage_lock'))+'</span>',!un);
    }).join('');
    const diffs=Object.keys(DIFFS).map(d=>opt('diff',d,cfg.diff===d,'st-guide',t('diff_'+d))).join('');
    let onlHtml='<h2>'+t('st_online')+'</h2>'+(lock?'<p class="st-note">'+t('onl_locked',{code:lock})+'</p>':'<div class="st-row st-onl">'+onlModes+'</div>');
    if(!lock&&onl.mode!=='solo'){
      onlHtml+='<div class="st-fields"><label class="st-field"><span>'+t('onl_name')+'</span><input class="st-input" id="st-name" maxlength="16" autocomplete="off" value="'+esc(onl.name)+'"></label>'
        +(onl.mode==='join'?'<label class="st-field"><span>'+t('onl_code')+'</span><input class="st-input st-code" id="st-code" maxlength="'+CODE_LEN+'" autocomplete="off" autocapitalize="characters" spellcheck="false" value="'+esc(onl.code)+'"></label>':'')
        +'</div>'
        +(onl.mode==='create'?'<div class="st-fields"><div class="st-field"><span>'+t('st_chairs')+'</span><div class="st-row st-chairs">'+[2,3,4,5,6].map(n=>opt('chairs',n,onl.chairs===n,'st-guide',n)).join('')+'</div></div>'+'</div>':'')
        +'<p class="st-note">'+t(onl.mode==='create'?'onl_hint_create':'onl_hint_join')+' '+t('onl_note')+'</p>'+(err?'<p class="st-err">'+esc(err)+'</p>':'');
    }
    root.innerHTML='<div class="st-card" role="dialog" aria-labelledby="st-h">'
      +'<div class="st-head"><span class="neon">Courte Studio</span><button class="btn sm" id="st-lang" type="button" aria-label="'+esc(t('lang_aria'))+'"><span data-l="ko">KO</span>/<span data-l="en">EN</span></button></div>'
      +'<h1 id="st-h">'+t('st_title')+'</h1><p class="st-sub">'+t('st_sub')+'</p>'
      +'<h2>'+t('st_time')+'</h2><div class="st-row st-times">'+times+'</div>'
      +'<h2>'+t('st_mode')+'</h2><div class="st-row st-modes">'+modes+'</div>'
      +(cfg.mode==='story'?'<h2>'+t('st_stage')+'</h2><div class="st-row st-stages">'+stages+'</div>':'<h2>'+t('st_menu')+'</h2><div class="st-row st-fams">'+fams+'</div>')
      +'<h2>'+t('st_diff')+'</h2><div class="st-row st-diffs">'+diffs+'</div><p class="st-note">'+t(cfg.mode==='practice'?'diff_note2':'diff_note3')+'</p>'
      +onlHtml
      +'<button class="btn lg primary st-go" id="st-go" type="button">'+t('open_bar')+'</button></div>';
  }
  root.addEventListener('click',e=>{
    if(!open)return;
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='st-lang'){setLang(getLang()==='ko'?'en':'ko');return;}
    if(b.id==='st-go'){
      const locked=roomLock&&roomLock();
      if(!locked&&onl.mode==='join'&&onl.code.length!==CODE_LEN){err=t('onl_bad');render();return;}
      err='';hide();onStart(Object.assign({},cfg),locked?{mode:'keep',code:'',name:onl.name}:Object.assign({},onl));return;
    }
    if(b.dataset.k&&!b.disabled){
      const card=root.querySelector('.st-card'),y=card?card.scrollTop:0;
      if(b.dataset.k==='online'){onl.mode=b.dataset.v;err='';}
      else if(b.dataset.k==='chairs')onl.chairs=+b.dataset.v;
      else{cfg[b.dataset.k]=b.dataset.v;if(b.dataset.k==='time')onPreview(cfg.time);}
      render();const c2=root.querySelector('.st-card');if(c2)c2.scrollTop=y;
    }
  });
  root.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='st-name')onl.name=el.value;
    else if(el.id==='st-code'){onl.code=normalizeCode(el.value);el.value=onl.code;}
  });
  onLang(()=>{if(open)render();});
  function show(){cfg=Object.assign({},getCfg());open=true;root.hidden=false;render();onPreview(cfg.time);const g=root.querySelector('#st-go');if(g)g.focus({preventScroll:true});}
  function hide(){open=false;root.hidden=true;}
  return {show,hide,isOpen:()=>open};
}
