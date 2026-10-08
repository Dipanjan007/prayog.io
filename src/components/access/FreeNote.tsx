"use client";

import Link from "next/link";
import { OPENS, plural } from "@/lib/access";
import { useTier } from "@/lib/useTier";

/** One line under a hub's title saying what's open and how to get more. */
export function FreeNote() {
  const tier = useTier();
  if (!tier || tier === "family" || tier === "school") return null;
  return (
    <p className="mt-3 max-w-2xl rounded-2xl bg-white/[0.04] px-4 py-2 text-sm text-white/65" data-testid="free-note">
      {tier === "visitor" ? (
        <>
          Try {plural(OPENS.visitor.lessons, "lesson")}, {plural(OPENS.visitor.sets, "Olympiad set")} and {plural(OPENS.visitor.outliers, "Outliers lab")} without signing up.{" "}
          <Link href="/join" className="text-cyan-300 hover:underline">
            A free account
          </Link>{" "}
          opens every NCERT lesson.
        </>
      ) : (
        <>
          Your free account opens every NCERT lesson, {plural(OPENS.free.sets, "Olympiad set")} and {plural(OPENS.free.outliers, "Outliers lab")}.{" "}
          <Link href="/plans" className="text-cyan-300 hover:underline">
            The Family plan
          </Link>{" "}
          opens the rest.
        </>
      )}
    </p>
  );
}
