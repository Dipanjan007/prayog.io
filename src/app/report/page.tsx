import type { Metadata } from "next";
import ReportView from "./ReportView";

export const metadata: Metadata = {
  title: "Weekly report",
  description: "What your child played this week on Prayog, where they could use a hand, and what to ask them at dinner.",
};

export default function ReportPage() {
  return <ReportView />;
}
