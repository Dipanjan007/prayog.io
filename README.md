# Prayog

NCERT Physics for Classes 7 to 10, learned by playing with live simulations instead of reading.

The first playable lesson is Class 8 (Curiosity) "Pressure, Winds, Storms, and Cyclones", built around a real-time wind tunnel.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
npm test        # progress merge tests
```

Without a database the app runs device-only: progress stays in the browser. To switch on accounts, set the variables in `.env.example` (at least `DATABASE_URL`) and run the migrations once:

```bash
npm run db:migrate
```

On Vercel, add Supabase from the Marketplace (Storage → Marketplace), pick the Mumbai region, and it sets `POSTGRES_URL`. Functions run in Mumbai too (`vercel.json`).

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
| `db/migrations/` | Postgres schema: accounts, children, consents, progress, classes, sessions, sign-in codes |
| `src/server/` | Database client, sessions (httpOnly cookies), sign-in codes by email, account deletion |
| `src/app/api/` | Sign-in, children, progress sync, classes, class join, leaderboard, account deletion |
| `src/lib/progress-merge.ts` | Merges progress from several devices; XP is recomputed so nothing counts twice |
| `src/components/SyncProgress.tsx` | Saves progress on the device first, then syncs it when online |
| `src/app/suggest/`, `src/app/api/suggestions/` | Suggestion box: anyone sends an idea, it becomes a GitHub issue (and a database row) for the weekly review |
| `docs/weekly-review.md` | How the weekly review triages ideas and builds the approved ones |
| `src/app/teach/`, `src/app/join/class/` | Teacher dashboard with join codes, and students joining with a code and picture password |

## Lesson loop

Every lesson follows the same loop: **Hook → Predict → Play (missions checked by the simulation) → Discover → Challenge → Master quiz**. Missions complete themselves when the simulation shows the right result, so students learn by doing rather than by clicking "next".

## Privacy

Every student is a child under India's DPDP Act, 2023. The app has no ads, no analytics or tracking SDKs, and stores only a nickname, class, avatar and progress for a child.

- A parent proves their email with a one-time code before giving consent, and only then can add a child. Each consent is recorded with its version.
- In school classes the school gives consent; teacher sign-up is invite-only during the pilot (`TEACHER_ALLOWLIST`).
- Students never give an email. School students sign in with the class code, their nickname and a 3-picture password, locked for 15 minutes after 5 wrong tries.
- Parents can delete a child or their whole account; teachers can remove students or delete a class. Deletes are immediate.

## Suggestion box and weekly review

Students, parents and teachers send ideas from "Suggest an idea" (footer, and the Me page). Each one is filed as a GitHub issue labelled `suggestion` + `needs-triage` in `SUGGESTIONS_GITHUB_REPO`, and kept in the `suggestions` table when there is a database. Only the sender's role and optional class are kept; emails, phone numbers, links and handles are stripped first. Offline or before the box is switched on, ideas wait on the device and send themselves later.

Every week a review groups and ranks new ideas, posts a summary, and builds the ones labelled `approved`. See [docs/weekly-review.md](docs/weekly-review.md).

## Not built yet

- Stronger parent verification (DigiLocker or similar) on top of the email code
- Teacher assignments and weekly class challenges, parent weekly reports
- The other Physics chapters (see `src/content/curriculum.ts`), Hindi, the paid Pro tier
