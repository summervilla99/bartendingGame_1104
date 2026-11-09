/* Night 3 of the tale: Do Yoonjae, the rich heir who only asks for "the most expensive", and Kkangi's comic clash with him.
   Choices: exactly one right answer; the others make the guest leave (game over, retry from the last entrance). */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'더 그럴듯한 말을 골라 보세요.',en:'Try a more fitting thing to say.'}});

const NODES=[
  nar('o1','셋째 밤. 마스터의 노트 3페이지. “비싼 술을 찾는 사람은 대개 값 말고는 말할 게 없는 사람이다.”','Night three. Page three of the Master’s notebook. “Someone who asks for the priciest drink usually has nothing else to say.”','yj_pre'),
  nar('yj_pre','문 앞에 검은 세단이 멈췄다. 기사가 문을 열어 주고서야 한 남자가 내린다. 문 하나 여는 것도 남이 해 주는 사람이다.','A black sedan stops at the door. A driver opens it before a man steps out. A man who has even his doors opened for him.','e_yj'),

  /* Yoonjae */
  {id:'e_yj',t:'enter',who:'yoonjae',seat:'g2',next:'yj1'},
  say('yj1','yoonjae','여기 제일 비싼 거 줘요. 가격은 상관없어요.','Give me your most expensive drink. Price is no object.','yj1n'),
  nar('yj1n','손목의 시계가 조명보다 먼저 빛난다. 그는 카운터 위에 작은 상자를 내려놓았다. 시계 케이스다.','His watch catches the light before the lamps do. He sets a small box on the counter: a watch case.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“제일 비싼 건 저희 가게 월세인데, 그것도 한 잔 드릴까요?”','“The priciest thing here is our rent. Want a glass of that too?”','yj_x2'),
    opt('“비싼 술은 많지만 오늘 밤 손님께 어울리는 한 잔을 드리고 싶어요. 오늘 어떤 하루였어요?”','“We have pricey bottles, but I’d rather serve what suits you tonight. What kind of day was it?”','yj_a1',{right:true}),
    opt('“저희는 모든 메뉴가 합리적인 가격이에요.”','“Everything on our menu is reasonably priced.”','yj_x1')]},
  say('yj_x1','yoonjae','……그래서 제일 비싼 게 뭐냐고요. 아, 됐어요. 이 집도 별로네.','…So what is the most expensive one. Never mind. This place is nothing special either.','yj_x1n'),
  nar('yj_x1n','그는 시계 케이스를 챙겨 문으로 향했다. 밖에서 기사가 급히 달려와 문을 열었다.','He took his watch case and headed for the door. The driver outside rushed to open it.','l_x_yj1'),
  {id:'l_x_yj1',t:'leave',who:'yoonjae',next:'ov_yj'},
  say('yj_x2','yoonjae','월세요? ……내 앞에서 돈 얘기를 이렇게 대놓고 하는 사람은 처음이에요.','Rent? …No one has ever talked money to me this bluntly.','yj_x2n'),
  nar('yj_x2n','그는 충격받은 얼굴로 일어났다. 기사가 문을 열어 주기도 전에.','He stood up looking shocked. Before the driver could even open the door.','l_x_yj2'),
  {id:'l_x_yj2',t:'leave',who:'yoonjae',next:'ov_yj'},
  over('ov_yj','e_yj'),
  say('yj_a1','yoonjae','……하루요? 별거 없었어요. 회의 세 개, 식사 두 번. 그리고 아무한테도 전화가 안 왔어요.','…My day? Nothing much. Three meetings, two meals. And no one called me.','yj_a2',{hearts:{yoonjae:1}}),
  nar('yj_a2','그의 휴대폰은 카운터 위에서 한 번도 울리지 않았다.','His phone never rang once on the counter.','yj_b'),
  say('yj_b','yoonjae','그냥 제일 좋은 걸로요. 남들이 보면 “아, 저 사람 대단하구나” 싶은 걸로.','Just the best. Something that makes people think, “wow, that person is really something.”','yj_bn'),
  nar('yj_bn','그는 사람이 거의 없는 바에서 ‘남들’이라는 말을 했다. 마스터의 노트가 떠오른다.','He said “people” in a bar with hardly anyone in it. The Master’s note comes to mind.','rec_yj'),
  {id:'rec_yj',t:'recommend',who:'yoonjae',hint:{ko:'남들이 보기에 근사한 걸로',en:'Something that looks impressive'},fail:'yj_m',
   cands:[
    cand('highball','miss','하이볼? 이건 우리 비서가 마시는 거예요.','A highball? That’s what my assistant drinks.'),
    cand('manhattan','good','……이게 제일 좋은 건가요? 이상하게, 비싼 맛은 안 나는데 편하네요.','…Is this the best one? Oddly, it doesn’t taste expensive, but it feels comfortable.'),
    cand('espressomartini','ok','오, 거품이 예쁘네요. 사진 찍어도 돼요?','Oh, the foam is pretty. Mind if I take a photo?'),
    cand('mojito','miss','풀이 한가득… 우리 집 정원사가 보면 슬퍼하겠네요.','All that greenery… my gardener would be sad.'),
    cand('oldfashioned','good','단순한데… 오래된 의자 같은 맛이에요.','Simple… it tastes like an old armchair.'),
    cand('moscowmule','miss','구리 컵이요? 이거 주방 도구 아닌가요?','A copper cup? Isn’t that kitchenware?'),
    cand('cosmopolitan','ok','분홍색… 사진은 잘 나오겠네요. 맛은 잘 모르겠어요.','Pink… it will photograph well. The taste, I can’t tell.'),
    cand('americano','miss','이름이 아메리카노인데 커피가 없네요? 속은 기분이에요.','It’s called Americano but there’s no coffee? I feel cheated.')],
   react:{3:'yj_r3',2:'yj_r2',1:'yj_r1'}},
  say('yj_m','yoonjae','……이건 아닌 것 같아요. 기사님 불러 주세요.','…This isn’t it. Call my driver.','yj_mn'),
  nar('yj_mn','기사가 문을 여는 소리가 이번엔 유난히 빨랐다.','The sound of the driver opening the door was unusually quick this time.','l_x_yj3'),
  {id:'l_x_yj3',t:'leave',who:'yoonjae',next:'ov_yj'},
  say('yj_r3','yoonjae','……이상하네요. 하나도 안 비싼데, 마음이 놓여요.','…Strange. It’s not expensive at all, yet I feel at ease.','e_yj2',{hearts:{yoonjae:2},flag:'yoonjae_opens'}),
  say('yj_r2','yoonjae','괜찮네요. 다음에도 이런 걸로 주세요.','Not bad. I’d like this again next time.','e_yj2',{hearts:{yoonjae:1}}),
  say('yj_r1','yoonjae','맛은… 잘 모르겠어요. 일단 마실게요.','The taste… I can’t tell. I’ll drink it anyway.','e_yj2'),
  {id:'e_yj2',t:'enter',who:'yoonjae',seat:'g2',next:'yj_c'},
  say('yj_c','yoonjae','혹시 이 가게 파실 생각 없어요? 제가 인수하고 싶은데. 값은 부르는 대로 드릴게요.','By any chance, would you sell this place? I’d like to buy it. Name your price.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“이 가게는 마스터에게 받은 거라 팔 수 없어요. 대신 단골로 오세요.”','“I got this place from the Master, so it’s not for sale. But do come as a regular.”','yj_d',{right:true}),
    opt('“그럼 계약서에 제 직함을 ‘우주 대왕’으로 써 주세요.”','“Then write my title on the contract as ‘Emperor of the Universe’.”','yj_y2'),
    opt('“얼마까지 생각하세요?”','“How much are you thinking?”','yj_y1')]},
  say('yj_y1','yoonjae','……역시 모든 게 가격이 있군요.','…So everything has a price after all.','yj_y1n'),
  nar('yj_y1n','그는 조용히 시계 케이스를 닫았다. 조금 전보다 훨씬 작아 보였다.','He quietly closed the watch case. He looked much smaller than a moment ago.','l_x_yj4'),
  {id:'l_x_yj4',t:'leave',who:'yoonjae',next:'ov_yj2'},
  say('yj_y2','yoonjae','…진지하게 말하는 중이었는데요.','…I was being serious.','yj_y2n'),
  nar('yj_y2n','그는 시계를 한 번 쳐다보고, 나를 한 번 쳐다보고, 일어났다.','He looked at his watch, then at me, then stood up.','l_x_yj5'),
  {id:'l_x_yj5',t:'leave',who:'yoonjae',next:'ov_yj2'},
  over('ov_yj2','e_yj2'),
  say('yj_d','yoonjae','……단골이요? 나한테 그렇게 말해 준 사람은 오랜만이네요.','…A regular? It’s been a while since anyone said that to me.','yj_dn',{hearts:{yoonjae:1},flag:'yoonjae_offer'}),
  nar('yj_dn','문밖에서 기사가 서성이는 게 보인다. 그 손님은 오늘 처음으로 웃었다.','Through the door I can see the driver pacing. The guest smiled for the first time tonight.','e_kk'),

  /* Kkangi barges in */
  {id:'e_kk',t:'enter',who:'kkangi',seat:'g1',also:[{who:'yoonjae',seat:'g2'}],next:'kk0'},
  nar('kk0','쾅. 또 그 소리다.','Bang. That sound again.','if_kk'),
  {id:'if_kk',t:'if',when:'kkangi_secret',then:'kk_a',else:'kk_b'},
  say('kk_a','kkangi','야! 나 왔다! 그 모히또인지 뭔지, 그거 줘 봐! ……아, 달아서 먹는 거 아니고 시원해서 먹는 거야.','Yo! I’m here! Give me that mojito thing! …Not because it’s sweet. Because it’s refreshing.','kk_c1'),
  say('kk_b','kkangi','야! 나 왔다! 오늘도 제일 센 거 줘 봐!','Yo! I’m here! Your strongest again tonight!','kk_c1'),
  nar('kk_c1','그의 시선이 윤재의 시계 케이스에 꽂힌다.','His eyes lock onto Yoonjae’s watch case.','kk_c2'),
  say('kk_c2','kkangi','뭐야, 저 양복쟁이는. 저거 가짜 시계냐?','Who’s the suit? Is that watch a fake?','kk_c3'),
  say('kk_c3','yoonjae','……저 헬멧 주인이세요? 바닥에는 놓지 말아 주세요. 제 구두가 비싸서요.','…Is that your helmet? Please don’t put it on the floor. My shoes are expensive.','c3'),
  {id:'c3',t:'choice',opts:[
    opt('“두 분이 같이 앉으시면 불편하실 테니 자리를 옮겨 드릴까요?”','“You two seem uncomfortable sitting together, shall I move one of you?”','kk_z1'),
    opt('“오늘 첫 잔은 제가 사겠습니다. 대신 두 분 다 조용히 드시기로 해요.”','“The first round is on me tonight. In return, you both drink quietly.”','kj_a',{right:true}),
    opt('“싸우실 거면 링은 저쪽 피아노 옆에 있어요. 제가 심판 볼게요.”','“If you’re fighting, the ring is by the piano. I’ll referee.”','kk_z2')]},
  say('kk_z1','kkangi','내가 왜 옮겨! 저 인간이 옮겨야지!','Why should I move! He’s the one who should move!','kk_z1n'),
  nar('kk_z1n','깡이가 헬멧을 낚아채고 나갔다. 윤재는 구두를 내려다보며 한숨을 쉬었다.','Kkangi snatched his helmet and stormed out. Yoonjae sighed, looking down at his shoes.','l_x_kk1'),
  {id:'l_x_kk1',t:'leave',who:'kkangi',next:'ov_kk'},
  say('kk_z2','yoonjae','……폭력은 질색이에요. 저는 이만 가 보겠습니다.','…I hate violence. I’ll be going now.','kk_z2n'),
  nar('kk_z2n','윤재가 시계 케이스를 챙겨 나갔다. 깡이는 링이 어디냐고 두리번거렸다.','Yoonjae took his watch case and left. Kkangi looked around asking where the ring was.','l_x_yj6'),
  {id:'l_x_yj6',t:'leave',who:'yoonjae',next:'ov_kk'},
  over('ov_kk','e_kk'),
  say('kj_a','kkangi','……쳇. 사장이 쏜다니까 참는다.','…Tch. The boss is paying, so I’ll let it slide.','kj_b',{hearts:{kkangi:1}}),
  say('kj_b','yoonjae','(작게) 저도… 감사합니다.','(quietly) Me too… thank you.','kj_c',{hearts:{yoonjae:1}}),
  say('kj_c','yoonjae','그런데 그 헬멧, 어느 모델이에요? 제 비서가 오토바이를 좋아해서요.','By the way, what model is that helmet? My assistant loves motorcycles.','kj_d'),
  say('kj_d','kkangi','(눈이 빛난다) 이거? 카본이야! 이 무게 좀 봐!','(eyes lighting up) This? Carbon! Check out how light it is!','kj_e',{flag:'rivals_chat'}),
  nar('kj_e','두 사람은 20분 동안 헬멧 이야기를 했다. 아무도 술을 더 시키지 않았다.','The two talked about helmets for twenty minutes. Nobody ordered another drink.','kj_f'),
  say('kj_f','yoonjae','다음에는 기사 없이 올게요. 헬멧은 안 쓰지만요.','Next time I’ll come without my driver. Though I won’t wear a helmet.','l_yj'),
  {id:'l_yj',t:'leave',who:'yoonjae',next:'kj_g'},
  say('kj_g','kkangi','저 양복쟁이, 의외로 말이 통하네.','That suit, surprisingly easy to talk to.','l_kk'),
  {id:'l_kk',t:'leave',who:'kkangi',next:'cl1'},

  nar('cl1','마감. 카운터 구석에 빈 시계 케이스가 하나 남아 있다. 쪽지가 붙어 있다. “다음에 직접 찾으러 올게요. — 윤재”','Closing time. An empty watch case is left in the corner of the counter, with a note: “I’ll come and pick it up myself next time. — Yoonjae”','cl2'),
  {id:'cl2',t:'close',title:{ko:'셋째 밤',en:'The Third Night'},
   note:{ko:'마스터의 노트 3페이지 — “비싼 것을 찾는 사람이 정말 찾는 건, 값을 매길 수 없는 편안함이다.”',en:'Master’s notebook, page 3 — “What people who ask for the priciest thing truly seek is a comfort that has no price.”'}}
];

const FACE={yj1:'smile',yj_x1:'angry',yj_x2:'surprised',yj_a1:'sad',yj_b:'neutral',yj_m:'angry',yj_r3:'smile',yj_r2:'smile',yj_r1:'sad',yj_c:'smile',yj_y1:'sad',yj_y2:'surprised',yj_d:'smile',
  kk_a:'smile',kk_b:'angry',kk_c2:'angry',kk_z1:'angry',kj_a:'angry',kj_d:'smile',kj_g:'smile',kj_b:'smile',kj_c:'smile',kj_f:'smile',kk_z2:'sad'};
export const GRAPH3={};
NODES.forEach(n=>{GRAPH3[n.id]=n;if(FACE[n.id])n.face=FACE[n.id];});
export const NIGHT3={n:3,entry:'o1',graph:GRAPH3,title:{ko:'셋째 밤',en:'The Third Night'},
  desc:{ko:'비싼 것만 찾는 손님과, 헬멧 하나로 친해지는 두 사람.',en:'A guest who only asks for the priciest, and two men who bond over a helmet.'}};
