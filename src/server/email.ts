import "server-only";

/**
 * Sends the one-time sign-in code. Uses Resend when RESEND_API_KEY is set.
 * In development without a key the code is printed to the server log instead.
 * Returns false when email isn't configured in production.
 */
export async function sendLoginCode(email: string, code: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") return false;
    console.log(`[dev] Prayog sign-in code for ${email}: ${code}`);
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Prayog <no-reply@prayog.app>",
      to: [email],
      subject: `Your Prayog code is ${code}`,
      text: `Your Prayog sign-in code is ${code}. It works for 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
    }),
  });
  return res.ok;
}
