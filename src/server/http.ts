import "server-only";
import { NextResponse } from "next/server";
import { sameText } from "./crypto";
import { hasDb } from "./db";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Every API route starts here: without a database the app is device-only. */
export function noDb() {
  return hasDb() ? null : fail("Accounts aren't switched on yet.", 503);
}

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Returns an error
 * response unless that matches, and refuses everything while the secret is unset.
 */
export function cronRefused(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail("CRON_SECRET isn't set.", 503);
  return sameText(req.headers.get("authorization") ?? "", `Bearer ${secret}`) ? null : fail("Not allowed.", 401);
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const isClassNum = (n: unknown): n is 7 | 8 | 9 | 10 => n === 7 || n === 8 || n === 9 || n === 10;

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
