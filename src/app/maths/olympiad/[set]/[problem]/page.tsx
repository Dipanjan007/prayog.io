import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblem, getSet, problemsFor, subjectOf } from "@/content/olympiad";
import ProblemPlayer from "@/components/olympiad/ProblemPlayer";

export function generateStaticParams() {
  return problemsFor("maths").map((p) => ({ set: p.set, problem: p.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/maths/olympiad/[set]/[problem]">): Promise<Metadata> {
  const { set, problem } = await params;
  const p = getProblem(set, problem);
  return { title: p ? `${p.title} · Maths Olympiad` : "Maths Olympiad", description: p?.ask };
}

export default async function MathsProblemPage({ params }: PageProps<"/maths/olympiad/[set]/[problem]">) {
  const { set, problem } = await params;
  const s = getSet(set);
  if (!getProblem(set, problem) || !s || subjectOf(s) !== "maths") notFound();
  return <ProblemPlayer setId={set} problemId={problem} />;
}
