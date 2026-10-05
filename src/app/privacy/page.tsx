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
        <li>For school classes: the teacher&apos;s name, email and school, and the class.</li>
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
      <h2 className="font-display mt-8 text-xl font-semibold text-white">Who gives consent</h2>
      <p className="mt-2">
        A parent or guardian signs up with their email, proves it is theirs with a one-time code, and gives consent
        before their child&apos;s profile is made. When a school uses Prayog, the school gives consent for the students
        its teachers add.
      </p>
      <h2 className="font-display mt-8 text-xl font-semibold text-white">Where it lives</h2>
      <p className="mt-2">
        Without an account, everything stays only in this browser on this device. With an account, progress is also
        saved on our servers in India so it works on any device. A teacher sees the progress of students in their
        class; classmates see a nickname on the class leaderboard only if the child chooses to show it.
      </p>
      <h2 className="font-display mt-8 text-xl font-semibold text-white">Deleting it</h2>
      <p className="mt-2">
        A parent can delete a child&apos;s profile, or their whole account, at any time after signing in. A teacher can
        remove a student or delete a class. Deleting removes the data from our servers straight away.
      </p>
    </article>
  );
}
