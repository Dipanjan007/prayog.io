import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OLY_PROBLEMS, getProblem } from "@/content/olympiad";
import ProblemPlayer from "@/components/olympiad/ProblemPlayer";

export function generateStaticParams() {
  return OLY_PROBLEMS.map((p) => ({ set: p.set, problem: p.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/olympiad/[set]/[problem]">): Promise<Metadata> {
  const { set, problem } = await params;
  const p = getProblem(set, problem);
  return { title: p ? `${p.title} · Olympiad` : "Olympiad", description: p?.ask };
}

export default async function ProblemPage({ params }: PageProps<"/olympiad/[set]/[problem]">) {
  const { set, problem } = await params;
  if (!getProblem(set, problem)) notFound();
  return <ProblemPlayer setId={set} problemId={problem} />;
}
