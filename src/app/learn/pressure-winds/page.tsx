import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Pressure, Winds, Storms, and Cyclones",
  description: "Class 8 NCERT Physics in a live wind tunnel: find out why storms lift roofs.",
};

export default function Page() {
  return <LessonPlayer />;
}
