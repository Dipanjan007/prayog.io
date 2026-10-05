/** Values shared by the browser and the server (no "use client" here). */

export const AVATARS = ["🦊", "🐯", "🦉", "🐬", "🐼", "🦄", "🐙", "🚀", "🤖", "🌟", "⚡", "🌈"];

/** Bump when the consent text changes, so parents are asked again. */
export const CONSENT_VERSION = "2026-10-05";

/**
 * Picture password for children who sign in with a class code: three
 * pictures in order. Easy for a Class 7 child, with sign-in locked for a
 * while after 5 wrong tries.
 */
export const PICTURES = [
  { id: "apple", emoji: "🍎" },
  { id: "ball", emoji: "⚽" },
  { id: "bike", emoji: "🚲" },
  { id: "cat", emoji: "🐱" },
  { id: "kite", emoji: "🪁" },
  { id: "moon", emoji: "🌙" },
  { id: "star", emoji: "⭐" },
  { id: "tree", emoji: "🌳" },
  { id: "drum", emoji: "🥁" },
] as const;

export const PICTURE_COUNT = 3;

export function isPicturePassword(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.length === PICTURE_COUNT &&
    v.every((p) => typeof p === "string" && PICTURES.some((x) => x.id === p))
  );
}

export const NICKNAME_RULE = /^[A-Za-z0-9_ ]{3,16}$/;
