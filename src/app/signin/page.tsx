"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EmailCode from "@/components/account/EmailCode";
import Family from "@/components/account/Family";
import { refreshMe, useMe } from "@/lib/account";

/** Sign-in for parents and teachers. Students sign in with their class code. */
export default function SignInPage() {
  const me = useMe();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [noAccount, setNoAccount] = useState(false);

  useEffect(() => {
    if (me?.account?.role === "teacher") router.replace("/teach");
  }, [me, router]);

  if (!me) return <div className="mx-auto mt-16 max-w-xl text-center text-faint">Loading…</div>;
  if (!me.server) {
    return (
      <div className="glass mx-auto mt-8 max-w-md rounded-3xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Accounts are coming soon</h1>
        <p className="mt-2 text-muted">For now your progress is saved on this device.</p>
      </div>
    );
  }
  if (me.account?.role === "parent") {
    return (
      <div className="mx-auto max-w-xl pt-4">
        <Family />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pt-4">
      <section className="glass rounded-3xl p-6">
        <div className="text-sm text-saffron-300">Parents and teachers</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Sign in</h1>
        <EmailCode
          email={email}
          onEmail={(v) => {
            setEmail(v);
            setNoAccount(false);
          }}
          onVerified={async (r) => {
            if ("needsSignup" in r) {
              setNoAccount(true);
              return;
            }
            await refreshMe();
          }}
        />
        {noAccount && (
          <p className="mt-3 text-sm text-ochre-200">
            There&apos;s no account with that email yet.{" "}
            <Link href="/join" className="underline">
              Sign up as a parent
            </Link>{" "}
            or{" "}
            <Link href="/teach" className="underline">
              as a teacher
            </Link>
            .
          </p>
        )}
        <p className="mt-5 text-center text-sm text-faint">
          Student with a class code?{" "}
          <Link href="/join/class" className="underline">
            Join or sign in to your class
          </Link>
        </p>
      </section>
    </div>
  );
}
