/* What guests say when a drink arrives: nice or funny, depending on the stars. Pure data, picked by a seed so everyone in a room hears the same line. */
const Q=(ko,en)=>({ko,en});
export const QUIPS={
  3:[Q('이거 레시피 좀 알려줄 수 있어요? 완벽해요!','Can I get that recipe? Perfect!'),Q('한 모금에 하루 피로가 싹 풀려요.','One sip and the whole day melts away.'),
     Q('당신 같은 바텐더를 기다렸어요.','I have been waiting for a bartender like you.'),Q('이 맛은 반칙이에요. 한 잔 더!','This is cheating. Another one!'),
     Q('이 순간, 이 노래, 이 술. 완벽해요.','This moment, this song, this drink. Perfect.'),Q('단골 하겠습니다. 진심으로요.','I am becoming a regular. Seriously.'),
     Q('혹시 바 뒤에 마법사가 숨어 있나요?','Is there a wizard hiding behind this bar?'),Q('건배! 오늘 최고의 선택이었어요.','Cheers! Best choice I made today.')],
  2:[Q('꽤 좋은데요? 다음엔 더 기대할게요.','Pretty good! I will expect more next time.'),Q('맛있어요. 조금만 더 다듬으면 완벽해요.','Tasty. A little polish and it is perfect.'),
     Q('오, 괜찮은데요! 한 잔 더 해도 되겠어요.','Oh nice! I could go for another.'),Q('균형이 좋네요. 손맛이 있어요.','Nicely balanced. You have a good hand.'),
     Q('오늘 하루가 조금 나아졌어요.','My day just got a little better.'),Q('이 정도면 합격이에요!','That is a pass in my book!')],
  1:[Q('음… 나쁘지 않아요. 노력은 인정!','Hmm, not bad. I appreciate the effort!'),Q('조금 달았나? 아니, 조금 셌나? 어쨌든 마실게요.','A bit sweet? A bit strong? Either way, cheers.'),
     Q('괜찮아요, 누구나 처음엔 그렇죠.','It is fine, everyone starts somewhere.'),Q('다음 잔을 기대해 볼게요.','I will look forward to the next one.'),
     Q('이거… 제가 주문한 거 맞죠?','This is... what I ordered, right?')],
  0:[Q('이건 칵테일이라기보단 추억의 맛인데요.','This tastes more like a memory than a cocktail.'),Q('일단 마셔 볼게요. 용기를 내서요.','I will drink it. With courage.'),
     Q('레시피를 한 번 더 볼까요? 도와드릴게요.','Shall we look at the recipe again? I will help.'),Q('괜찮아요. 오늘은 물이 제일 맛있는 날이에요.','It is okay. Today water is the best drink.'),
     Q('독특한 시도네요?','Quite the experimental take!')]
};
export const RECIPE_QUIPS={
  negroni:Q('쌉쌀함이 딱 제 취향이에요.','Bitter and balanced, just how I like it.'),mojito:Q('민트 향이 여름 같아요.','The mint tastes like summer.'),
  margarita:Q('소금 림이 포인트네요!','That salted rim is the star!'),oldfashioned:Q('클래식은 역시 클래식이에요.','A classic is a classic.'),
  manhattan:Q('맨해튼의 야경이 떠올라요.','It makes me think of Manhattan at night.'),daiquiri:Q('라임이 상큼해요, 휴가 온 기분!','Zesty lime, it feels like a holiday!'),
  espressomartini:Q('이거면 오늘 밤은 잠 못 자겠네요.','I will not sleep tonight after this.'),highball:Q('탄산이 시원해요!','So refreshing and bubbly!'),
  moscowmule:Q('구리 머그가 멋져요.','Love the copper mug.'),cosmopolitan:Q('핑크빛이 예뻐요.','That pink is gorgeous.')
};
export function quip(stars,seed,recipeId){
  const n=Math.abs(seed|0),arr=QUIPS[stars]||QUIPS[1];
  if(stars>=2&&RECIPE_QUIPS[recipeId]&&n%3===0)return RECIPE_QUIPS[recipeId];
  return arr[n%arr.length];
}
