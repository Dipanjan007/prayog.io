import "server-only";
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function sixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Class join codes: 6 characters with no look-alikes (0/O, 1/I/L). */
export function joinCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[randomInt(0, alphabet.length)];
  return out;
}

/** Compare two strings without leaking, through timing, how much of them matched. */
export function sameText(given: string, want: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hashSecret(secret: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(secret, salt, 32);
  return `${salt.toString("base64url")}.${key.toString("base64url")}`;
}

export async function checkSecret(secret: string, stored: string) {
  const [salt, key] = stored.split(".");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  const actual = await scryptAsync(secret, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}
