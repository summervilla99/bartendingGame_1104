/* Night 1 of the tale: Seoyun (the lawyer) and Mr. Park (the department head). Script: docs/story/01-night1.md.
   Every text is {ko,en}. who: narr (narration) | me | a character id from CHARS. */
export const CHARS={
  me:{name:{ko:'하랑',en:'Harang'},seat:null},
  seoyun:{name:{ko:'한서윤',en:'Han Seoyun'},seat:'g2',tone:'#e7c9a0'},
  taesik:{name:{ko:'박태식',en:'Park Taesik'},seat:'g1',tone:'#d9a486'}
};
/* One short flavour line per drink, shown on the recommendation buttons. */
export const FLAVOR={
  negroni:{ko:'쓰고 진한 클래식',en:'Bitter, bold classic'},americano:{ko:'쌉쌀하고 가벼운',en:'Bittersweet and light'},
  manhattan:{ko:'묵직한 위스키 스터',en:'Weighty stirred whiskey'},daiquiri:{ko:'새콤달콤 럼',en:'Tart and sweet rum'},
  moscowmule:{ko:'생강 톡 쏘는',en:'Spicy ginger fizz'},mojito:{ko:'민트 청량',en:'Minty and fresh'},
  highball:{ko:'시원한 위스키 소다',en:'Cold whiskey and soda'},gimlet:{ko:'깔끔한 라임 진',en:'Crisp lime gin'},
  oldfashioned:{ko:'진한 위스키 한 모금',en:'A slow whiskey sip'},espressomartini:{ko:'달콤한 커피',en:'Sweet coffee kick'},
  cosmopolitan:{ko:'새콤한 핑크',en:'Tart and pink'}
};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match)=>({id,match});

const NODES=[
  /* opening */
  nar('o1','오픈 10분 전. 거울 속의 내가 말한다. “괜찮아, 호텔 바에서 3년 했잖아.” 거울 속의 나는 믿지 않는 얼굴이다.','Ten minutes to opening. The me in the mirror says, “You did three years at a hotel bar. You’ll be fine.” The me in the mirror is not convinced.','o2'),
  nar('o2','마스터는 열쇠와 노트 한 권만 남기고 떠났다. 첫 줄은 이렇다. “처음엔 다 틀려도 된다. 단, 얼음은 아끼지 마라.”','The Master left only a key and a notebook. Its first line: “Everyone gets it wrong at first. Just never skimp on ice.”','o3'),
  nar('o3','얼음을 세 번째로 채웠을 때, 문의 종이 울렸다.','I was refilling the ice for the third time when the door chime rang.','e_sy'),

  /* Seoyun */
  {id:'e_sy',t:'enter',who:'seoyun',seat:'g2',next:'sy1'},
  say('sy1','seoyun','아무거나 주세요.','Anything, please.','sy2'),
  nar('sy2','“아무거나”는 바텐더에게 가장 어려운 주문이다.','“Anything” is the hardest order a bartender can get.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“취향을 조금만 알려 주시겠어요?”','“Could you tell me a little about your taste?”','sy_a1'),
    opt('“혹시 오늘 힘든 일이 있으셨어요?”','“Did something rough happen today?”','sy_a2'),
    opt('“‘아무거나’는 메뉴에 없어요.” (미소)','“‘Anything’ isn’t on the menu.” (smile)','sy_a3')]},
  say('sy_a1','seoyun','쓴 거. 근데 너무 독하진 않은 거요. 오늘은 취하러 온 게 아니라서.','Something bitter. But not too strong. I’m not here to get drunk tonight.','sy_a1n'),
  nar('sy_a1n','힌트가 두 개. 쓰다, 그리고 독하지 않다.','Two hints: bitter, and not too strong.','rec_sy'),
  say('sy_a2','seoyun','……티 나요?','…Is it that obvious?','sy_a2b'),
  say('sy_a2b','seoyun','의뢰인이 이겼는데, 이긴 것 같지가 않아서요. (잠시) 아니, 이런 얘길 왜 하죠. 쓴 거 주세요.','My client won, but it doesn’t feel like a win. (pause) No, why am I telling you this. Something bitter, please.','rec_sy',{hearts:{seoyun:1}}),
  say('sy_a3','seoyun','(피식) 재밌네요. 그럼 제일 자신 있는 걸로.','(a small laugh) Fun. Then whatever you’re most confident about.','sy_a3n'),
  nar('sy_a3n','식은땀. 자신 있는 것, 자신 있는 것…','Cold sweat. Confident, confident…','rec_sy2'),
  {id:'rec_sy',t:'recommend',who:'seoyun',hint:{ko:'쓴맛 · 너무 독하지 않게',en:'Bitter · not too strong'},
   cands:[cand('negroni','good'),cand('americano','good'),cand('manhattan','ok'),cand('daiquiri','miss'),cand('moscowmule','miss'),cand('mojito','miss')],
   react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
  {id:'rec_sy2',t:'recommend',who:'seoyun',hint:{ko:'제일 자신 있는 걸로',en:'Whatever you are most confident about'},
   cands:[cand('negroni','good'),cand('americano','good'),cand('manhattan','ok'),cand('daiquiri','miss'),cand('moscowmule','miss'),cand('mojito','miss')],
   react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
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
  nar('ts1n','지하 리스닝바에서 소주를 찾는 사람은 처음이다. 그것도 큰 소리로.','The first person ever to ask for soju in an underground listening bar. And loudly.','ts2'),
  say('ts2','taesik','이 동네에 이런 데가 있었네. 회사 앞 포차는 오늘 휴무라서.','Didn’t know a place like this was around here. The pub by my office is closed today.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“소주는 없지만 비슷한 걸 만들어 드릴게요.”','“No soju, but I can make something close.”','ts_b1'),
    opt('“저희는 칵테일바예요. 메뉴 보시겠어요?”','“We’re a cocktail bar. Would you like the menu?”','ts_b2'),
    opt('“소맥 아세요? 위스키에 탄산을 섞으면 비슷해요.”','“Know somaek? Whiskey with soda is close.”','ts_b3')]},
  say('ts_b1','taesik','오, 비슷한 거? 소주처럼 깔끔하게 넘어가는 걸로. 안주 없어도 되는 거.','Oh, something similar? Clean going down like soju. Something that needs no snacks.','rec_ts'),
  say('ts_b2','taesik','칵테일은 여자들이 먹는 거 아냐? 에이, 그래도 한번 봐 봐.','Aren’t cocktails for women? Ah, well, let me look.','ts_b2n'),
  nar('ts_b2n','메뉴판을 90도 돌렸다가, 반대로 돌렸다가, 결국 팔을 쭉 뻗어 읽으신다.','He rotates the menu ninety degrees, then back, then holds it at arm’s length to read.','ts_b2b'),
  say('ts_b2b','taesik','하이볼은 알아. 우리 막내가 그것만 마셔.','I know highball. Our youngest drinks nothing else.','o_ts'),
  say('ts_b3','taesik','위스키로? 야, 그거 말 되네.','With whiskey? Hey, that makes sense.','ts_b3n',{hearts:{taesik:1}}),
  nar('ts_b3n','말은 안 되지만 맛은 될 수도 있다.','It makes no sense, but it might taste right.','o_ts'),
  {id:'rec_ts',t:'recommend',who:'taesik',hint:{ko:'소주처럼 깔끔하게',en:'Clean like soju'},
   cands:[cand('highball','good'),cand('americano','ok'),cand('gimlet','ok'),cand('oldfashioned','miss'),cand('espressomartini','miss'),cand('cosmopolitan','miss')],
   react:{3:'ts_r3',2:'ts_r2',1:'ts_r1'}},
  {id:'o_ts',t:'order',who:'taesik',rec:'highball',match:'good',react:{3:'ts_r3',2:'ts_r2',1:'ts_r1'}},
  say('ts_r3','taesik','캬— 이게 위스키라고? 소주보다 깔끔하네. 야, 우리 팀 회식 때 가져와도 되냐?','Ahh— that’s whiskey? Cleaner than soju. Hey, can I bring this to our team dinner?','ts_r3n',{hearts:{taesik:2},flag:'park_likes_highball'}),
  nar('ts_r3n','한 잔에 회식까지 확장 중이다.','One glass, and he’s already planning the whole company dinner.','ts_p'),
  say('ts_r2','taesik','시원하네. 소맥 같아.','Refreshing. Like somaek.','ts_p',{hearts:{taesik:1}}),
  say('ts_r1','taesik','아… 위스키 향이 좀… 아니야, 마셔 볼게. 총각이 만든 거니까.','Ah… the whiskey smell is a bit… no, I’ll try it. You made it, kid.','ts_r1n'),
  nar('ts_r1n','‘총각’은 다음에 반드시 정정하자.','I really should correct “kid” next time.','ts_p'),
  nar('ts_p','태식이 휴대폰을 한참 들여다본다. 문자 한 줄. 보낸 사람은 “아들”.','Taesik stares at his phone for a long time. One text. From “Son”.','ts_p2'),
  say('ts_p2','taesik','아들이 내일 시험이라는데 뭐라고 보내야 할지 모르겠네. “잘 봐라”는 짧고, “열심히 했냐”는 부담 주잖아.','My son has an exam tomorrow and I don’t know what to send. “Do well” is too short and “Did you study hard” is pressure.','c3'),
  {id:'c3',t:'choice',opts:[
    opt('“‘아빠가 한잔 사 줄게’는 어때요?”','“How about ‘Dad will buy you a drink’?”','ts_c1',{hearts:{taesik:1}}),
    opt('“그냥 ‘힘내’면 충분해요.”','“Just ‘hang in there’ is enough.”','ts_c2')]},
  say('ts_c1','taesik','…그거 좋네. 보내 볼까.','…That’s good. Let me send it.','ts_c1n'),
  nar('ts_c1n','웃으며 문자를 보냈다. 아들에게서 곧 답이 올 것 같다.','He sends it with a smile. A reply is probably coming soon.','ts_h'),
  say('ts_c2','taesik','힘내… 그래, 그게 제일 어렵지.','Hang in there… yes, that’s the hardest part.','ts_c2n'),
  nar('ts_c2n','한참 고민하다가 이모티콘만 보냈다.','After long thought, he sends only an emoticon.','ts_h'),
  say('ts_h','taesik','내일은… 면담이라 나도 시험이야. 부장 달고 22년인데, 사람 일이 말이야.','Tomorrow I have a meeting, so I’m sitting an exam too. Twenty-two years as head of department, and still, you never know.','ts_hn',{flag:'park_interview_tomorrow'}),
  nar('ts_hn','22년을 한 곳에서 보낸 아저씨의 소주 대신 하이볼. 오늘 밤 이 한 잔이 위로였기를.','A highball in place of soju for a man who spent twenty-two years in one place. I hope tonight’s glass was a comfort.','l_ts'),
  {id:'l_ts',t:'leave',who:'taesik',next:'cl1'},

  /* closing */
  nar('cl1','마감 후, 피아노 위에서 악보 한 장을 발견했다. 아래에 손글씨. “누군가를 위한 곡.”','After closing I found a sheet of music on the piano. Handwritten below: “A song for someone.”','cl2',{flag:'seoyun_saw_sheet'}),
  nar('cl2','서윤이 가방을 두고 가기 전, 한참 이걸 바라보던 게 떠올랐다.','I remembered Seoyun staring at it for a long while before she left her bag.','cl3'),
  {id:'cl3',t:'close',title:{ko:'첫째 밤',en:'The First Night'},
   note:{ko:'마스터의 노트 1페이지 — “손님의 첫 마디는 거짓말이 많다. ‘아무거나’는 ‘이해받고 싶다’이고, ‘소주 있어요?’는 ‘여기 편해요?’다.”',
         en:'Master’s notebook, page 1 — “A guest’s first words are often a lie. ‘Anything’ means ‘understand me’. ‘Do you have soju?’ means ‘is it comfortable here?’”'}}
];
export const GRAPH={};
NODES.forEach(n=>{GRAPH[n.id]=n;});
export const NIGHT1={n:1,entry:'o1',graph:GRAPH,title:{ko:'첫째 밤',en:'The First Night'},
  desc:{ko:'서윤과 태식, 두 명의 첫 손님.',en:'Seoyun and Taesik: your first two guests.'}};
export const NIGHTS=[NIGHT1];
