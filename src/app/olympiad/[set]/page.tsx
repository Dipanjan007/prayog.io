import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OLY_SETS, getSet } from "@/content/olympiad";
import { ProblemList } from "@/components/olympiad/SetProgress";

export function generateStaticParams() {
  return OLY_SETS.map((s) => ({ set: s.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/olympiad/[set]">): Promise<Metadata> {
  const { set } = await params;
  const s = getSet(set);
  return { title: s ? `${s.title} · Olympiad` : "Olympiad" };
}

export default async function SetPage({ params }: PageProps<"/olympiad/[set]">) {
  const { set } = await params;
  const s = getSet(set);
  if (!s) notFound();
  return (
    <div className="pt-2">
      <nav className="text-sm text-white/45" aria-label="Breadcrumb">
        <Link href="/olympiad" className="hover:text-white">
          Olympiad
        </Link>
      </nav>
      <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">
        {s.emoji} {s.title}
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">{s.blurb}</p>
      <p className="mt-1 text-xs text-white/45">🎮 {s.sim} · Warm-up, standard, then Olympiad level.</p>
      <ProblemList setId={s.id} />
    </div>
  );
}
