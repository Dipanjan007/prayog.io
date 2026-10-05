import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Keeping Time with the Skies",
  description: "Class 8 NCERT Curiosity: day and night, shadows and sundials, phases of the Moon, and lunar and solar calendars.",
};

export default function Page() {
  return <LessonPlayer />;
}
