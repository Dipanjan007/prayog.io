import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Gravity and Black Holes",
  description:
    "Squeeze Earth, the Sun and a giant star until they become black holes. Explore g = (G × M) ÷ R², escape speed, the Schwarzschild radius r_s = (2 × G × M) ÷ c², how stars die, and how black holes bend light.",
};

export default function Page() {
  return <LessonPlayer />;
}
