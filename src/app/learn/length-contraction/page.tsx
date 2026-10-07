import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Relativity: Shrinking Lengths and the Cosmic Speed Limit",
  description:
    "Beyond the book, Class 10: watch a fast rocket shrink along its motion with L = L₀ ÷ γ, and add speeds the Einstein way to see that nothing beats light.",
};

export default function Page() {
  return <LessonPlayer />;
}
