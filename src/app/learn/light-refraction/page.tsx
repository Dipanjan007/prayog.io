import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Light: Reflection and Refraction",
  description: "Class 10 NCERT Physics: bend light through glass, form images with lenses and mirrors, and focus a projector.",
};

export default function Page() {
  return <LessonPlayer />;
}
