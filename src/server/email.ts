import "server-only";

/**
 * Sends the one-time sign-in code. Uses Resend when RESEND_API_KEY is set.
 * In development without a key the code is printed to the server log instead.
 * Returns false when email isn't configured in production.
 */
export async function sendLoginCode(email: string, code: string): Promise<boolean> {
  return send(
    email,
    `Your Prayog code is ${code}`,
    `Your Prayog sign-in code is ${code}. It works for 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
  );
}

/** Tells someone their unused account is about to be deleted. */
export async function sendInactivityWarning(email: string, days: number): Promise<boolean> {
  return send(
    email,
    "Your Prayog account will be deleted soon",
    `Nobody has used your Prayog account for two years, so we will delete it and everything in it in ${days} days.\n\n` +
      "To keep it, just sign in once at Prayog before then. If you don't need it any more, you don't have to do anything.",
  );
}

async function send(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") return false;
    console.log(`[dev] email to ${to}: ${subject}\n${text}`);
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Prayog <no-reply@prayog.app>", to: [to], subject, text }),
  });
  return res.ok;
}
