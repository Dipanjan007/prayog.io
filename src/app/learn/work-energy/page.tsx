import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Work, Energy, and Simple Machines",
  description: "Class 9 NCERT Physics: work, kinetic and potential energy, conservation of energy and power on a roller coaster, and levers with the principle of moments.",
};

export default function Page() {
  return <LessonPlayer />;
}
