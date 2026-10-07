import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Lemon batteries and nervous compasses",
  description:
    "Class 8 NCERT Curiosity: make a compass needle swing with a current, find the north pole of a coil, build a lemon battery, add cells in series and light an LED the right way round.",
};

export default function Page() {
  return <LessonPlayer />;
}
