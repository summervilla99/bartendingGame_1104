# Courte Studio

어두운 마호가니 톤의 고급 라운지 바에서 걸어 다니며 칵테일을 만들고 손님과 이야기하는 3D 바텐딩 게임 (프로토타입).

- WASD로 바를 돌아다니다가 카운터 안쪽으로 들어가 `E`를 누르면 바텐더 시점으로 바뀌어요.
- 재료 붓기 → 셰이크/스터 → 따르기 → 가니시 → 서빙 → 별점과 팁
- 칵테일마다 어울리는 잔이 따로 있어요 (더블 록스, 올드 패션드, 쿠페, 마가리타, 닉앤노라, 하이볼).
- three.js (r128) + Vite. 에셋 파일 없이 코드로 만든 지오메트리, 캔버스 텍스처, WebAudio 소리만 써요.

```bash
npm install
npm run dev
```

## 온라인 방 (Supabase Realtime)

`.env.example` 을 `.env.local` 로 복사해 Supabase 프로젝트의 URL 과 **publishable 키**를 넣으면 기기 간 방이 동작해요. 비워 두면 같은 브라우저의 탭끼리만 연결돼요(`?net=local` 로 강제할 수도 있어요). secret 키는 절대 넣지 마세요.

```bash
npm test   # 단위 테스트 (네트워크 필요 없음)
```
