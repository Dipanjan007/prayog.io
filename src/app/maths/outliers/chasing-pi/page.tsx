import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Chasing π",
  description:
    "Maths Outliers lab: trap π between polygons like Archimedes, add up Madhava's series π ÷ 4 = 1 − 1/3 + 1/5 − ..., use Madhava's end correction, and meet Aryabhata's 3.1416.",
};

export default function Page() {
  return <LessonPlayer />;
}
