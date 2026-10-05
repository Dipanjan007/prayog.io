import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Light: Shadows and Reflections",
  description: "Class 7 NCERT Curiosity: shadows that grow and shrink, umbra and penumbra, transparent and opaque materials, a pinhole camera and reflection from a plane mirror.",
};

export default function Page() {
  return <LessonPlayer />;
}
