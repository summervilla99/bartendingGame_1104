# Courte Studio

어두운 마호가니 톤의 고급 라운지 바에서 걸어 다니며 칵테일을 만들고 손님과 네트워킹하는 3D 바텐딩 게임. 지금은 **싱글플레이 프로토타입**이고, 최종 목표는 **온라인 라이브로 같이 바에서 즐기는 것**(걸어 다니는 손님 ↔ 카운터 안의 바텐더 역할 전환). 디자인적 아름다움이 최우선.

사용자는 한국어로 소통한다. 대화는 한국어, 코드 식별자와 주석은 영어. 게임 UI는 **한국어/영어 이중 언어**(기본은 `navigator.language`, 상단 KO/EN 토글로 전환, `localStorage` 저장).

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

디버그: `http://localhost:5173/?debug` 로 열면 `window.__courte` 에 `{S, enterBar, leaveBar, guests, npcs, player, doAction, RECIPES}` 가 노출된다.
소프트웨어 렌더링처럼 프레임이 느린 환경에서는 `?debug&dtmax=0.2` 로 프레임당 시뮬레이션 시간을 늘려 테스트한다(기본 0.05).

## 기술 결정 (바꾸기 전에 읽을 것)

- **three@0.128.0 고정.** 룩이 이 버전의 비-물리 조명, 색 관리 없음(색을 화면 값 그대로 씀) 기준으로 맞춰져 있다. 최신 three로 올리면 조명 세기와 색이 전부 달라지므로 올릴 거면 룩 재튜닝을 각오할 것.
- 애드온은 `three/examples/jsm/...` 에서 import (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass).
- 후처리: 4x MSAA 하프플로트 타깃 → 블룸 → 커스텀 최종 패스(톤 숄더, 비네트, 색수차, 그레인). `src/composer.js`.
- 에셋 파일이 없다. 모든 지오메트리는 코드로 만들고(LatheGeometry 위주), 텍스처는 canvas로 그리고, 소리는 WebAudio로 생성한다.
- 환경맵은 작은 가짜 스튜디오 씬을 PMREM으로 구워서 쓴다(`src/env.js`). 유리, 황동, 액체의 반사가 여기서 나온다.
- 조명: 반구광 + 펜던트 포인트 3 + 키 스포트(그림자) + 네온 핑크 + 틸. 라이트 개수를 늘리면 모바일에서 바로 느려진다.

## 아트 방향

스피크이지/리스닝바 톤의 고급 인테리어. 진한 적갈색 마호가니, 옥스블러드 가죽, 산화된 황동, 검은 대리석 상판, 낮은 호박색 조명. 네온은 백바 위 작은 사인 하나뿐이고 "과하게 휘황찬란하면 싸구려처럼 보인다"는 것이 원칙. 조도는 낮게, 빛은 펜던트/스콘스/촛불 등 국소 광원으로.
바닥은 다크 헤링본, 벽은 다마스크 + 월스콧, 창은 밤 도시 + 벨벳 커튼, 홀 한쪽에 그랜드 피아노 스테이지.

UI는 "미드나잇 글라스": 반투명 다크 유리면(`--glass-2` + blur) + 1px 헤어라인(`--line`) + 황동 포인트. 두꺼운 외곽선/하드 섀도우 스티커 스타일은 폐기했다. 색은 3D 방이 담당하고 UI는 조용하게 둔다.
- 타이틀/칵테일 이름: 세리프(Cormorant Garamond + Noto Serif KR, 이탤릭 포함). 라벨/수치: DM Sans + Noto Sans KR, 작은 대문자 + 넓은 자간, 수치는 tabular-nums. Yellowtail 은 로고 전용. Black Han Sans 는 3D 병 라벨 캔버스에만 쓴다.
- 주요 버튼 = 황동 그라디언트 알약(`.btn.primary`), 보조 = 유리 알약. 활성 상태 = 황동 1px 링 + 옅은 배경.
- 모바일 우선: 상단은 로고 + 팁 + 설정 버튼(언어/음악은 `#settings` 팝오버. 단위 토글은 제거했고 ml · oz 를 항상 함께 표시), 바텐딩 조작은 하단 시트(`.bar-bottom`, 세로 화면에선 전체 폭), 단계는 얇은 스테퍼(`.steps`), 재료 칩은 가로 스크롤 + 스냅. 터치 타깃 44px 이상.
- 방식 색: 셰이크 구리(`--copper`), 스터 세이지(`--sage`), 빌드 황동. 경고 `--tomato`.

색 토큰은 `src/styles.css` 의 `:root` 에 있다.

## 구조

```
index.html          마크업(HUD, 티켓, 결과 카드)
src/
  main.js           씬 구성, 게임 상태(S), 카메라, UI, 주문, 바텐딩 흐름 (아직 큼)
  room.js           바 공간 전체(바닥, 벽, 카운터, 백바, 가구, 피아노, 조명), 충돌 박스 목록
  player.js         3인칭 컨트롤러(WASD/조이스틱, 충돌, 숄더 카메라 + 벽 앞 당김)
  figures.js        관절 캐릭터(makeCharacter), 걷기/앉기 포즈, 팔 2본 IK(reachArm), 손님 구성
  bottles.js        실제 술병(위스키/데킬라/진/럼 등) loft 지오메트리 + 라벨, 백바 인스턴싱
  glass.js          잔 11종(mixing/rocks/tumbler/fashioned/coupe/margarita/nick/highball/collins/mug/martini), 액체 수위, 얼음, 가니시(오렌지/라임/레몬/민트/체리), 셰이커
  session.js        세션 설정(시간대/메뉴 계열/모드/가이드) 정의, 저장, 레시피 풀 필터. 나중에 온라인 방 설정으로 그대로 쓴다
  start.js          "오늘 밤을 골라 주세요" 시작 화면(시간대 선택 시 뒤의 바가 실시간 미리보기)
  game/             순수 게임 규칙(three/DOM 없음, JSON 상태): rng.js 시드 난수, world.js 월드·주문·밤 정산·스냅샷, bartending.js 붓기/섞기/점수
  data.js           재료 20종(INGR, cat=spirit|liqueur|mixer), 레시피 19종(RECIPES, house:true=하우스 오리지널), 가니시, 이름은 전부 {ko,en}
  i18n.js           ko/en 사전, t(key,vars), tr({ko,en}), setLang/onLang, data-i18n 속성 적용
  units.js          ml · oz 병기(fmtVol, fmtRatio, 5ml 미만은 대시). 토글 없음
  audio.js          WebAudio
  composer.js       후처리 체인
  env.js            환경맵
  three-utils.js    canvasTex, M(재질), lathe, hdr
  util.js           clamp, lerp, ease, rand, pick, won
  styles.css        전체 스타일
```

## 게임 흐름

모드: `S.mode` = `'walk'`(맵 자유 이동, 3인칭) | `'bar'`(바텐더 시점 바텐딩). 카운터 안쪽 `BAR_ZONE` 에서 `E` 로 진입, `카운터에서 나가기`/Esc 로 복귀.

바텐딩 단계 `S.stage`:
`pour` → (`mix` → `strain`) → `garnish` → `serve` → `result`
- 빌드 레시피(하이볼)는 `mix`/`strain` 을 건너뛰고 바로 `garnish`.
- `pour`: 재료 칩 또는 선반 위 병을 꾹 누르면 `ING[id].rate` ml/s 로 따라진다. 병이 기울어 따르는 포즈는 `updateBottles`.
- `mix`: 셰이크는 캔버스에서 위아래 드래그(반전 횟수), 스터는 잔 둘레 원 드래그(누적 각도 3바퀴).
- `strain`: 셰이커(불투명 스틸)/믹싱 글라스가 입구(lip)를 축으로 기울어 서빙 잔 위에서 따른다(`poseSource`). 아바타 손은 `reachArm` IK로 따라간다.
- 방식 구분 규칙: 과즙/시럽이 들어가면 `shake`(은색 틴에 붓고 두 번째 틴을 덮어 흔듦, 구리색 배지), 술로만 만들면 `stir`(투명 믹싱 글라스 + 바 스푼, 초록 배지), 섞지 않으면 `build`(서빙 잔에 바로, 황동 배지). 새 레시피는 이 규칙으로 `method` 를 정한다. 주문서 배지/설명은 `why_*` 문구, 단계 이름은 `step_shake`/`step_stir`.
- 점수: 정확도 70% + 섞은 정도 20% + 가니시 10%. 별 3개 ≥ 0.88, 2개 ≥ 0.68, 1개 ≥ 0.45. 팁 = 별 × 3000 + 정확도 × 1000.

바텐딩 카메라 프리셋 `PRE.bar` 는 카운터 뒤(바텐더 시점)에서 손님석을 바라보며, 걷기 카메라는 `player.view` 다. 프리셋은 위치/목표/FOV 외에 `off`(뷰 오프셋 비율)를 가진다. 바 카메라는 작업대를 화면 위쪽에 두고 아래를 HUD에 내주기 위해 `setViewOffset` 으로 장면을 0.2H 위로 올린다. FOV는 16:9 기준 수직 FOV를 받아 화면비에 맞춰 수평 시야를 유지하도록 `fovFor` 가 변환한다.

## 알려진 한계 / 하지 말아야 할 것

- 손님은 전부 NPC. 멀티플레이 없음.
- 3D 모델이 전부 기본 도형이라 사람과 소품이 인형 같다. 가장 큰 퀄리티 상승 지점.
- 바텐딩 중에는 손님 모형을 숨긴다(가까운 자리 손님의 팔이 화면 양옆에 굵게 보여서). 에셋 교체 후 다시 볼 것.
- 소프트웨어 렌더링으로만 검증했다. 실제 GPU에서의 프레임 속도와 모바일 성능은 미확인.
- 소리(음악, 효과음)는 브라우저에서 직접 들어 보고 튜닝한 적이 없다.
- 술 묘사가 있는 게임이므로 출시 시 연령 등급 확인이 필요하다.

## 다음 단계 (제안 순서)

1. **구조 정리**: `main.js` 를 `scene/room.js`, `game/state.js`, `game/bartending.js`, `ui/hud.js` 로 분리. 지금은 상태 `S` 와 DOM 갱신이 한 파일에 섞여 있다.
2. **룩 업그레이드**: Blender에서 카운터, 백바, 스툴, 인물을 모델링하고 조명을 베이킹해 GLB로 내보내기(Draco/KTX2 압축). 코드 지오메트리를 GLB로 교체. 고정 카메라 디오라마 구도를 유지하면 퀄리티를 올리기 쉽다.
3. **멀티플레이**
   - 방 단위 서버(후보: Colyseus, PartyKit/Cloudflare Durable Objects, Node + Socket.IO). 서버가 권위를 가진다.
   - 방 8~12석. 바텐더 스테이션 1~2곳. "칵테일 만들기" 버튼 → 빈 스테이션이 있으면 카메라 이동 + 점유, 없으면 대기열.
   - 동기화 대상: 좌석 점유, 주문, 제조 중인 잔의 상태(재료 ml, 섞은 정도), 서빙 이벤트, 이모트/건배, 채팅.
   - 바텐더가 없을 때는 NPC 바텐더가 대신 만들어 방이 비어 보이지 않게 한다.
   - 음성은 나중에(LiveKit 등).
4. **콘텐츠**: 위스키 모드(니트/온더락/하이볼, 얼음 모양), 전통주/막걸리/소주 베이스 칵테일, 손님 사연과 분위기 주문, 해금/인테리어 꾸미기.
5. **정리**: 접근성(키보드 조작 보강), 모바일 터치 튜닝, 성능 프로파일링(라이트 수, 픽셀 비율).

## 작업 규칙

- 변경 후 `npm run build` 가 통과해야 한다.
- 시각 변경은 스크린샷으로 확인하고 레퍼런스와 비교할 것. 코드만 보고 "예쁘다"고 판단하지 말 것.
- 새 의존성을 넣기 전에 번들 크기와 three@0.128.0 호환을 확인한다.

## 다국어 / 단위 / 모바일 규칙

- 화면에 보이는 문자열은 코드에 직접 쓰지 말고 `i18n.js` 사전(`t('key')`)이나 `{ko,en}` 데이터에 넣는다. 정적 HTML은 `data-i18n`, `data-i18n-html`, `data-i18n-aria`. 새 동적 텍스트는 `main.js` 의 `refreshAll()` 에서 언어/단위 변경 시 다시 그려지게 할 것.
- 용량은 항상 `fmtVol`/`fmtRatio` 로 표시(ml, oz 병기). 내부 값은 ml.
- 재료 칩과 3D 레일은 카테고리 탭(`CATS`)에 따라 해당 병만 보인다(`layoutRail`, `setTab`). 재료를 추가하면 `data.js`(cat, bottle)와 `bottles.js` 스펙을 함께 추가. 레일 한 쪽 최대 5병, 작업 공간(중앙 |x|<0.5)은 비운다.
- 새 칵테일은 잔(`GL`)과 얼음 규칙(`bigIce`/`ice`)을 확인하고, 하우스 오리지널은 `house:true` + `story:{ko,en}`.
- 세로 모바일(화면비 < 0.85)은 별도 코드 경로 없이 `PRE.barP` 카메라, `fovFor` 최대 92°, 레일 간격 축소, CSS `max-aspect-ratio:4/5` / `pointer:coarse` 로 처리한다. 터치 타깃은 44px 이상, 칩은 `touch-action:pan-x`.
- 모바일 실기기 터치/성능은 아직 확인하지 않았다(브라우저 에뮬레이션 375x812 에서만 확인).

## 세션(밤) 규칙

- 설정 객체 `{time, menu, mode, guide}` 는 `session.js` 의 `loadSession/saveSession` 으로 저장된다. 언어/단위는 개인 설정이라 여기에 넣지 않는다(온라인에서도 플레이어별).
- 시간대(`TIMES`): 조명/창밖(`room.setTime`), 손님 수, 주문 간격, 동시 주문 수, 팁 배율, 서비스 모드 목표 잔 수를 정한다. 메뉴 계열(`FAMILIES`)은 손님이 주문하는 레시피 풀.
- 모드: `service`(목표 잔 수 후 정산 카드), `practice`(무제한, 주문서 설명 항상 펼침). `lab` 은 자리만 있고 비활성.
- 가이드 `instinct`: 붓는 중 진행 눈금/현재량을 숨기고 목표량만 보여 준다. 결과 카드는 그대로 수치를 보여 준다.
- `S.paused` 동안(시작 화면, 정산) 주문과 이동이 멈춘다.

## 주문서(티켓) 규칙

- 주문서 본문 순서: 재료 진행(ml · oz) → 잔/가니시 → 방식 이유(`why_*`, 항상 표시) → 이야기(하우스 오리지널) → "알아두면 좋아요"(서빙 방식 `serveOf`, 비율 `ratioOf`, 방식별 시간 `tech_*`, 한 줄 팁 `TIPS`).
- 새 레시피를 추가하면 `data.js` 의 `TIPS` 에 `{ko,en}` 한 줄 팁도 같이 넣는다(없으면 팁 줄만 생략된다).
- 주문서는 `max-height:36dvh` 로 안에서 스크롤된다(화면을 덜 가리려는 의도). 내용을 더 넣을 때 이 높이를 키우지 말 것.

## 게임 로직 / 직렬화 규칙 (온라인 대비)

- **규칙은 `src/game/` 에만 둔다.** three.js, DOM, `window`, `Math.random` 을 쓰지 않는다(난수는 `game/rng.js`, 상태는 `world.rng`). 화면 코드(`main.js`)는 결과를 읽어 그리기만 한다.
- 상태는 항상 JSON 으로 직렬화 가능해야 한다: `world`(밤 전체: 좌석/주문/집계/RNG 상태)와 `drink`(제조 중인 한 잔). `snapshot(world,drink)` / `restore(json)` 로 저장·복원하고, 복원 뒤에도 같은 주문 순서가 이어진다.
- 서버가 생기면 같은 `game/` 함수를 서버에서 돌린다(서버 권위). 클라이언트는 입력(붓기 시작/멈춤, 흔들기 한 번, 서빙)만 보내고 결과 이벤트(`tickOrders` 가 돌려주는 `{seatId,recipeId}` 등)를 받는다.
- 잔 용량은 `data.js` 의 `VESSEL_CAP` 한 곳에서 정의하고 `glass.js` 가 그 값을 쓴다.
- 테스트: `npm test`(Node, 의존성 없음). 레시피 데이터 검증(재료/잔 용량/방식 규칙/팁), 주문 결정성, 점수, 스냅샷 왕복을 검사한다. 새 레시피나 규칙을 바꾸면 반드시 통과시킬 것.
- 재현용: `?debug&seed=7` 로 열면 그 밤의 난수 시드가 고정된다. `window.__courte.snapshot()` 으로 현재 상태 JSON 을 볼 수 있다.
