import {ING,serveOf} from './data.js';

/* Detailed, per-recipe know-how shown in the order menu's detail card: what to watch for while making it, what makes it taste better, and the common mistake.
   Classics have hand-written notes; every other recipe gets notes assembled from its method, glass and ingredients so none is ever empty. All strings are {ko,en}. */
const N=(ko,en)=>({ko,en});

const HAND={
  negroni:{watch:N('세 재료를 같은 양(30ml)으로. 믹싱 글라스에 얼음을 넉넉히 넣고 20~30초 저어 충분히 차갑게 만들어요.','Equal parts (30 ml each). Stir with plenty of ice for 20–30 seconds until properly cold.'),
    taste:N('큰 얼음 하나에 따르면 천천히 희석돼 끝까지 맛이 유지돼요. 오렌지 껍질을 잔 위에서 비틀어 향을 입히세요.','Pour over one large cube so it dilutes slowly. Twist the orange peel over the glass to add its oils.'),
    mistake:N('흔들면 탁하고 묽어져요. 쓴맛이 강하다고 베르뭇을 빼면 균형이 무너져요.','Shaking makes it cloudy and thin. Cutting the vermouth to soften the bitterness breaks the balance.')},
  daiquiri:{watch:N('라임은 꼭 생과즙으로, 시럽까지 재서 넣어요. 얼음과 함께 아주 차갑게 흔든 뒤 얼음 없이 쿠페에 따라요.','Use fresh lime and measure the syrup too. Shake hard with ice, then strain into a coupe with no ice.'),
    taste:N('잔을 미리 차갑게 해 두면 마지막 모금까지 시원해요. 너무 시면 시럽을 5ml 더해 보세요.','Chill the glass first so the last sip is as cold as the first. If it is too sharp, add 5 ml more syrup.'),
    mistake:N('시판 라임주스나 오래 둔 주스는 쓴맛이 나요. 흔들기를 덜 하면 차갑지도 부드럽지도 않아요.','Bottled or old lime juice turns bitter. An under-shaken daiquiri is neither cold nor smooth.')},
  oldfashioned:{watch:N('설탕과 비터스에 위스키를 더해 20초쯤 저어요. 큰 얼음 하나를 넣고 오렌지 껍질을 짜 마무리해요.','Stir the whiskey with sugar and bitters for about 20 seconds, add one large cube, and finish with an orange peel.'),
    taste:N('얼음이 녹으며 맛이 열려요. 천천히 마시며 향의 변화를 느껴 보세요.','As the ice melts, the flavour opens. Sip slowly and notice how the aroma changes.'),
    mistake:N('셰이크하면 흐려지고 질감이 사라져요. 설탕을 너무 많이 넣으면 위스키 맛이 가려져요.','Shaking clouds it and ruins the texture. Too much sugar hides the whiskey.')},
  margarita:{watch:N('라임은 생과즙으로. 얼음과 함께 힘차게 흔들어요. 소금은 잔 바깥쪽 가장자리에만 묻혀요.','Fresh lime only. Shake hard with ice. Salt only the outside edge of the rim.'),
    taste:N('트리플 섹이 단맛과 오렌지 향을 더해요. 데킬라는 100% 아가베를 쓰면 훨씬 깔끔해요.','Triple sec adds sweetness and orange aroma. A 100% agave tequila makes it far cleaner.'),
    mistake:N('소금을 잔 안쪽까지 묻히면 모든 모금이 짜져요. 라임이 모자라면 달기만 한 술이 돼요.','Salt on the inside of the rim makes every sip salty. Too little lime leaves it merely sweet.')},
  manhattan:{watch:N('위스키 2 : 베르뭇 1에 비터스. 얼음과 함께 25초쯤 저어 맑고 차갑게 만든 뒤 쿠페에 따라요.','Two parts whiskey to one vermouth plus bitters. Stir about 25 seconds with ice and strain into a coupe.'),
    taste:N('좋은 베르뭇은 개봉 후 냉장 보관해야 향이 살아 있어요. 체리 하나로 마무리하세요.','Keep opened vermouth in the fridge so it stays fresh. Finish with a single cherry.'),
    mistake:N('젓는 시간이 짧으면 독하고 뜨뜻해요. 오래 둔 상한 베르뭇은 시큼한 맛을 내요.','Too little stirring leaves it harsh and warm. Stale vermouth tastes sour.')},
  whiskeysour:{watch:N('레몬, 시럽, 위스키를 얼음과 힘차게 흔들어요. 얼음 위에 따라 체리로 마무리해요.','Shake whiskey, lemon and syrup hard with ice, pour over fresh ice and add a cherry.'),
    taste:N('오래 흔들수록 질감이 부드러워져요. 레몬과 시럽은 3 : 2 정도가 기준점이에요.','The longer you shake, the silkier it gets. Lemon to syrup around 3 : 2 is a good starting point.'),
    mistake:N('레몬이 많으면 입이 오그라들고, 시럽이 많으면 느끼해요. 반드시 재서 넣으세요.','Too much lemon puckers; too much syrup cloys. Always measure.')},
  boulevardier:{watch:N('버번, 캄파리, 베르뭇을 얼음과 저어 큰 얼음 위에 따라요. 오렌지 껍질로 향을 더해요.','Stir bourbon, Campari and vermouth with ice and pour over a large cube. Add an orange peel.'),
    taste:N('네그로니보다 묵직하고 따뜻해요. 버번은 너무 거칠지 않은 것으로 고르세요.','Heavier and warmer than a Negroni. Choose a bourbon that is not too rough.'),
    mistake:N('버번이 너무 많으면 캄파리의 개성이 사라져요.','Too much bourbon buries the Campari.')},
  tomcollins:{watch:N('진, 레몬, 시럽을 먼저 섞고 얼음 가득 채운 잔에 따른 뒤 소다로 마무리해요.','Build gin, lemon and syrup first, add ice, and top with soda.'),
    taste:N('소다는 차갑게, 마지막에 살짝만. 레몬 휠을 얹으면 향이 더해져요.','Keep the soda cold and add it last. A lemon wheel adds aroma.'),
    mistake:N('소다를 세게 따르거나 휘저으면 탄산이 날아가요.','Pouring soda hard or stirring it flat kills the fizz.')},
  mojito:{watch:N('민트는 찢지 말고 살짝 눌러 향만 내요. 얼음을 가득 채우고 소다는 마지막에 넣어요.','Press the mint gently, never shred it. Pack with ice and add soda last.'),
    taste:N('민트 줄기는 쓴맛이 나니 잎만 쓰고, 마지막에 민트를 손바닥으로 톡 쳐서 향을 깨워 올려요.','Stems turn bitter, so use leaves only; slap the garnish mint between your palms to wake its aroma.'),
    mistake:N('민트를 으깨면 풀맛이 나요. 얼음이 적으면 금방 밍밍해져요.','Crushed mint tastes grassy. Too little ice and it goes weak fast.')},
  americano:{watch:N('캄파리와 베르뭇을 같은 양으로 넣고 소다를 얹어요. 얼음 위에서 한 번만 저어요.','Equal Campari and vermouth over ice, topped with soda, stirred once.'),
    taste:N('식전에 가볍게 마시기 좋아요. 오렌지 슬라이스나 껍질로 향을 더하세요.','A light aperitif. Add an orange slice or peel for aroma.'),
    mistake:N('소다를 너무 많이 넣으면 쓴맛이 흐려지고 밍밍해요.','Too much soda waters down the bitterness.')},
  cosmopolitan:{watch:N('보드카, 트리플 섹, 라임, 크랜베리를 얼음과 흔들어 쿠페나 마티니 잔에 따라요.','Shake vodka, triple sec, lime and cranberry with ice and strain into a stemmed glass.'),
    taste:N('크랜베리는 색을 내는 정도만. 오렌지 껍질을 불꽃 위에서 짜면 향이 폭발해요.','Cranberry is for colour only. Flamed orange peel gives a burst of aroma.'),
    mistake:N('크랜베리를 많이 넣으면 단 주스처럼 돼요.','Too much cranberry turns it into sweet juice.')},
  moscowmule:{watch:N('구리 머그에 얼음을 가득 채우고 보드카와 라임, 진저 비어는 마지막에 넣어요.','Fill the mug with ice, add vodka and lime, and ginger beer last.'),
    taste:N('매운 진저 비어를 고르면 개성이 살아요. 머그를 미리 차갑게 해 두세요.','A spicy ginger beer gives it character. Chill the mug first.'),
    mistake:N('진저 비어를 세게 부으면 거품이 넘쳐요.','Pouring ginger beer hard makes it foam over.')},
  martini:{watch:N('진과 드라이 베르뭇을 차가운 믹싱 글라스에서 25~30초 저어요. 레몬 껍질을 잔 위에서 비틀어요.','Stir gin and dry vermouth in a cold mixing glass for 25–30 seconds and twist a lemon peel over it.'),
    taste:N('잔과 진을 냉동고에 두면 한층 맑고 날카로워요. 베르뭇은 적게, 신선한 것으로.','A freezer-cold glass and gin make it clearer and sharper. Use little, fresh vermouth.'),
    mistake:N('흔들면 거품이 생기고 탁해져요. 오래된 베르뭇은 전체 맛을 망쳐요.','Shaking makes it foamy and cloudy. Stale vermouth ruins the whole drink.')},
  sidecar:{watch:N('브랜디, 트리플 섹, 레몬을 얼음과 힘차게 흔들어 얼음 없이 쿠페에 따라요.','Shake brandy, triple sec and lemon hard with ice and strain into a coupe.'),
    taste:N('잔 가장자리에 설탕을 묻히면 새콤함이 부드러워져요(바깥쪽만).','A sugared rim (outside only) softens the sourness.'),
    mistake:N('레몬이 많으면 시기만 하고 브랜디의 깊이가 사라져요.','Too much lemon is all sour and loses the brandy’s depth.')},
  whiterussian:{watch:N('얼음 위에 보드카와 커피 리큐르를 먼저 따르고 크림을 마지막에 얹어요.','Pour vodka and coffee liqueur over ice first, then float the cream.'),
    taste:N('크림을 숟가락 뒷면으로 천천히 따르면 층이 예쁘게 생겨요.','Pour the cream slowly over the back of a spoon for a clean layer.'),
    mistake:N('저으면 층이 사라지고, 크림이 많으면 느끼해요.','Stirring erases the layers; too much cream is heavy.')},
  blackrussian:{watch:N('얼음 위에 보드카와 커피 리큐르를 따라 가볍게 한 번 저어요.','Pour vodka and coffee liqueur over ice and give one gentle stir.'),
    taste:N('커피 리큐르가 달아서 보드카는 넉넉히 잡아야 균형이 맞아요.','Coffee liqueur is sweet, so keep the vodka generous for balance.'),
    mistake:N('얼음이 작으면 금방 녹아 묽어져요.','Small ice melts quickly and waters it down.')},
  gimlet:{watch:N('진, 라임, 시럽을 얼음과 아주 차갑게 흔들어 닉앤노라 잔에 따라요.','Shake gin, lime and syrup very cold and strain into a Nick & Nora.'),
    taste:N('라임은 직접 짠 것으로. 진의 허브 향이 라임과 만나 가장 깨끗하게 드러나요.','Squeeze the lime yourself; the gin’s botanicals show cleanest against it.'),
    mistake:N('시럽을 많이 넣으면 달아서 진의 향이 사라져요.','Too much syrup is cloying and hides the gin.')},
  french75:{watch:N('진, 레몬, 시럽을 흔들어 따르고, 차가운 프로세코를 천천히 얹어요.','Shake gin, lemon and syrup, strain, then top slowly with cold prosecco.'),
    taste:N('프로세코는 아주 차갑게. 레몬 껍질을 비틀어 마지막 향을 더해요.','Keep the prosecco very cold and finish with a lemon twist.'),
    mistake:N('프로세코를 세게 따르면 거품이 넘치고 김이 빠져요.','Pouring prosecco hard makes it foam over and go flat.')},
  aperolspritz:{watch:N('얼음 위에 프로세코, 아페롤, 소다 순서로 따라 한 번만 저어요.','Over ice, add prosecco, then Aperol, then soda, and stir once.'),
    taste:N('오렌지 슬라이스를 곁들이면 향이 살아나요. 큰 와인잔처럼 넉넉한 잔이 어울려요.','An orange slice lifts the aroma; a roomy glass suits it.'),
    mistake:N('아페롤을 너무 많이 넣으면 달고 쓴맛만 남아요.','Too much Aperol leaves only sweet bitterness.')},
  mimosa:{watch:N('차가운 프로세코를 먼저 따르고 오렌지주스를 천천히 더해요.','Pour cold prosecco first, then add orange juice slowly.'),
    taste:N('신선하게 짠 오렌지주스를 쓰면 훨씬 향긋해요. 둘 다 아주 차갑게.','Fresh-squeezed orange juice is far more fragrant. Keep both ice cold.'),
    mistake:N('주스를 먼저 넣고 프로세코를 부으면 거품이 넘쳐요.','Adding prosecco on top of juice makes it overflow.')},
  kirroyale:{watch:N('카시스를 잔 바닥에 먼저 넣고 차가운 프로세코를 천천히 따라요.','Put the cassis in the glass first, then pour cold prosecco slowly.'),
    taste:N('카시스는 아주 조금만. 붉은 색이 은은하게 번지는 모습이 매력이에요.','A little cassis goes a long way; the soft red bloom is the charm.'),
    mistake:N('카시스가 많으면 포도주스처럼 달아요.','Too much cassis turns it into sweet grape juice.')},
  cubalibre:{watch:N('얼음 가득 채운 잔에 럼과 라임을 넣고 콜라를 마지막에 따라요.','In an ice-filled glass add rum and lime, and top with cola.'),
    taste:N('라임 조각을 짜서 잔에 넣으면 콜라 단맛이 정리돼요.','Squeeze a lime wedge in to cut the cola’s sweetness.'),
    mistake:N('콜라를 휘저으면 김이 빠져요.','Stirring flattens the cola.')},
  ginandtonic:{watch:N('얼음을 가득 채운 잔에 진을 따르고 토닉을 천천히 따라 한 번만 저어요.','Fill the glass with ice, add gin, pour tonic slowly and stir once.'),
    taste:N('토닉은 새로 딴 차가운 것으로. 라임 휠을 얹고 잔 가장자리를 한 번 문질러요.','Use fresh cold tonic. Add a lime wheel and run it around the rim.'),
    mistake:N('토닉을 세게 부으면 탄산이 사라져요.','Pouring tonic hard loses the carbonation.')},
  pinacolada:{watch:N('럼, 파인애플, 크림을 얼음과 오래 흔들어 부드러운 질감을 만들어요.','Shake rum, pineapple and cream long and hard for a smooth texture.'),
    taste:N('아주 차갑고 크리미할수록 좋아요. 체리와 파인애플 조각으로 마무리하세요.','The colder and creamier the better. Finish with a cherry and pineapple.'),
    mistake:N('덜 흔들면 크림이 분리되고 얼음 조각이 거슬려요.','Under-shaking leaves it split and icy.')},
  maitai:{watch:N('럼, 트리플 섹, 라임, 시럽을 얼음과 흔들고, 짙은 럼은 마지막에 위에 얹어요.','Shake rum, triple sec, lime and syrup, and float the dark rum on top.'),
    taste:N('민트를 손으로 쳐 향을 깨워 올려요. 라임과 럼의 향이 잔 위에서 먼저 올라와요.','Slap the mint to wake it up so the aroma greets you first.'),
    mistake:N('럼 종류를 섞지 않고 한 가지로만 만들면 깊이가 부족해요.','Using only one rum loses the depth.')},
  longisland:{watch:N('다섯 가지 술을 같은 양으로 넣고 콜라는 마지막에 살짝만 넣어 색을 내요.','Five spirits in equal parts; add only a splash of cola for colour.'),
    taste:N('레몬은 생과즙으로. 얼음을 가득 채워 천천히 마시게 하세요.','Fresh lemon and plenty of ice make it easier to sip.'),
    mistake:N('콜라를 많이 넣으면 술이 약해 보이지만 단 음료가 돼 버려요.','Too much cola hides the strength but makes it syrupy.')},
  paloma:{watch:N('데킬라, 라임, 자몽을 얼음 위에 따르고 소다로 마무리해요.','Over ice, add tequila, lime and grapefruit, then top with soda.'),
    taste:N('소금 림이 자몽의 쌉쌀함을 살려요. 생자몽주스를 쓰면 훨씬 상큼해요.','A salted rim brings out the grapefruit; fresh juice is much brighter.'),
    mistake:N('소다를 너무 많이 넣으면 밍밍해져요.','Too much soda makes it weak.')},
  espressomartini:{watch:N('보드카, 커피 리큐르, 진한 에스프레소를 얼음과 아주 힘차게 흔들어요.','Shake vodka, coffee liqueur and fresh espresso very hard with ice.'),
    taste:N('식힌 에스프레소를 쓰면 더 진해요. 거품 위에 커피콩 세 알을 띄우는 것이 전통이에요.','Chilled espresso is richer. Three beans on the foam is traditional.'),
    mistake:N('덜 흔들면 거품이 생기지 않아요. 따뜻한 에스프레소는 얼음을 녹여 묽어져요.','Under-shaking gives no foam; hot espresso melts the ice and waters it down.')}
};

/* generic notes, assembled from what the recipe is made of */
function auto(r){
  const keys=Object.keys(r.parts),has=a=>keys.some(k=>a.indexOf(k)>=0);
  const watch=[],taste=[],mistake=[];
  if(r.method==='shake'){
    watch.push(N('틴에 얼음을 가득 넣고 10~15초 힘차게 흔들어요. 틴 바깥에 서리가 끼면 충분해요.','Fill the tin with ice and shake hard for 10–15 seconds, until the outside frosts over.'));
    mistake.push(N('덜 흔들면 차갑지도 부드럽지도 않아요.','Under-shaking leaves it neither cold nor smooth.'));
  }else if(r.method==='stir'){
    watch.push(N('얼음과 함께 20~30초 천천히 저어 맑고 차갑게 만들어요.','Stir slowly with ice for 20–30 seconds until clear and cold.'));
    mistake.push(N('흔들면 탁하고 묽어져요.','Shaking makes it cloudy and thin.'));
  }else{
    watch.push(N('섞지 않고 잔에 바로 만들어요. 얼음을 먼저 채우고 순서대로 따라요.','No mixing: build it straight in the glass, ice first, then pour in order.'));
    mistake.push(N('너무 세게 저으면 맛이 섞이기 전에 묽어져요.','Over-stirring waters it down before the flavours join.'));
  }
  if(has(['soda','tonic','ginger','cola','prosecco'])){
    watch.push(N('탄산 재료는 마지막에 천천히 따르고 거의 젓지 마세요.','Add fizzy ingredients last, pour slowly, and barely stir.'));
    mistake.push(N('탄산을 세게 붓거나 젓는 것이 가장 흔한 실수예요(김이 빠져요).','Pouring fizz hard or stirring is the most common mistake: it goes flat.'));
  }
  if(has(['lemon','lime','grapefruit','yuzu'])){
    taste.push(N('과즙은 바로 짠 신선한 것이 가장 좋아요. 너무 시면 시럽을 5ml 더, 너무 달면 과즙을 조금 더하세요.','Fresh-squeezed juice is best. If too sharp, add 5 ml syrup; if too sweet, a touch more juice.'));
  }
  if(has(['cream','creamliq'])){
    watch.push(N('크림이 들어가면 평소보다 오래 흔들어 질감을 매끄럽게 만드세요.','With cream, shake longer than usual to get a smooth texture.'));
  }
  if(has(['coffee','espresso'])){taste.push(N('커피는 식혀서 쓰면 얼음이 덜 녹아 맛이 진해요.','Cooled coffee melts less ice and tastes richer.'));}
  if(r.korean){
    watch.push(N('소주와 막걸리는 도수가 낮아 흔들거나 저을 때 희석을 짧게 하세요.','Soju and makgeolli are lower in alcohol, so keep dilution short.'));
    taste.push(N('아주 차갑게 마실수록 깔끔해요. 재료도 미리 식혀 두세요.','The colder, the cleaner. Chill the ingredients beforehand.'));
  }
  const up=serveOf(r.glass)==='up';
  if(up)taste.push(N('잔을 미리 얼음물로 차갑게 해 두면 마지막 모금까지 시원해요.','Chill the glass with ice water first so the last sip stays cold.'));
  else if(r.noIce)taste.push(N('얼음이 없으니 잔의 향을 먼저 맡고 천천히 마셔요.','With no ice, nose the glass first and sip slowly.'));
  else taste.push(N('얼음은 단단하고 투명한 큰 것이 천천히 녹아 좋아요.','Hard, clear, large ice melts slowly and keeps the drink right.'));
  if(r.garnish&&r.garnish!=='none'){
    taste.push(N('가니시는 향을 더하는 마지막 터치예요. 서빙 직전에 올려요.','The garnish is the last touch of aroma. Add it right before serving.'));
  }
  return {watch,taste,mistake};
}

/* the full detail for one recipe: {watch:[N..], taste:[N..], mistake:[N..], steps:[N..]} */
export function detailOf(r){
  const h=HAND[r.id],a=auto(r);
  const out=h?{watch:[h.watch],taste:[h.taste],mistake:[h.mistake]}:a;
  const ids=Object.keys(r.parts);
  const pour=ids.map(k=>ING[k].name);
  const method=r.method==='shake'?N('셰이커에 얼음과 함께 담아 흔들어요.','Add ice and shake.'):r.method==='stir'?N('믹싱 글라스에서 얼음과 함께 저어요.','Stir with ice in the mixing glass.'):N('섞지 않고 잔에서 바로 완성해요.','No mixing; finish right in the glass.');
  out.steps=[N('재료를 따라요: '+pour.join(' → '),'Pour: '+pour.join(' → ')),method];
  if(r.method!=='build')out.steps.push(N('차가운 잔에 걸러 따라요.','Strain into a chilled glass.'));
  out.steps.push(N('가니시를 올려 서빙해요.','Garnish and serve.'));
  return out;
}
export const SECTION_TITLES={watch:N('만들 때 주의할 점','Watch out for'),taste:N('맛있게 만드는 팁','Tips for better taste'),mistake:N('흔한 실수','Common mistakes'),steps:N('만드는 순서','How it is made')};
