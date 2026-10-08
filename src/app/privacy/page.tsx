import type { Metadata } from "next";
import { CONSENT_VERSION } from "@/lib/shared";

export const metadata: Metadata = { title: "Privacy" };

const H2 = "font-display mt-8 text-xl font-semibold text-white";
const LIST = "mt-2 list-disc space-y-1 pl-5";

export default function PrivacyPage() {
  // The grievance officer (DPDP Section 8(10)), set in the hosting settings.
  const contactName = process.env.PRIVACY_CONTACT_NAME;
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL;

  return (
    <article className="max-w-2xl pt-4 text-white/75">
      <h1 className="font-display text-4xl font-bold text-white">Privacy, in plain words</h1>
      <p className="mt-4">
        Every student on Prayog is a child under India&apos;s Digital Personal Data Protection Act, 2023. We build for
        that from the start. This notice explains what we keep, why, and what you can do about it.
      </p>

      <h2 className={H2}>What we keep, and why</h2>
      <ul className={LIST}>
        <li>
          <b className="text-white">The parent&apos;s name and email, and when they gave consent:</b> to sign you in with
          a one-time code, to prove a parent agreed before a child&apos;s profile was made, and to tell you about your
          account.
        </li>
        <li>
          <b className="text-white">For school classes, the teacher&apos;s name, email, school and classes:</b> to sign
          the teacher in and show them their students&apos; progress.
        </li>
        <li>
          <b className="text-white">The child&apos;s nickname, class and chosen avatar:</b> to show the right lessons and,
          only if the child chooses, a nickname on the class leaderboard. No real name, photo, phone number or location.
        </li>
        <li>
          <b className="text-white">Learning progress (steps finished, XP, badges, scores):</b> so progress is safe and
          works on any device, and so a parent or teacher can see it.
        </li>
        <li>
          <b className="text-white">A security log:</b> when someone signs in, gives consent, views a class or changes or
          deletes data, with the account id and internet address. It holds no names or emails, is used only to spot and
          investigate misuse, and is deleted after a year.
        </li>
        <li>
          <b className="text-white">Ideas sent through &quot;Suggest an idea&quot;:</b> the text, the page it came from,
          and whether a student, parent or teacher sent it. Not who sent it. Emails, phone numbers and links typed into
          an idea are removed before we keep it.
        </li>
      </ul>

      <h2 className={H2}>What we never do</h2>
      <ul className={LIST}>
        <li>No advertising of any kind, and no ad or analytics trackers.</li>
        <li>No tracking or profiling of children&apos;s behaviour.</li>
        <li>No selling or sharing of data.</li>
        <li>No paid rewards, loot boxes or cash prizes.</li>
      </ul>

      <h2 className={H2}>Who gives consent</h2>
      <p className="mt-2">
        A parent or guardian signs up with their email, proves it is theirs with a one-time code, and gives consent
        before their child&apos;s profile is made. When a school uses Prayog, the school gives consent for the students
        its teachers add, and Prayog looks after that data on the school&apos;s behalf.
      </p>

      <h2 className={H2}>Where it lives, and who helps us run Prayog</h2>
      <p className="mt-2">
        Without an account, everything stays only in this browser on this device. With an account, progress is also
        saved on our servers in India so it works on any device. A teacher sees the progress of students in their
        class; classmates see a nickname on the class leaderboard only if the child chooses to show it.
      </p>
      <ul className={LIST}>
        <li>Vercel runs the website, from Mumbai.</li>
        <li>Supabase stores the database, in Mumbai.</li>
        <li>Resend sends sign-in codes, account emails and, if you have the Family plan, the weekly report. Those emails pass through its servers in the USA.</li>
        <li>
          Until payments open, a parent can leave their email on the Family plan waitlist. We email it once when
          payments open and delete it within a year.
        </li>
        <li>
          Razorpay takes Family plan payments, in India. We keep only the plan, the amount and the dates; Razorpay keeps
          the card or UPI details and never gets your child&apos;s details.
        </li>
        <li>GitHub holds suggestions for our weekly review, with contact details already removed.</li>
      </ul>
      <p className="mt-2">Each of them may use our data only to provide that service to us.</p>

      <h2 className={H2}>How long we keep it</h2>
      <ul className={LIST}>
        <li>Until you delete it, which you can do at any time.</li>
        <li>
          If nobody signs in to an account and none of its children learns for two years, we email a warning and delete
          the account a week later unless someone signs in.
        </li>
        <li>Students a school enrolled are deleted after a year without any learning.</li>
        <li>Sign-in codes expire after 10 minutes; the security log is deleted after a year.</li>
      </ul>

      <h2 className={H2}>Your rights</h2>
      <p className="mt-2">After signing in, a parent or teacher can:</p>
      <ul className={LIST}>
        <li>
          <b className="text-white">See it:</b> &quot;Download my data&quot; gives you a file with everything we hold
          about you and your children or class.
        </li>
        <li>
          <b className="text-white">Correct it:</b> edit your name, or your child&apos;s nickname, class and avatar.
        </li>
        <li>
          <b className="text-white">Withdraw consent:</b> delete a child&apos;s profile, or your whole account. It is as
          easy as giving consent. Deleting removes the data from our servers straight away; backup copies are
          overwritten within 7 days. A teacher can remove a student or delete a class.
        </li>
        <li>
          <b className="text-white">Name someone</b> to act for you if you die or can no longer manage the account, by
          writing to us.
        </li>
      </ul>

      <h2 className={H2}>If something goes wrong</h2>
      <p className="mt-2">
        If your data is ever exposed, we will tell you and the Data Protection Board of India without delay, with what
        happened, what it means for you and what we are doing about it.
      </p>

      <h2 className={H2}>Questions and complaints</h2>
      {contactEmail ? (
        <p className="mt-2">
          Write to {contactName ? `${contactName}, our grievance officer, at ` : "our grievance officer at "}
          <a className="underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . We reply within 90 days, usually much sooner. If you are not happy with our answer, you can complain to the
          Data Protection Board of India.
        </p>
      ) : (
        <p className="mt-2">
          Our grievance officer&apos;s contact will appear here before accounts open. If you are not happy with our
          answer, you can complain to the Data Protection Board of India.
        </p>
      )}

      <p className="mt-8 text-xs text-white/40">Notice version {CONSENT_VERSION}.</p>
    </article>
  );
}
