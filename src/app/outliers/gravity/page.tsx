import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Gravitation: Mass, Weight and Gravity",
  description:
    "Class 9 gravity lab: feel F = (G × m₁ × m₂) ÷ r², weigh a 45 kg astronaut on Earth, Moon, Mars and Jupiter, drop a feather in a vacuum, fire Newton's cannon into orbit and squeeze Earth into a black hole.",
};

export default function Page() {
  return <LessonPlayer />;
}
