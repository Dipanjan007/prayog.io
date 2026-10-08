"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, refreshMe, useMe } from "@/lib/account";
import { progressStore } from "@/lib/progress";
import { profileStore } from "@/lib/profile";
import AccountActions from "./AccountActions";
import ChildForm, { type ChildValues } from "./ChildForm";

/**
 * A signed-in parent's children: pick who uses this device, add a child,
 * correct one's details, or delete one. Progress a guest made on this
 * device moves into the new child.
 */
export default function Family() {
  const me = useMe();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const children = me?.children ?? [];
  const showForm = adding || children.length === 0;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const create = (v: ChildValues) =>
    run(async () => {
      const guest = !profileStore.get().child?.id;
      const { child } = await api<{ child: { id: string } }>("/api/children", "POST", {
        ...v,
        progress: guest ? progressStore.get() : undefined,
      });
      if (!guest) progressStore.clear();
      profileStore.set({ parent: null, child: { id: child.id, ...v } });
      await refreshMe();
      router.push("/learn");
    });

  const use = (id: string) =>
    run(async () => {
      await api(`/api/children/${id}/use`, "POST");
      await refreshMe();
      router.push("/learn");
    });

  const save = (id: string, v: ChildValues) =>
    run(async () => {
      await api(`/api/children/${id}`, "PATCH", v);
      const here = profileStore.get();
      if (here.child?.id === id) profileStore.set({ ...here, child: { id, ...v } });
      await refreshMe();
      setEditing(null);
    });

  const remove = (id: string, nickname: string) => {
    if (!window.confirm(`Delete ${nickname}'s profile and all their progress? This can't be undone.`)) return;
    run(async () => {
      await api(`/api/children/${id}`, "DELETE");
      if (profileStore.get().child?.id === id) {
        profileStore.clear();
        progressStore.clear();
      }
      await refreshMe();
    });
  };

  const editingChild = children.find((c) => c.id === editing);
  if (editingChild) {
    return (
      <section className="glass rounded-3xl p-6">
        <div className="text-sm text-violet-300">Correct a profile</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Edit {editingChild.nickname}</h1>
        <ChildForm
          key={editingChild.id}
          initial={editingChild}
          onSubmit={(v) => save(editingChild.id, v)}
          submitLabel="Save"
          busy={busy}
          onBack={() => setEditing(null)}
        />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
    );
  }

  if (showForm) {
    return (
      <section className="glass rounded-3xl p-6">
        <div className="text-sm text-violet-300">Hand the device to your child</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Make your explorer</h1>
        <ChildForm onSubmit={create} submitLabel="Start exploring" busy={busy} onBack={children.length ? () => setAdding(false) : undefined} />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {children.length === 0 && <AccountActions role="parent" />}
      </section>
    );
  }

  return (
    <section className="glass rounded-3xl p-6">
      <div className="text-sm text-cyan-300">Signed in as {me?.account?.name}</div>
      <h1 className="font-display mt-2 text-3xl font-bold">Who is learning on this device?</h1>
      <ul className="mt-5 grid gap-2">
        {children.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/10 p-3">
            <span className="text-3xl">{c.avatar}</span>
            <div className="flex-1">
              <div className="font-semibold">{c.nickname}</div>
              <div className="text-xs text-white/50">Class {c.classNum}</div>
            </div>
            <button className="text-xs text-white/40 underline hover:text-white/70" disabled={busy} onClick={() => setEditing(c.id)}>
              Edit
            </button>
            <button className="text-xs text-white/40 underline hover:text-rose-300" disabled={busy} onClick={() => remove(c.id, c.nickname)}>
              Delete
            </button>
            <button className="btn-primary !py-2 text-sm" disabled={busy} onClick={() => use(c.id)}>
              {me?.child?.id === c.id ? "Continue" : "Use here"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => setAdding(true)}>
          ＋ Add a child
        </button>
        <Link href="/report" className="btn-ghost">
          📊 This week&apos;s report
        </Link>
      </div>
      <AccountActions role="parent" />
    </section>
  );
}
