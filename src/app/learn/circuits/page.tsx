import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Electricity: Circuits and their Components",
  description: "Class 7 NCERT Physics: build circuits, test conductors and fix a broken torch.",
};

export default function Page() {
  return <LessonPlayer />;
}
