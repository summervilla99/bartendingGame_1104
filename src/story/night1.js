/* Night 1 of the tale: Seoyun (a professional in a sharp suit) and Mr. Park (the department head). Script: docs/story/01-night1.md.
   Every text is {ko,en}. who: narr (narration) | me | a character id from CHARS. */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
/* A drink the player may serve: match = good | ok | miss; lead = what the guest says about this very drink. */
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});

const NODES=[
  /* opening */
  nar('o1','오픈 10분 전. 거울 속의 내가 말한다. “괜찮아, 호텔 바에서 3년 했잖아.” 거울 속의 나는 믿지 않는 얼굴이다.','Ten minutes to opening. The me in the mirror says, “You did three years at a hotel bar. You’ll be fine.” The me in the mirror is not convinced.','o2'),
  nar('o2','마스터는 열쇠와 노트 한 권만 남기고 떠났다. 첫 줄은 이렇다. “처음엔 다 틀려도 된다. 단, 얼음은 아끼지 마라.”','The Master left only a key and a notebook. Its first line: “Everyone gets it wrong at first. Just never skimp on ice.”','o3'),
  nar('o3','얼음을 세 번째로 채웠을 때, 문의 종이 울렸다.','I was refilling the ice for the third time when the door chime rang.','e_sy'),

  /* Seoyun */
  {id:'e_sy',t:'enter',who:'seoyun',seat:'g2',next:'sy0'},
  nar('sy0','빈틈없는 검은 정장에 서류 가방. 척 보기에도 전문직의 분위기가 난다.','A flawless black suit and a briefcase. She gives off a professional air at a glance.','sy0b'),
  nar('sy0b','그녀는 노트를 펼치고 볼펜을 딸깍 눌렀다. 술 마시러 온 사람치고는 너무 진지하다.','She opens a notebook and clicks her pen. Awfully serious for someone who came for a drink.','sy1'),
  say('sy1','seoyun','아무거나 주세요.','Anything, please.','sy2'),
  nar('sy2','“아무거나”는 바텐더에게 가장 어려운 주문이다.','“Anything” is the hardest order a bartender can get.','c1'),
  /* one fitting line (right), one so-so line, one absurd line: only the fitting one moves the night on */
  {id:'c1',t:'choice',opts:[
    opt('“혹시 오늘 힘든 일이 있으셨어요?”','“Did something rough happen today?”','sy_x1'),
    opt('“취향을 조금만 알려 주시겠어요?”','“Could you tell me a little about your taste?”','sy_a1',{right:true}),
    opt('“그럼 제 기분 가는 대로! 오늘은 민트초코 맛 칵테일이 땡기네요.”','“Then I’ll go with my mood! Tonight I feel like a mint-choc cocktail.”','sy_x2')]},
  say('sy_x1','seoyun','……처음 본 사람한테 그런 걸 물으시네요. 아무거나라고 했는데.','…You ask a stranger that? I said anything.','sy_x1n'),
  nar('sy_x1n','싸늘한 침묵. 서윤은 휴대폰을 뒤집어 든 채 조용히 일어섰다.','A cold silence. Seoyun picked up her phone and quietly stood.','l_x_sy1'),
  {id:'l_x_sy1',t:'leave',who:'seoyun',next:'ov_sy'},
  say('sy_x2','seoyun','……민트초코요? (잠시) 농담이죠? ……농담이 아니네요.','…Mint-choc? (pause) You’re joking, right? …You’re not joking.','sy_x2n'),
  nar('sy_x2n','그녀는 말없이 가방을 들었다. 표정 하나 변하지 않는 게 오히려 더 무서웠다.','She took her bag without a word. Not a flicker on her face, which was somehow scarier.','l_x_sy2'),
  {id:'l_x_sy2',t:'leave',who:'seoyun',next:'ov_sy'},
  {id:'ov_sy',t:'over',retry:'e_sy',title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'더 그럴듯한 말을 골라 보세요.',en:'Try a more fitting thing to say.'}},
  say('sy_a1','seoyun','쓴 거. 근데 너무 독하진 않은 거요. 오늘은 취하러 온 게 아니라서.','Something bitter. But not too strong. I’m not here to get drunk tonight.','sy_a1n',{hearts:{seoyun:1}}),
  nar('sy_a1n','힌트가 두 개. 쓰다, 그리고 독하지 않다.','Two hints: bitter, and not too strong.','rec_sy'),
  {id:'rec_sy',t:'recommend',who:'seoyun',hint:{ko:'쓴맛 · 너무 독하지 않게',en:'Bitter · not too strong'},fail:'sy_m',
   cands:[
    cand('daiquiri','miss','……너무 달아요. 쓴 거라고 했는데.','…Too sweet. I said bitter.'),
    cand('negroni','good','쌉쌀한데 깊네요. 딱 이런 걸 찾았어요.','Bitter, yet deep. This is exactly what I was after.'),
    cand('manhattan','ok','좀 묵직하네요. 그래도 나쁘지 않아요.','A bit heavy. Not bad, though.'),
    cand('mojito','miss','민트요? 지금은 상쾌해지고 싶은 기분이 아니에요.','Mint? I’m not in the mood to feel refreshed.'),
    cand('americano','good','가볍게 쓰네요. 취하지 않고 마시기 좋아요.','Lightly bitter. Easy to drink without getting drunk.'),
    cand('espressomartini','miss','커피를 마시면 오늘 밤 잠은 다 잔 거네요.','If I drink coffee, I can say goodbye to sleep tonight.'),
    cand('boulevardier','ok','……위스키 향이 꽤 세네요. 오늘은 조금 가벼운 게 좋았는데.','…Quite a lot of whiskey. I wanted something lighter tonight.'),
    cand('moscowmule','miss','생강이 너무 세요. 오늘 같은 날은 안 맞아요.','Too much ginger. Not right for a day like today.')],
   react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
  say('sy_m','seoyun','죄송해요. 오늘은 이게 아니었나 봐요.','I’m sorry. This wasn’t what I needed tonight.','sy_mn'),
  nar('sy_mn','그녀는 잔을 반쯤 남긴 채 일어섰다.','She stood up, leaving the glass half full.','l_x_sy3'),
  {id:'l_x_sy3',t:'leave',who:'seoyun',next:'ov_sy'},
  say('sy_r3','seoyun','……(한 모금) 이거.','…(takes a sip) This.','sy_r3b'),
  say('sy_r3b','seoyun','전에 이런 맛을 내던 곳이 있었어요. 손이 비슷하네요.','There was a place that made it taste like this. Your hands are similar.','sy_r3n',{hearts:{seoyun:2},flag:'seoyun_knows_master'}),
  nar('sy_r3n','마스터를 아는 사람이다.','She knows the Master.','sy_f'),
  say('sy_r2','seoyun','괜찮네요. 오늘 하루 중에 제일 정직한 맛이에요.','Nice. The most honest taste of my whole day.','sy_r2n',{hearts:{seoyun:1}}),
  nar('sy_r2n','칭찬 같기도 하고 아닌 것 같기도 하다. 속으로 방을 한 바퀴 돈다.','It sounds like praise. Or maybe not. I pace a lap around the room in my head.','sy_f'),
  say('sy_r1','seoyun','……물 좀 주시겠어요?','…Could I have some water?','sy_r1n'),
  nar('sy_r1n','그 물이 오늘 밤 최고의 서비스였다는 건 비밀로 하자.','Let’s keep it secret that the water was tonight’s best service.','sy_f'),
  say('sy_f','seoyun','가방 두고 가도 돼요? 내일 올게요. 오늘은 휴대폰이랑 같이 있기 싫어서.','Can I leave my bag here? I’ll be back tomorrow. I don’t want to be with my phone tonight.','sy_f2'),
  nar('sy_f2','휴대폰이 세 번 울렸다. 서윤은 세 번 다 무시했다. 그 모습이 조금 멋있었다.','Her phone rang three times. Seoyun ignored it three times. It was a little bit cool.','l_sy'),
  {id:'l_sy',t:'leave',who:'seoyun',next:'e_ts'},

  /* Mr. Park */
  {id:'e_ts',t:'enter',who:'taesik',seat:'g1',next:'ts1'},
  say('ts1','taesik','여기 소주 파나요?','Do you sell soju here?','ts1n'),
  nar('ts1n','지하 리스닝바에서 소주를 찾는 사람은 처음이다. 그것도 큰 소리로. 그런데 손에는 이미 소주병이 들려 있다.','The first person ever to ask for soju in an underground listening bar. And loudly. Yet he is already holding a bottle of soju.','ts2'),
  say('ts2','taesik','이 동네에 이런 데가 있었네. 회사 앞 포차는 오늘 휴무라서.','Didn’t know a place like this was around here. The pub by my office is closed today.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“소주는 없고요, 샴페인 타워 쌓아 드릴까요? 오늘 쏘시는 거죠?”','“No soju, but shall I build a champagne tower? You’re paying tonight, right?”','ts_x2'),
    opt('“저희는 칵테일바라 소주는 안 팝니다.”','“We’re a cocktail bar. We don’t sell soju.”','ts_x1'),
    opt('“소주는 없지만 비슷한 걸 만들어 드릴게요.”','“No soju, but I can make something close.”','ts_b1',{right:true})]},
  say('ts_x1','taesik','아… 그래? 그럼 됐어. 괜히 들어왔네.','Ah… is that so? Never mind then. Shouldn’t have come in.','ts_x1n'),
  nar('ts_x1n','문이 닫히는 소리가 이상하게 컸다.','The door closed strangely loudly.','l_x_ts1'),
  {id:'l_x_ts1',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_x2','taesik','샴페인 타워?! 나 월급날 아직 멀었어! 이 집 이상한 데야!','A champagne tower?! Payday is far off! This place is weird!','ts_x2n'),
  nar('ts_x2n','부장님의 위기 대응은 빠른 후퇴였다.','The department head’s crisis response was a swift retreat.','l_x_ts2'),
  {id:'l_x_ts2',t:'leave',who:'taesik',next:'ov_ts'},
  {id:'ov_ts',t:'over',retry:'e_ts',title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'더 그럴듯한 말을 골라 보세요.',en:'Try a more fitting thing to say.'}},
  say('ts_b1','taesik','오, 비슷한 거? 소주처럼 쭉 넘어가는, 독한 걸로. 안주 없어도 되는 거.','Oh, something similar? Strong, and straight down like soju. Something that needs no snacks.','rec_ts',{hearts:{taesik:1}}),
  {id:'rec_ts',t:'recommend',who:'taesik',hint:{ko:'소주처럼 쭉, 독하게',en:'Strong, straight down like soju'},fail:'ts_m',
   cands:[
    cand('cosmopolitan','miss','이게 뭐야, 핑크색이잖아! 나 이런 건 못 먹어!','What’s this, it’s pink! I can’t drink this!'),
    cand('neat','good','캬— 이거지! 위스키는 이렇게 그냥 마셔야 맛이야.','Ahh— that’s it! Whiskey is best straight.'),
    cand('highball','ok','음, 시원하긴 한데 좀 싱겁네. 이것도 나쁘진 않아.','Refreshing, but a bit weak. Not bad though.'),
    cand('mojito','miss','풀이 들어갔네? 쌈 싸 먹으라는 거야?','There’s grass in it? Am I supposed to wrap meat in it?'),
    cand('faust','good','어휴, 달달하게 시작하더니 뒤통수를 치네! 소주보다 센데?','Whoa, starts sweet and then smacks you! Stronger than soju!'),
    cand('oldfashioned','ok','달콤한 위스키네. 소주 마시던 입엔 좀 달다.','Sweetish whiskey. A little sweet for a soju mouth.'),
    cand('espressomartini','miss','커피? 이 시간에 마시면 잠은 다 잤네.','Coffee? At this hour I’ll never sleep.'),
    cand('velvetrose','miss','장미? 나 이런 분위기 아니야. 향수 마시는 줄 알았네.','Rose? Not my style. Feels like drinking perfume.')],
   react:{3:'ts_r3',2:'ts_r2',1:'ts_r1'}},
  say('ts_m','taesik','…미안한데 이건 못 먹겠네. 나 소주 마시러 갈게.','…Sorry, I can’t drink this. I’m off to find some soju.','ts_mn'),
  nar('ts_mn','문이 닫히는 소리가 이상하게 컸다.','The door closed strangely loudly.','l_x_ts5'),
  {id:'l_x_ts5',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_r3','taesik','야, 총각 손이 좋은데? 우리 팀 회식 때 데려와도 되냐?','Hey, you’ve got good hands, kid. Can I bring you to our team dinner?','ts_r3n',{hearts:{taesik:2},flag:'park_trusts_you'}),
  nar('ts_r3n','한 잔에 회식까지 확장 중이다.','One glass, and he’s already planning the whole company dinner.','ts_p'),
  say('ts_r2','taesik','괜찮네. 오늘 밤은 이걸로 됐어.','Not bad. This will do for tonight.','ts_p',{hearts:{taesik:1}}),
  say('ts_r1','taesik','아… 좀 밍밍한데… 아니야, 마셔 볼게. 총각이 만든 거니까.','Ah… a bit weak… no, I’ll drink it. You made it, kid.','ts_r1n'),
  nar('ts_r1n','‘총각’은 다음에 반드시 정정하자.','I really should correct “kid” next time.','ts_p'),
  nar('ts_p','태식이 휴대폰을 한참 들여다본다. 문자 한 줄. 보낸 사람은 “아들”.','Taesik stares at his phone for a long time. One text. From “Son”.','ts_p2'),
  say('ts_p2','taesik','아들이 내일 시험이라는데 뭐라고 보내야 할지 모르겠네. “잘 봐라”는 짧고, “열심히 했냐”는 부담 주잖아.','My son has an exam tomorrow and I don’t know what to send. “Do well” is too short and “Did you study hard” is pressure.','c3'),
  {id:'c3',t:'choice',opts:[
    opt('“아들한테는 ‘공부 안 하면 용돈 끊는다’가 최고죠.”','“With sons, ‘no studying, no allowance’ works best.”','ts_y2'),
    opt('“‘아빠가 한잔 사 줄게’는 어때요?”','“How about ‘Dad will buy you a drink’?”','ts_c1',{right:true,hearts:{taesik:1}}),
    opt('“그냥 ‘힘내’면 충분해요.”','“Just ‘hang in there’ is enough.”','ts_y1')]},
  say('ts_y1','taesik','……힘내. 그래, 그렇게만 보내면 되겠지. (쓸쓸히) 잘 마셨어, 총각.','…Hang in there. Yeah, that’s all I should send. (wistfully) Thanks for the drink, kid.','ts_y1n'),
  nar('ts_y1n','계산서를 두고 나가는 뒷모습이 어쩐지 작아 보였다.','He left the bill and walked out. His back looked somehow smaller.','l_x_ts3'),
  {id:'l_x_ts3',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_y2','taesik','…우리 애는 그러면 더 안 해. 내가 그랬거든.','…My kid does less when I do that. I used to be the same.','ts_y2n'),
  nar('ts_y2n','그가 남긴 건 하이볼 반 잔과 어색한 침묵이었다.','All he left was half a highball and an awkward silence.','l_x_ts4'),
  {id:'l_x_ts4',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_c1','taesik','…그거 좋네. 보내 볼까.','…That’s good. Let me send it.','ts_c1n'),
  nar('ts_c1n','웃으며 문자를 보냈다. 아들에게서 곧 답이 올 것 같다.','He sends it with a smile. A reply is probably coming soon.','ts_h'),
  say('ts_h','taesik','내일은… 면담이라 나도 시험이야. 부장 달고 22년인데, 사람 일이 말이야.','Tomorrow I have a meeting, so I’m sitting an exam too. Twenty-two years as head of department, and still, you never know.','ts_hn',{flag:'park_interview_tomorrow'}),
  nar('ts_hn','22년을 한 곳에서 보낸 아저씨 앞에 소주 대신 놓인 술 한 잔. 오늘 밤 이 한 잔이 위로였기를.','A drink where the soju would have been, for a man who spent twenty-two years in one place. I hope tonight’s glass was a comfort.','l_ts'),
  {id:'l_ts',t:'leave',who:'taesik',next:'cl1'},

  /* closing */
  nar('cl1','마감 후, 피아노 위에서 악보 한 장을 발견했다. 아래에 손글씨. “누군가를 위한 곡.”','After closing I found a sheet of music on the piano. Handwritten below: “A song for someone.”','cl2',{flag:'seoyun_saw_sheet'}),
  nar('cl2','서윤이 가방을 두고 가기 전, 한참 이걸 바라보던 게 떠올랐다.','I remembered Seoyun staring at it for a long while before she left her bag.','cl3'),
  {id:'cl3',t:'close',title:{ko:'첫째 밤',en:'The First Night'},
   note:{ko:'마스터의 노트 1페이지 — “손님의 첫 마디는 거짓말이 많다. ‘아무거나’는 ‘이해받고 싶다’이고, ‘소주 있어요?’는 ‘여기 편해요?’다.”',
         en:'Master’s notebook, page 1 — “A guest’s first words are often a lie. ‘Anything’ means ‘understand me’. ‘Do you have soju?’ means ‘is it comfortable here?’”'}}
];
/* Expressions per line (anything not listed is neutral). */
const FACE={sy_a1:'neutral',sy_x1:'angry',sy_x2:'surprised',sy_m:'sad',sy_r3:'smile',sy_r3b:'smile',sy_r2:'smile',sy_r1:'sad',sy_f:'smile',
  ts1:'neutral',ts_x1:'sad',ts_x2:'surprised',ts_m:'angry',ts_b1:'smile',ts_r3:'smile',ts_r2:'smile',ts_r1:'sad',ts_p2:'sad',ts_y1:'sad',ts_y2:'angry',ts_c1:'smile',ts_h:'sad'};
export const GRAPH={};
NODES.forEach(n=>{GRAPH[n.id]=n;if(FACE[n.id])n.face=FACE[n.id];});
export const NIGHT1={n:1,entry:'o1',graph:GRAPH,title:{ko:'첫째 밤',en:'The First Night'},
  desc:{ko:'서윤과 태식, 두 명의 첫 손님.',en:'Seoyun and Taesik: your first two guests.'}};

