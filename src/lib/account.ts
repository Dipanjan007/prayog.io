"use client";

import { useSyncExternalStore } from "react";
import type { ClassNum } from "@/content/curriculum";

export interface AccountInfo {
  id: string;
  role: "parent" | "teacher";
  name: string;
  email: string;
  school_name: string | null;
}

export interface ChildInfo {
  id: string;
  nickname: string;
  classNum: ClassNum;
  avatar: string;
  showOnLeaderboard: boolean;
  viaSchool: boolean;
}

export interface Me {
  /** False when the server has no database: the app is device-only. */
  server: boolean;
  account?: AccountInfo | null;
  children?: ChildInfo[];
  child?: (ChildInfo & { classes: { id: string; name: string }[] }) | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** JSON fetch to our own API. Throws ApiError with a message fit to show. */
export async function api<T = Record<string, unknown>>(path: string, method = "GET", json?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: json === undefined ? undefined : { "Content-Type": "application/json" },
      body: json === undefined ? undefined : JSON.stringify(json),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("You seem to be offline. Try again when you're connected.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong. Please try again.", res.status);
  return data as T;
}

// Who is signed in, shared by every component. Undefined until first loaded.
let me: Me | undefined;
let loading: Promise<Me> | null = null;
const listeners = new Set<() => void>();

export function refreshMe(): Promise<Me> {
  loading = api<Me>("/api/me")
    .catch(() => ({ server: false }) as Me)
    .then((m) => {
      me = m;
      listeners.forEach((l) => l());
      return m;
    });
  return loading;
}

/** Run `fn` whenever the signed-in state is reloaded. */
export function subscribeMe(fn: (m: Me) => void) {
  const l = () => me && fn(me);
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useMe(): Me | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!loading) refreshMe();
      return () => listeners.delete(l);
    },
    () => me,
    () => undefined,
  );
}
