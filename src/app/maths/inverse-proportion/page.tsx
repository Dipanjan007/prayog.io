import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Faster car, shorter trip",
  description:
    "Class 8 NCERT Maths (Ganita Prakash Part 2): inverse proportion. Drive from Delhi to Agra at different speeds, share a wall among workers, and see the product stay the same.",
};

export default function Page() {
  return <LessonPlayer />;
}
