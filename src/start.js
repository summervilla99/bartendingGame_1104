import {t,getLang,setLang,onLang} from './i18n.js';
import {TIMES,TIME_ORDER,FAM_ORDER,FAMILIES,MODES,poolFor} from './session.js';
import {normalizeCode,CODE_LEN} from './net/room.js';

/* "Open the bar" screen: pick the hour, the menu family, the mode and the guide level. */
export function createStart({root,recipes,getCfg,onPreview,onStart,initialOnline}){
  let cfg=null,open=false,err='';
  /* online choice lives outside the session config (it is per player, not part of the night) */
  const onl=Object.assign({mode:'solo',code:'',name:''},initialOnline||{});
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
    const guides=['full','instinct'].map(id=>opt('guide',id,cfg.guide===id,'st-guide',t('guide_'+id))).join('');
    const onlModes=['solo','create','join'].map(id=>opt('online',id,onl.mode===id,'st-guide',t('onl_'+id))).join('');
    let onlHtml='<h2>'+t('st_online')+'</h2><div class="st-row st-onl">'+onlModes+'</div>';
    if(onl.mode!=='solo'){
      onlHtml+='<div class="st-fields"><label class="st-field"><span>'+t('onl_name')+'</span><input class="st-input" id="st-name" maxlength="16" autocomplete="off" value="'+esc(onl.name)+'"></label>'
        +(onl.mode==='join'?'<label class="st-field"><span>'+t('onl_code')+'</span><input class="st-input st-code" id="st-code" maxlength="'+CODE_LEN+'" autocomplete="off" autocapitalize="characters" spellcheck="false" value="'+esc(onl.code)+'"></label>':'')
        +'</div><p class="st-note">'+t(onl.mode==='create'?'onl_hint_create':'onl_hint_join')+' '+t('onl_note')+'</p>'+(err?'<p class="st-err">'+esc(err)+'</p>':'');
    }
    root.innerHTML='<div class="st-card" role="dialog" aria-labelledby="st-h">'
      +'<div class="st-head"><span class="neon">Courte Studio</span><button class="btn sm" id="st-lang" type="button" aria-label="'+esc(t('lang_aria'))+'"><span data-l="ko">KO</span>/<span data-l="en">EN</span></button></div>'
      +'<h1 id="st-h">'+t('st_title')+'</h1><p class="st-sub">'+t('st_sub')+'</p>'
      +'<h2>'+t('st_time')+'</h2><div class="st-row st-times">'+times+'</div>'
      +'<h2>'+t('st_menu')+'</h2><div class="st-row st-fams">'+fams+'</div>'
      +'<h2>'+t('st_mode')+'</h2><div class="st-row st-modes">'+modes+'</div>'
      +'<h2>'+t('st_guide')+'</h2><div class="st-row st-guides">'+guides+'</div>'
      +onlHtml
      +'<button class="btn lg primary st-go" id="st-go" type="button">'+t('open_bar')+'</button></div>';
  }
  root.addEventListener('click',e=>{
    if(!open)return;
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='st-lang'){setLang(getLang()==='ko'?'en':'ko');return;}
    if(b.id==='st-go'){
      if(onl.mode==='join'&&onl.code.length!==CODE_LEN){err=t('onl_bad');render();return;}
      err='';hide();onStart(Object.assign({},cfg),Object.assign({},onl));return;
    }
    if(b.dataset.k&&!b.disabled){
      const card=root.querySelector('.st-card'),y=card?card.scrollTop:0;
      if(b.dataset.k==='online'){onl.mode=b.dataset.v;err='';}
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
