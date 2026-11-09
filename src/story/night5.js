/* Night 5 of the tale (the serious night): Mr. Park after his meeting, Seoyun with a job offer.
   Choices: exactly one right answer; the others make the guest leave (game over, retry from the last entrance). */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'더 그럴듯한 말을 골라 보세요.',en:'Try a more fitting thing to say.'}});

const NODES=[
  nar('o1','다섯째 밤. 마스터의 노트 5페이지. “무거운 말은 잔이 비워질 때까지 기다려 준다. 서둘러 묻지 마라.”','Night five. Page five of the Master’s notebook. “A heavy word waits until the glass is empty. Don’t rush to ask.”','e_ts'),

  /* Mr. Park */
  {id:'e_ts',t:'enter',who:'taesik',seat:'g1',next:'ts0'},
  nar('ts0','오늘 밤 태식은 문을 아주 조용히 열었다. 손에는 이번에도 소주병이 들려 있다. 뚜껑은 열리지 않은 채로.','Tonight Taesik opened the door very quietly. He holds a soju bottle again, still sealed.','ts1'),
  say('ts1','taesik','……면담, 끝났어요.','…The meeting’s over.','ts2'),
  say('ts2','taesik','희망퇴직이래요. 내일까지 답을 달래요. 22년이 서류 세 장으로 정리되네요.','Voluntary retirement, they said. They want an answer by tomorrow. Twenty-two years, settled in three sheets of paper.','ts3'),
  nar('ts3','소주병은 카운터 위에서 열리지 않았다. 마시면 울 것 같아서라고, 그는 말하지 않았다.','The soju bottle stayed sealed on the counter. Because he’d cry if he drank it, he did not say.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“퇴직금으로 치킨집 차리세요! 제가 첫 손님 할게요!”','“Open a fried chicken shop with the severance! I’ll be your first customer!”','ts_x2'),
    opt('“요즘 다들 힘들죠. 힘내세요.”','“Everyone’s having a hard time these days. Cheer up.”','ts_x1'),
    opt('“오늘은 결론 내지 마세요. 일단 한 잔 드시고, 결정은 내일의 부장님이 하시면 돼요.”','“Don’t decide anything tonight. Have a drink first; tomorrow’s you can make the decision.”','ts_a1',{right:true})]},
  say('ts_x1','taesik','……그렇죠. 다 힘들죠. 괜히 말했네요.','…Right. Everyone does. I shouldn’t have said anything.','ts_x1n'),
  nar('ts_x1n','그는 소주병을 비닐봉지에 다시 넣었다.','He put the soju bottle back into its plastic bag.','l_x_ts1'),
  {id:'l_x_ts1',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_x2','taesik','치킨집… 내 인생이 농담으로 들려요? 미안하지만 오늘은 못 웃겠네요.','A chicken shop… does my life sound like a joke? Sorry, I can’t laugh tonight.','ts_x2n'),
  nar('ts_x2n','문이 닫히는 소리는 크지 않았다. 그래서 더 오래 남았다.','The door closed softly. That made it linger longer.','l_x_ts2'),
  {id:'l_x_ts2',t:'leave',who:'taesik',next:'ov_ts'},
  over('ov_ts','e_ts'),
  say('ts_a1','taesik','……내일의 나. 그런 건 생각 못 했네요. 오늘 밤만 사는 사람처럼 앉아 있었는데.','…Tomorrow’s me. I hadn’t thought of that. I was sitting here like someone who only had tonight.','ts_a2',{hearts:{taesik:1}}),
  say('ts_a2','taesik','소주 말고요. 오늘은 좀 따뜻한 걸로 줘요. 천천히 마실 수 있는 걸로.','Not soju. Something warm tonight. Something I can sip slowly.','rec_ts'),
  {id:'rec_ts',t:'recommend',who:'taesik',hint:{ko:'따뜻하고 천천히 마실 수 있는',en:'Warm, something to sip slowly'},fail:'ts_m',
   cands:[
    cand('highball','miss','시원한 건 오늘은 싫네요. 마음이 더 식어요.','Nothing cold tonight. It would only chill me further.'),
    cand('oldfashioned','good','……오래 저어서 만든 거죠? 이거, 천천히 마시게 되네요.','…Stirred for a long time, right? This one makes me slow down.'),
    cand('moscowmule','miss','얼음이랑 생강이… 너무 차가워요.','Ice and ginger… too cold.'),
    cand('neat','good','아무것도 안 섞었는데 이상하게 따뜻하네요.','Nothing mixed in, and yet it’s oddly warm.'),
    cand('manhattan','ok','묵직하네요. 오늘은 좀 무거워도 괜찮겠어요.','Heavy. Tonight, heavy is fine.'),
    cand('mojito','miss','풀 냄새는… 오늘은 좀 그래요.','The smell of grass… not tonight.'),
    cand('boulevardier','ok','쌉쌀하네요. 지금 기분이랑 닮았어요.','Bitter. It resembles how I feel.'),
    cand('cosmopolitan','miss','분홍색 말고요. 오늘은 그냥 어른 맛으로.','Not pink. Tonight just something grown-up.')],
   react:{3:'ts_r3',2:'ts_r2',1:'ts_r1'}},
  say('ts_m','taesik','…미안해요. 오늘은 아무것도 못 넘기겠어요.','…Sorry. I can’t swallow anything tonight.','ts_mn'),
  nar('ts_mn','그는 소주병을 두고 나갔다. 두고 간 건 병이 아니었는지도 모른다.','He left the soju bottle behind. Maybe it wasn’t only the bottle he left.','l_x_ts3'),
  {id:'l_x_ts3',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_r3','taesik','……이상하네요. 이걸 마시니까, 아들 얼굴이 떠올라요.','…Strange. Drinking this, I picture my son’s face.','e_ts2',{hearts:{taesik:2},flag:'park_opens'}),
  say('ts_r2','taesik','나쁘지 않네요. 좀 숨이 쉬어지는 것 같아요.','Not bad. I feel like I can breathe a little.','e_ts2',{hearts:{taesik:1}}),
  say('ts_r1','taesik','……고맙습니다. 마시고 있으면 마실 수 있을 것 같아요.','…Thank you. If I keep sipping, maybe I can.','e_ts2'),
  {id:'e_ts2',t:'enter',who:'taesik',seat:'g1',next:'if_ts'},
  {id:'if_ts',t:'if',when:'park_trusts_you',then:'ts_t',else:'ts_u'},
  say('ts_t','taesik','처음 온 날 마신 그 술… 그날 처음으로 회사 사람이 아닌 다른 사람이 된 기분이었어요.','The drink I had the first night… that day, for once, I felt like someone other than the company man.','ts_p'),
  say('ts_u','taesik','처음 왔을 땐 소주만 찾았는데, 이제는 소주가 안 당기네요.','When I first came I only asked for soju. Now I don’t crave it.','ts_p'),
  nar('ts_p','그의 휴대폰이 짧게 울렸다. 아들이다. “아빠, 오늘 면담이라고 했죠. 끝나고 전화해요.”','His phone buzzes once. His son: “Dad, you had your meeting today, right? Call me when it’s over.”','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“통화 전에 아드님께 먼저 한마디 하세요. 괜찮다는 거짓말 말고, 지금 솔직한 마음을요.”','“Before you call, send him one line. Not a lie that you’re fine, just how you honestly feel.”','ts_d',{right:true}),
    opt('“‘아빠 퇴직했다, 치킨 사 와’라고 보내세요!”','“Text him, ‘Dad retired, bring chicken!’”','ts_y2'),
    opt('“저는 바텐더라 가족 일은 잘 몰라요.”','“I’m just a bartender; I don’t know much about family matters.”','ts_y1')]},
  say('ts_y1','taesik','……그렇죠. 괜한 걸 물었네요.','…Right. I shouldn’t have asked.','ts_y1n'),
  nar('ts_y1n','그는 휴대폰을 뒤집어 놓았다.','He turned his phone face down.','l_x_ts4'),
  {id:'l_x_ts4',t:'leave',who:'taesik',next:'ov_ts2'},
  say('ts_y2','taesik','……치킨요? 그렇게까지 가볍게는 못 하겠네요.','…Chicken? I can’t make it that light.','ts_y2n'),
  nar('ts_y2n','그는 억지로 웃어 보이고는 일어섰다.','He forced a smile and stood up.','l_x_ts5'),
  {id:'l_x_ts5',t:'leave',who:'taesik',next:'ov_ts2'},
  over('ov_ts2','e_ts2'),
  say('ts_d','taesik','솔직한 마음… 무서웠다고 보내 볼게요. 22년 만에 처음으로요.','An honest feeling… I’ll tell him I was scared. For the first time in twenty-two years.','ts_e',{hearts:{taesik:1},flag:'park_honest'}),
  nar('ts_e','그는 소주병을 비닐봉지에 다시 넣었다. 그리고 오늘 처음으로, 천천히 웃었다.','He put the soju bottle back into its bag. And for the first time tonight, he slowly smiled.','ts_f'),
  say('ts_f','taesik','이 병은 열 일이 생기면 열게요. 오늘은 아니에요.','I’ll open this bottle when there’s something to celebrate. Not tonight.','l_ts'),
  {id:'l_ts',t:'leave',who:'taesik',next:'e_sy'},

  /* Seoyun */
  {id:'e_sy',t:'enter',who:'seoyun',seat:'g2',next:'sy0'},
  nar('sy0','태식이 나간 문이 닫히자 곧 다시 열렸다. 서윤이다. 노트 옆에 서류 봉투를 내려놓는다.','The door had hardly closed behind Taesik when it opened again. Seoyun. She sets a document envelope beside her notebook.','sy1'),
  say('sy1','seoyun','……저, 변호사예요. 이 얘길 여기서 처음 하네요.','…I’m a lawyer. It’s the first time I’ve said that here.','sy2'),
  say('sy2','seoyun','이직 제안을 받았어요. 시민 법률 구조 센터요. 연봉은 지금의 사분의 일이에요.','I received a job offer from a civil legal aid centre. A quarter of my current salary.','sy3'),
  say('sy3','seoyun','이기고도 허무했던 이유를 알 것 같은데… 그래도 무서워요.','I think I know why winning felt empty… but I’m still scared.','c3'),
  {id:'c3',t:'choice',opts:[
    opt('“연봉이 중요하긴 하죠. 현실적으로 생각해 보세요.”','“Pay does matter. Think realistically.”','sy_x1'),
    opt('“노트에 적은 ‘이긴 날’과 ‘좋았던 날’, 어느 쪽 줄이 더 길어요?”','“In your notebook, which line is longer: ‘days I won’ or ‘days it felt good’?”','sy_a',{right:true}),
    opt('“동전 던져 보세요! 앞면이면 이직, 뒷면이면 한 번 더!”','“Toss a coin! Heads, you switch; tails, best of three!”','sy_x2')]},
  say('sy_x1','seoyun','……그렇죠. 현실적으로요. 그게 제 직업이니까요.','…Right. Realistically. That’s what I do for a living.','sy_x1n'),
  nar('sy_x1n','그녀는 서류 봉투를 가방에 넣고 일어섰다. 노트는 펼치지 않은 채로.','She put the envelope in her bag and stood up. The notebook stayed closed.','l_x_sy1'),
  {id:'l_x_sy1',t:'leave',who:'seoyun',next:'ov_sy'},
  say('sy_x2','seoyun','……동전이요? 저는 지금 제 인생 얘기를 하고 있는데요.','…A coin? I’m talking about my life right now.','sy_x2n'),
  nar('sy_x2n','서윤은 동전 대신 가방을 집었다.','Instead of a coin, Seoyun picked up her bag.','l_x_sy2'),
  {id:'l_x_sy2',t:'leave',who:'seoyun',next:'ov_sy'},
  over('ov_sy','e_sy'),
  nar('sy_a','그녀는 노트를 펼쳐 한참 넘겨 보았다.','She opened her notebook and leafed through it for a long while.','sy_a2'),
  say('sy_a2','seoyun','좋았던 날 줄이… 훨씬 짧네요. 이긴 날은 이렇게 많은데.','The “good days” line is… much shorter. And there are so many days I won.','sy_a3',{hearts:{seoyun:1}}),
  nar('sy_a3','볼펜이 한 줄 위에서 오래 멈췄다. 이번에는 망설임이 아니라 정리하는 손이었다.','Her pen hovered over one line for a long time. This time not hesitation, but a hand putting things in order.','sy_b'),
  say('sy_b','seoyun','오늘은 취하고 싶지 않아요. 결정하기 전에, 맑은 정신으로 한 잔만요.','I don’t want to get drunk tonight. One glass, with a clear head, before I decide.','rec_sy'),
  {id:'rec_sy',t:'recommend',who:'seoyun',hint:{ko:'결정을 앞둔 날 · 맑은 정신으로',en:'A decision ahead · stay clear-headed'},fail:'sy_m',
   cands:[
    cand('espressomartini','miss','커피요? 오늘은 잠을 자야 해요.','Coffee? I need to sleep tonight.'),
    cand('whitenegroni','good','맑고 쌉쌀하네요. 생각이 정리되는 맛이에요.','Clear and bitter. The taste of thoughts falling into place.'),
    cand('negroni','ok','조금 진하지만, 괜찮아요. 오늘은 이 정도 무게는 필요해요.','A little strong, but fine. Tonight I need this much weight.'),
    cand('daiquiri','miss','너무 달아요. 오늘은 달콤한 건 사양할게요.','Too sweet. I’ll pass on sweetness tonight.'),
    cand('americano','good','가볍게 쓰고, 끝이 깔끔해요. 딱 좋아요.','Lightly bitter, a clean finish. Just right.'),
    cand('faust','miss','……이건 오늘 마시면 내일 후회할 맛이네요.','…If I drink this tonight, I’ll regret it tomorrow.'),
    cand('tomcollins','ok','시원하게 길게 마시는 것도 나쁘지 않네요.','A long, cool drink isn’t bad either.'),
    cand('velvetrose','miss','장미 향은 오늘 밤엔 너무 감상적이에요.','Rose perfume is too sentimental tonight.')],
   react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
  say('sy_m','seoyun','죄송해요, 오늘은 이게 아니에요.','Sorry, this isn’t what I need today.','l_x_sy3'),
  {id:'l_x_sy3',t:'leave',who:'seoyun',next:'ov_sy'},
  say('sy_r3','seoyun','……맑아졌어요. 이제 정할 수 있을 것 같아요.','…My head is clear. I think I can decide now.','e_sy2',{hearts:{seoyun:2},flag:'seoyun_decides'}),
  say('sy_r2','seoyun','도움이 됐어요. 고마워요.','That helped. Thank you.','e_sy2',{hearts:{seoyun:1}}),
  say('sy_r1','seoyun','……고맙습니다.','…Thank you.','e_sy2'),
  {id:'e_sy2',t:'enter',who:'seoyun',seat:'g2',next:'sy_c'},
  say('sy_c','seoyun','저, 이 바는… 제가 다른 일을 하게 돼도 계속 열려 있죠?','This bar… will it stay open even if I change jobs?','c4'),
  {id:'c4',t:'choice',opts:[
    opt('“글쎄요, 장사가 잘 되면요.”','“Well, if business goes well.”','sy_y1'),
    opt('“자리 대여료는 일 년에 오백만 원이에요.”','“The seat rental is five million won a year.”','sy_y2'),
    opt('“마스터가 남긴 자리니까요. 직업이 뭐든, 서윤 씨 자리는 계속 있어요.”','“It’s the Master’s place. Whatever your job, your seat will always be here.”','sy_d',{right:true})]},
  say('sy_y1','seoyun','……그렇군요. 현실적이네요.','…I see. Very realistic.','sy_y1n'),
  nar('sy_y1n','그녀는 서류 봉투를 한 번 쓰다듬고 일어섰다.','She stroked the envelope once and stood.','l_x_sy4'),
  {id:'l_x_sy4',t:'leave',who:'seoyun',next:'ov_sy2'},
  say('sy_y2','seoyun','……오백만 원이요? 농담이죠?','…Five million won? You’re joking, right?','sy_y2n'),
  nar('sy_y2n','대답을 기다리지 않고 서윤은 가방을 들었다.','Without waiting for an answer, Seoyun picked up her bag.','l_x_sy5'),
  {id:'l_x_sy5',t:'leave',who:'seoyun',next:'ov_sy2'},
  over('ov_sy2','e_sy2'),
  say('sy_d','seoyun','……고마워요. 그럼, 안심하고 결정할게요.','…Thank you. Then I’ll decide with peace of mind.','sy_e',{hearts:{seoyun:1},flag:'seoyun_leaving_firm'}),
  nar('sy_e','그녀는 서류 봉투에서 서명 페이지를 꺼내 이름을 쓰기 시작했다. 아주 천천히, 그러나 멈추지 않고.','She took the signature page from the envelope and began to write her name. Very slowly, but without stopping.','sy_f'),
  say('sy_f','seoyun','내일 아침에 제출할 거예요. 피아노 치는 분께도 전해 주세요. 이제 저, 낮에도 시간이 날 거라고.','I’ll submit it tomorrow morning. Tell the pianist too. That I’ll have time in the daytime from now on.','l_sy',{hearts:{bond:1},flag:'bond_free'}),
  {id:'l_sy',t:'leave',who:'seoyun',next:'cl1'},

  nar('cl1','마감. 카운터 끝에 소주병이 하나 남아 있다. 뚜껑은 여전히 닫혀 있다. 메모지가 붙어 있다. “열 일이 생기면 열게요. — 태식”','Closing time. A soju bottle is left at the end of the counter, its cap still sealed. A note is stuck on it: “I’ll open it when there’s something to celebrate. — Taesik”','cl2'),
  {id:'cl2',t:'close',title:{ko:'다섯째 밤',en:'The Fifth Night'},
   note:{ko:'마스터의 노트 5페이지 — “큰 결정은 밤에 내리지 말고, 밤에는 마음만 정리해라.”',en:'Master’s notebook, page 5 — “Don’t make big decisions at night. At night, only put your heart in order.”'}}
];

const FACE={ts1:'sad',ts2:'sad',ts_x1:'sad',ts_x2:'angry',ts_a1:'sad',ts_a2:'neutral',ts_m:'sad',ts_r3:'smile',ts_r2:'neutral',ts_r1:'sad',ts_t:'smile',ts_u:'neutral',ts_y1:'sad',ts_y2:'angry',ts_d:'sad',ts_f:'smile',
  sy1:'neutral',sy2:'sad',sy3:'sad',sy_x1:'sad',sy_x2:'angry',sy_a2:'sad',sy_b:'neutral',sy_m:'sad',sy_r3:'smile',sy_r2:'smile',sy_c:'neutral',sy_y1:'sad',sy_y2:'surprised',sy_d:'smile',sy_f:'smile'};
export const GRAPH5={};
NODES.forEach(n=>{GRAPH5[n.id]=n;if(FACE[n.id])n.face=FACE[n.id];});
export const NIGHT5={n:5,entry:'o1',graph:GRAPH5,title:{ko:'다섯째 밤',en:'The Fifth Night'},
  desc:{ko:'열리지 않은 소주병, 그리고 서류 봉투 하나.',en:'A soju bottle that stays sealed, and an envelope.'}};
