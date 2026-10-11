import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "The chessboard and the rice",
  description:
    "Maths Outliers lab: double grains of rice across a chessboard to 2⁶³ on square 64 and 2⁶⁴ − 1 in all, race ₹1 lakh a day against 1 paisa doubled, and find when a doubling lotus pond is half full.",
};

export default function Page() {
  return <LessonPlayer />;
}
