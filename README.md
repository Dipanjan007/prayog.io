# Prayog

NCERT Physics for Classes 7 to 10, learned by playing with live simulations instead of reading.

The first playable lesson is Class 8 (Curiosity) "Pressure, Winds, Storms, and Cyclones", built around a real-time wind tunnel.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## What's here

| Path | What it is |
| --- | --- |
| `src/lib/sim/lbm.ts` | 2D fluid solver (lattice Boltzmann, D2Q9) that runs in the browser and measures drag and lift |
| `src/lib/sim/shapes.ts` | Obstacles for the wind tunnel: ball, box, raindrop, flat plate, wing, house, or a shape the student draws |
| `src/components/sim/WindTunnel.tsx` | The wind tunnel screen: pressure, air speed and smoke views, sliders, force meters |
| `src/content/curriculum.ts` | Physics chapters for Classes 7 to 10, grouped into strands from basics to advanced |
| `src/content/lessons/pressure-winds.ts` | Lesson text, missions, challenge thresholds and quiz |
| `src/app/learn/pressure-winds/` | The lesson: hook, predict, missions, discover, wing challenge, quiz |
| `src/lib/progress.ts` | XP, levels, streaks with freezes, badges |
| `src/lib/profile.ts`, `src/app/join/` | Parent consent and child profile (nickname, class, avatar) |
| `public/sw.js` | Offline cache so lessons work without a connection after the first visit |

## Lesson loop

Every lesson follows the same loop: **Hook → Predict → Play (missions checked by the simulation) → Discover → Challenge → Master quiz**. Missions complete themselves when the simulation shows the right result, so students learn by doing rather than by clicking "next".

## Privacy

Every student is a child under India's DPDP Act, 2023. The app has no ads, no analytics or tracking SDKs, and stores only a nickname, class, avatar and progress. In this version everything lives in the browser's local storage; nothing is sent to a server. A parent gives consent before a profile is created.

## Not built yet

- Server accounts with verified parental consent, so progress syncs across devices
- School mode: teacher sign-up, class codes, class-only leaderboards, teacher dashboard
- The other Physics chapters (see `src/content/curriculum.ts`), Hindi, the paid Pro tier
