/* Night 4 of the tale: Yunha asks for help. A drink "from the guest over there", a note in the right tone, and a song for the one who listens.
   Choices: exactly one right answer; the others make the guest leave (game over, retry from the last entrance). */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'다시 시도해 보세요.',en:'Give it another try.'}});

const NODES=[
  nar('o1','넷째 밤. 마스터의 노트 4페이지. “말보다 먼저 닿는 것이 있다. 그걸 서두르지 마라.”','Night four. Page four of the Master’s notebook. “Some things arrive before words do. Don’t rush them.”','e_yh'),

  /* Yunha asks for help */
  {id:'e_yh',t:'enter',who:'yunha',seat:'piano',music:'classical',next:'yh0'},
  nar('yh0','개점 전부터 피아노 소리가 들렸다. 같은 곡이다. 제목 없는 그 곡.','I heard the piano before we even opened. The same piece. The untitled one.','yh1'),
  say('yh1','yunha','(연주를 멈추고) 저기요. 부탁이 하나 있어요.','(stopping) Excuse me. May I ask a favor?','yh2'),
  say('yh2','yunha','어제 그 노트 쓰시는 분… 오늘도 오실까요? 말을 거는 건 자신이 없어서요.','The one with the notebook… will she come tonight? I’m no good at starting a conversation.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“제가 마이크 잡고 두 분을 정식으로 소개해 드릴게요!”','“I’ll grab a mic and officially introduce you two!”','yh_x2'),
    opt('“직접 말 거는 건 부담스러우니, 제가 쪽지를 곁들여 술 한 잔 전해 드릴게요.”','“Talking directly may feel heavy, so I’ll pass her a drink along with a note.”','yh_a',{right:true}),
    opt('“그건 두 분이 알아서 하실 일 같아요.”','“That seems like something you two should sort out yourselves.”','yh_x1')]},
  say('yh_x1','yunha','…그렇죠. 괜한 부탁을 했네요.','…Right. I shouldn’t have asked.','yh_x1n'),
  nar('yh_x1n','그녀는 건반 뚜껑을 조용히 닫았다.','She quietly closed the fallboard.','l_x_yh1'),
  {id:'l_x_yh1',t:'leave',who:'yunha',next:'ov_yh'},
  say('yh_x2','yunha','마이크요?! 안 돼요, 절대 안 돼요!','A mic?! No, absolutely not!','yh_x2n'),
  nar('yh_x2n','그녀는 악보를 끌어안고 피아노 뒤로 숨어 버렸다.','She hugged her sheet music and hid behind the piano.','l_x_yh2'),
  {id:'l_x_yh2',t:'leave',who:'yunha',next:'ov_yh'},
  over('ov_yh','e_yh'),
  say('yh_a','yunha','…그럴 수 있어요? 고마워요. 정말.','…You can do that? Thank you. Really.','yh_b',{hearts:{yunha:1}}),
  nar('yh_b','마침 문이 열렸다. 노트를 든 사람이 들어온다.','Just then the door opened. Someone with a notebook walked in.','e_sy'),

  /* Seoyun arrives */
  {id:'e_sy',t:'enter',who:'seoyun',seat:'g2',also:[{who:'yunha',seat:'piano'}],next:'sy1'},
  say('sy1','seoyun','어제 그 곡이요. 오늘도 같은 곡이네요. ……아니, 아무 말도 안 한 거예요. 못 들은 걸로 해 주세요.','That piece from yesterday. The same one today. …No, I didn’t say anything. Pretend you didn’t hear.','sy2'),
  nar('sy2','서윤의 귀가 살짝 붉어졌다.','Seoyun’s ears turned slightly red.','sy3'),
  nar('sy3','피아노 앞의 윤하가 눈짓을 보냈다. 지금이다. 쪽지를 써야 한다.','At the piano, Yunha gave me a look. Now. I need to write the note.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“오늘 연주 잘 들었어요. 한 잔 드시면서 쉬세요.”','“I enjoyed tonight’s playing. Please rest with this drink.”','n_a',{right:true}),
    opt('“저 구석 자리, 연주자 시야에 딱 걸리는 명당이에요. ㅎㅎ”','“That corner seat is right in the pianist’s line of sight. Hehe.”','n_x1'),
    opt('“당신 노트 쓰는 모습을 매일 봤어요. 사실 그 곡은 당신을 위한 곡이에요.”','“I’ve watched you write in that notebook every day. That piece is actually for you.”','n_x2')]},
  say('n_x1','seoyun','……처음 본 분이 제 자리를 어떻게 아시죠? (조금 식은 얼굴로) 잘 마셨다고만 전해 주세요.','…How does someone I’ve never met know my seat? (a little cooler) Just tell her thanks for the drink.','n_x1n'),
  nar('n_x1n','서윤은 노트를 덮고 일어섰다. 쪽지는 두 번 접혀 있었다.','Seoyun closed her notebook and stood. The note had been folded twice.','l_x_sy1'),
  {id:'l_x_sy1',t:'leave',who:'seoyun',next:'ov_sy'},
  say('n_x2','seoyun','……매일 봤다고요? 저를요?','…Every day? You watched me?','n_x2n'),
  nar('n_x2n','그녀는 쪽지를 접어 놓고 가방을 들었다. 피아노 소리가 멎었다.','She folded the note away and picked up her bag. The piano fell silent.','l_x_sy2'),
  {id:'l_x_sy2',t:'leave',who:'seoyun',next:'ov_sy'},
  over('ov_sy','e_sy'),
  nar('n_a','쪽지를 곁들인 잔을 쟁반에 올린다. 서윤에게 어떤 술이 어울릴까.','I set a glass on the tray with the note. What would suit Seoyun?','rec_sy'),
  {id:'rec_sy',t:'recommend',who:'seoyun',hint:{ko:'윤하가 보내는 한 잔 · 서윤의 취향으로',en:'A drink from Yunha, to Seoyun’s taste'},fail:'sy_m',
   pre:{who:'me',text:{ko:'저쪽 손님께서 보내셨습니다. 쪽지와 함께요.',en:'That guest over there sent this. With a note.'}},
   cands:[
    cand('daiquiri','miss','……너무 달아요. 보내 주신 분께는 미안하지만.','…Too sweet. Sorry to whoever sent it.'),
    cand('negroni','good','……이 맛, 제가 좋아하는 거예요. 어떻게 아셨죠?','…This is the taste I like. How did you know?'),
    cand('manhattan','ok','묵직하네요. 오늘은 조금 가벼운 게 좋았지만, 고마워요.','Heavy. I wanted something lighter tonight, but thank you.'),
    cand('velvetrose','miss','장미 향이요…? 모르는 분이 보내기엔 좀 부담스럽네요.','Rose perfume…? A bit much from someone I don’t know.'),
    cand('americano','good','가볍게 쓰네요. 오늘은 이게 딱이었어요.','Lightly bitter. This was exactly right for tonight.'),
    cand('cosmopolitan','miss','분홍색이네요. 제 취향은 아니에요.','It’s pink. Not really my taste.'),
    cand('boulevardier','ok','위스키가 강하지만… 나쁘지 않아요.','Strong on the whiskey… but not bad.'),
    cand('mojito','miss','민트요? 오늘은 상쾌해지고 싶은 기분이 아니에요.','Mint? I’m not in the mood to feel refreshed.')],
   react:{3:'sy_r3',2:'sy_r2',1:'sy_r1'}},
  say('sy_m','seoyun','죄송해요, 보내 주신 분껜 고맙지만 이건 못 마시겠어요.','Sorry, I’m grateful to whoever sent it, but I can’t drink this.','sy_mn'),
  nar('sy_mn','그녀는 쪽지만 챙겨 일어섰다.','She took only the note and stood up.','l_x_sy3'),
  {id:'l_x_sy3',t:'leave',who:'seoyun',next:'ov_sy'},
  say('sy_r3','seoyun','……피아노 치시는 분이죠? 연주 잘 들었다고 전해 주세요.','…The one at the piano, right? Please tell her I enjoyed the playing.','e_sy2',{hearts:{seoyun:1,bond:2},flag:'bond_gift'}),
  say('sy_r2','seoyun','고맙다고 전해 주세요. 쪽지도요.','Please tell her thanks. And for the note too.','e_sy2',{hearts:{bond:1}}),
  say('sy_r1','seoyun','……감사하다고만 전해 주세요.','…Just tell her thank you.','e_sy2'),
  {id:'e_sy2',t:'enter',who:'seoyun',seat:'g2',also:[{who:'yunha',seat:'piano'}],next:'yh_d'},

  /* The song */
  say('yh_d','yunha','(작은 목소리로) 어땠어요, 그분?','(quietly) How was she?','yh_d2'),
  say('yh_d2','me','고맙다고 전해 달래요. 쪽지도요.','She said thank you. For the note too.','yh_e'),
  say('yh_e','yunha','……! 그럼 다음 곡은… 어떤 분위기가 좋을까요?','…! Then for the next piece… what mood would be good?','c3'),
  {id:'c3',t:'choice',opts:[
    opt('“아무 곡이나 좋아요. 연주는 다 좋으니까.”','“Any piece is fine. Your playing is good anyway.”','yh_y1'),
    opt('“경쾌한 트로트 메들리요!”','“An upbeat trot medley!”','yh_y2'),
    opt('“조용하고 느린 곡이요. 노트 쓰는 손이 멈추지 않을 만큼.”','“Something quiet and slow. Soft enough that her pen keeps moving.”','yh_g',{right:true})]},
  say('yh_y1','yunha','…아무거나라니. 제일 어려운 주문이네요.','…“Any piece”. That’s the hardest order there is.','yh_y1n'),
  nar('yh_y1n','그녀는 악보를 정리하고 조용히 일어섰다.','She gathered her sheet music and quietly stood up.','l_x_yh3'),
  {id:'l_x_yh3',t:'leave',who:'yunha',next:'ov_yh2'},
  say('yh_y2','yunha','피아노 앞에서 트로트를요?! ……오늘은 이만 갈게요.','A trot medley on a piano?! …I’ll call it a night.','yh_y2n'),
  nar('yh_y2n','윤하는 웃음을 참으며 도망치듯 나갔다.','Yunha fled, trying not to laugh.','l_x_yh4'),
  {id:'l_x_yh4',t:'leave',who:'yunha',next:'ov_yh2'},
  over('ov_yh2','e_sy2'),
  say('yh_g','yunha','(미소) 알겠어요. 오늘은 그 곡을 끝까지 칠게요.','(smiling) Got it. Tonight I’ll play that piece all the way through.','fx_m'),
  {id:'fx_m',t:'fx',music:'classical',next:'yh_h'},
  nar('yh_h','피아노가 낮고 느리게 흐르기 시작했다. 서윤의 볼펜이 멈췄다. 이번에는 놀라서가 아니라, 듣느라.','The piano starts to flow, low and slow. Seoyun’s pen stops. This time not from surprise, but from listening.','yh_i',{hearts:{bond:1}}),
  nar('yh_i','그녀의 노트 구석에, 아주 작은 글씨로 한 줄이 늘어난다.','In the corner of her notebook, one more line appears in tiny handwriting.','sy_f'),
  say('sy_f','seoyun','……저기요. 다음 곡도 들려주실 수 있을까요? 저 사람한테요.','…Excuse me. Could she play the next piece too? Ask her.','sy_g',{hearts:{seoyun:1,bond:1},flag:'seoyun_asked'}),
  say('sy_g','me','직접 말씀하셔도 돼요. 아주 가까이 있거든요.','You can tell her yourself. She’s quite close.','sy_h'),
  say('sy_h','seoyun','…다음에요. 오늘은 곡이 끝날 때까지만 들을게요.','…Next time. Tonight I’ll only listen until the piece ends.','l_sy'),
  {id:'l_sy',t:'leave',who:'seoyun',next:'yh_z'},
  say('yh_z','yunha','내일도 칠게요. 이번엔 제목이 생길지도 몰라요.','I’ll play tomorrow too. This time it might get a title.','l_yh'),
  {id:'l_yh',t:'leave',who:'yunha',next:'cl1'},

  nar('cl1','마감. 피아노 위의 악보, 제목 칸에 누군가 연필로 점 하나를 찍어 두었다.','Closing time. On the sheet music on the piano, someone has put a single pencil dot in the title line.','cl2',{flag:'title_dot'}),
  {id:'cl2',t:'close',title:{ko:'넷째 밤',en:'The Fourth Night'},
   note:{ko:'마스터의 노트 4페이지 — “음악은 말이 닿지 못하는 곳에 먼저 도착한다.”',en:'Master’s notebook, page 4 — “Music arrives first where words cannot reach.”'}}
];

const FACE={yh1:'smile',yh2:'sad',yh_x1:'sad',yh_x2:'surprised',yh_a:'smile',sy1:'neutral',n_x1:'sad',n_x2:'surprised',sy_m:'sad',sy_r3:'smile',sy_r2:'smile',sy_r1:'neutral',
  yh_d:'neutral',yh_e:'smile',yh_y1:'sad',yh_y2:'surprised',yh_g:'smile',sy_f:'smile',sy_h:'smile',yh_z:'smile'};
export const GRAPH4={};
NODES.forEach(n=>{GRAPH4[n.id]=n;if(FACE[n.id])n.face=FACE[n.id];});
export const NIGHT4={n:4,entry:'o1',graph:GRAPH4,title:{ko:'넷째 밤',en:'The Fourth Night'},
  desc:{ko:'저쪽 손님께서 보내셨습니다. 한 잔과 쪽지, 그리고 한 곡.',en:'“That guest over there sent this.” A drink, a note and a song.'}};
