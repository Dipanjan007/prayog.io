import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Exploring Forces",
  description: "Class 8 NCERT Curiosity: push a crate against friction, weigh objects on a spring balance, and pull with magnets and charged combs.",
};

export default function Page() {
  return <LessonPlayer />;
}
