/* ko/en dictionaries. t(key,vars) for UI strings, tr({ko,en}) for data objects. Language: localStorage, else navigator.language. */
const KEY='courte.lang';
const D={
  ko:{
    tips:'오늘의 팁',music_on:'음악 켜기',music_off:'음악 끄기',orders_aria:'대기 중인 주문',cheers:'건배',
    hint_kb:'<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동 · <kbd>Shift</kbd> 달리기 · 드래그로 시점 회전 · 카운터 안쪽으로 들어가면 바텐딩',
    hint_touch:'왼쪽 스틱으로 이동 · 화면을 드래그해 시점 회전 · 카운터 안쪽에서 바텐딩',
    step_shake:'흔들기',step_stir:'젓기',
    why_shake:'과즙·시럽이 들어가는 칵테일은 얼음과 함께 힘차게 흔들어 섞어요. 은색 틴에 부어 뚜껑을 닫고 셰이크!',
    why_stir:'술로만 만드는 칵테일은 흔들면 탁해져요. 믹싱 글라스에 부어 숟가락으로 부드럽게 저어요.',
    why_build:'섞지 않고 서빙할 잔에 바로 부어 만들어요.',
    st_title:'오늘 밤을 골라 주세요',st_sub:'시간대와 메뉴, 모드를 정하면 바가 열려요.',st_time:'시간대',st_menu:'오늘의 메뉴',st_mode:'모드',st_guide:'가이드',
    time_golden:'골든아워',time_prime:'프라임타임',time_last:'라스트콜',
    time_golden_d:'노을이 드는 창, 느긋한 분위기. 천천히 배우기 좋아요.',time_prime_d:'피아노가 시작되고 손님이 가득해요. 주문이 빨라요.',time_last_d:'비 오는 창과 촛불. 마지막 한 잔, 팁이 두둑해요.',
    time_golden_t:'느긋한 주문 · 팁 ×1',time_prime_t:'손님 많음 · 팁 ×1.2',time_last_t:'주문 몰림 · 팁 ×1.5',
    fam_all:'전체',fam_sours:'사워 · 시트러스',fam_stirred:'스터 · 클래식',fam_long:'하이볼 · 롱드링크',fam_agave:'아가베 나이트',fam_gin:'진 나이트',fam_house:'하우스 오리지널',suggested:'추천',
    mode_service:'서비스',mode_service_d:'한 밤에 {n}잔. 별점과 팁으로 정산해요.',mode_practice:'연습',mode_practice_d:'시간 제한 없이 천천히. 레시피 설명이 항상 펼쳐져요.',mode_lab:'랩',mode_lab_d:'나만의 칵테일을 만들어요.',soon:'곧 공개',
    guide_full:'눈금 보기',guide_instinct:'감으로 (눈금 숨김)',open_bar:'바 열기',night_btn:'새로운 밤',
    sum_title:'오늘 밤 정산',sum_drinks:'만든 잔',sum_stars:'평균 별점',sum_best:'베스트 한 잔',sum_again:'한 번 더',sum_new:'새로운 밤',
    sum_r0:'오늘은 연습이 더 필요해요.',sum_r1:'무난한 밤이었어요.',sum_r2:'단골이 생길 것 같은 밤!',sum_r3:'완벽한 밤이었어요. 마지막 한 잔까지.',
    night_prog:'{time} · {n}/{goal}',night_free:'{time} · 연습',
    settings_aria:'설정',set_lang:'언어',set_unit:'단위',set_music:'음악',
    know_title:'알아두면 좋아요',k_ratio:'비율',serve_up:'업 · 얼음 없이',serve_rocks:'온더락',serve_tall:'롱드링크 · 얼음 가득',serve_mug:'구리 머그 · 얼음 가득',
    tech_shake:'셰이크 10~15초',tech_stir:'스터 20~30초',tech_build:'가볍게 한 번',
    st_online:'함께 하기',onl_solo:'혼자',onl_create:'방 만들기',onl_join:'코드로 참가',onl_name:'닉네임',onl_code:'방 코드',
    onl_hint_create:'바를 열면 방 코드가 만들어져요. 친구에게 링크를 보내 주세요.',onl_hint_join:'친구가 알려 준 5자리 방 코드를 넣어 주세요. 시간대와 메뉴는 방장이 정한 대로 진행돼요.',
    onl_note:'지금은 같은 브라우저의 다른 탭에서 만나 함께 걷고 건배할 수 있어요. 주문과 칵테일은 아직 각자 진행돼요.',onl_bad:'방 코드는 5자리예요.',
    guest_default:'손님',room_open:'방이 열렸어요 · {code}',room_joined:'방에 들어왔어요 · {code}',room_copied:'초대 링크를 복사했어요',room_aria:'방 {code} · {n}명 · 눌러서 초대 링크 복사',
    bubble_making:'{name}님이 만드는 중',claim_fail:'다른 사람이 먼저 맡았어요',claim_lost:'주문이 다른 곳으로 넘어갔어요',act_full:'바텐더 자리가 가득 찼어요',host_only:'방장만 새로운 밤을 시작할 수 있어요',room_host_you:'이제 내가 방장이에요',onl_locked:'방 {code}에서 함께 진행 중이에요. 방장이 정한 설정으로 진행돼요.',
    emote_btn:'행동',emo_cheers:'건배',emo_wave:'손 흔들기',emo_clap:'박수',emo_bow:'인사',chat_btn:'채팅',chat_ph:'메시지를 입력하세요',chat_send:'보내기',
    act_sit:'앉기 · {name}',act_stand:'일어서기',act_photo:'사진 찍기 · {name}',photo_save:'저장',photo_share:'공유',photo_close:'닫기',toast_saved:'사진을 저장했어요',set_night:'밤',
    order_btn:'주문하기',order_title:'무엇을 드릴까요?',order_sent:'주문했어요! 바텐더를 기다려요',order_full:'지금은 주문할 수 없어요',timer_lb:'제한시간',
    fired:'시간 초과! 바텐더에서 해고됐어요. 30초 뒤에 다시 지원할 수 있어요',fired_wait:'아직 해고 상태예요. 잠시 뒤에 다시 지원해 주세요',drink_arrived:'주문한 술이 나왔어요! ({stars}성)',
    emo_dance:'춤추기',emo_jump:'점프',st_chairs:'바 의자 수',st_diff:'난이도',diff_easy:'하 · 60초',diff_mid:'중 · 45초',diff_hard:'상 · 30초',
    diff_note:'앉은 손님이 주문하면 바텐더가 제한시간 안에 만들어야 해요. 못 만들면 해고돼서 30초 동안 일할 수 없어요.',
    combo:'콤보 ×{n}',rush_tag:'급해요',rush_bubble:'빨리 주세요!',guest_left:'손님이 기다리다 지쳐 떠났어요',story_clear:'{stage} 클리어!',story_clear_say:'다음 단계가 열렸어요. 계속해 볼까요?',
    story_retry:'{stage} 다시 도전',story_retry_say:'평균 {n}성 이상이면 클리어예요. 한 번 더 해 볼까요?',sum_next:'다음 단계',
    mode_story:'시나리오',mode_story_d:'쉬운 칵테일부터 클래식, 복잡한 칵테일까지 단계별로 깨요.',st_stage:'단계',stage_lock:'이전 단계를 클리어하면 열려요',stage_cleared:'클리어 · 평균 ★{avg}',stage_new:'{n}잔 · 평균 ★ 이상 클리어',
    diff_note2:'연습 모드는 제한시간이 없어요.',diff_note3:'제한시간이 지나면 손님이 떠나요. (친구 모드에서는 바텐더가 해고돼요)',
    music_pick:'음악 고르기',music_title:'어떤 음악을 틀까요?',mus_jazz:'재즈',mus_house:'하우스',mus_classical:'클래식',mus_off:'끄기',
    set_genre:'음악',set_mood:'분위기',set_zoom:'화면 크기',mood_set:'분위기를 {time}(으)로 바꿨어요',
    net_error:'서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.',set_room:'방',room_leave:'방 나가기',room_left:'방에서 나왔어요',
    leave:'카운터 나가기',step_pour:'붓기',step_mix:'섞기',step_garnish:'가니시',step_serve:'서빙',
    tab_spirit:'증류주',tab_liqueur:'리큐르·베르뭇',tab_mixer:'주스·믹서',
    reset:'비우고 다시',next_pour:'다 넣었어요',strain:'잔에 따르기',serve:'서빙하기',garnish_say:'가니시를 골라 올려 주세요.',
    tip:'팁',r_next:'다음 주문',loading:'바를 여는 중…',stars_aria:'별 3개 중 {n}개',unit_aria:'단위 전환 (ml / oz)',lang_aria:'언어 전환',
    toast_hint:'재료를 꾹 누르고 있으면 따라져요',toast_full:'잔이 가득 찼어요',toast_empty:'먼저 재료를 따라 주세요',
    toast_mixed:'좋아요, 잘 섞였어요',toast_nosound:'이 브라우저에서는 소리를 켤 수 없어요',toast_cheers:'짠!',
    mix_shake:'틴을 닫았어요. 위아래로 힘차게 흔들어 주세요. 화면을 누른 채 위아래로 드래그!',
    mix_stir:'잔 둘레를 따라 원을 그리며 저어 주세요. 화면을 누른 채 빙글빙글 드래그!',
    bubble_order:'{name} 한 잔 부탁해요',act_bar:'바텐딩 시작 · 주문 {n}건',act_wait:'주문을 기다리는 중…',act_talk:'{name}에게 말 걸기',
    talk_order:'{drink} 한 잔 부탁해도 될까요? 카운터 안쪽에서 만들어 주세요.',
    ticket_no:'주문 #{n} · {name}',tag_house:'하우스 오리지널',no_garnish:'가니시 없음',
    extra_ing:'레시피에 없는 재료가 {v} 들어갔어요.',r_who:'{name}에게 서빙',r_extra:'레시피에 없는 재료',r_garnish:'가니시',r_match:'맞음',r_diff:'다름',
    say0:'이건 제가 시킨 게 아닌 것 같은데요…',say1:'음, 레시피를 한 번 더 볼까요?',say2:'좋아요. 한 잔 더 시켜도 되겠는데요?',say3:'완벽해요. 오늘 밤은 여기서 끝낼래요.',
    unit_both:'ml · oz',unit_ml:'ml',unit_oz:'oz',dash_one:'{n} 대시',dash_many:'{n} 대시'
  },
  en:{
    tips:"Tonight's tips",music_on:'Music on',music_off:'Music off',orders_aria:'Pending orders',cheers:'Cheers',
    hint_kb:'<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move · <kbd>Shift</kbd> run · drag to look · step behind the counter to bartend',
    hint_touch:'Left stick to move · drag to look · step behind the counter to bartend',
    step_shake:'Shake',step_stir:'Stir',
    why_shake:'Citrus, juice or syrup drinks are shaken hard with ice. Pour into the steel tin, seal it, shake!',
    why_stir:'Spirit-only drinks turn cloudy if shaken. Pour into the mixing glass and stir gently with the bar spoon.',
    why_build:'No mixing needed. Pour straight into the serving glass.',
    st_title:'Choose your night',st_sub:'Pick the hour, the menu and the mode, then the bar opens.',st_time:'Hour',st_menu:"Tonight's menu",st_mode:'Mode',st_guide:'Guide',
    time_golden:'Golden Hour',time_prime:'Prime Time',time_last:'Last Call',
    time_golden_d:'Sunset in the windows, a relaxed room. Easy to learn.',time_prime_d:'The piano starts and the room fills. Orders come quick.',time_last_d:'Rain on the glass, candlelight. One last round, bigger tips.',
    time_golden_t:'Relaxed orders · tips ×1',time_prime_t:'Busy · tips ×1.2',time_last_t:'Order rush · tips ×1.5',
    fam_all:'Everything',fam_sours:'Sours & citrus',fam_stirred:'Stirred classics',fam_long:'Highballs & longs',fam_agave:'Agave night',fam_gin:'Gin night',fam_house:'House originals',suggested:'Suggested',
    mode_service:'Service',mode_service_d:'{n} drinks in a night, settled with stars and tips.',mode_practice:'Practice',mode_practice_d:'No pressure. Recipe notes stay open.',mode_lab:'Lab',mode_lab_d:'Invent your own cocktails.',soon:'Coming soon',
    guide_full:'Show measures',guide_instinct:'By feel (hide measures)',open_bar:'Open the bar',night_btn:'New night',
    sum_title:'Night summary',sum_drinks:'Drinks',sum_stars:'Avg. stars',sum_best:'Best drink',sum_again:'Again',sum_new:'New night',
    sum_r0:'Needs more practice tonight.',sum_r1:'A decent night.',sum_r2:'You may have earned some regulars!',sum_r3:'A flawless night, down to the last drink.',
    night_prog:'{time} · {n}/{goal}',night_free:'{time} · practice',
    settings_aria:'Settings',set_lang:'Language',set_unit:'Units',set_music:'Music',
    know_title:'Good to know',k_ratio:'Ratio',serve_up:'Served up · no ice',serve_rocks:'On the rocks',serve_tall:'Tall · over ice',serve_mug:'Copper mug · over ice',
    tech_shake:'Shake 10–15 s',tech_stir:'Stir 20–30 s',tech_build:'One gentle stir',
    st_online:'Play together',onl_solo:'Solo',onl_create:'Create room',onl_join:'Join with code',onl_name:'Nickname',onl_code:'Room code',
    onl_hint_create:'A room code is made when the bar opens. Send friends the link.',onl_hint_join:'Enter the 5-character room code your friend gave you. The host sets the hour and menu.',
    onl_note:'For now you can meet in another tab of the same browser to walk and cheer together. Orders and drinks are still separate.',onl_bad:'Room codes are 5 characters.',
    guest_default:'Guest',room_open:'Room open · {code}',room_joined:'Joined room · {code}',room_copied:'Invite link copied',room_aria:'Room {code} · {n} here · tap to copy invite link',
    bubble_making:'{name} is making it',claim_fail:'Someone else took it first',claim_lost:'That order moved on',act_full:'Both bartender spots are taken',host_only:'Only the host can start a new night',room_host_you:'You are the host now',onl_locked:'Playing together in room {code}. The host sets the night.',
    emote_btn:'Actions',emo_cheers:'Cheers',emo_wave:'Wave',emo_clap:'Clap',emo_bow:'Bow',chat_btn:'Chat',chat_ph:'Say something',chat_send:'Send',
    act_sit:'Sit · {name}',act_stand:'Stand up',act_photo:'Take a photo · {name}',photo_save:'Save',photo_share:'Share',photo_close:'Close',toast_saved:'Photo saved',set_night:'Night',
    order_btn:'Order',order_title:'What can I get you?',order_sent:'Ordered! Waiting for a bartender',order_full:"Can't order right now",timer_lb:'Time left',
    fired:"Time's up! You were fired as bartender. You can reapply in 30 seconds",fired_wait:"You're still fired. Try again in a moment",drink_arrived:'Your drink is here! ({stars} stars)',
    emo_dance:'Dance',emo_jump:'Jump',st_chairs:'Bar stools',st_diff:'Difficulty',diff_easy:'Easy · 60 s',diff_mid:'Medium · 45 s',diff_hard:'Hard · 30 s',
    diff_note:'When a seated guest orders, the bartender must finish within the time limit. Too slow and you are fired for 30 seconds.',
    combo:'Combo ×{n}',rush_tag:'in a hurry',rush_bubble:'Quick, please!',guest_left:'The guest got tired of waiting and left',story_clear:'{stage} cleared!',story_clear_say:'The next stage is open. Keep going?',
    story_retry:'Retry {stage}',story_retry_say:'Average {n} stars or more to clear. One more try?',sum_next:'Next stage',
    mode_story:'Story',mode_story_d:'Work through the cocktails stage by stage: easy first, then the classics, then the complex ones.',st_stage:'Stage',stage_lock:'Clear the previous stage to unlock',stage_cleared:'Cleared · avg ★{avg}',stage_new:'{n} drinks · clear with enough stars',
    diff_note2:'Practice has no time limit.',diff_note3:'Guests leave when the time runs out. (With friends, the bartender gets fired.)',
    music_pick:'Pick music',music_title:'What shall we play?',mus_jazz:'Jazz',mus_house:'House',mus_classical:'Classical',mus_off:'Off',
    set_genre:'Music',set_mood:'Mood',set_zoom:'Screen size',mood_set:'Mood set to {time}',
    net_error:"Couldn't reach the server. Try again in a moment.",set_room:'Room',room_leave:'Leave room',room_left:'Left the room',
    leave:'Leave counter',step_pour:'Pour',step_mix:'Mix',step_garnish:'Garnish',step_serve:'Serve',
    tab_spirit:'Spirits',tab_liqueur:'Liqueurs & Vermouth',tab_mixer:'Juices & Mixers',
    reset:'Start over',next_pour:'Done pouring',strain:'Pour into glass',serve:'Serve',garnish_say:'Pick a garnish.',
    tip:'Tip',r_next:'Next order',loading:'Opening the bar…',stars_aria:'{n} of 3 stars',unit_aria:'Switch units (ml / oz)',lang_aria:'Switch language',
    toast_hint:'Press and hold an ingredient to pour',toast_full:'The glass is full',toast_empty:'Pour something first',
    toast_mixed:'Nicely mixed',toast_nosound:"Sound isn't available in this browser",toast_cheers:'Cheers!',
    mix_shake:'Tin sealed. Shake it hard: press and drag up and down!',
    mix_stir:'Stir in circles around the glass. Press and drag round and round!',
    bubble_order:'One {name}, please',act_bar:'Start bartending · {n} order(s)',act_wait:'Waiting for orders…',act_talk:'Talk to {name}',
    talk_order:'Could I get a {drink}, please? Come around behind the counter to make it.',
    ticket_no:'Order #{n} · {name}',tag_house:'House original',no_garnish:'No garnish',
    extra_ing:'{v} of something not in the recipe went in.',r_who:'Served to {name}',r_extra:'Not in the recipe',r_garnish:'Garnish',r_match:'Match',r_diff:'Different',
    say0:"This isn't what I ordered…",say1:'Hmm, maybe check the recipe again?',say2:"Nice. I could go for another one.",say3:"Perfect. That's my night made.",
    unit_both:'ml · oz',unit_ml:'ml',unit_oz:'oz',dash_one:'{n} dash',dash_many:'{n} dashes'
  }
};
let lang=null;
try{lang=localStorage.getItem(KEY);}catch(_){}
const HAS_DOM=typeof document!=='undefined';
if(lang!=='ko'&&lang!=='en')lang=(((typeof navigator!=='undefined'&&navigator.language)||'en')+'').toLowerCase().indexOf('ko')===0?'ko':'en';
const subs=[];
if(HAS_DOM)document.documentElement.lang=lang;
export const getLang=()=>lang;
export function t(key,vars){
  let s=D[lang][key];if(s==null)s=D.ko[key];if(s==null)return key;
  if(vars)s=s.replace(/\{(\w+)\}/g,(m,k)=>vars[k]!=null?vars[k]:m);
  return s;
}
export const tr=o=>o?(o[lang]||o.ko):'';
export function applyDom(root){
  if(!HAS_DOM)return;
  root=root||document;
  root.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n);});
  root.querySelectorAll('[data-i18n-html]').forEach(n=>{n.innerHTML=t(n.dataset.i18nHtml);});
  root.querySelectorAll('[data-i18n-ph]').forEach(n=>{n.placeholder=t(n.dataset.i18nPh);});
  root.querySelectorAll('[data-i18n-aria]').forEach(n=>{n.setAttribute('aria-label',t(n.dataset.i18nAria));});
}
export function setLang(l){
  if(l===lang)return;
  lang=l;try{localStorage.setItem(KEY,l);}catch(_){}
  if(HAS_DOM)document.documentElement.lang=l;applyDom();subs.forEach(f=>f(l));
}
export const onLang=f=>{subs.push(f);};
