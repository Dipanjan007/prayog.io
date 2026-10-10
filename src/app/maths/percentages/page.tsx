import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "The Diwali sale",
  description:
    "Class 8 NCERT Maths (Ganita Prakash Part 2): percent as a fraction of 100 on a 10 × 10 grid, discounts and GST on a shop bill, and why +20% then −20% does not bring a price back.",
};

export default function Page() {
  return <LessonPlayer />;
}
