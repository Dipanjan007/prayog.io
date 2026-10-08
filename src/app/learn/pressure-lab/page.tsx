import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Press, pour and pump",
  description:
    "Class 8 NCERT Science (Curiosity): pressure = force ÷ area with a brick on sand, sharp knives and school-bag straps, water pressure rising with depth, and air pressure holding a rubber sucker to a wall.",
};

export default function Page() {
  return <LessonPlayer />;
}
