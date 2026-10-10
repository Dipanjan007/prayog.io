import Link from "next/link";
import HeroTunnel from "@/components/HeroTunnel";
import { CATALOGUE } from "@/content/curriculum";

const LOOP = [
  { n: "01", title: "Predict", text: "Make a guess before you touch anything.", colour: "text-violet-300" },
  { n: "02", title: "Play", text: "Drag, tilt and crank up live simulations.", colour: "text-cyan-300" },
  { n: "03", title: "Discover", text: "See the NCERT rule happen in front of you.", colour: "text-lime-300" },
  { n: "04", title: "Master", text: "Challenges and questions that level you up.", colour: "text-pink-300" },
];

const PLAYABLE = [
  { href: "/learn/earth-moon-sun", emoji: "🌘", cls: 7, title: "Make an eclipse", text: "Tilt the Earth for the seasons, then line up the Moon and the Sun for a solar and a lunar eclipse." },
  { href: "/learn/circuits", emoji: "🔦", cls: 7, title: "Build a torch that works", text: "Wire up cells, bulbs and switches, test what conducts, then fix a broken torch." },
  { href: "/learn/pressure-winds", emoji: "🏎️", cls: 8, title: "Wind tunnel", text: "Blow roofs off in a cyclone and give a sports car downforce with its rear wing." },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pt-6">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> NCERT Physics · Classes 7 to 10
          </span>
          <h1 className="font-display mt-5 text-5xl font-bold leading-[1.05] sm:text-6xl">
            Don&apos;t read physics.
            <br />
            <span className="text-gradient">Play with it.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/65">
            Wind tunnels, circuits and light benches that react to every move you make. Earn XP and badges, and climb
            your class leaderboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/learn/pressure-winds" className="btn-primary">
              Try the wind tunnel →
            </Link>
            <Link href="/join" className="btn-ghost">
              Parents: set up a profile
            </Link>
          </div>
        </div>
        <HeroTunnel />
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Play now</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {PLAYABLE.map((l) => (
            <Link key={l.href} href={l.href} className="glass group rounded-3xl p-5 transition hover:bg-white/10">
              <div className="text-4xl">{l.emoji}</div>
              <div className="mt-3 text-xs uppercase tracking-wider text-white/50">Class {l.cls}</div>
              <div className="font-display mt-1 text-xl font-semibold">{l.title}</div>
              <p className="mt-2 text-sm text-white/60">{l.text}</p>
              <div className="mt-4 text-sm text-cyan-200 group-hover:underline">Play →</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Every lesson is a playground</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s) => (
            <div key={s.n} className="glass rounded-3xl p-5">
              <div className={`font-display text-sm ${s.colour}`}>{s.n}</div>
              <div className="font-display mt-6 text-2xl font-semibold">{s.title}</div>
              <p className="mt-2 text-sm text-white/60">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="glass rounded-3xl p-6 md:col-span-2">
          <div className="text-sm text-cyan-300">For students</div>
          <h3 className="font-display mt-2 text-2xl font-semibold">Every chapter, Class 7 to 10</h3>
          <p className="mt-2 text-white/60">
            {CATALOGUE.lessons} NCERT Physics chapters, each built around a lab you can play, plus {CATALOGUE.labs} second labs for
            the extra topics a chapter squeezes in. New: {CATALOGUE.maths} Maths labs, one for each class.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/learn" className="text-cyan-200 hover:underline">
              See the physics map →
            </Link>
            <Link href="/maths" className="text-cyan-200 hover:underline">
              Try the maths labs →
            </Link>
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="text-sm text-lime-300">For parents</div>
          <h3 className="font-display mt-2 text-2xl font-semibold">Safe by design</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-white/65">
            <li>✓ You give consent before your child plays</li>
            <li>✓ No ads, no tracking, no selling data</li>
            <li>✓ Nickname only, no real photos</li>
            <li>✓ Leaderboards are opt-in, class only</li>
          </ul>
        </div>
        <div className="glass rounded-3xl p-6 md:col-span-3 md:flex md:items-center md:justify-between">
          <div>
            <div className="text-sm text-violet-300">For schools</div>
            <h3 className="font-display mt-2 text-2xl font-semibold">Class challenges and a teacher dashboard</h3>
            <p className="mt-2 text-white/60">Teachers create a class, share a code, and see who needs help.</p>
          </div>
          <Link href="/join/school" className="btn-ghost mt-4 md:mt-0">
            Schools: learn more
          </Link>
        </div>
      </section>
    </div>
  );
}
