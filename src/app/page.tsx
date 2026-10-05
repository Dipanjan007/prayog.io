import Link from "next/link";
import HeroTunnel from "@/components/HeroTunnel";
import { InkDivider, InkUnderline, LoopIcon, StrandIcon } from "@/components/Ink";

const LOOP = [
  { title: "Predict", text: "Make a guess before you touch anything." },
  { title: "Play", text: "Drag, tilt and crank up live simulations." },
  { title: "Discover", text: "See the NCERT rule happen in front of you." },
  { title: "Master", text: "Challenges and questions that level you up." },
];

const PLAYABLE = [
  { href: "/learn/circuits", strand: "electricity", colour: "var(--c-lime)", cls: 7, title: "Build a torch that works", text: "Wire up cells, bulbs and switches, test what conducts, then fix a broken torch." },
  { href: "/learn/pressure-winds", strand: "fluids", colour: "var(--c-sky)", cls: 8, title: "Wind tunnel", text: "Blow roofs off in a cyclone and give a sports car downforce with its rear wing." },
  { href: "/learn/motion", strand: "motion", colour: "var(--c-cyan)", cls: 9, title: "Drive and graph", text: "Drive a sports car and watch its distance and speed graphs draw live. Stop in the zone." },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pt-6 sm:gap-24 sm:pt-12">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-300" aria-hidden /> NCERT Physics · Classes 7 to 10
          </p>
          <h1 className="font-display mt-5 text-[2.75rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.25rem]">
            Don&apos;t read physics.
            <br />
            <span className="relative inline-block pb-2">
              <span className="text-gradient">Play with it.</span>
              <InkUnderline className="absolute -bottom-1 left-0 h-3 w-full text-saffron-400/80" />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Wind tunnels, circuits and light benches that react to every move you make. Earn XP, collect badges and
            climb your class leaderboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/learn/pressure-winds" className="btn-primary">
              Try the wind tunnel <span aria-hidden>→</span>
            </Link>
            <Link href="/join" className="btn-ghost">
              Parents: set up a profile
            </Link>
          </div>
        </div>
        <HeroTunnel />
      </section>

      <section>
        <SectionTitle eyebrow="Start anywhere" title="Play now" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLAYABLE.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="glass group flex flex-col rounded-3xl p-6 transition-colors hover:border-line-strong hover:bg-raised"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-well"
                style={{ color: l.colour }}
              >
                <StrandIcon id={l.strand} className="h-7 w-7" />
              </span>
              <div className="eyebrow mt-5">Class {l.cls}</div>
              <div className="font-display mt-1.5 text-2xl">{l.title}</div>
              <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{l.text}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-300">
                Play <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <InkDivider />

      <section>
        <SectionTitle eyebrow="How it works" title="Every lesson is a playground" />
        <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s, i) => (
            <li key={s.title} className="border-t border-line pt-5">
              <div className="flex items-center justify-between text-saffron-300">
                <span className="font-display text-lg italic">0{i + 1}</span>
                <LoopIcon step={i} className="h-7 w-7 text-muted" />
              </div>
              <div className="font-display mt-4 text-2xl">{s.title}</div>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-3xl p-6 sm:p-8 md:col-span-2">
          <div className="eyebrow">For students</div>
          <h3 className="font-display mt-3 text-[1.7rem] leading-tight">Basics to advanced, one strand at a time</h3>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            Motion, force, pressure, energy, electricity, light and waves grow from Class 7 to Class 10. Master one level
            and the next unlocks early.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-faint">
            {["motion", "force", "fluids", "energy", "electricity", "light", "waves"].map((id) => (
              <StrandIcon key={id} id={id} className="h-6 w-6" />
            ))}
          </div>
          <Link href="/learn" className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold text-saffron-300 hover:underline">
            See the map <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="eyebrow">For parents</div>
          <h3 className="font-display mt-3 text-[1.7rem] leading-tight">Safe by design</h3>
          <ul className="mt-4 space-y-2.5 text-[0.95rem] text-muted">
            {[
              "You give consent before your child plays",
              "No ads, no tracking, no selling data",
              "Nickname only, no real photos",
              "Leaderboards are opt-in, class only",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-0.5 text-sage-300" aria-hidden>✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-3xl p-6 sm:p-8 md:col-span-3 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <div className="eyebrow">For schools</div>
            <h3 className="font-display mt-3 text-[1.7rem] leading-tight">Class challenges and a teacher dashboard</h3>
            <p className="mt-2 leading-relaxed text-muted">Teachers will create a class, share a code, and see who needs help.</p>
          </div>
          <Link href="/join/school" className="btn-ghost mt-5 w-full shrink-0 md:mt-0 md:w-auto">
            Schools: learn more
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="font-display mt-2 text-3xl sm:text-4xl">{title}</h2>
    </div>
  );
}
