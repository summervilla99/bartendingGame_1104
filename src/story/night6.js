/* Night 6 of the tale: the building is sold and the rent triples. The regulars gather, Yunha knows about a drawer in the piano bench,
   and Seoyun finally has a title for the piece.
   Choices: exactly one right answer; the others make a guest leave (game over, retry from the last entrance). Seats: Taesik g0, Kkangi g1, Seoyun g2, Yoonjae g3. */
import {CHARS,FLAVOR} from './chars.js';
export {CHARS,FLAVOR};

const say=(id,who,ko,en,next,x)=>Object.assign({id,t:'say',who,text:{ko,en},next},x||{});
const nar=(id,ko,en,next,x)=>say(id,'narr',ko,en,next,x);
const opt=(ko,en,next,x)=>Object.assign({text:{ko,en},next},x||{});
const cand=(id,match,ko,en)=>({id,match,lead:{ko,en}});
const over=(id,retry)=>({id,t:'over',retry,title:{ko:'손님이 떠났어요',en:'The guest left'},tip:{ko:'다시 시도해 보세요.',en:'Give it another try.'}});
const ALL=[{who:'taesik',seat:'g0'},{who:'kkangi',seat:'g1'},{who:'seoyun',seat:'g2'},{who:'yoonjae',seat:'g3'},{who:'yunha',seat:'piano'}];

const NODES=[
  nar('o1','여섯째 밤. 마스터의 노트 6페이지는 비어 있다. 대신 오늘 아침 우편함에 편지 한 통이 꽂혀 있었다.','Night six. Page six of the Master’s notebook is blank. Instead, a letter was stuck in the mailbox this morning.','o2'),
  nar('o2','“건물 소유자 변경 안내. 월세 3배 인상, 또는 30일 내 퇴거.”','“Notice of new building ownership. Rent tripled, or vacate within 30 days.”','o3'),
  nar('o3','개점 시간이 되었는데, 얼음을 채우는 손이 떨린다.','It’s opening time, and my hands shake as I fill the ice.','e_ts'),

  /* Taesik is first */
  {id:'e_ts',t:'enter',who:'taesik',seat:'g0',next:'ts1'},
  say('ts1','taesik','표정이 왜 그래요? 어제 내가 지었던 표정이랑 똑같은데.','What’s with that face? It’s the same one I wore yesterday.','c1'),
  {id:'c1',t:'choice',opts:[
    opt('“별일 아니에요. 곧 해결될 거예요.”','“It’s nothing. It’ll be sorted out soon.”','ts_x1'),
    opt('“솔직하게 말할게요. 건물주가 바뀌어서 월세가 세 배가 된대요.”','“I’ll be honest. The building has a new owner and the rent is tripled.”','ts_a',{right:true}),
    opt('“이 가게는 오늘이 마지막이에요! 마지막 파티를 열죠!”','“Today is this bar’s last day! Let’s throw a farewell party!”','ts_x2')]},
  say('ts_x1','taesik','……거짓말이네요. 나도 어제 그랬어요. 괜찮은 척하는 얼굴이요.','…That’s a lie. I wore it yesterday too. The face of pretending to be fine.','ts_x1n'),
  nar('ts_x1n','그는 소주병을 두고 조용히 돌아섰다. 괜찮은 척은 오래가지 못한다.','He left the soju bottle and quietly turned away. Pretending to be fine doesn’t last long.','l_x_ts1'),
  {id:'l_x_ts1',t:'leave',who:'taesik',next:'ov_ts'},
  say('ts_x2','taesik','마지막이라고요?! 나, 오늘 밤 소주를 열려고 했는데…!','The last?! I was going to open the soju tonight…!','l_x_ts2'),
  {id:'l_x_ts2',t:'leave',who:'taesik',next:'ov_ts'},
  over('ov_ts','e_ts'),
  say('ts_a','taesik','……편지 이리 줘 봐요. 나도 22년 동안 계약서를 읽어 온 사람이에요.','…Give me the letter. I’ve read contracts for twenty-two years.','ts_b',{hearts:{taesik:1}}),
  nar('ts_b','그가 안경을 고쳐 쓰는 사이, 문이 연달아 열렸다. 소문은 빠르다. 아니, 기사가 눈치가 빠른 건지도 모른다.','While he adjusted his glasses, the door kept opening. News travels fast. Or maybe the driver is just sharp.','e_all'),

  /* the regulars gather */
  {id:'e_all',t:'enter',who:'kkangi',seat:'g1',also:[{who:'seoyun',seat:'g2'},{who:'yoonjae',seat:'g3'}],next:'all0'},
  say('all0','kkangi','야, 사장! 무슨 일이야? 문 앞에서 양복쟁이 기사가 울던데!','Hey, boss! What’s going on? The suit’s driver was crying at the door!','all1'),
  say('all1','yoonjae','울지 않았어요. 눈에 뭐가 들어간 겁니다. ……그래서, 무슨 일인가요?','He wasn’t crying. Something got in his eye. …So, what’s going on?','all2'),
  say('all2','seoyun','서류부터 보여 주세요. 감정은 그다음에요.','Documents first. Feelings after.','all3'),
  nar('all3','나는 편지를 카운터 위에 올렸다. 네 사람의 시선이 종이 한 장에 모였다.','I laid the letter on the counter. Four pairs of eyes gathered on a single sheet of paper.','all4'),
  say('all4','yoonjae','월세 세 배… 제가 내겠습니다. 아니, 건물을 사겠습니다. 지금 전화할게요.','Triple rent… I’ll pay it. No, I’ll buy the building. Let me call right now.','c2'),
  {id:'c2',t:'choice',opts:[
    opt('“그럼 한 달만 부탁드릴게요.”','“Then just one month, please.”','yj_x1'),
    opt('“금괴로 주세요! 금은 안 떨어지니까요!”','“Pay in gold bars! Gold never drops!”','yj_x2'),
    opt('“마음은 정말 감사해요. 하지만 돈으로만 막는 건 마스터가 원한 방식이 아닐 거예요. 같이 방법을 찾아봐요.”','“I’m truly grateful. But just buying our way out isn’t what the Master would want. Let’s find a way together.”','yj_a',{right:true})]},
  say('yj_x1','seoyun','……그렇게 쉽게 받으시면, 이 가게는 윤재 씨 소유가 되는 거예요.','…If you accept that so easily, this bar becomes Yoonjae’s.','yj_x1n'),
  nar('yj_x1n','서윤이 가방을 들었다. 이건 가게를 지키는 방식이 아니다.','Seoyun picked up her bag. This is not how you protect a place.','l_x_sy1'),
  {id:'l_x_sy1',t:'leave',who:'seoyun',next:'ov_all'},
  say('yj_x2','yoonjae','금괴… 저희 집 금고에 있긴 한데요. 진심으로 말씀하시는 건가요?','Gold bars… we do have some in the vault. Are you being serious?','yj_x2n'),
  nar('yj_x2n','윤재는 진지하게 휴대폰을 꺼내 금값을 검색하기 시작했다.','Yoonjae earnestly took out his phone and began checking the price of gold.','l_x_yj1'),
  {id:'l_x_yj1',t:'leave',who:'yoonjae',next:'ov_all'},
  over('ov_all','e_all'),
  say('yj_a','yoonjae','……같이요. 그 말을 들은 지 오래됐네요.','…Together. It’s been a while since I heard that word.','s1',{hearts:{yoonjae:1}}),
  say('s1','seoyun','계약서가 있나요? 이 가게의 원본 임대차 계약서요.','Do you have the contract? The original lease for this bar.','s2'),
  say('s2','me','마스터가 가지고 있었을 텐데… 노트의 6페이지가 비어 있어요.','The Master would have had it… but page six of his notebook is blank.','s3'),
  say('s3','kkangi','비어 있으면 뭐 어때. 내가 건물주 찾아가서 헬멧으로 대화할까?','So what if it’s blank. Should I go find the landlord and talk with my helmet?','c3'),
  {id:'c3',t:'choice',opts:[
    opt('“폭력은 안 돼요. 대신 깡이 씨는 건물주가 오면 제일 먼저 문을 열어 주세요. 가장 친절하게요.”','“No violence. But when the landlord comes, you open the door first. As politely as you can.”','k_a',{right:true}),
    opt('“좋아요! 헬멧에 ‘월세 인하’라고 써서 가세요!”','“Great! Write ‘rent cut’ on the helmet and go!”','k_x2'),
    opt('“음, 일단 참으세요.”','“Hmm, just hold it in for now.”','k_x1')]},
  say('k_x1','kkangi','참으라고? 내가 언제 참아 봤다고!','Hold it in? When have I ever held anything in!','l_x_kk1'),
  {id:'l_x_kk1',t:'leave',who:'kkangi',next:'ov_all'},
  say('k_x2','kkangi','써 줘! 근데 내 글씨가 좀 험해서…','Write it! But my handwriting is kind of rough…','k_x2n'),
  nar('k_x2n','깡이는 헬멧에 매직으로 정말 무언가를 쓰고 나가 버렸다.','Kkangi actually scribbled something on his helmet with a marker and left.','l_x_kk2'),
  {id:'l_x_kk2',t:'leave',who:'kkangi',next:'ov_all'},
  say('k_a','kkangi','……문 여는 거? 그건 자신 있어. 어제도 걷어찼잖아.','…Opening doors? I’m good at that. I kicked one open yesterday.','p1',{hearts:{kkangi:1}}),
  nar('p1','그때, 피아노 쪽에서 작은 목소리가 들렸다.','Then, a small voice came from the piano.','e_yh'),

  /* Yunha and the drawer */
  {id:'e_yh',t:'enter',who:'yunha',seat:'piano',next:'yh1'},
  say('yh1','yunha','저… 도움이 될지 모르겠는데요. 피아노 의자 안에 서랍이 있어요.','Um… I’m not sure this helps, but there’s a drawer inside the piano bench.','yh2'),
  say('yh2','yunha','악보를 넣으려다 봤어요. 서류 같은 게 잔뜩 있었는데, 제 물건이 아니라 열어 보진 않았어요.','I saw it while putting in my sheet music. Lots of papers, but they’re not mine so I didn’t open it.','c4'),
  {id:'c4',t:'choice',opts:[
    opt('“마스터의 물건을 함부로 열어도 될지 모르겠어요.”','“I’m not sure we should open the Master’s things.”','yh_x1'),
    opt('“그 서랍에는 분명 보물이 있어요! 윤재 씨, 금고 따는 사람 불러 주세요!”','“There must be treasure in that drawer! Yoonjae, call a safe-cracker!”','yh_x2'),
    opt('“열어 보죠. 모두 같이, 한 장씩요.”','“Let’s open it. All of us, one sheet at a time.”','yh_a',{right:true})]},
  say('yh_x1','yunha','…그렇죠. 제가 괜한 말을 했네요.','…Right. I shouldn’t have said anything.','l_x_yh1'),
  {id:'l_x_yh1',t:'leave',who:'yunha',next:'ov_yh'},
  say('yh_x2','yunha','보물이요?! 아니, 저는 그냥… 죄송해요!','Treasure?! No, I just… sorry!','l_x_yh2'),
  {id:'l_x_yh2',t:'leave',who:'yunha',next:'ov_yh'},
  over('ov_yh','e_yh'),
  say('yh_a','yunha','(안도한 듯) 네. 그럼 같이요.','(relieved) Yes. Together, then.','d1',{hearts:{yunha:1}}),
  nar('d1','피아노 의자의 서랍이 열렸다. 오래된 서류철, 그리고 맨 위에 편지 한 통. “하랑에게.”','The drawer in the piano bench opened. An old file of documents, and on top, a letter. “To Harang.”','d2'),
  nar('d2','마스터의 필체였다. 나는 소리 내어 읽었다.','It was the Master’s handwriting. I read it aloud.','d3'),
  say('d3','me','하랑에게. 임대차 계약의 명의는 이미 네 앞으로 바꿔 두었다. 갱신 권리도 10년 치를 등록해 두었다. 가게를 지킬 사람은 건물이 아니라 사람이 정하는 것이다.','To Harang. I have already moved the lease into your name, and registered ten years of renewal rights. It is people, not buildings, who decide who keeps a place.','d4'),
  say('d4','seoyun','…명의 이전과 갱신권 등록. 서류가 완벽해요. 건물주는 월세를 올릴 수 없고 퇴거도 요구할 수 없어요.','…A transfer of the lease and registered renewal rights. The papers are perfect. The landlord can’t raise the rent or demand you leave.','d5',{hearts:{seoyun:1}}),
  say('d5','taesik','야, 이거 22년 동안 본 계약서 중에 제일 깔끔하네!','Hey, this is the cleanest contract I’ve seen in twenty-two years!','e_cel'),

  /* celebration */
  {id:'e_cel',t:'enter',who:'taesik',seat:'g0',also:ALL.filter(a=>a.who!=='taesik'),next:'d6'},
  nar('d6','태식이 카운터 위의 소주병 뚜껑을 비틀었다. 딸깍. 닫혀 있던 병이 처음으로 열렸다.','Taesik twisted the cap off the soju bottle on the counter. Click. The sealed bottle was opened for the first time.','d7'),
  say('d7','taesik','열 일이 생겼네요. ……다들 한 잔씩 하죠. 사장님이 쏘는 걸로.','Something to celebrate at last. …A round for everyone. On the boss.','rec_all'),
  {id:'rec_all',t:'recommend',who:'taesik',hint:{ko:'다 같이 건배할 한 잔 · 모두가 좋아할 만한',en:'A toast for everyone · a crowd-pleaser'},fail:'t_m',
   cands:[
    cand('neat','miss','건배용으로는 너무 독해요. 다들 한 모금에 눈물 나겠어요.','Too strong for a toast. Everyone will tear up after one sip.'),
    cand('highball','good','캬— 이거지! 다 같이 마시기 딱 좋네요.','Ahh— that’s it! Perfect for drinking together.'),
    cand('mojito','ok','시원하네요. 다만 건배하기엔 좀 가볍네요.','Refreshing. A bit light for a toast, though.'),
    cand('espressomartini','miss','건배하고 밤을 샐 수는 없죠.','We can’t toast and then stay up all night.'),
    cand('moscowmule','good','톡 쏘는 게 축하하는 기분이에요!','That fizz feels like celebrating!'),
    cand('tomcollins','ok','길게 마시는 건 좋은데, 오늘은 좀 더 진하면 좋겠어요.','A long drink is nice, but tonight I’d like it a bit stronger.'),
    cand('faust','miss','이건 건배하다 다 쓰러지겠어요.','Everyone would collapse mid-toast.'),
    cand('velvetrose','miss','장미는… 이 멤버에겐 좀 아닌 것 같네요.','Rose… doesn’t quite suit this crowd.')],
   react:{3:'t_r3',2:'t_r2',1:'t_r1'}},
  say('t_m','taesik','…이건 아니네요. 축하는 한 잔 더 있어야겠어요.','…This isn’t it. A celebration needs another round.','l_x_ts3'),
  {id:'l_x_ts3',t:'leave',who:'taesik',next:'ov_cel'},
  over('ov_cel','e_cel'),
  say('t_r3','taesik','……건배! 가게를 위해, 사장님을 위해!','…Cheers! To the bar, to the boss!','cp1',{hearts:{taesik:1},flag:'toast_ok'}),
  say('t_r2','taesik','건배! 맛은 좀 아쉽지만 마음은 최고예요.','Cheers! The taste is so-so, but the spirit is the best.','cp1'),
  say('t_r1','taesik','……건배. 분위기가 좋으니까 괜찮아요.','…Cheers. The mood is good, so it’s fine.','cp1'),

  /* the title */
  nar('cp1','축하의 소란 속에서 서윤이 노트를 꺼냈다. 피아노 앞의 윤하가 숨을 멈춘다.','In the noise of the celebration, Seoyun took out her notebook. At the piano, Yunha held her breath.','cp2'),
  say('cp2','seoyun','……저, 제목을 지어 봤어요. 그 곡이요.','…I came up with a title. For that piece.','cp3'),
  say('cp3','yunha','……!','…!','cp4'),
  say('cp4','seoyun','근데 직접 말할 자신이 없어서… 어떻게 해야 할까요?','But I’m not confident saying it myself… what should I do?','c5'),
  {id:'c5',t:'choice',opts:[
    opt('“제가 대신 전해 드릴게요.”','“I’ll deliver it for you.”','cp_x1'),
    opt('“제목은 노트에서 직접 읽어 주세요. 윤하 씨는 그 곡을 몇 달째 치고 있잖아요.”','“Read the title yourself from your notebook. Yunha’s been playing that piece for months.”','cp_a',{right:true}),
    opt('“제목은 ‘서윤♥윤하’로 하죠! 제가 마이크 가져올게요!”','“Let’s call it ‘Seoyun♥Yunha’! I’ll fetch the mic!”','cp_x2')]},
  say('cp_x1','seoyun','……그렇죠. 대신 전해 주시는 게 편하겠죠.','…Right. It would be easier if you did.','cp_x1n'),
  nar('cp_x1n','서윤은 노트를 덮었다. 용기는 대신 전해 줄 수 없는 것이다.','Seoyun closed the notebook. Courage is not something you can deliver for someone.','l_x_sy2'),
  {id:'l_x_sy2',t:'leave',who:'seoyun',next:'ov_cel'},
  say('cp_x2','yunha','마이크요?! 아니에요, 아니에요, 아니에요!','A mic?! No, no, no!','cp_x2n'),
  nar('cp_x2n','윤하는 얼굴이 빨개진 채 악보를 끌어안고 도망쳤다.','Yunha fled with a flushed face, clutching her sheet music.','l_x_yh3'),
  {id:'l_x_yh3',t:'leave',who:'yunha',next:'ov_cel'},
  say('cp_a','seoyun','(숨을 고르고 노트를 펼쳐 읽는다) “첫 번째 안부.”','(taking a breath, reading from the notebook) “First Regards.”','cp_b',{hearts:{bond:2,seoyun:1},flag:'bond_title'}),
  say('cp_b','yunha','……안부. 맞아요. 이 곡은 처음부터, 누군가에게 안부를 묻는 곡이었어요.','…Regards. Yes. From the very start, this piece was a way of asking after someone.','cp_c',{hearts:{yunha:1}}),
  nar('cp_c','윤하가 피아노 의자에 앉아 곡의 마지막 소절을 처음으로 이어서 쳤다. 이제 제목이 있는 곡이다.','Yunha sat at the piano and played the final bars through for the first time. A piece with a title now.','cp_d'),
  say('cp_d','kkangi','…야, 나 지금 눈에 뭐 들어간 거 같아.','…Hey, I think something just got in my eye.','cp_e'),
  say('cp_e','yoonjae','…저희 기사님이랑 같은 증상이네요.','…The same symptom as our driver.','l_kk'),
  {id:'l_kk',t:'leave',who:'kkangi',next:'l_yj'},
  {id:'l_yj',t:'leave',who:'yoonjae',next:'l_ts'},
  {id:'l_ts',t:'leave',who:'taesik',next:'l_sy'},
  {id:'l_sy',t:'leave',who:'seoyun',next:'l_yh'},
  {id:'l_yh',t:'leave',who:'yunha',next:'cl1'},

  nar('cl1','마감. 얼음이 반쯤 녹은 잔들이 카운터에 놓여 있다. 이 가게는 오늘 처음으로, 건물이 아니라 사람으로 서 있었다.','Closing time. Half-melted glasses stand on the counter. For the first time today, this bar stood on people rather than on a building.','cl2'),
  {id:'cl2',t:'close',title:{ko:'여섯째 밤',en:'The Sixth Night'},
   note:{ko:'마스터의 노트 6페이지 — 비어 있다. 아니, 이제 이 가게의 단골들이 채우고 있다.',en:'Master’s notebook, page 6 — blank. No, the regulars are filling it in now.'}}
];

const FACE={ts1:'sad',ts_x1:'sad',ts_x2:'surprised',ts_a:'neutral',all0:'surprised',all1:'neutral',all2:'neutral',all4:'smile',yj_x1:'sad',yj_x2:'surprised',yj_a:'smile',s3:'angry',k_x1:'angry',k_x2:'smile',k_a:'smile',
  yh1:'sad',yh_x1:'sad',yh_x2:'surprised',yh_a:'smile',d4:'smile',d5:'smile',d7:'smile',t_r3:'smile',t_r2:'smile',t_r1:'neutral',t_m:'sad',cp2:'smile',cp3:'surprised',cp4:'sad',cp_x1:'sad',cp_x2:'surprised',cp_a:'smile',cp_b:'smile',cp_d:'sad',cp_e:'sad'};
export const GRAPH6={};
NODES.forEach(n=>{GRAPH6[n.id]=n;if(FACE[n.id])n.face=FACE[n.id];});
export const NIGHT6={n:6,entry:'o1',graph:GRAPH6,title:{ko:'여섯째 밤',en:'The Sixth Night'},
  desc:{ko:'월세 세 배, 피아노 의자의 서랍, 그리고 제목이 생긴 곡.',en:'Triple rent, a drawer in the piano bench, and a piece that finally gets a title.'}};
