"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isTier, type Tier } from "./access";
import { useMe } from "./account";

const KEY = "prayog_tier";

function cached(): Tier | undefined {
  try {
    const v = localStorage.getItem(KEY);
    return isTier(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

const noop = () => () => {};

/**
 * What this device can open. Undefined while we don't know yet. The last
 * answer is remembered so a paying family keeps everything offline, and a
 * server without accounts (device-only mode) opens everything.
 */
export function useTier(): Tier | undefined {
  const me = useMe();
  const onClient = useSyncExternalStore(noop, () => true, () => false);
  const live: Tier | undefined = !me || me.offline ? undefined : me.server ? (me.tier ?? "visitor") : "school";

  useEffect(() => {
    if (!live) return;
    try {
      localStorage.setItem(KEY, live);
    } catch {}
  }, [live]);

  if (live) return live;
  if (!onClient) return undefined;
  if (me?.offline) return cached() ?? "visitor";
  return cached();
}
