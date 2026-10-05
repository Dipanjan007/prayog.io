"use client";

import { useMe } from "@/lib/account";
import LocalJoin from "./LocalJoin";
import ServerJoin from "./ServerJoin";

export default function JoinPage() {
  const me = useMe();
  if (!me) return <div className="mx-auto mt-16 max-w-xl text-center text-faint">Loading…</div>;
  return <div className="mx-auto max-w-xl pt-4">{me.server ? <ServerJoin /> : <LocalJoin />}</div>;
}
