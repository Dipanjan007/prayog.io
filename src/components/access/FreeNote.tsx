"use client";

import Link from "next/link";
import { useTier } from "@/lib/useTier";

/** One line under a hub's title saying what's open and how to get more. */
export function FreeNote() {
  const tier = useTier();
  if (!tier || tier === "family" || tier === "school") return null;
  return (
    <p className="mt-3 max-w-2xl rounded-2xl bg-white/[0.04] px-4 py-2 text-sm text-white/65" data-testid="free-note">
      {tier === "visitor" ? (
        <>
          4 lessons, 1 Olympiad set and 1 Outliers lab are open to try.{" "}
          <Link href="/join" className="text-cyan-300 hover:underline">
            Sign up free
          </Link>{" "}
          to open 6 lessons, 2 sets and 2 Outliers labs, or{" "}
          <Link href="/plans" className="text-cyan-300 hover:underline">
            see plans
          </Link>{" "}
          for everything.
        </>
      ) : (
        <>
          Your free account opens 6 lessons, 2 Olympiad sets and 2 Outliers labs.{" "}
          <Link href="/plans" className="text-cyan-300 hover:underline">
            The Family plan
          </Link>{" "}
          opens everything.
        </>
      )}
    </p>
  );
}
