import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Electricity: Magnetic and Heating Effects",
  description: "Class 8 NCERT Curiosity: build an electromagnet crane, see why only iron is lifted, and make a nichrome wire glow until the fuse melts.",
};

export default function Page() {
  return <LessonPlayer />;
}
