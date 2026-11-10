/* Everyone in the tale: names, speaker colours, where they sit, how they look and what they bring. */
export const CHARS={
  me:{name:{ko:'하랑',en:'Harang'},seat:null},
  bond:{name:{ko:'서윤 × 윤하의 인연',en:'Seoyun × Yunha bond'}},
  kkangi:{name:{ko:'강태산',en:'Kang Taesan'},intro:{ko:'말과 속마음이 반대인 헬멧 손님',en:'The helmet guest whose words say the opposite of what they mean'},seat:'g1',tone:'#c9b27a',prop:'helmet',
    look:{name:'깡이',skin:0xc9936f,top:0x1b1b1e,shirt:0xdcd7cc,pants:0x1c2230,hair:0x0d0b0b,slick:true,glasses:0x0b0b0c,earring:0xd8d8dc,necklace:0xd4af37,shoes:0xf0efe9,lip:0x6a2a26,w:1.08,h:1.01,sheen:true}},
  yoonjae:{name:{ko:'도윤재',en:'Do Yoonjae'},intro:{ko:'제일 비싼 것만 찾는 재벌 3세',en:'The heir who only asks for the most expensive thing'},seat:'g2',tone:'#9fb4d9',prop:'watchbox',
    look:{name:'윤재',skin:0xeed1b8,top:0x1b2848,shirt:0xf5f2ea,tie:0x9a7a2e,pants:0x1b2848,hair:0x3a281e,slick:true,lapel:0x121c38,watch:true,sheen:true,shoes:0x1a1010,lip:0x7a3a34,w:.95,h:1.04}},
  master:{name:{ko:'마스터',en:'The Master'},intro:{ko:'Coda의 주인, 20년 동안 이 문을 연 사람',en:'Coda’s owner, who opened this door for twenty years'},seat:'g1',tone:'#c9a066',prop:'key',
    look:{name:'마스터',skin:0xe2bd9c,top:0x3b2b24,shirt:0xe9e0cc,tie:0x6b2a2a,pants:0x2a2420,hair:0xe6e2dc,bald:true,glasses:0x6a5a3a,lapel:0x2a1c16,watch:true,belly:true,shoes:0x1c1410,lip:0x7a3a34,w:1.02,h:.97}},
  yunha:{name:{ko:'윤하',en:'Yunha'},intro:{ko:'밤마다 피아노 앞에 앉는 사람',en:'The one who sits at the piano every night'},seat:'piano',tone:'#d9a3b8',
    look:{name:'윤하',skin:0xeac6a8,top:0x2a1a30,pants:0x2a1a30,hair:0x6b3a28,long:true,dress:true,sheen:true,earring:0xd9b46a,lip:0xa03a48,w:.9,h:1.0,shoes:0x15101a}},
  seoyun:{name:{ko:'한서윤',en:'Han Seoyun'},intro:{ko:'30대 중후반쯤으로 보이는 손님. 왠지 모를 고독함을 지니고 있다.',en:'A guest in her mid-to-late thirties, with a loneliness she does not explain.'},seat:'g2',tone:'#e7c9a0',prop:'notebook',
    look:{name:'서윤',skin:0xf0d2ba,top:0x15151b,shirt:0xf7f2ea,pants:0x15151b,hair:0x180f12,bob:true,sheen:true,lapel:0x0b0b0f,earring:0xf3eee4,necklace:0xc9a066,shoes:0x0b0b0d,lip:0x8a2a34,w:.9,h:1.03}},
  taesik:{name:{ko:'박태식',en:'Park Taesik'},intro:{ko:'술기운에 볼이 발갛게 달아올라 있다.',en:'His cheeks are flushed red from drink.'},seat:'g1',tone:'#d9a486',prop:'soju',
    look:{name:'태식',blush:0xd23b3b,skin:0xd9957c,top:0x6b6c71,shirt:0xe9e4d8,tie:0x7a2a2a,loose:true,pants:0x47484d,hair:0x8c8a86,bald:true,lapel:0x55565b,glasses:0x2b2b2e,watch:true,belly:true,shoes:0x2a1c14,lip:0x7a3a34,w:1.12,h:.97}}
};
/* One short flavour line per drink, shown on the recommendation buttons. */
export const FLAVOR={
  negroni:{ko:'쓰고 진한 클래식',en:'Bitter, bold classic'},americano:{ko:'쌉쌀하고 가벼운',en:'Bittersweet and light'},
  manhattan:{ko:'묵직한 위스키 스터',en:'Weighty stirred whiskey'},daiquiri:{ko:'새콤달콤 럼',en:'Tart and sweet rum'},
  moscowmule:{ko:'생강 톡 쏘는',en:'Spicy ginger fizz'},mojito:{ko:'민트 청량',en:'Minty and fresh'},
  highball:{ko:'시원한 위스키 소다',en:'Cold whiskey and soda'},gimlet:{ko:'깔끔한 라임 진',en:'Crisp lime gin'},
  oldfashioned:{ko:'진한 위스키 한 모금',en:'A slow whiskey sip'},espressomartini:{ko:'달콤한 커피',en:'Sweet coffee kick'},
  cosmopolitan:{ko:'새콤한 핑크',en:'Tart and pink'},boulevardier:{ko:'위스키 베이스의 쓴 네그로니',en:'A whiskey Negroni'},
  whiskeysour:{ko:'새콤한 위스키',en:'Tart whiskey'},neat:{ko:'얼음 없이 위스키 그대로',en:'Straight whiskey, no ice'},faust:{ko:'달콤한 카시스 뒤에 숨은 독한 럼',en:'Strong rum hiding behind sweet cassis'},velvetrose:{ko:'장미 향의 달콤한 칵테일',en:'Sweet and rosy'},
  courtenoir:{ko:'가게의 이름을 건 쌉쌀하고 진한 한 잔',en:'The house drink: dark and bittersweet'},
  sojufizz:{ko:'소주에 레몬과 소다, 가볍게',en:'Soju, lemon and soda, light'},sojutonic:{ko:'소주에 토닉, 깔끔하게',en:'Soju with tonic, clean'},sojunegroni:{ko:'소주로 만든 쌉쌀한 네그로니',en:'A Negroni made with soju'},grapefruitsoju:{ko:'달콤한 자몽 소주',en:'Sweet grapefruit soju'},
  martini:{ko:'진과 베르뭇만, 아주 독한',en:'Just gin and vermouth, very strong'},mudslide:{ko:'크림 리큐르의 디저트 칵테일',en:'A creamy dessert cocktail'},pinacolada:{ko:'파인애플과 크림의 열대 칵테일',en:'Tropical pineapple and cream'},
  cubalibre:{ko:'럼과 콜라에 라임',en:'Rum and cola with lime'},mexicanmule:{ko:'데킬라와 진저 비어',en:'Tequila and ginger beer'},ginandtonic:{ko:'진과 토닉',en:'Gin and tonic'},seabreeze:{ko:'크랜베리와 자몽의 롱드링크',en:'Cranberry and grapefruit long drink'},goldrush:{ko:'꿀을 넣은 위스키 사워',en:'A honeyed whiskey sour'},ginrickey:{ko:'설탕 없는 진 라임 소다',en:'Sugar-free gin, lime and soda'},
  poinsettia:{ko:'크랜베리와 프로세코의 크리스마스',en:'Christmas in cranberry and prosecco'},sbagliato:{ko:'진 대신 프로세코를 넣은 네그로니',en:'A Negroni with prosecco'},french75:{ko:'진 사워 위에 거품을 얹은',en:'Gin sour topped with bubbles'},aperolspritz:{ko:'아페롤과 프로세코의 스프리츠',en:'Aperol and prosecco spritz'},longisland:{ko:'네 가지 술이 든 아이스티 모양',en:'Four spirits dressed as iced tea'},maitai:{ko:'두 가지 럼의 열대 칵테일',en:'A two-rum tiki drink'},
  whitenegroni:{ko:'맑고 쌉쌀한 화이트 네그로니',en:'Clear and bitter-floral'},tomcollins:{ko:'레몬과 소다로 길게',en:'Long, lemony and fizzy'}
};

