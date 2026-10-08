import "server-only";
import { headers } from "next/headers";
import type postgres from "postgres";
import { db } from "./db";

/**
 * Things we log, kept a year for breach investigation (DPDP Rule 6). Never
 * put a name, email or nickname in `detail`: ids are enough to trace.
 */
export type AuditAction =
  | "code_requested"
  | "sign_in"
  | "sign_in_failed"
  | "sign_up"
  | "consent_given"
  | "account_updated"
  | "account_deleted"
  | "data_exported"
  | "child_created"
  | "child_updated"
  | "child_deleted"
  | "child_device_linked"
  | "child_sign_in"
  | "child_sign_in_failed"
  | "class_created"
  | "class_deleted"
  | "class_joined"
  | "class_progress_viewed"
  | "member_removed"
  | "member_unlocked"
  | "inactivity_warned"
  | "inactive_deleted";

interface Entry {
  account?: string | null;
  child?: string | null;
  subject?: string | null;
  detail?: Record<string, string | number | boolean | null>;
}

/** The caller's IP as Vercel reports it, or null outside a request. */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

export async function audit(action: AuditAction, e: Entry = {}, sql: postgres.Sql | postgres.TransactionSql = db()) {
  const detail = e.detail ? sql.json(e.detail) : null;
  await sql`insert into audit_log (action, actor_account, actor_child, subject_id, ip, detail)
    values (${action}, ${e.account ?? null}, ${e.child ?? null}, ${e.subject ?? null}, ${await clientIp()}, ${detail})`;
}
