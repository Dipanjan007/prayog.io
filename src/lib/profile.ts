"use client";

import { createLocalStore } from "./store";
import type { ClassNum } from "@/content/curriculum";

/** Bump when the consent text changes, so parents are asked again. */
export const CONSENT_VERSION = "2026-10-04";

export interface Profile {
  parent: { name: string; email: string; consentVersion: string; consentAt: string } | null;
  child: { nickname: string; classNum: ClassNum; avatar: string; showOnLeaderboard: boolean } | null;
}

export const profileStore = createLocalStore<Profile>("prayog.profile.v1", { parent: null, child: null });
export const useProfile = profileStore.use;

export const AVATARS = ["🦊", "🐯", "🦉", "🐬", "🐼", "🦄", "🐙", "🚀", "🤖", "🌟", "⚡", "🌈"];
