"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store. Everything stays on this device: there is
 * no server yet, and nothing here is sent anywhere.
 */
export function createLocalStore<T>(key: string, initial: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  function read(): T {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? { ...initial, ...JSON.parse(raw) } : initial;
    } catch {
      cache = initial;
    }
    return cache as T;
  }

  function write(next: T) {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode or storage full: keep working in memory.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = undefined;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    get: read,
    set: write,
    update(fn: (prev: T) => T) {
      write(fn(read()));
    },
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      cache = initial;
      listeners.forEach((l) => l());
    },
    use(): T {
      return useSyncExternalStore(subscribe, read, () => initial);
    },
  };
}
