/* Night 7 of the tale: the Master's last night. He tells the story behind the untitled piece, and the ending depends on how far the bond between Seoyun and Yunha has grown.
   Choices: exactly one right answer; the others make a guest leave (game over, retry from the last entrance). */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'다시 시도해 보세요.',en:'Give it another try.'}});

const NODES=[
  nar('o1','마지막 밤. 마스터의 노트 7페이지에는 한 줄만 적혀 있다. “이 페이지는 네가 써라.”','The last night. Page seven of the Master’s notebook holds a single line: “This page, you write.”','o2'),
  nar('o2','개점 직전, 문이 열렸다. 열쇠를 가진 사람은 이제 나뿐인데.','Right before opening, the door opened. And I’m the only one who has a key now.','e_ms'),

  /* the Master */
  {id:'e_ms',t:'enter',who:'master',seat:'g1',next:'m1'},
  nar('m1','낡은 외투, 반질반질한 지팡이, 그리고 20년 동안 이 문을 열던 손. 마스터가 돌아왔다.','A worn coat, a polished cane, and the hand that opened this door for twenty years. The Master is back.','m2'),
  say('m2','master','처음 문 열던 날 얼음을 세 번 채웠다며? 허허.','I hear you refilled the ice three times the day you opened. Heh heh.','m3'),
  say('m3','master','마지막으로 한 잔 부탁하네. 이 가게의 이름을 건 한 잔으로.','One last drink, if you would. One that carries the name of this place.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“저는 아직 마스터만큼 못 만들어요.”','“I’m still not as good as you.”','m_x1'),
    opt('“마스터가 만든 걸 기억해서 그대로 흉내 내겠습니다!”','“I’ll remember what you made and copy it exactly!”','m_x2'),
    opt('“영광입니다. 가르쳐 주신 대로, 손님의 이야기부터 듣겠습니다.”','“It’s an honour. As you taught me, I’ll start by listening to the guest’s story.”','m_a',{right:true})]},
  say('m_x1','master','……그런 소리를 하는 놈에게 열쇠를 줬다니. 허허, 내 눈이 늙었군.','…I gave the key to someone who says that? Heh, my eyes are getting old.','m_x1n'),
  nar('m_x1n','마스터는 지팡이를 짚고 천천히 일어섰다. 이번에는 문을 직접 열고 나갔다.','The Master rose slowly with his cane. This time he opened the door himself and left.','l_x_ms1'),
  {id:'l_x_ms1',t:'leave',who:'master',next:'ov_ms'},
  say('m_x2','master','흉내는 내가 제일 싫어하는 거야. 20년 동안 가르친 게 그거였나.','Copying is what I hate most. Was that what twenty years of teaching came to?','m_x2n'),
  nar('m_x2n','그는 서운한 얼굴로 외투를 다시 입었다.','He put his coat back on with a hurt face.','l_x_ms2'),
  {id:'l_x_ms2',t:'leave',who:'master',next:'ov_ms'},
  over('ov_ms','e_ms'),
  say('m_a','master','허허. 이야기부터… 그래, 그게 전부지.','Heh heh. The story first… yes, that’s all there is to it.','m_b',{hearts:{master:1}}),
  say('m_b','master','오늘 밤 한 잔은 늙은이의 마지막 잔이기도 하고, 이 가게가 처음 문을 연 날의 잔이기도 하지.','Tonight’s glass is an old man’s last, and also the glass of the day this place first opened.','rec_ms'),
  {id:'rec_ms',t:'recommend',who:'master',hint:{ko:'마스터의 마지막 잔 · 가게의 이름을 건 한 잔',en:'The Master’s last drink · a glass that carries the bar’s name'},fail:'m_m',
   cands:[
    cand('mojito','miss','……이건 내 이름을 건 잔이 아니야.','…This isn’t a glass that carries my name.'),
    cand('courtenoir','good','……코다 누아. 이 가게를 열던 밤에 처음 만든 술이야. 어떻게 알았나.','…Coda Noir. The first drink I made the night this place opened. How did you know?'),
    cand('manhattan','ok','무난하군. 나쁘진 않아. 나쁘진 않지만 가게의 이름은 아니야.','Safe. Not bad. But it isn’t the name of this place.'),
    cand('daiquiri','miss','이건 젊은 날의 술이군. 오늘은 아니야.','A drink of youth. Not tonight.'),
    cand('oldfashioned','good','단순한 걸 고르는 놈이 좋은 바텐더지. 이건 내 손 같구먼.','Anyone who chooses the simple one is a good bartender. This feels like my own hand.'),
    cand('cosmopolitan','miss','분홍빛은 서윤에게 어울리지, 나한테는 아니야.','Pink suits Seoyun, not me.'),
    cand('boulevardier','ok','위스키가 앞서가는군. 그래도 마음은 알겠네.','The whiskey runs ahead. Still, I understand the thought.'),
    cand('espressomartini','miss','이 나이에 커피라니. 오늘은 잠들고 싶어.','Coffee at my age? Tonight I want to sleep.')],
   react:{3:'m_r3',2:'m_r2',1:'m_r1'}},
  say('m_m','master','…아직은 아니었나 보군.','…Perhaps not yet.','m_mn'),
  nar('m_mn','그는 잔을 내려놓고 오래 창밖을 보았다.','He set the glass down and gazed out of the window for a long time.','l_x_ms3'),
  {id:'l_x_ms3',t:'leave',who:'master',next:'ov_ms'},
  say('m_r3','master','……이 맛이야. 20년 전 그 밤이 떠오르는군.','…That’s the taste. It brings back that night, twenty years ago.','e_ms2',{hearts:{master:2},flag:'master_proud'}),
  say('m_r2','master','좋아. 자네 손이 이제 이 가게 손이 되었군.','Good. Your hands have become this bar’s hands.','e_ms2',{hearts:{master:1}}),
  say('m_r1','master','…마음이 담겼으니 됐네.','…There’s heart in it. That’s enough.','e_ms2'),
  {id:'e_ms2',t:'enter',who:'master',seat:'g1',next:'m_c'},

  /* the story behind the piece */
  say('m_c','master','자네에게 하나 묻겠네. 그 피아노 곡, 제목 없던 곡의 주인공을 아나?','Let me ask you something. Do you know who that piano piece, the one without a title, is about?','m_d'),
  say('m_d','me','……누군가를 위한 곡이라고만 알아요.','…I only know it’s for someone.','m_e'),
  say('m_e','master','20년 전 얘기가 아니야. 3년 전 겨울밤이었지. 한 여자가 저 구석에서 소리 없이 울고 있었어. 노트를 펼쳐 놓고, 한 글자도 못 쓰고.','Not twenty years ago. It was a winter night three years back. A woman sat in that corner crying without a sound, her notebook open, unable to write a single word.','m_f'),
  say('m_f','master','그때 저 피아노를 치던 아이가 말없이 곡을 바꿨지. 그 곡이, 지금 제목이 있는 그 곡일세.','The girl at the piano quietly changed her song then. That song is the one that has a title now.','m_g'),
  nar('m_g','나는 서윤의 노트와 윤하의 악보를 동시에 떠올렸다. 두 이야기가 한 점에서 만났다.','I thought of Seoyun’s notebook and Yunha’s sheet music at once. Two stories met at a single point.','e_pair'),

  {id:'e_pair',t:'enter',who:'seoyun',seat:'g2',also:[{who:'yunha',seat:'piano'}],next:'pr1'},
  nar('pr1','마침 문이 열렸다. 서윤이 들어오고, 피아노 앞에는 어느새 윤하가 앉아 있다. 두 사람은 마스터를 보고 걸음을 멈췄다.','Just then the door opened. Seoyun came in, and Yunha was already at the piano. Both stopped at the sight of the Master.','pr2'),
  say('pr2','seoyun','……마스터.','…Master.','pr3'),
  say('pr3','master','오랜만이군, 서윤. 그리고 윤하. 마침 잘 왔네.','It’s been a while, Seoyun. And Yunha. You came at the right time.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“그 이야기는 두 분이 따로 들으시는 게 좋지 않을까요?”','“Wouldn’t it be better for them to hear that story separately?”','pr_x1'),
    opt('“사실 제가 두 분을 짝으로 맺어 주기로 했어요! 오늘 밤 안에!”','“Actually I’ve decided to match you two! Before tonight is over!”','pr_x2'),
    opt('“마스터, 그 겨울밤 이야기를 두 분 앞에서 직접 해 주세요.”','“Master, please tell that winter night’s story to both of them yourself.”','pr_a',{right:true})]},
  say('pr_x1','master','그렇군. 남의 이야기는 조심스러운 법이지. 허허.','I see. Other people’s stories do call for care. Heh.','pr_x1n'),
  nar('pr_x1n','마스터는 입을 다문 채 모자를 집어 들었다. 이야기는 영영 묻혔다.','The Master picked up his hat and said no more. The story stayed buried.','l_x_ms4'),
  {id:'l_x_ms4',t:'leave',who:'master',next:'ov_pr'},
  say('pr_x2','seoyun','……짝이요?','…Matching?','pr_x2n'),
  nar('pr_x2n','서윤과 윤하는 서로를 보지도 않고, 동시에 반대 방향으로 시선을 돌렸다.','Seoyun and Yunha, without looking at each other, turned their eyes in opposite directions at once.','l_x_sy1'),
  {id:'l_x_sy1',t:'leave',who:'seoyun',next:'ov_pr'},
  over('ov_pr','e_pair'),
  say('pr_a','master','허허. 그래, 그러세. 서윤, 그 밤에 울던 자리에서 윤하는 피아노를 쳤어. 윤하, 자네 곡으로 위로받은 사람이 서윤이었네.','Heh heh. Very well. Seoyun, at the seat where you wept that night, Yunha was playing the piano. Yunha, the one your music comforted was Seoyun.','pr_b',{hearts:{master:1}}),
  say('pr_b','yunha','……그때 그분이, 서윤 씨였어요?','…That woman back then was you, Seoyun?','pr_c'),
  say('pr_c','seoyun','……그 곡이, 저한테 쳐 주신 곡이었어요?','…That piece was played for me?','pr_d'),
  nar('pr_d','두 사람은 말없이 서로를 바라보았다. 피아노 위의 악보에는 “첫 번째 안부”라는 제목이 적혀 있다.','The two looked at each other in silence. On the piano, the sheet music bears the title “First Regards”.','if_love'),

  /* the ending depends on the bond */
  {id:'if_love',t:'if',heart:'bond',atLeast:4,then:'end_love',else:'if_friend'},
  {id:'if_friend',t:'if',heart:'bond',atLeast:2,then:'end_friend',else:'end_apart'},
  nar('end_love','윤하가 피아노 의자의 옆자리를 비켜 앉았다. 서윤은 잠시 망설이다가 노트를 접고 그 자리에 앉았다. 곡이 처음으로 두 사람의 연주가 되었다.','Yunha shifted over on the piano bench. After a moment’s hesitation, Seoyun closed her notebook and sat beside her. For the first time, the piece became a duet.','end_love2',{flag:'ending_love'}),
  nar('end_love2','한 달 뒤, 저녁 일곱 시. 문이 열리고 두 사람이 함께 들어온다. 서윤의 노트에는 새 줄이 생겼다. “좋았던 날.”','A month later, seven in the evening. The door opens and the two walk in together. A new line has appeared in Seoyun’s notebook: “Good days.”','epi'),
  nar('end_friend','서윤은 노트를 펼쳐 한 줄을 적고, 윤하는 건반에 손을 올렸다. 서로의 이름은 이제 안부가 되었다. 이름 붙이지 않은 마음은 곡 속에 천천히 머물렀다.','Seoyun opened her notebook and wrote a line; Yunha placed her hands on the keys. Each other’s names had become regards. The feeling without a name lingered slowly inside the piece.','end_friend2',{flag:'ending_friend'}),
  nar('end_friend2','한 달 뒤. 서윤은 낮에는 법률 센터에서 일하고, 밤에는 구석 자리에서 윤하의 연주를 듣는다. 서로의 연주와 한 잔을 아끼는 사이가 되었다.','A month later. Seoyun works at the legal centre by day and listens to Yunha play from the corner seat at night. They have become people who treasure each other’s music and a glass.','epi'),
  nar('end_apart','두 사람은 오래 서로를 바라보다가, 어색하게 고개를 숙여 인사했다. 곡은 끝까지 연주되었지만, 연주가 끝나자 다시 각자의 자리로 돌아갔다.','They looked at each other for a long time, then bowed awkwardly. The piece was played to the end, and afterward each returned to her own seat.','end_apart2',{flag:'ending_apart'}),
  nar('end_apart2','한 달 뒤. 서윤은 새 일터로, 윤하는 다른 도시의 무대로 떠났다. 그래도 피아노 위에는 제목이 적힌 악보가 놓여 있고, 구석 자리에는 가끔 노트를 든 손님이 앉는다. 서로의 이름은 아는 사이로 남았다.','A month later. Seoyun went to her new job, Yunha to a stage in another city. Still, the sheet music with its title lies on the piano, and now and then a guest with a notebook sits in the corner seat. They remained people who know each other’s names.','epi'),

  nar('epi','태식은 새 직장에서 금요일마다 퇴근길에 들른다. 이번에는 소주병을 열고. 깡이와 윤재는 같은 날 오는 일이 많아졌다. 서로 모르는 척하면서.','Taesik drops by every Friday on his way home from his new job, this time opening the soju. Kkangi and Yoonjae often come on the same day now, pretending not to know each other.','k1'),
  nar('k1','마스터는 카운터에 열쇠를 내려놓았다. 이미 내 것인데도, 그날 처음으로 내 것처럼 느껴졌다.','The Master set the key on the counter. It was already mine, but that day it felt like mine for the first time.','k2'),
  say('k2','master','이제 이 가게는 자네 것이군. 마스터라고 불러도 좋네.','The place is yours now. You may call yourself the Master.','l_ms',{face:'smile'}),
  {id:'l_ms',t:'leave',who:'master',next:'l_sy'},
  {id:'l_sy',t:'leave',who:'seoyun',next:'l_yh'},
  {id:'l_yh',t:'leave',who:'yunha',next:'cl1'},

  nar('cl1','나는 노트 7페이지를 펼쳤다. 첫 줄을 적는다. “오늘도, 얼음은 세 번 채웠다.”','I opened page seven of the notebook and wrote the first line: “Tonight too, I refilled the ice three times.”','cl2'),
  {id:'cl2',t:'close',title:{ko:'일곱째 밤',en:'The Seventh Night'},
   note:{ko:'마스터의 노트 7페이지 — “이 페이지는 네가 써라.” 이야기는 여기서 끝나고, 이 가게의 밤은 계속된다.',en:'Master’s notebook, page seven — “This page, you write.” The story ends here, and the nights of this bar go on.'}}
];

const FACE={m2:'smile',m3:'neutral',m_x1:'sad',m_x2:'angry',m_a:'smile',m_b:'neutral',m_m:'sad',m_r3:'smile',m_r2:'smile',m_r1:'neutral',m_c:'neutral',m_e:'sad',m_f:'neutral',
  pr2:'surprised',pr3:'smile',pr_x1:'sad',pr_x2:'surprised',pr_a:'smile',pr_b:'surprised',pr_c:'surprised'};
export const GRAPH7={};
NODES.forEach(n=>{GRAPH7[n.id]=n;if(FACE[n.id]&&!n.face)n.face=FACE[n.id];});
export const NIGHT7={n:7,entry:'o1',graph:GRAPH7,title:{ko:'일곱째 밤',en:'The Seventh Night'},
  desc:{ko:'마스터의 마지막 밤, 그리고 제목이 생긴 곡의 이야기.',en:'The Master’s last night, and the story behind the piece that now has a title.'}};

/* The endings for the gallery: the same narration the player reads, shown again from the start screen. */
const endText=ids=>ids.map(id=>GRAPH7[id].text);
export const ENDINGS=[
  {id:'ending_love',title:{ko:'이어짐',en:'Together'},hint:{ko:'서윤 × 윤하의 인연이 4 이상',en:'Seoyun × Yunha bond of 4 or more'},text:endText(['end_love','end_love2'])},
  {id:'ending_friend',title:{ko:'좋은 친구',en:'Dear friends'},hint:{ko:'서윤 × 윤하의 인연이 2~3',en:'Seoyun × Yunha bond of 2–3'},text:endText(['end_friend','end_friend2'])},
  {id:'ending_apart',title:{ko:'엇갈림',en:'Apart, yet connected'},hint:{ko:'서윤 × 윤하의 인연이 0~1',en:'Seoyun × Yunha bond of 0–1'},text:endText(['end_apart','end_apart2'])}
];
