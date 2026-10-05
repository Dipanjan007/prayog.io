import "server-only";
import type postgres from "postgres";
import { db } from "./db";

/**
 * Pilot gate for teachers: their email, or their school's email domain
 * (written "@school.edu.in"), must be in TEACHER_ALLOWLIST. This stops
 * strangers opening "classes" that collect children's data.
 */
export function teacherAllowed(email: string) {
  const list = (process.env.TEACHER_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const domain = email.slice(email.lastIndexOf("@"));
  return list.includes(email) || list.includes(domain);
}

/**
 * Delete a class. Children the school enrolled (no parent account) go with
 * it unless they are also in another class; parent-registered children stay.
 */
export async function deleteClass(tx: postgres.TransactionSql, classId: string) {
  await tx`delete from children c using class_members m
    where m.class_id = ${classId} and m.child_id = c.id and c.parent_id is null
      and not exists (select 1 from class_members o where o.child_id = c.id and o.class_id <> ${classId})`;
  await tx`delete from classes where id = ${classId}`;
}

export async function deleteAccount(accountId: string) {
  await db().begin(async (tx) => {
    const classes = await tx<{ id: string }[]>`select id from classes where teacher_id = ${accountId}`;
    for (const c of classes) await deleteClass(tx, c.id);
    // Children cascade from the parent account; so do sessions and consents.
    await tx`delete from accounts where id = ${accountId}`;
  });
}
