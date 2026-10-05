"use client";

import { useEffect } from "react";
import { api, refreshMe, subscribeMe, type Me } from "@/lib/account";
import { progressStore, type Progress } from "@/lib/progress";
import { canonical, mergeProgress } from "@/lib/progress-merge";
import { profileStore } from "@/lib/profile";

const DEBOUNCE_MS = 3000;

/**
 * Keeps this device's progress in step with the child's account. Progress is
 * always saved on the device first, so lessons work offline; it is sent to the
 * server a few seconds after it changes, and again when the device is back
 * online. The server merges, so nothing earned on any device is lost.
 */
export default function SyncProgress() {
  useEffect(() => {
    let childId: string | null = null;
    let lastSent = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    /** Take the server's copy. `replace` drops what is on the device (another child's). */
    const apply = (server: Progress, replace = false) => {
      lastSent = canonical(server);
      // Merge rather than overwrite: the child may have earned more while the request was out.
      const next = replace ? server : mergeProgress(progressStore.get(), server);
      if (canonical(progressStore.get()) !== canonical(next)) progressStore.set(next);
    };

    const push = async () => {
      if (!childId || !navigator.onLine) return;
      const local = progressStore.get();
      if (canonical(local) === lastSent) return;
      try {
        apply((await api<{ progress: Progress }>("/api/progress", "PUT", { progress: local })).progress);
      } catch {
        // Offline or signed out: try again on the next change or reconnect.
      }
    };

    const start = async (m: Me) => {
      if (!m.server || !m.child) {
        childId = null;
        return;
      }
      if (m.child.id === childId) return;
      const local = profileStore.get().child;
      const child = m.child;
      childId = child.id;
      profileStore.update((p) => ({
        ...p,
        child: { id: child.id, nickname: child.nickname, classNum: child.classNum, avatar: child.avatar, showOnLeaderboard: child.showOnLeaderboard },
      }));
      if (local?.id && local.id !== child.id) {
        // A different child used this device before: load this child's own progress.
        try {
          apply((await api<{ progress: Progress }>("/api/progress")).progress, true);
        } catch {}
      } else {
        await push();
      }
    };

    const stopMe = subscribeMe(start);
    refreshMe();
    const unsubscribe = progressStore.subscribeChanges(() => {
      clearTimeout(timer);
      timer = setTimeout(push, DEBOUNCE_MS);
    });
    const online = () => push();
    window.addEventListener("online", online);
    return () => {
      unsubscribe();
      stopMe();
      clearTimeout(timer);
      window.removeEventListener("online", online);
    };
  }, []);

  return null;
}
