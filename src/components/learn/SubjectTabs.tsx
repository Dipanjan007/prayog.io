import Link from "next/link";

const SUBJECTS = [
  { id: "physics", href: "/learn", label: "Physics" },
  { id: "maths", href: "/maths", label: "Maths" },
] as const;

/** Switch between the Physics and Maths maps. */
export default function SubjectTabs({ current }: { current: (typeof SUBJECTS)[number]["id"] }) {
  return (
    <div className="inline-flex gap-1 rounded-full bg-black/20 p-1 text-sm" role="tablist" aria-label="Subject">
      {SUBJECTS.map((s) => (
        <Link
          key={s.id}
          href={s.href}
          role="tab"
          aria-selected={s.id === current}
          className={`rounded-full px-4 py-1.5 transition ${s.id === current ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
