import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Magnetic Effects of Electric Current",
  description: "Class 10 NCERT Physics: compass needles and field lines around a wire, a loop and a solenoid, and the force on a current-carrying rod.",
};

export default function Page() {
  return <LessonPlayer />;
}
