import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Describing Motion Around Us",
  description: "Class 9 NCERT Physics: drive a sports car and watch its distance–time and speed–time graphs draw live.",
};

export default function Page() {
  return <LessonPlayer />;
}
