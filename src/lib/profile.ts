"use client";

import { createLocalStore } from "./store";
import type { ClassNum } from "@/content/curriculum";

export { AVATARS, CONSENT_VERSION } from "./shared";

export interface Profile {
  parent: { name: string; email: string; consentVersion: string; consentAt: string } | null;
  /** `id` is set once the profile is saved to a Prayog account. */
  child: { id?: string; nickname: string; classNum: ClassNum; avatar: string; showOnLeaderboard: boolean } | null;
}

export const profileStore = createLocalStore<Profile>("prayog.profile.v1", { parent: null, child: null });
export const useProfile = profileStore.use;

