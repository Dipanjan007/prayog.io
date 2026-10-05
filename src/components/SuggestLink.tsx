"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Opens the suggestion box, remembering which page the idea came from. */
export default function SuggestLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const path = usePathname();
  const href = path && path !== "/suggest" ? `/suggest?from=${encodeURIComponent(path)}` : "/suggest";
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
