import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Wire a safe home",
  description:
    "Class 10 NCERT Science: wire a house with 5 A and 15 A circuits, trip an MCB by overloading, blow a fuse with a short circuit, make a faulty iron safe with earthing, and work out a month's electricity bill in kWh.",
};

export default function Page() {
  return <LessonPlayer />;
}
