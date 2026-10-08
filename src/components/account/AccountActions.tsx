"use client";

import { api, refreshMe, useMe } from "@/lib/account";
import { progressStore } from "@/lib/progress";
import { profileStore } from "@/lib/profile";

/**
 * Sign out, correct your details, download everything we hold, or withdraw
 * consent by deleting the account and everything stored with it.
 */
export default function AccountActions({ role }: { role: "parent" | "teacher" }) {
  const me = useMe();
  const what =
    role === "parent"
      ? "your account, your children's profiles and all their progress"
      : "your account, your classes, and the student profiles your school created";
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/40">
      <button
        className="underline hover:text-white/70"
        onClick={async () => {
          await api("/api/auth/signout", "POST", { who: "adult" }).catch(() => {});
          await refreshMe();
        }}
      >
        Sign out
      </button>
      <button
        className="underline hover:text-white/70"
        onClick={async () => {
          const name = window.prompt("Your name", me?.account?.name ?? "");
          if (name === null) return;
          const schoolName = role === "teacher" ? window.prompt("Your school", me?.account?.school_name ?? "") : undefined;
          if (schoolName === null) return;
          await api("/api/account", "PATCH", { name, schoolName })
            .then(refreshMe)
            .catch((e: Error) => window.alert(e.message));
        }}
      >
        Edit my details
      </button>
      <a className="underline hover:text-white/70" href="/api/account/export" download>
        Download my data
      </a>
      <button
        className="underline hover:text-rose-300"
        onClick={async () => {
          if (!window.confirm(`Withdraw consent and delete ${what}? This can't be undone.`)) return;
          await api("/api/account", "DELETE").catch(() => {});
          progressStore.clear();
          profileStore.clear();
          await refreshMe();
        }}
      >
        {role === "parent" ? "Withdraw consent and delete account" : "Delete account"}
      </button>
    </div>
  );
}
