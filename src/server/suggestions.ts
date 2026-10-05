import "server-only";
import { db, hasDb } from "./db";
import { toIssue, type Suggestion } from "@/lib/suggestion";

/** owner/name of the repository suggestions are filed in, when GitHub is set up. */
function githubTarget() {
  const token = process.env.SUGGESTIONS_GITHUB_TOKEN;
  const repo = process.env.SUGGESTIONS_GITHUB_REPO;
  return token && repo && /^[\w.-]+\/[\w.-]+$/.test(repo) ? { token, repo } : null;
}

/** True when a suggestion has somewhere to go: the database, GitHub, or both. */
export function canTakeSuggestions(): boolean {
  return hasDb() || githubTarget() !== null;
}

async function fileIssue(s: Suggestion): Promise<number | null> {
  const target = githubTarget();
  if (!target) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${target.repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${target.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toIssue(s)),
    });
    if (!res.ok) {
      console.error(`suggestion issue failed: ${res.status}`);
      return null;
    }
    return ((await res.json()) as { number: number }).number;
  } catch (e) {
    console.error("suggestion issue failed", e);
    return null;
  }
}

/**
 * Keeps a suggestion in the database (in India) when there is one, and files it
 * as a GitHub issue when that is set up, so the weekly review can pick it up.
 * Returns false only when it could be stored nowhere.
 */
export async function saveSuggestion(s: Suggestion): Promise<boolean> {
  const issue = await fileIssue(s);
  if (hasDb()) {
    await db()`insert into suggestions (role, area, class_num, page, body, github_issue)
      values (${s.role}, ${s.area}, ${s.classNum}, ${s.page}, ${s.text}, ${issue})`;
    return true;
  }
  return issue !== null;
}
