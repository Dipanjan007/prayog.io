import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Electricity",
  description: "Class 10 NCERT Physics: Ohm's law, resistivity, resistors in series and parallel, and the heating effect of current in a circuit lab.",
};

export default function Page() {
  return <LessonPlayer />;
}
