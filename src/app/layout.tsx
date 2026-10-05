import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import ServiceWorker from "@/components/ServiceWorker";
import SyncProgress from "@/components/SyncProgress";
import SendSuggestions from "@/components/SendSuggestions";
import SuggestLink from "@/components/SuggestLink";

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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 sm:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs text-white/40 sm:px-6">
          Prayog follows the NCERT syllabus. No ads and no tracking.{" "}
          <a href="/privacy" className="underline hover:text-white/70">
            Privacy
          </a>
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
