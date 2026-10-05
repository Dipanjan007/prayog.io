import { hasDb } from "@/server/db";
import { ok } from "@/server/http";
import { currentAccount, currentChild } from "@/server/session";
import { childrenOf, childView, classesOfChild } from "@/server/views";

/** Who is signed in on this device. `server: false` means device-only mode. */
export async function GET() {
  if (!hasDb()) return ok({ server: false });
  const [account, child] = await Promise.all([currentAccount(), currentChild()]);
  return ok({
    server: true,
    account,
    children: account?.role === "parent" ? await childrenOf(account.id) : undefined,
    child: child ? { ...childView(child), classes: await classesOfChild(child.id) } : null,
  });
}
