import "server-only";
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

declare global {
  var prayogSql: postgres.Sql | undefined;
}

/**
 * Plain Postgres, so the host can change (Supabase in Mumbai for now).
 * prepare: false keeps it working through Supabase's transaction pooler.
 */
export const sql: postgres.Sql | null = url
  ? (globalThis.prayogSql ??= postgres(url, { prepare: false, max: 5, idle_timeout: 20, onnotice: () => {} }))
  : null;

/** True when a database is configured. Without one the app runs device-only. */
export function hasDb(): boolean {
  return sql !== null;
}

export function db(): postgres.Sql {
  if (!sql) throw new Error("DATABASE_URL is not set");
  return sql;
}
