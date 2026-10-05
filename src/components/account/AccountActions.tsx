"use client";

import { api, refreshMe } from "@/lib/account";
import { progressStore } from "@/lib/progress";
import { profileStore } from "@/lib/profile";

/** Sign out, or delete the account and everything stored with it. */
export default function AccountActions({ role }: { role: "parent" | "teacher" }) {
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
        className="underline hover:text-rose-300"
        onClick={async () => {
          if (!window.confirm(`Delete ${what}? This can't be undone.`)) return;
          await api("/api/account", "DELETE").catch(() => {});
          progressStore.clear();
          profileStore.clear();
          await refreshMe();
        }}
      >
        Delete account
      </button>
    </div>
  );
}
