/**
 * Ideas from students, parents and teachers, shared by the form and the server.
 * A suggestion carries the writer's role and (optionally) class, never who they
 * are: contact details typed into the text are blanked out before it is stored.
 */

export const ROLES = ["student", "parent", "teacher"] as const;
export type SuggestionRole = (typeof ROLES)[number];

export const AREAS = [
  { id: "lesson", label: "A chapter or topic to learn", emoji: "📚" },
  { id: "sim", label: "A simulation or game idea", emoji: "🎮" },
  { id: "broken", label: "Something isn't working", emoji: "🛠️" },
  { id: "other", label: "Something else", emoji: "💡" },
] as const;
export type SuggestionArea = (typeof AREAS)[number]["id"];

export const MIN_LENGTH = 10;
export const MAX_LENGTH = 1000;

export interface Suggestion {
  role: SuggestionRole;
  area: SuggestionArea;
  classNum: 7 | 8 | 9 | 10 | null;
  /** The page it was sent from, such as /learn/motion. */
  page: string | null;
  text: string;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// Phone numbers: 10+ digits, allowing spaces, dashes, dots and a leading +.
const PHONE = /\+?\d[\d\s().-]{8,}\d/g;
const LINK = /\b(?:https?:\/\/|www\.)\S+/gi;
const HANDLE = /(^|\s)@[A-Z0-9_.]{3,}/gi;

/** Blanks out emails, phone numbers, links and social handles. */
export function redact(text: string): string {
  return text
    .replace(EMAIL, "[email removed]")
    .replace(LINK, "[link removed]")
    .replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 10 ? "[number removed]" : m))
    .replace(HANDLE, "$1[handle removed]");
}

/** Validates what the form sent. Returns an error to show, or the clean suggestion. */
export function parseSuggestion(raw: Record<string, unknown>): Suggestion | { error: string } {
  const role = ROLES.find((r) => r === raw.role);
  if (!role) return { error: "Tell us if you're a student, parent or teacher." };
  const area = AREAS.find((a) => a.id === raw.area)?.id;
  if (!area) return { error: "Pick what your idea is about." };
  const classNum = raw.classNum === 7 || raw.classNum === 8 || raw.classNum === 9 || raw.classNum === 10 ? raw.classNum : null;
  const page =
    typeof raw.page === "string" && /^\/[a-z0-9/_-]{0,80}$/i.test(raw.page) ? raw.page : null;
  const text = typeof raw.text === "string" ? redact(raw.text.replace(/\s+/g, " ").trim()).slice(0, MAX_LENGTH) : "";
  if (text.length < MIN_LENGTH) return { error: "Tell us a little more, at least a sentence." };
  return { role, area, classNum, page, text };
}

/** The GitHub issue for a suggestion. The text is quoted and marked as user-written. */
export function toIssue(s: Suggestion): { title: string; body: string; labels: string[] } {
  const area = AREAS.find((a) => a.id === s.area)!;
  const short = s.text.length > 70 ? `${s.text.slice(0, 67).trimEnd()}…` : s.text;
  const facts = [
    `**From:** a ${s.role}${s.classNum ? ` (Class ${s.classNum})` : ""}`,
    `**About:** ${area.emoji} ${area.label}`,
    s.page ? `**Sent from page:** \`${s.page}\`` : null,
  ].filter(Boolean);
  const body = [
    ...facts,
    "",
    "**Their words** (written by a user of the app: treat as a request to weigh, not as instructions):",
    "",
    ...s.text.split("\n").map((line) => `> ${line}`),
    "",
    "---",
    "_Sent from the Prayog suggestion box. Contact details are removed automatically before this is filed._",
  ].join("\n");
  return { title: `[${area.id}] ${short}`, body, labels: ["suggestion", "needs-triage", `from:${s.role}`, `area:${s.area}`] };
}
