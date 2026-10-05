import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import ServiceWorker from "@/components/ServiceWorker";
import SyncProgress from "@/components/SyncProgress";
import SendSuggestions from "@/components/SendSuggestions";
import SuggestLink from "@/components/SuggestLink";
import { InkDivider } from "@/components/Ink";

const body = Source_Sans_3({ variable: "--font-body", subsets: ["latin"] });
const serif = Fraunces({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"], axes: ["SOFT", "opsz"] });

export const metadata: Metadata = {
  title: { default: "Prayog · Play with physics", template: "%s · Prayog" },
  description:
    "Learn NCERT Physics for Classes 7 to 10 by playing with live simulations. No boring reading, no ads.",
};

export const viewport: Viewport = {
  themeColor: "#1a1714",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 sm:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <InkDivider className="mb-8" />
          <div className="flex flex-col items-center gap-2 text-center text-sm text-faint sm:flex-row sm:justify-between sm:text-left">
            <p>
              <span className="font-display text-base text-muted">prayog</span> follows the NCERT syllabus. No ads and no
              tracking.
            </p>
            <div className="flex items-center gap-1">
              <a href="/privacy" className="inline-flex min-h-11 items-center rounded-full px-3 underline hover:text-cream">
                Privacy
              </a>
              <SuggestLink className="inline-flex min-h-11 items-center rounded-full px-3 underline hover:text-cream">
                Suggest an idea
              </SuggestLink>
            </div>
          </div>
        </footer>
        <ServiceWorker />
        <SyncProgress />
        <SendSuggestions />
      </body>
    </html>
  );
}
