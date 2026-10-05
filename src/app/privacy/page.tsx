import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-2xl pt-4 text-white/75">
      <h1 className="font-display text-4xl font-bold text-white">Privacy, in plain words</h1>
      <p className="mt-4">
        Every student on Prayog is a child under India&apos;s Digital Personal Data Protection Act, 2023. We build for
        that from the start.
      </p>
      <h2 className="font-display mt-8 text-xl font-semibold text-white">What we keep</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>The parent&apos;s name and email, and when they gave consent.</li>
        <li>The child&apos;s nickname, class and chosen avatar. No real name, photo, phone number or location.</li>
        <li>Learning progress: steps finished, XP, badges, scores.</li>
      </ul>
      <h2 className="font-display mt-8 text-xl font-semibold text-white">What we never do</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>No advertising of any kind, and no ad or analytics trackers.</li>
        <li>No tracking or profiling of children&apos;s behaviour.</li>
        <li>No selling or sharing of data.</li>
        <li>No paid rewards, loot boxes or cash prizes.</li>
      </ul>
      <h2 className="font-display mt-8 text-xl font-semibold text-white">Where it lives today</h2>
      <p className="mt-2">
        In this early version, everything is stored only in this browser on this device. Nothing is sent to a server.
        You can delete it all from the Me page at any time.
      </p>
    </article>
  );
}
