"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { needs } from "@/lib/access";
import { useTier } from "@/lib/useTier";
import { LockPanel } from "./LockPanel";

interface Props {
  href: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children: ReactNode;
}

/** A card link that shows blurred with a lock when this device can't open it yet. */
export function LockableLink({ href, className = "", style, title, children }: Props) {
  // Until we know, assume a visitor: they are most people who haven't signed in.
  const tier = useTier() ?? "visitor";
  const need = needs(tier, href);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!need)
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} relative w-full cursor-pointer overflow-hidden text-left`}
        style={style}
        aria-label={`${title ?? "This lab"}: ${need === "register" ? "sign up free to open" : "in the Family plan"}`}
        data-locked={need}
      >
        <div className="pointer-events-none select-none opacity-50 blur-[3px]" aria-hidden>
          {children}
        </div>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-[#070a14]/80 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            {need === "register" ? "🔓 Free with sign-up" : "🔒 Family plan"}
          </span>
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <LockPanel need={need} title={title} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
