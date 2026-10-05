import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Light: Mirrors and Lenses",
  description: "Class 8 NCERT Physics: plane, concave and convex mirrors and lenses on a live optics bench.",
};

export default function Page() {
  return <LessonPlayer />;
}
