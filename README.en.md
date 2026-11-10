<div align="center">

# 🍸 Bar Coda

**A 3D bartending game set in a dim mahogany listening lounge: mix cocktails, listen to your regulars, and play it with friends.**

[한국어](README.md) · English

[**▶ Play now**](https://bar-coda.vercel.app)

`Browser · no install · mobile & desktop · Korean / English`

</div>

---

## About

Bar Coda takes its name from the *coda*, the closing passage of a piece of music, and is set in a listening-lounge bar: deep oxblood leather, oxidised brass, low amber light, and a grand piano on one side. The goal is **a quiet, refined atmosphere** rather than anything flashy.

Walk around the bar, step behind the counter to switch to the bartender's view, and pour, shake, stir and garnish the drinks your guests order. Make them well and you earn stars and tips; listen to your regulars and you follow a story that runs over seven nights.

## How to play

Pick one of three ways to play when the game opens.

| Mode | Description |
| --- | --- |
| **Story** | Talk with your regulars, choose the drink that fits their mood, and follow a seven-night story. Solo only. |
| **With friends** | Open a room and invite friends by link or a 5-character code. Switch between a guest walking around and the bartender behind the counter. Up to 8 people. |
| **Cocktail practice** | Serve guests alone and learn the recipes. Choose the hour of the night, the menu family and a time limit. |

### Making a drink

`Pour → shake / stir → strain → garnish → serve → stars and tip`

- **Pour**: press and hold an ingredient chip or a bottle on the shelf and it tilts and pours. Amounts are shown in ml and oz together.
- **Three methods**: anything with juice or syrup is **shaken** (shake the tin so the ice rattles), spirit-only drinks are **stirred** (draw circles with a bar spoon in a mixing glass), and drinks that are not mixed are **built** straight in the glass.
- **Scoring**: accuracy 70% + how well it was mixed 20% + garnish 10%, which gives one to three stars and a tip.
- 73 cocktails (3 house originals, 12 Korean-spirit drinks, 6 Christmas specials), 41 ingredients and 11 glasses. In practice mode you can pick any cocktail to make. Each recipe has its own glass and ice rule, and the order ticket lists the serve, the reason for the method and a tip, so **you can learn as you go even if you have never bartended.**

## Features

- 🎬 **A seven-night story plus four epilogue nights**: dialogue, choices, mood orders (pick a drink for how they feel), relationship hearts, and **three endings** that depend on the Seoyun × Yunha bond. Nights 6 and 7 include 3D still cuts.
- 👫 **Online rooms**: you see a friend making a drink live (the bottle tilts, the glass fills, the shaker shakes). Sitting down, chat (with a scrollable history), emotes (cheers, wave, clap, bow, dance, jump) and a photo mode are included.
- ⏱ **Time limit**: none, 60, 45 or 30 seconds, switchable from the start menu and the in-game settings. Playing solo, the guest leaves; with friends, the bartender is fired.
- 🎁 **Combos, regulars and rushing guests**: two or more stars in a row earn a combo bonus, three stars twice for the same guest makes them a regular, and a rushing guest tips 1.5×.
- 📒 **Bar notebook**: guests pin a polaroid to the guestbook when you earn three stars, and you collect a coaster for every cocktail you make.
- 🐈 **Counter cat**: jumps for joy or turns away depending on how the drink turned out.
- 🪄 **Bar decor**: unlock light colours, wall art and coasters with lifetime tips; in a room the host's taste shows for everyone.
- 🥂 **Joint toast and buying a drink**: cheer together for a tip bonus, or send the working bartender a drink.
- 🎄 **Christmas decor**: a tree, garlands, a wreath, snow and Santa hats (switchable in settings, and not shown in the story).
- 🎵 **Live music**: jazz, classical and house are synthesised on the fly. Sit at the piano to change the genre.
- 🌗 **Hours of the night**: golden hour, prime time, last call. Lighting, the view outside, the number of guests and the tip multiplier all change.
- 📱 **Mobile first**: portrait layout, a touch joystick, pinch to zoom, and touch targets of 44px or more.
- 🌐 **Korean / English**: KO/EN toggle at the top, following your device language by default.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | `W` `A` `S` `D` (run with `Shift`) | Left joystick |
| Look | Mouse drag | Drag the screen |
| Interact (start bartending, sit, talk) | `E` | On-screen button |
| Emotes | `1`–`6`, jump with `Space` | Act / Dance / Jump buttons |
| Chat | `Enter` to open, `Esc` to close | Chat button |
| Zoom | Mouse wheel | Two-finger pinch |
| Leave the counter | `Esc` | ✕ button |

## Tech

- **three.js r128 + Vite**, vanilla JS, no framework.
- **No asset files.** Models are geometry built in code, textures are drawn on canvas, and sound and music are synthesised with WebAudio. The build is about 1 MB.
- Post-processing: 4x MSAA half-float, then bloom, tone shoulder, vignette, chromatic aberration and grain. The environment map is a small fake studio scene baked with PMREM, which gives the reflections on glass, brass and liquid.
- **Game rules live only in `src/game/`** (no three.js or DOM, JSON-serialisable); the screen just draws their results. The same rules are meant to run on a server later.
- Online: a host-authoritative model. The transport layer is a single interface with two implementations: BroadcastChannel (tabs in the same browser) and **Supabase Realtime** (across devices). Every message that arrives from the network is validated and cleaned before use.
- The story is a pure-data dialogue graph (`src/story/`), and rules, networking and story are all covered by Node tests.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # creates dist/
npm test         # unit tests (no network needed)
```

URL options for development:

| URL | Purpose |
| --- | --- |
| `/?debug` | Exposes game state and functions on `window.__courte` |
| `/?debug&seed=7` | Fixes the night's random seed |
| `/?debug&dtmax=0.2` | Raises the simulated time per frame on slow machines |
| `/?net=local` | Forces online rooms to connect tabs in the same browser only |
| `/?room=ABCDE` | Joins a room directly by code |

### Online rooms (optional)

Cross-device rooms use [Supabase](https://supabase.com) Realtime. Without it the game still works, and only tabs in the same browser connect to each other.

1. Copy `.env.example` to `.env.local`.
2. Put your project's URL and its **publishable (anon) key** into `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`.
3. To check against the real server: `SUPABASE_URL=… SUPABASE_KEY=<publishable> npm test`

> ⚠️ **Never put a secret / service_role key in code, `.env*` files or commits.** The client only uses the publishable key, and `.env.local` is excluded from git.

## Project structure

```
index.html          markup (HUD, order ticket, result card)
src/
  main.js           scene setup, game state, camera, UI, the bartending flow
  room.js           the whole bar (floor, walls, counter, back bar, furniture, piano, lights)
  figures.js        articulated characters, walk/sit poses, arm IK, faces
  glass.js          11 glasses, liquid level, ice, garnishes, the shaker
  bottles.js        real bottle geometry and labels
  data.js           ingredients, recipes, garnishes (Korean / English)
  audio.js          WebAudio sound effects and music synthesis
  game/             pure game rules (world, orders, scoring, shared room rules)
  net/              online rooms (transport, message validation, room client)
  story/            the seven nights, dialogue engine, still cuts, saving
  start.js          the start screen
test/               Node tests (no dependencies)
docs/story/         story design notes
```

Design decisions and rules are written up in more detail in [`CLAUDE.md`](CLAUDE.md) (in Korean).

## Deployment

Hosted on Vercel; the output of `vite build`, `dist/`, is what gets deployed.

```bash
vercel deploy --prod
```

The environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` (publishable key only) are baked into the bundle at build time, so changing them requires a redeploy.

## Known limitations

- The 3D models are built from basic shapes, so people and props look doll-like. This is the biggest area for improvement.
- Real-GPU frame rates, real-device mobile performance and iPhone Safari sound (including the silent switch) have not been verified thoroughly.
- If the host leaves an online room, one of the remaining people takes over, but it is not yet server-authoritative (the host's client is the authority).
- The story is solo only.

## Roadmap

- More bartending actions such as bottle flips and ice carving
- Remembering guests' tastes with a regular's line, and unlockable bar decor
- Rewatching the still cuts from the ending gallery
- Replacing people and furniture with external 3D assets (GLB)
- Server-authoritative rooms and voice chat

## Notice

This game depicts alcohol. Check age ratings and local regulations before any release or distribution.

## License

Not decided yet. Until a license is chosen, all rights are reserved by the author.
