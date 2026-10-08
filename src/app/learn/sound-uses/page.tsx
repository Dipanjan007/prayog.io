import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Silent bells and singing halls",
  description:
    "Class 9 NCERT Physics: pump the air out of a bell jar, tune a hall's reverberation time with Sabine's formula, find a crack in steel with ultrasound and compare animal hearing ranges.",
};

export default function Page() {
  return <LessonPlayer />;
}
