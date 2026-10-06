"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AccountActions from "@/components/account/AccountActions";
import EmailCode from "@/components/account/EmailCode";
import { api, ApiError, refreshMe, useMe } from "@/lib/account";
import { CLASSES, type ClassNum } from "@/content/curriculum";
import { LESSONS } from "@/content/lessons";
import { stepOrder } from "@/content/lessons/types";
import type { Progress } from "@/lib/progress";

interface Student {
  id: string;
  nickname: string;
  avatar: string;
  xp: number;
  weekXp: number;
  lessons: Progress["lessons"];
}

interface Klass {
  id: string;
  name: string;
  classNum: ClassNum;
  joinCode: string;
  students: Student[];
}

export default function TeachPage() {
  const me = useMe();
  if (!me) return <div className="mx-auto mt-16 max-w-xl text-center text-white/50">Loading…</div>;
  if (!me.server) {
    return (
      <div className="glass mx-auto mt-8 max-w-md rounded-3xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">School classes are coming soon</h1>
        <Link href="/join/school" className="btn-primary mt-5">
          See how it will work
        </Link>
      </div>
    );
  }
  if (me.account?.role === "teacher") return <Dashboard name={me.account.name} school={me.account.school_name ?? ""} />;
  if (me.account?.role === "parent") {
    return (
      <div className="glass mx-auto mt-8 max-w-md rounded-3xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">You&apos;re signed in as a parent</h1>
        <p className="mt-2 text-white/60">Teacher accounts need their own email.</p>
      </div>
    );
  }
  return <TeacherSignup />;
}

function TeacherSignup() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [schoolConsent, setSchoolConsent] = useState(false);

  return (
    <div className="mx-auto max-w-xl pt-4">
      <section className="glass rounded-3xl p-6">
        <div className="text-sm text-violet-300">For teachers</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Bring Prayog to your class</h1>
        <p className="mt-2 text-white/60">
          Students join with a class code and a nickname, so they don&apos;t need an email. During the pilot, teacher
          sign-up is open to invited schools.
        </p>
        <label className="mt-5 grid gap-1 text-sm">
          <span className="text-white/60">Your name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="mt-4 grid gap-1 text-sm">
          <span className="text-white/60">School</span>
          <input className="field" value={school} onChange={(e) => setSchool(e.target.value)} autoComplete="organization" />
        </label>
        <EmailCode
          email={email}
          onEmail={setEmail}
          ready={name.trim().length > 1 && school.trim().length > 1 && schoolConsent}
          signup={{ role: "teacher", name: name.trim(), schoolName: school.trim(), schoolConsent }}
          onVerified={() => refreshMe().then(() => undefined)}
        >
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-violet-400"
              checked={schoolConsent}
              onChange={(e) => setSchoolConsent(e.target.checked)}
            />
            <span>
              My school has agreed to use Prayog and to give consent for the students I add, as described in the{" "}
              <Link href="/privacy" className="underline">
                privacy notice
              </Link>
              .
            </span>
          </label>
        </EmailCode>
        <p className="mt-4 text-center text-sm text-white/50">
          Already signed up?{" "}
          <Link href="/signin" className="underline">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}

function lessonDone(s: Student, lessonId: string) {
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const done = s.lessons[lessonId]?.done ?? [];
  const steps = stepOrder(lesson);
  return steps.filter((x) => done.includes(x)).length / steps.length;
}

function Dashboard({ name, school }: { name: string; school: string }) {
  const [classes, setClasses] = useState<Klass[] | null>(null);
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState<ClassNum>(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setClasses((await api<{ classes: Klass[] }>("/api/classes")).classes);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load your classes.");
    }
  }, []);

  useEffect(() => {
    // Fetch on mount; setState happens after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-violet-300">{school}</div>
          <h1 className="font-display text-3xl font-bold">{name}&apos;s classes</h1>
        </div>
      </div>

      <section className="glass mt-6 rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold">New class</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="field min-w-0 flex-1" placeholder="e.g. 8B Science" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <select className="field w-28" value={newClass} onChange={(e) => setNewClass(Number(e.target.value) as ClassNum)} aria-label="Class">
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            disabled={busy || newName.trim().length < 2}
            onClick={() => run(() => api("/api/classes", "POST", { name: newName.trim(), classNum: newClass }).then(() => setNewName("")))}
          >
            Create
          </button>
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {classes === null && !error && <p className="mt-6 text-white/50">Loading classes…</p>}
      {classes?.length === 0 && <p className="mt-6 text-white/50">No classes yet. Create one, then share its code with your students.</p>}

      {classes?.map((k) => (
        <section key={k.id} className="glass mt-4 rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">{k.name}</h2>
              <div className="text-sm text-white/50">
                Class {k.classNum} · {k.students.length} student{k.students.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50">Join code</div>
              <div className="font-mono text-2xl tracking-widest text-cyan-200">{k.joinCode}</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/40">Students open prayog → Join a class, and type this code.</p>

          {k.students.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-white/50">
                  <tr>
                    <th className="py-2 font-normal">Student</th>
                    <th className="py-2 font-normal">This week</th>
                    <th className="py-2 font-normal">Total XP</th>
                    {LESSONS.map((l) => (
                      <th key={l.id} className="py-2 font-normal" title={l.chapter}>
                        {l.title}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {k.students.map((s) => (
                    <tr key={s.id} className="border-t border-white/5">
                      <td className="py-2">
                        {s.avatar} {s.nickname}
                      </td>
                      <td className="py-2">{s.weekXp}</td>
                      <td className="py-2">{s.xp}</td>
                      {LESSONS.map((l) => {
                        const f = lessonDone(s, l.id);
                        return (
                          <td key={l.id} className="py-2">
                            <span className={f === 1 ? "text-lime-300" : f > 0 ? "text-amber-200" : "text-white/30"}>
                              {f === 1 ? "Done" : `${Math.round(f * 100)}%`}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2 text-right">
                        <button
                          className="text-xs text-white/40 underline hover:text-rose-300"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Remove ${s.nickname} from ${k.name}?`)) run(() => api(`/api/classes/${k.id}/members/${s.id}`, "DELETE"));
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            className="mt-4 text-xs text-white/40 underline hover:text-rose-300"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete ${k.name}? Student profiles made for this class are deleted too.`)) run(() => api(`/api/classes/${k.id}`, "DELETE"));
            }}
          >
            Delete class
          </button>
        </section>
      ))}
      <AccountActions role="teacher" />
    </div>
  );
}
