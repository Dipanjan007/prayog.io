"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { needs } from "@/lib/access";
import { useTier } from "@/lib/useTier";
import { LockPanel } from "./LockPanel";

/** The hub page a locked page belongs to. */
function backTo(path: string) {
  const hub = path.match(/^\/(maths\/olympiad|maths\/outliers|olympiad|outliers|maths)(\/|$)/);
  return hub ? `/${hub[1]}` : "/learn";
}

/** Stands in front of a lab opened by its address when this device can't open it yet. */
export default function AccessGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const tier = useTier();
  // Open to visitors, or not a lab at all: no need to wait for the account check.
  if (!needs("visitor", path)) return children;
  if (!tier)
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/40" aria-busy="true">
        Opening the lab…
      </div>
    );
  const need = needs(tier, path);
  if (!need) return children;
  return (
    <div className="pt-10">
      <LockPanel need={need} />
      <p className="mt-6 text-center text-sm text-white/45">
        Or go back to{" "}
        <Link href={backTo(path)} className="text-cyan-300 hover:underline">
          the free labs
        </Link>
        .
      </p>
    </div>
  );
}
