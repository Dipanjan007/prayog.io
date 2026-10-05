"use client";

import { api, ApiError } from "./account";
import { createLocalStore } from "./store";
import type { Suggestion } from "./suggestion";

/** Ideas written offline (or before the box is switched on) wait here until they can be sent. */
export const pendingSuggestions = createLocalStore<{ items: Suggestion[] }>("prayog.suggestions.v1", { items: [] });

let sending = false;

/** Sends what is waiting. Drops an idea only once it is sent or the server says it can never be. */
export async function sendPending() {
  if (sending || !navigator.onLine) return;
  sending = true;
  try {
    for (const item of pendingSuggestions.get().items) {
      try {
        await api("/api/suggestions", "POST", item);
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0;
        if (status !== 400) break; // offline, switched off or busy: try again later
      }
      pendingSuggestions.update((q) => ({ items: q.items.filter((i) => i !== item) }));
    }
  } finally {
    sending = false;
  }
}
