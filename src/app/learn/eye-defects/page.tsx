import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Dadi's reading glasses",
  description:
    "Class 10 NCERT Science: find your near point, age an eye from 15 to 80 to see presbyopia, design +3 D reading glasses and a bifocal, and see why a cataract needs surgery.",
};

export default function Page() {
  return <LessonPlayer />;
}
