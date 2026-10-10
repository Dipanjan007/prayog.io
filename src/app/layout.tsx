import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SubjectPanel from "@/components/SubjectPanel";
import ServiceWorker from "@/components/ServiceWorker";
import SyncProgress from "@/components/SyncProgress";
import SendSuggestions from "@/components/SendSuggestions";
import SuggestLink from "@/components/SuggestLink";
import AccessGate from "@/components/access/AccessGate";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Prayog · Play with physics", template: "%s · Prayog" },
  description:
    "Learn NCERT Physics for Classes 7 to 10 by playing with live simulations. No boring reading, no ads.",
};

export const viewport: Viewport = {
  themeColor: "#070a14",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <NavBar />
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-24 pt-4 sm:px-6 lg:flex-row">
          <SubjectPanel />
          <main className="min-w-0 flex-1">
            <AccessGate>{children}</AccessGate>
          </main>
        </div>
        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 text-xs text-white/40 sm:px-6">
          Prayog follows the NCERT syllabus. No ads and no tracking.{" "}
          <Link href="/privacy" className="underline hover:text-white/70">
            Privacy
          </Link>
          {" · "}
          <Link href="/plans" className="underline hover:text-white/70">
            Plans
          </Link>
          {" · "}
          <SuggestLink className="underline hover:text-white/70">Suggest an idea</SuggestLink>
        </footer>
        <ServiceWorker />
        <SyncProgress />
        <SendSuggestions />
      </body>
    </html>
  );
}
