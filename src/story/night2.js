/* Night 2 of the tale: Seoyun comes back, Kkangi storms in, and Yunha's piano calms the room. Script notes: docs/story/01-night1.md.
   Every text is {ko,en}. Choices: exactly one right answer; the others make the guest leave (game over, retry from the last entrance). */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'더 그럴듯한 말을 골라 보세요.',en:'Try a more fitting thing to say.'}});

const NODES=[
  nar('o1','둘째 밤. 마스터의 노트 2페이지를 펼친다. “진상은 손님이 아니라 하루의 비명이다. 단, 비명이라고 다 받아 줄 필요는 없다.”','Night two. I open page two of the Master’s notebook. “A rude guest is just a day screaming. But you don’t have to take every scream.”','e_sy'),

  /* Seoyun comes back for her bag */
  {id:'e_sy',t:'enter',who:'seoyun',seat:'g2',next:'sy1'},
  say('sy1','seoyun','가방 찾으러 왔어요. ……그리고 어제 그거, 한 잔 더 부탁해도 될까요?','I came for my bag. …And could I have another of yesterday’s?','sy2'),
  nar('sy2','어제와 같은 자리, 같은 노트. 달라진 건 그녀가 먼저 주문했다는 것뿐이다.','Same seat, same notebook. The only difference: she ordered first.','if_sy'),
  {id:'if_sy',t:'if',when:'seoyun_saw_sheet',then:'sy_sheet',else:'o_sy'},
  say('sy_sheet','seoyun','저기, 피아노 위에 있던 악보요. 어제 두고 가신 분 거예요?','Um, the sheet music on the piano. Did someone leave it yesterday?','sy_sheet2'),
  say('sy_sheet2','me','주인이 있는 악보예요. 곧 올지도 몰라요.','It has an owner. They might show up soon.','o_sy'),
  {id:'o_sy',t:'order',who:'seoyun',rec:'negroni',match:'good',react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
  say('sy_r3','seoyun','……어제랑 같은 맛이에요. 이상하게, 안심되네요.','…The same as yesterday. Strangely, it’s reassuring.','e_kk',{hearts:{seoyun:1}}),
  say('sy_r2','seoyun','어제보다 조금 달라졌네요. 나쁘진 않아요.','A little different from yesterday. Not bad.','e_kk'),
  say('sy_r1','seoyun','……오늘은 물이 나을 것 같네요.','…Water might be better tonight.','e_kk'),

  /* Kkangi storms in */
  {id:'e_kk',t:'enter',who:'kkangi',seat:'g1',next:'kk0'},
  nar('kk0','쾅. 문이 열리는 게 아니라 걷어차이는 소리가 났다.','Bang. The door didn’t open, it got kicked.','kk1'),
  say('kk1','kkangi','사장! 여기 제일 센 거 줘 봐!','Boss! Give me your strongest!','kk1n'),
  nar('kk1n','헬멧을 카운터에 쿵 내려놓는다. 서윤의 볼펜이 문장 중간에 멈췄다.','He thuds his helmet onto the counter. Seoyun’s pen stops mid-sentence.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“어이쿠 팔뚝이 대단하시네요! 저랑 팔씨름 한 판 하실래요?”','“Whoa, look at those arms! Fancy an arm-wrestle with me?”','kk_x2'),
    opt('“저희는 조용히 드시는 곳이라 소리를 좀 낮춰 주세요.”','“This is a quiet place, so please keep it down.”','kk_x1'),
    opt('“센 게 필요한 날이군요. 오늘 어떤 하루였어요?”','“Sounds like you need something strong. What kind of day was it?”','kk_a1',{right:true})]},
  say('kk_x1','kkangi','뭐? 손님한테 조용히 하라고? 야, 나 간다. 다시는 안 와.','What? Telling a customer to be quiet? I’m out. Never coming back.','kk_x1n'),
  nar('kk_x1n','헬멧을 들고 나가는 뒷모습이 의외로 서운해 보였다.','His back as he walked out with the helmet looked oddly hurt.','l_x_kk1'),
  {id:'l_x_kk1',t:'leave',who:'kkangi',next:'ov_kk'},
  say('kk_x2','kkangi','…팔씨름? 너 지금 나 시험하냐? 아 진짜 이 집 이상하다!','…Arm-wrestling? Are you testing me? This place is so weird!','kk_x2n'),
  nar('kk_x2n','깡이는 팔씨름에서 진 사람처럼 도망쳤다. 시작도 안 했는데.','Kkangi fled like a man who had lost an arm-wrestle. We hadn’t even started.','l_x_kk2'),
  {id:'l_x_kk2',t:'leave',who:'kkangi',next:'ov_kk'},
  over('ov_kk','e_kk'),
  say('kk_a1','kkangi','……뭐, 하루? 그냥. 오늘 짜증 나는 일이 있었다. 말 걸면 팰 줄 알았냐.','…A day? Whatever. Something annoying happened. You thought I’d punch you if you talked to me?','kk_a1n',{hearts:{kkangi:1}}),
  nar('kk_a1n','그는 헬멧만 쳐다보며 말했다. 의외로, 말을 받아 주는 사람이 필요했던 것이다.','He said it staring at his helmet. Surprisingly, he just needed someone to listen.','kk_b'),
  say('kk_b','kkangi','그냥 독한 거. 근데 절대 달면 안 돼. 남자가 어떻게 단 걸 먹냐.','Just something strong. But never sweet. What kind of man drinks sweet stuff?','kk_bn'),
  nar('kk_bn','마스터의 노트가 떠오른다. “손님의 첫 마디는 거짓말이 많다.”','The Master’s note comes to mind: “A guest’s first words are often a lie.”','rec_kk'),
  {id:'rec_kk',t:'recommend',who:'kkangi',hint:{ko:'독하게 · 절대 달지 않게',en:'Strong · never sweet'},fail:'kk_m',
   cands:[
    cand('negroni','miss','으, 쓰다! 약 먹는 거야?','Ugh, bitter! Is this medicine?'),
    cand('mojito','good','……뭐야 이거. 달… 아니 시원하네. 이름이 뭐라고?','…What is this. Sweet… no, refreshing. What’s it called?'),
    cand('neat','ok','독하긴 한데… 재미는 없네.','Strong, sure… but boring.'),
    cand('espressomartini','miss','커피? 나 지금 심장 뛰는 거 안 보여?','Coffee? Can’t you see my heart’s racing already?'),
    cand('daiquiri','good','씁, 새콤한 게… 아니 이거 맛있네? 아니, 괜찮네.','Hmph, tangy… no wait, this is good? I mean, it’s okay.'),
    cand('moscowmule','ok','생강이 맵네. 센 느낌은 있어서 나쁘진 않아.','Spicy ginger. Feels strong, so not bad.'),
    cand('manhattan','miss','이거 아저씨 술이잖아. 난 아직 서른넷이야.','That’s an old man’s drink. I’m only thirty-four.'),
    cand('velvetrose','miss','장미?! 야, 나 지금 놀리는 거냐?','Rose?! Are you making fun of me?')],
   react:{3:'kk_r3',2:'kk_r2',1:'kk_r1'}},
  say('kk_m','kkangi','……이딴 걸 마시라고? 계산해.','…And I’m supposed to drink this? Check, please.','kk_mn'),
  nar('kk_mn','깡이는 잔을 반쯤 남긴 채 문으로 향했다. 발소리가 유난히 컸다.','Kkangi walked to the door leaving the glass half full. His footsteps were unusually loud.','l_x_kk3'),
  {id:'l_x_kk3',t:'leave',who:'kkangi',next:'ov_kk'},
  say('kk_r3','kkangi','야, 이거 이름이 뭐라고 했지? ……적어 둬. 아, 적진 말고. 기억할게.','Hey, what was this called again? …Write it down. No, don’t. I’ll remember it.','kk_c',{hearts:{kkangi:2},flag:'kkangi_secret'}),
  say('kk_r2','kkangi','나쁘진 않네. 한 잔 더.','Not bad. One more.','kk_c',{hearts:{kkangi:1}}),
  say('kk_r1','kkangi','……뭐 이래. 아, 됐어. 먹을게.','…What is this. Ah, never mind. I’ll drink it.','kk_c'),
  say('kk_c','kkangi','야! 근데 여기 음악 뭐 이래? 너무 졸리잖아! 좀 신나는 거 없어?','Hey! What’s with the music here? It’s putting me to sleep! Got anything lively?','kk_cn'),
  nar('kk_cn','바 안의 시선이 일제히 이쪽으로 모인다. 서윤의 볼펜이 다시 멈췄다. 분위기가 위태롭다.','Every eye in the bar turns our way. Seoyun’s pen stops again. The mood is wobbling.','kk_d'),

  /* Yunha plays */
  nar('kk_d','그때, 구석의 피아노 쪽에서 의자가 조용히 끌리는 소리가 났다.','Then, from the corner piano, a chair scraped quietly.','e_yh'),
  {id:'e_yh',t:'enter',who:'yunha',seat:'piano',music:'classical',next:'yh0'},
  nar('yh0','누군가 말없이 건반을 눌렀다. 낮고 조용한 첫 음.','Someone pressed a key without a word. A low, quiet first note.','kk_e'),
  say('kk_e','kkangi','……어? 뭐야, 이거.','…Huh? What’s this.','kk_f'),
  nar('kk_f','깡이의 입이 닫혔다. 바 전체가 숨을 고르는 것 같았다.','Kkangi’s mouth closed. The whole bar seemed to catch its breath.','kk_g'),
  say('kk_g','kkangi','…좋네. 아니, 시끄럽지 않아서 좋다고.','…Nice. I mean, I like that it’s not loud.','kk_h',{hearts:{kkangi:1}}),
  say('kk_h','kkangi','계산해. 아까 그 술 이름 잊어버리지 마라. 또 올 거니까.','Check. Don’t forget what that drink was. I’m coming back.','l_kk'),
  {id:'l_kk',t:'leave',who:'kkangi',next:'e_yh2'},
  {id:'e_yh2',t:'enter',who:'yunha',seat:'piano',next:'yh1'},
  say('yh1','yunha','죄송해요, 너무 시끄러워서 참다가 쳐 버렸어요.','Sorry, it got so loud I couldn’t hold back and just started playing.','yh2'),
  say('yh2','yunha','(작은 목소리로) 구석에서 노트 쓰시는 분, 어제도 계셨죠? 제 악보를 한참 보시던데.','(quietly) The one writing in a notebook in the corner, she was here yesterday, right? She stared at my sheet music for ages.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“연락처 알려 드릴까요? 제가 사장이라 다 알아요.”','“Want her number? I’m the owner, I know everything.”','yh_x2'),
    opt('“단골이세요. 궁금하시면 직접 물어보는 게 좋겠죠?”','“She’s a regular. If you’re curious, better to ask her yourself, right?”','yh_a',{right:true}),
    opt('“글쎄요, 제가 손님 얘기를 해도 될지 모르겠네요.”','“Hmm, I’m not sure I should talk about a guest.”','yh_x1')]},
  say('yh_x1','yunha','아… 맞다. 제가 실례했네요. 죄송해요.','Ah… right. That was rude of me. Sorry.','yh_x1n'),
  nar('yh_x1n','그녀는 건반 뚜껑을 조용히 닫고 일어섰다.','She quietly closed the fallboard and stood up.','l_x_yh1'),
  {id:'l_x_yh1',t:'leave',who:'yunha',next:'ov_yh'},
  say('yh_x2','yunha','…연락처요? 아니, 그런 건 좀… 오늘은 이만 갈게요.','…A number? No, that’s a bit… I’ll call it a night.','yh_x2n'),
  nar('yh_x2n','피아노 소리가 뚝 끊겼다. 서윤이 고개를 든다.','The piano stopped dead. Seoyun looks up.','l_x_yh2'),
  {id:'l_x_yh2',t:'leave',who:'yunha',next:'ov_yh'},
  over('ov_yh','e_yh2'),
  say('yh_a','yunha','(미소) 그렇죠. 직접 물어보는 게 맞겠네요. 고마워요.','(smiling) True. Asking her myself makes sense. Thank you.','yh_b',{hearts:{yunha:1,bond:1},flag:'bond_started'}),
  nar('yh_b','서윤의 볼펜이 천천히 움직이기 시작했다. 아니, 움직이는 척하고 있다.','Seoyun’s pen slowly starts moving again. Or rather, pretends to.','yh_c'),
  say('yh_c','yunha','오늘 곡은 아직 제목이 없어요. 들으시는 분이 지어 주셨으면 좋겠는데.','Tonight’s piece has no title yet. I wish whoever listens would name it.','yh_d'),
  nar('yh_d','서윤이 이날 처음으로 피아노 쪽을 돌아봤다.','For the first time tonight, Seoyun turned toward the piano.','sy_e',{flag:'seoyun_heard_yunha'}),
  say('sy_e','seoyun','……오늘 연주, 누구 곡이에요?','…Whose piece was that tonight?','sy_e2'),
  say('sy_e2','me','아직 제목이 없대요. 연주한 분이 저기 계세요.','It has no title yet. The player is right over there.','sy_e3'),
  say('sy_e3','seoyun','…그래요.','…I see.','sy_e4',{hearts:{seoyun:1}}),
  nar('sy_e4','짧은 대답이었지만, 노트에 한 줄이 더 늘었다.','A short answer, but one more line appeared in her notebook.','l_sy'),
  {id:'l_sy',t:'leave',who:'seoyun',next:'yh_z'},
  say('yh_z','yunha','내일도 칠 거예요. 구석에 누가 오든 말든요.','I’ll play tomorrow too. Whoever comes to that corner.','l_yh'),
  {id:'l_yh',t:'leave',who:'yunha',next:'cl1'},

  nar('cl1','마감. 피아노 위에는 새 악보 한 장이 올라와 있다. 제목 칸은 비어 있다.','Closing time. A new sheet of music sits on the piano. The title line is blank.','cl2',{flag:'sheet_untitled'}),
  {id:'cl2',t:'close',title:{ko:'둘째 밤',en:'The Second Night'},
   note:{ko:'마스터의 노트 2페이지 — “같은 음악도 듣는 사람이 다르면 다른 곡이 된다.”',en:'Master’s notebook, page 2 — “The same music becomes a different song for each listener.”'}}
];

const FACE={kk1:'angry',kk_x1:'angry',kk_x2:'surprised',kk_a1:'sad',kk_b:'angry',kk_m:'angry',kk_r3:'smile',kk_r2:'smile',kk_r1:'sad',kk_c:'surprised',kk_e:'surprised',kk_g:'smile',kk_h:'smile',
  sy1:'neutral',sy_r3:'smile',sy_r1:'sad',sy_e3:'smile',
  yh1:'sad',yh2:'neutral',yh_x1:'sad',yh_x2:'surprised',yh_a:'smile',yh_c:'smile',yh_z:'smile'};
export const GRAPH2={};
NODES.forEach(n=>{GRAPH2[n.id]=n;if(FACE[n.id])n.face=FACE[n.id];});
export const NIGHT2={n:2,entry:'o1',graph:GRAPH2,title:{ko:'둘째 밤',en:'The Second Night'},
  desc:{ko:'진상 손님과 피아노, 그리고 노트를 쓰는 사람.',en:'A rowdy guest, a piano, and the one writing in a notebook.'}};
