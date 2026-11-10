/* Epilogue nights (8-11), unlocked after the seventh night: one short night for each regular.
   Same rules as every night: choices have exactly one right answer, the others make the guest leave (game over, retry from the entrance).
   They add hearts for the guest, never for the Seoyun x Yunha bond, so the endings stay decided by nights 2-6. */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'다시 시도해 보세요.',en:'Give it another try.'}});
/* a wrong answer: the guest answers, then leaves (the game-over card follows) */
const bad=(id,who,ko,en,ov)=>[say(id,who,ko,en,id+'n'),nar(id+'n','손님은 조용히 자리에서 일어섰다.','The guest quietly stood up from the seat.',id+'l'),{id:id+'l',t:'leave',who,next:ov}];
const build=(n,entry,nodes,face,still,title,desc)=>{
  const g={};nodes.forEach(x=>{g[x.id]=x;if(face[x.id]&&!x.face)x.face=face[x.id];if(x.id in still)x.still=still[x.id];});
  return {n,entry,graph:g,title,desc,epilogue:true};
};

/* ── 8: Taesik opens the bottle ── */
const N8=[
  nar('o1','후일담, 첫째 밤. 마스터의 노트 뒷장에 작은 글씨가 있다. “좋은 소식을 가져온 손님에게는 질문보다 축하를 먼저.”','Epilogue, first night. On the back page of the Master’s notebook, in small letters: “For a guest who brings good news, congratulations come before questions.”','e_ts'),
  {id:'e_ts',t:'enter',who:'taesik',seat:'g1',next:'ts0'},
  nar('ts0','태식이 문을 활짝 열었다. 양복 대신 낚시 조끼, 손에는 이번에도 소주병. 이번에는 뚜껑이 없다.','Taesik flung the door open. A fishing vest instead of a suit, and a soju bottle in his hand again. This time the cap is gone.','ts1'),
  say('ts1','taesik','하랑 씨! 열었어요! 오늘 드디어 병을 열었어요!','Harang! I opened it! Today I finally opened the bottle!','ts2'),
  say('ts2','taesik','아들놈이 첫 월급으로 낚시 장비를 사 줬어요. 제가 아니라 걔가요. 그날 밤, 뚜껑을 돌렸죠.','My son bought me fishing gear with his first paycheck. Not me buying him; him buying me. That night, I turned the cap.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“병은 그냥 따서 드시는 게 제일 맛있지 않나요?”','“Isn’t the bottle best when you just pour it straight?”','ts_x1'),
    opt('“축하드려요! 오늘은 그 병에 어울리는 한 잔을 만들어 드릴게요.”','“Congratulations! Let me make a drink worthy of that bottle.”','ts_a1',{right:true}),
    opt('“소주병이 열렸다니! 이 가게 역사상 가장 큰 사건이에요. 신문에 내야 해요!”','“The soju bottle is open! The biggest event in this bar’s history. We should call the newspapers!”','ts_x2')]},
  ...bad('ts_x1','taesik','……그렇긴 한데. 오늘은 좀 다르게 마시고 싶었는데.','…True enough. I wanted to drink it a little differently today.','ov1'),
  ...bad('ts_x2','taesik','신문까지는 좀… 부끄럽네요. 다음에 올게요.','A newspaper is a bit… embarrassing. I’ll come another time.','ov1'),
  over('ov1','e_ts'),
  say('ts_a1','taesik','소주로도 칵테일이 되나요? 오늘은 이 맛을 지우지 않고, 근사하게 마시고 싶어서요.','Can soju make a cocktail too? I want to drink it fancy tonight without losing its taste.','rec_ts',{hearts:{taesik:1}}),
  {id:'rec_ts',t:'recommend',who:'taesik',hint:{ko:'축하하는 날 · 소주의 맛을 살려서',en:'A celebration · keep the soju’s own taste'},fail:'ts_m',
   cands:[
    cand('sojufizz','good','소주 맛이 그대로네요! 그런데 이렇게 시원하게 넘어가다니.','It still tastes like soju! And yet it goes down so cool.'),
    cand('sojutonic','good','깔끔하네요. 토닉이 소주를 방해하지 않고 곁에 서 있어요.','So clean. The tonic stands beside the soju instead of in its way.'),
    cand('sojunegroni','ok','쌉쌀하네요. 소주 맛은 좀 숨었지만 어른 맛이에요.','Bitter. The soju hides a bit, but it’s a grown-up taste.'),
    cand('grapefruitsoju','ok','달콤한 자몽이네요. 아들이 좋아하겠어요.','Sweet grapefruit. My son would like this.'),
    cand('martini','miss','너무 독해요. 오늘은 취하고 싶지 않은 날이에요.','Too strong. Today I don’t want to get drunk.'),
    cand('mudslide','miss','크림이요? 소주병이 울겠어요.','Cream? The soju bottle would weep.'),
    cand('pinacolada','miss','소주 얘기를 하러 왔는데 휴양지에 온 것 같네요.','I came to talk about soju and now I feel like I’m on a resort.'),
    cand('whiskeysour','miss','오늘은 위스키가 아니에요, 소주예요.','Not whiskey today. Soju.')],
   react:{3:'ts_r3',2:'ts_r2',1:'ts_r1'}},
  say('ts_m','taesik','……이건 아닌 것 같네요. 오늘은 소주 이야기를 하고 싶었어요.','…That isn’t it. Today I wanted to talk about soju.','ts_mn'),
  nar('ts_mn','그는 열린 병의 입구를 손바닥으로 덮고 일어섰다.','He covered the open mouth of the bottle with his palm and stood.','l_x_ts'),
  {id:'l_x_ts',t:'leave',who:'taesik',next:'ov1'},
  say('ts_r3','taesik','이거예요! 소주가 이렇게 근사해질 수 있다니. 이 병, 오늘 제값 하네요.','That’s the one! Soju can be this elegant. This bottle earns its keep tonight.','e_ts2',{hearts:{taesik:2},flag:'park_toast'}),
  say('ts_r2','taesik','좋네요. 오늘 밤에 잘 어울려요.','Nice. It suits tonight.','e_ts2',{hearts:{taesik:1}}),
  say('ts_r1','taesik','……고마워요. 마시다 보면 더 좋아질 것 같아요.','…Thank you. I think it will grow on me as I drink.','e_ts2'),
  {id:'e_ts2',t:'enter',who:'taesik',seat:'g1',next:'ts_b'},
  nar('ts_b','그는 잔을 조금 들어 올려, 카운터 안쪽 빈 의자를 향해 작게 건배했다. 마스터가 앉던 자리다.','He raised his glass a little and toasted, quietly, the empty chair behind the counter. The Master’s chair.','ts_c'),
  say('ts_c','taesik','병을 열기 전에 마스터한테 전화했거든요. 열 일이 생겼다고요. “이제 마시게” 하시더라고요, 딱 한 마디.','Before I opened it I called the Master. I told him I finally had something to celebrate. “Drink it now,” he said, just those words.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“그 한마디로 충분히 마스터답네요. 다음엔 아드님도 같이 모셔 오세요.”','“That one line is so like him. Next time, bring your son along.”','ts_d',{right:true}),
    opt('“소주 열 일이 이렇게 오래 걸릴 줄이야. 다음엔 더 일찍 여세요.”','“Who knew a soju bottle needed this long? Open the next one sooner.”','ts_y1'),
    opt('“아드님 월급으로 사 준 장비면 낚시 가서 못 잡으면 환불해야겠네요.”','“If your son paid for the gear, you should return it if you catch nothing.”','ts_y2')]},
  ...bad('ts_y1','taesik','……그러게요. 22년을 기다렸는데 말이죠.','…Right. After twenty-two years of waiting.','ov2'),
  ...bad('ts_y2','taesik','환불이요? 선물인데… 그건 좀 섭섭하네요.','A refund? It was a gift… that stings a little.','ov2'),
  over('ov2','e_ts2'),
  say('ts_d','taesik','같이 와야겠네요. 아들한테 이 바를 보여 주고 싶어요. 아버지의 소주병이 열린 곳이라고요.','I should. I want to show my son this bar. Where his father’s soju bottle was finally opened.','l_ts',{hearts:{taesik:1}}),
  {id:'l_ts',t:'leave',who:'taesik',next:'cl1'},
  nar('cl1','마감. 카운터 위에는 비어 있는 소주병 하나와 메모지가 남았다. “다음엔 아들이랑. — 태식”','Closing time. An empty soju bottle and a note are left on the counter: “Next time, with my son. — Taesik”','cl2'),
  {id:'cl2',t:'close',title:{ko:'후일담 · 열린 소주병',en:'Epilogue · The opened bottle'},note:{ko:'마스터의 노트 뒷장 — “닫혀 있던 병이 열리면, 그 자리에는 이야기가 남는다.”',en:'Back page of the Master’s notebook — “When a sealed bottle opens, a story stays behind in its place.”'}}
];
const F8={ts1:'smile',ts2:'smile',ts_x1:'sad',ts_x2:'surprised',ts_a1:'smile',ts_m:'sad',ts_r3:'smile',ts_r2:'smile',ts_r1:'neutral',ts_b:'smile',ts_c:'smile',ts_y1:'sad',ts_y2:'sad',ts_d:'smile'};
export const NIGHT8=build(8,'o1',N8,F8,{},{ko:'후일담 · 열린 소주병',en:'Epilogue · The opened bottle'},{ko:'박태식의 소주병이 드디어 열리는 밤.',en:'The night Taesik’s soju bottle finally opens.'});

/* ── 9: Kkangi, rider ── */
const N9=[
  nar('o1','후일담, 둘째 밤. 마스터의 노트 뒷장. “말과 마음이 반대인 손님에게는 말을 믿지 말고, 쉬는 숨을 믿어라.”','Epilogue, second night. Back page of the Master’s notebook: “With a guest whose words and heart disagree, trust the breath, not the words.”','e_kk'),
  {id:'e_kk',t:'enter',who:'kkangi',seat:'g1',next:'kk0'},
  nar('kk0','헬멧을 쓴 채로 깡이가 들어왔다. 등에는 커다란 배달 가방이 달려 있다. 헬멧은 이번에는 반짝반짝 새것이다.','Kkangi walked in with his helmet on, a huge delivery bag on his back. The helmet is brand new and shiny.','kk1'),
  say('kk1','kkangi','나 이제 프로 라이더거든? 첫 달 정산 받았어. 근데 오늘 신호 위반 딱지도 끊었어. ……하랑, 나 어떡하냐.','I’m a pro rider now, you know? Got my first month’s pay. But I also got a red-light ticket today. …Harang, what do I do?','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“딱지는 딱지고, 첫 달 정산 받은 건 진짜 축하할 일이에요. 딱지는 내일의 깡이 씨가 반성하면 돼요.”','“A ticket is a ticket, but your first month’s pay is truly worth celebrating. Tomorrow’s you can feel sorry about the ticket.”','kk_a1',{right:true}),
    opt('“신호 위반은 안 되죠. 헬멧 벗고 반성하세요.”','“You can’t run red lights. Take off the helmet and reflect.”','kk_x1'),
    opt('“딱지 값은 제가 낼게요. 대신 배달 한 번 공짜로 해 주세요!”','“I’ll pay the ticket. In return, one free delivery!”','kk_x2')]},
  ...bad('kk_x1','kkangi','……나 헬멧 못 벗어. 벗으면 진짜 속마음이 나오잖아.','…I can’t take off the helmet. If I do, what I really feel comes out.','ov1'),
  ...bad('kk_x2','kkangi','야, 내가 무슨 공짜 기사냐? 나 이제 프로라고!','Hey, am I a free courier? I’m a pro now!','ov1'),
  over('ov1','e_kk'),
  say('kk_a1','kkangi','……알았어. 오늘 번 건 번 거고. 근데 오늘은 진짜 독한 거 줘. 달콤한 건 절대 안 돼. 달면 약해 보이잖아.','…Okay. Pay is pay. But tonight give me something really strong. Nothing sweet, ever. Sweet looks weak.','rec_kk',{hearts:{kkangi:1}}),
  {id:'rec_kk',t:'recommend',who:'kkangi',hint:{ko:'말은 “독한 것”, 마음은 “달고 시원한 것”',en:'He says “strong”, but means sweet and refreshing'},fail:'kk_m',
   cands:[
    cand('cubalibre','good','……뭐야, 이거 콜라 맛인데. 근데 이상하게 계속 마시게 돼. 약해 보이는 거 아니지?','…What, this tastes like cola. But somehow I keep drinking. This doesn’t look weak, right?'),
    cand('mexicanmule','good','진저가 톡 쏘네! 이거 독한 맛 맞지? 맞다고 해 줘.','The ginger bites! That counts as strong, right? Say it does.'),
    cand('ginandtonic','ok','시원하네. ……나쁘진 않은데 좀 심심하다.','Refreshing. …Not bad, a little plain.'),
    cand('seabreeze','ok','달콤한 건 안 된다고 했는데… 이건 반칙이야. 맛있어.','I said no sweet… this is cheating. It’s good.'),
    cand('negroni','miss','야, 이건 약 같잖아. 진짜 독한 걸 달라고 했지 쓴 걸 달라고 했냐.','This tastes like medicine. I said strong, not bitter.'),
    cand('martini','miss','……이거 소독약 아니야? 헬멧 안에서 숨이 막혀.','…Isn’t this disinfectant? I can’t breathe in this helmet.'),
    cand('neat','miss','그냥 위스키잖아. 아니, 난 좀 더 “칵테일”스러운 독한 걸 원했다고.','It’s just whiskey. I wanted a “cocktail” kind of strong.'),
    cand('goldrush','miss','……꿀이 들어갔네. 이건 아니지. 아니, 맛있긴 한데. 아니야!','…There’s honey in it. That’s not right. Well, it’s tasty. No! It’s not!')],
   react:{3:'kk_r3',2:'kk_r2',1:'kk_r1'}},
  say('kk_m','kkangi','야, 내가 달라고 한 건 이게 아니잖아. 가자, 헬멧!','Hey, that’s not what I asked for. Let’s go, helmet!','kk_mn'),
  nar('kk_mn','깡이는 배달 가방을 들썩이며 문 밖으로 나갔다.','Kkangi hitched up his delivery bag and went out the door.','l_x_kk'),
  {id:'l_x_kk',t:'leave',who:'kkangi',next:'ov1'},
  say('kk_r3','kkangi','……야, 이거 진짜 내 스타일이야. 아니, 독한 스타일. 독한 스타일이라고!','…Hey, this is really my style. No, strong style. Strong style!','e_kk2',{hearts:{kkangi:2},flag:'kkangi_rider'}),
  say('kk_r2','kkangi','나쁘지 않네. 다음에 또 시킬 수도.','Not bad. Might order it again.','e_kk2',{hearts:{kkangi:1}}),
  say('kk_r1','kkangi','……뭐, 마실 만하네.','…Well, it’s drinkable.','e_kk2'),
  {id:'e_kk2',t:'enter',who:'kkangi',seat:'g1',next:'kk_b'},
  nar('kk_b','그는 헬멧을 벗어 카운터에 올려놓았다. 처음으로, 속마음이 말보다 먼저 나올 것 같은 얼굴로.','He took off the helmet and set it on the counter. For the first time, with a face where the heart might come out before the words.','kk_c'),
  say('kk_c','kkangi','있잖아. 나 처음엔 배달 가방이 무거웠거든. 근데 오늘 집에 가는 길에 가방 안의 따뜻한 국물 냄새를 맡았는데… 이 일 괜찮은 일이구나, 싶더라.','You know, at first the delivery bag felt heavy. But on my way home today I smelled warm soup inside, and I thought, this is a good job.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“누군가에게 따뜻한 걸 가져다주는 일이니까요. 깡이 씨한테 잘 어울려요.”','“You bring something warm to somebody. That suits you.”','kk_d',{right:true}),
    opt('“국물 냄새가 났으면 저도 한 그릇 주세요!”','“If there’s soup, give me a bowl too!”','kk_y1'),
    opt('“그래도 신호는 지키세요. 헬멧 값 아까워요.”','“Still, obey the lights. That helmet was expensive.”','kk_y2')]},
  ...bad('kk_y1','kkangi','야, 그거 손님 거야! 나 진짜 프로라고!','Hey, that’s a customer’s! I’m a real pro!','ov2'),
  ...bad('kk_y2','kkangi','……알았어, 알았다고. 분위기 깨기 선수네, 너.','…Okay, okay. You’re a master at ruining the mood.','ov2'),
  over('ov2','e_kk2'),
  say('kk_d','kkangi','……어울린다고? 야, 그런 말 처음 들어. 헬멧 다시 써야겠다. 얼굴 빨개졌다.','…It suits me? Nobody’s ever said that. I need the helmet back on. My face is red.','l_kk',{hearts:{kkangi:1}}),
  {id:'l_kk',t:'leave',who:'kkangi',next:'cl1'},
  nar('cl1','마감. 카운터에는 새 헬멧 스티커 한 장이 붙어 있다. “바 코다 전용 — 안전운전 하랑”. 누가 붙였는지는 묻지 않아도 알 수 있다.','Closing time. A new helmet sticker is on the counter: “Bar Coda only. Drive safe, Harang.” No need to ask who put it there.','cl2'),
  {id:'cl2',t:'close',title:{ko:'후일담 · 헬멧과 배달 가방',en:'Epilogue · The helmet and the bag'},note:{ko:'마스터의 노트 뒷장 — “반대로 말하는 사람의 속마음은 그 사람이 돌아오는 길에 있다.”',en:'Back page of the Master’s notebook — “The heart of one who says the opposite is found on the way back.”'}}
];
const F9={kk1:'sad',kk_x1:'sad',kk_x2:'angry',kk_a1:'neutral',kk_m:'angry',kk_r3:'smile',kk_r2:'neutral',kk_r1:'neutral',kk_b:'neutral',kk_c:'smile',kk_y1:'angry',kk_y2:'sad',kk_d:'surprised'};
export const NIGHT9=build(9,'o1',N9,F9,{},{ko:'후일담 · 헬멧과 배달 가방',en:'Epilogue · The helmet and the bag'},{ko:'프로 라이더가 된 깡이의 첫 달.',en:'Kkangi’s first month as a pro rider.'});

/* ── 10: Yoonjae's first salary ── */
const N10=[
  nar('o1','후일담, 셋째 밤. 마스터의 노트 뒷장. “처음 번 돈은 크기가 아니라 무게로 센다.”','Epilogue, third night. Back page of the Master’s notebook: “The first money you earn is counted by weight, not by size.”','e_yj'),
  {id:'e_yj',t:'enter',who:'yoonjae',seat:'g2',next:'yj0'},
  nar('yj0','윤재가 처음으로 시계 케이스 없이 들어왔다. 손목에는 평범한 전자시계. 손에는 얇은 월급 봉투 하나.','For the first time Yoonjae walked in without a watch case. A plain digital watch on his wrist, and a thin pay envelope in his hand.','yj1'),
  say('yj1','yoonjae','……아버지 회사가 아닌 곳에서 첫 월급을 받았어요. 한 달 번 돈이 제가 예전에 한 번에 쓰던 팁보다 적네요.','…I got my first paycheck from a place that isn’t my father’s company. A month’s pay is less than a tip I used to leave in one go.','yj2'),
  say('yj2','yoonjae','그래서 오늘은 제일 싼 걸로 주세요. 아, 싼 게 아니라… 제 돈으로 낼 수 있는 걸로요.','So tonight, give me the cheapest thing. No, not cheapest… something I can pay for with my own money.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“제일 싼 걸로가 아니라, 첫 월급에 어울리는 걸로 내 드릴게요. 값보다 맛이 먼저예요.”','“Not the cheapest, but one that suits a first paycheck. Taste comes before price.”','yj_a1',{right:true}),
    opt('“싸게 해 드릴게요. 솔직히 윤재 씨는 그동안 너무 비싸게 드셨잖아요.”','“I’ll go cheap. Honestly, you’ve drunk far too expensively until now.”','yj_x1'),
    opt('“월급 봉투를 담보로 외상 하시겠어요?”','“Would you like to run a tab with the pay envelope as collateral?”','yj_x2')]},
  ...bad('yj_x1','yoonjae','……그렇게 말하니까 갑자기 부끄럽네요.','…Hearing it like that, I suddenly feel embarrassed.','ov1'),
  ...bad('yj_x2','yoonjae','담보요? 이건 제가 번 돈이에요. 농담으로는 듣지 않을게요.','Collateral? This is money I earned. I won’t take that as a joke.','ov1'),
  over('ov1','e_yj'),
  say('yj_a1','yoonjae','……값보다 맛. 그 말 좀 오래 곱씹을게요. 아무튼 소박하지만 근사한 걸로 부탁해요.','…Taste before price. I’ll chew on that for a while. Anyway, something modest but lovely.','rec_yj',{hearts:{yoonjae:1}}),
  {id:'rec_yj',t:'recommend',who:'yoonjae',hint:{ko:'첫 월급 · 소박하지만 근사하게',en:'A first paycheck · modest but lovely'},fail:'yj_m',
   cands:[
    cand('highball','good','시원하고 단순한데, 이상하게 마음이 편해져요.','Cool and simple, and strangely comforting.'),
    cand('gimlet','good','깔끔한 라임… 비싼 술이 아니어도 이렇게 반듯할 수 있네요.','Crisp lime… a drink doesn’t have to be expensive to stand this straight.'),
    cand('whiskeysour','ok','맛있어요. 조금 더 소박해도 괜찮았을 텐데.','Tasty. It could have been a little more modest.'),
    cand('ginrickey','ok','가볍고 좋네요. 다음엔 안주도 시킬게요.','Light and nice. Next time I’ll order a snack too.'),
    cand('martini','miss','이건 예전의 제가 시키던 술이에요. 오늘은 말고요.','This is what the old me used to order. Not tonight.'),
    cand('faust','miss','악마의 유혹이라니, 첫 월급에는 너무 위험해요.','A devil’s temptation? Too dangerous for a first paycheck.'),
    cand('pinacolada','miss','휴양지 술이네요. 일하고 나서 오기엔 너무 멀어요.','A resort drink. Too far from a day’s work.'),
    cand('mudslide','miss','디저트가 아니라 한 잔을 마시러 왔어요.','I came for a drink, not for dessert.')],
   react:{3:'yj_r3',2:'yj_r2',1:'yj_r1'}},
  say('yj_m','yoonjae','……오늘은 이게 아니에요. 다음에 올게요.','…This isn’t it today. I’ll come again.','yj_mn'),
  nar('yj_mn','윤재는 월급 봉투를 양손으로 곱게 들고 나갔다.','Yoonjae carried the pay envelope out with both hands.','l_x_yj'),
  {id:'l_x_yj',t:'leave',who:'yoonjae',next:'ov1'},
  say('yj_r3','yoonjae','……이거예요. 제 돈으로 마시는 첫 한 잔. 어쩌면 이게 제일 비싼 거네요.','…This is it. The first drink paid with my own money. Maybe it’s the most expensive one after all.','e_yj2',{hearts:{yoonjae:2},flag:'yoonjae_first_pay'}),
  say('yj_r2','yoonjae','좋네요. 오늘은 이 정도가 딱 맞아요.','Nice. This is just right for tonight.','e_yj2',{hearts:{yoonjae:1}}),
  say('yj_r1','yoonjae','……고맙습니다.','…Thank you.','e_yj2'),
  {id:'e_yj2',t:'enter',who:'yoonjae',seat:'g2',next:'yj_b',also:[{who:'kkangi',seat:'g1'}]},
  nar('yj_b','문이 요란하게 열렸다. 새 헬멧을 쓴 깡이가 곧장 윤재 옆자리에 앉았다.','The door banged open. Kkangi, new helmet and all, dropped straight into the seat next to Yoonjae.','yj_c'),
  say('yj_c','kkangi','야 재벌! 첫 월급이라며? 계산서는 누가 내냐? 크크.','Hey, rich boy! First paycheck, right? So who’s paying the bill? Heh.','yj_d'),
  say('yj_d','yoonjae','……깡이 씨. 오늘은 제가 낼 거예요. 제 돈으로요. 말리지 마세요.','…Kkangi. Tonight I’m paying. With my own money. Don’t stop me.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“그럼 오늘 계산은 윤재 씨가, 팁은 깡이 씨가 내는 걸로 어때요? 서로 첫 월급이잖아요.”','“Then tonight Yoonjae pays the bill and Kkangi the tip. It’s both your first paychecks.”','yj_e',{right:true}),
    opt('“둘 다 월급날이니 오늘 술은 제가 낼게요. 단, 비싼 건 빼고요.”','“It’s payday for you both, so the drinks are on me. Except the expensive ones.”','yj_y1'),
    opt('“싸우시려면 밖에서 헬멧 쓰고 하세요.”','“If you two are going to fight, do it outside with helmets on.”','yj_y2')]},
  ...bad('yj_y1','yoonjae','……제가 내겠다고 했잖아요. 오늘만큼은요.','…I said I’d pay. Just for tonight.','ov2'),
  ...bad('yj_y2','kkangi','야, 우리 안 싸워! 이 바에서 싸울 일이 어디 있냐고!','Hey, we’re not fighting! What is there to fight about in this bar!','ov2'),
  over('ov2','e_yj2'),
  say('yj_e','kkangi','……팁? 내가? 야, 나 이제 라이더라고. 첫 월급 받았다고! 좋아, 그렇게 하자.','…A tip? Me? I’m a rider now. I got my first pay! Fine, let’s do that.','yj_f',{hearts:{yoonjae:1,kkangi:1}}),
  nar('yj_f','두 사람이 서로 다른 손으로 지갑을 꺼냈다. 같은 박자로, 처음으로.','The two reached for their wallets with different hands, in the same beat, for the first time.','l_yj'),
  {id:'l_yj',t:'leave',who:'yoonjae',next:'l_kk2'},
  {id:'l_kk2',t:'leave',who:'kkangi',next:'cl1'},
  nar('cl1','마감. 계산서 위에 두 장의 영수증이 나란히 놓여 있다. 하나는 정확한 금액, 하나는 맞지 않는 금액. 맞지 않는 쪽이 더 많았다.','Closing time. Two receipts lie side by side on the bill. One for the exact amount, one for an amount that doesn’t match. The mismatched one was larger.','cl2'),
  {id:'cl2',t:'close',title:{ko:'후일담 · 첫 월급',en:'Epilogue · First paycheck'},note:{ko:'마스터의 노트 뒷장 — “처음 번 돈으로 마시는 한 잔은 가격을 매길 수 없다. 대신 이름을 붙여 둬라.”',en:'Back page of the Master’s notebook — “You can’t put a price on a drink bought with your first earnings. Give it a name instead.”'}}
];
const F10={yj1:'sad',yj2:'sad',yj_x1:'sad',yj_x2:'angry',yj_a1:'neutral',yj_m:'sad',yj_r3:'smile',yj_r2:'smile',yj_r1:'neutral',yj_c:'smile',yj_d:'neutral',yj_e:'surprised',yj_y1:'sad',yj_y2:'angry'};
export const NIGHT10=build(10,'o1',N10,F10,{},{ko:'후일담 · 첫 월급',en:'Epilogue · First paycheck'},{ko:'윤재가 처음으로 자기 돈으로 계산하는 밤.',en:'The night Yoonjae pays with his own money.'});

/* ── 11: Seoyun and Yunha, Christmas Eve ── */
const N11=[
  nar('o1','후일담, 마지막 밤. 크리스마스 이브. 마스터의 노트 맨 끝장. “마지막 줄은 지우지 말고 남겨 두어라. 누군가 이어 쓸 테니.”','Epilogue, the last night. Christmas Eve. The Master’s notebook, the very last page: “Don’t erase the last line. Someone will continue it.”','e_yh'),
  {id:'e_yh',t:'enter',who:'yunha',seat:'piano',next:'yh0'},
  nar('yh0','윤하가 피아노 뚜껑을 열었다. 오늘은 처음으로, 제목이 있는 곡이 아닌 새 곡의 첫 소절을 들려준다.','Yunha lifted the piano lid. Tonight, for the first time, she plays the opening bar of a piece that isn’t the one with the title.','e_sy'),
  {id:'e_sy',t:'enter',who:'seoyun',seat:'g2',next:'sy0'},
  nar('sy0','서윤이 들어왔다. 노트는 가방에 있다. 대신 작은 선물 상자를 들고 있다. 리본은 모서리가 조금 구겨져 있다.','Seoyun came in. The notebook stays in her bag; instead she carries a small gift box. The ribbon is a little crumpled at one corner.','sy1'),
  say('sy1','seoyun','저, 새 직장 첫 크리스마스예요. 이긴 날은 줄어들었는데… 좋았던 날 줄이 길어졌어요.','It’s my first Christmas at the new job. The “days I won” line has shrunk… but the “good days” line has grown.','sy2'),
  say('sy2','seoyun','이 상자는 피아노 치는 분께 드릴 거예요. 근데 용기가 안 나서 계속 들고만 있어요.','This box is for the pianist. But I can’t find the courage, so I just keep holding it.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“오늘 한 곡 부탁드려요. 곡이 끝나면 상자를 들고 가시면 돼요. 타이밍은 제가 만들어 볼게요.”','“Let’s ask for one song tonight. When it ends, you can take the box over. I’ll make the timing for you.”','sy_a1',{right:true}),
    opt('“상자는 제가 대신 전해 드릴게요. 저는 바텐더니까요.”','“I’ll deliver the box for you. I’m the bartender, after all.”','sy_x1'),
    opt('“상자에 폭죽을 달아서 던지세요! 크리스마스니까요!”','“Attach fireworks to the box and throw it! It’s Christmas!”','sy_x2')]},
  ...bad('sy_x1','seoyun','……그렇게 하면 제가 또 도망친 게 되잖아요.','…Then I’d be running away again.','ov1'),
  ...bad('sy_x2','seoyun','폭죽이요? 변호사가 폭죽 던지다 걸리면 기사 납니다.','Fireworks? A lawyer caught throwing fireworks makes the news.','ov1'),
  over('ov1','e_sy'),
  say('sy_a1','seoyun','……타이밍. 네, 그거면 될 것 같아요. 곡이 끝날 때까지는 마음을 정리하고 있을게요.','…Timing. Yes, that would do. I’ll collect myself until the song ends.','rec_sy',{hearts:{seoyun:1}}),
  {id:'rec_sy',t:'recommend',who:'seoyun',hint:{ko:'크리스마스 이브 · 용기가 필요한 밤',en:'Christmas Eve · a night that needs courage'},fail:'sy_m',
   cands:[
    cand('poinsettia','good','붉은 크랜베리에 거품이… 크리스마스 같아요. 용기가 나는 맛이에요.','Red cranberry under bubbles… it tastes like Christmas. It tastes like courage.'),
    cand('sbagliato','good','실수에서 시작된 술이라면서요? 오늘의 저한테 딱이네요.','They say it began as a mistake? That suits me tonight.'),
    cand('french75','ok','가볍고 반짝이네요. 조금 더 따뜻해도 좋았을 텐데.','Light and sparkling. A little warmth would have been nice.'),
    cand('aperolspritz','ok','밝은 맛이네요. 크리스마스치고는 여름 같지만, 좋아요.','A bright taste. Summery for Christmas, but I like it.'),
    cand('longisland','miss','이건 용기가 아니라 객기가 나오는 술이에요.','This gives you recklessness, not courage.'),
    cand('faust','miss','악마의 유혹이라니, 오늘은 천사 쪽이 필요해요.','A devil’s temptation? I need the angel’s side tonight.'),
    cand('maitai','miss','열대 분위기는 오늘 말고요. 오늘은 겨울이에요.','Not the tropics tonight. It’s winter.'),
    cand('mudslide','miss','너무 달아서 입이 먼저 닫히겠어요.','So sweet my mouth would close first.')],
   react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
  say('sy_m','seoyun','……죄송해요. 오늘은 이게 아니에요.','…Sorry. This isn’t what I need tonight.','sy_mn'),
  nar('sy_mn','서윤은 선물 상자를 품에 안고 문 쪽으로 걸어갔다.','Seoyun held the gift box to her chest and walked toward the door.','l_x_sy'),
  {id:'l_x_sy',t:'leave',who:'seoyun',next:'ov1'},
  say('sy_r3','seoyun','……용기가 나는 것 같아요. 정말로요.','…I think I’m getting courage. Really.','e_sy2',{hearts:{seoyun:2},flag:'seoyun_christmas'}),
  say('sy_r2','seoyun','좋아요. 숨이 편해졌어요.','Nice. I can breathe easier.','e_sy2',{hearts:{seoyun:1}}),
  say('sy_r1','seoyun','……고마워요.','…Thank you.','e_sy2'),
  {id:'e_sy2',t:'enter',who:'seoyun',seat:'g2',next:'yh_a'},
  nar('yh_a','윤하가 건반 위에서 손을 멈췄다. 마지막 화음이 공기 속에서 천천히 가라앉는다. 지금이다.','Yunha’s hands pause on the keys. The last chord sinks slowly into the air. Now.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“서윤 씨, 지금이에요. 이 한 곡이 끝나기 전에는 상자가 식지 않아요.”','“Seoyun, now. The box won’t get cold before this song is over.”','sy_b',{right:true}),
    opt('“아직 한 곡 더 들으셔도 돼요. 상자는 크리스마스 다음 날 주셔도 되잖아요.”','“You can hear one more song. The box can wait until the day after Christmas.”','sy_y1'),
    opt('“상자를 피아노 위로 던져 보세요! 건반 위로 안착하면 대박이에요.”','“Toss the box onto the piano! If it lands on the keys, it’s a miracle.”','sy_y2')]},
  ...bad('sy_y1','seoyun','……그러게요. 내일, 내일이면 더 용기가 날 것 같아요.','…True. Tomorrow, I might have more courage tomorrow.','ov2'),
  ...bad('sy_y2','seoyun','피아노에요?! 이건 저한테 가장 소중한 악기인데요!','On the piano?! It’s the most precious instrument to me!','ov2'),
  over('ov2','e_sy2'),
  nar('sy_b','서윤은 천천히 일어나 피아노 쪽으로 걸어갔다. 선물 상자를 두 손으로 내밀었다.','Seoyun rose slowly and walked to the piano. She held out the gift box in both hands.','sy_c',{hearts:{seoyun:1}}),
  {id:'sy_c',t:'if',heart:'bond',atLeast:4,then:'sy_love',else:'sy_friend'},
  say('sy_love','yunha','……제가 먼저 드리고 싶었는데. 서윤 씨가 먼저네요.','…I wanted to give mine first. And you were quicker.','sy_love2',{face:'smile',still:'end_love'}),
  nar('sy_love2','윤하는 자기 의자 옆자리를 두드렸다. 서윤이 앉자, 두 사람은 한 곡을 나란히 쳤다. 이번에는 둘 다 제목을 붙이지 않았다.','Yunha patted the seat beside her. Seoyun sat down and the two played one song side by side. This time neither gave it a title.','l_sy'),
  say('sy_friend','yunha','……저한테요? 이런 선물은 받아 본 적이 없어서요. 고마워요, 서윤 씨.','…For me? I’ve never received a gift like this. Thank you, Seoyun.','sy_friend2',{face:'smile',still:'end_friend'}),
  nar('sy_friend2','윤하는 상자를 피아노 위에 올려놓고 한 곡을 쳐 주었다. 서윤은 스툴에서 눈을 감고 그 곡을 들었다. 편안한 침묵이 가게 안에 내려앉았다.','Yunha set the box on the piano and played a song for her. Seoyun listened with her eyes closed from the stool. A comfortable silence settled over the bar.','l_sy'),
  {id:'l_sy',t:'leave',who:'seoyun',next:'l_yh'},
  {id:'l_yh',t:'leave',who:'yunha',next:'cl1'},
  nar('cl1','마감. 피아노 위에는 열지 않은 선물 상자 하나와 두 사람이 남기고 간 메모가 있다. “내년에도 이 자리에서.”','Closing time. On the piano sit a gift box and a note the two left behind: “Next year, in this same place.”','cl2'),
  {id:'cl2',t:'close',title:{ko:'후일담 · 크리스마스 이브',en:'Epilogue · Christmas Eve'},note:{ko:'마스터의 노트 맨 끝장 — “마지막 줄은 이어 쓸 사람을 위해 남겨 둔다.”',en:'The very last page of the Master’s notebook — “The last line is left for whoever continues it.”'}}
];
const F11={yh0:'smile',sy1:'smile',sy2:'sad',sy_x1:'sad',sy_x2:'surprised',sy_a1:'neutral',sy_m:'sad',sy_r3:'smile',sy_r2:'smile',sy_r1:'neutral',sy_y1:'sad',sy_y2:'surprised'};
export const NIGHT11=build(11,'o1',N11,F11,{cl1:null},{ko:'후일담 · 크리스마스 이브',en:'Epilogue · Christmas Eve'},{ko:'상자 하나를 든 서윤과, 새 곡을 치는 윤하.',en:'Seoyun with a gift box, and Yunha playing a new piece.'});
