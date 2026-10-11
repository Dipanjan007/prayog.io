import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Ice creams, capsules and tents",
  description:
    "Class 10 NCERT Maths: surface areas and volumes of combined solids. Build an ice-cream cone, a capsule and a tent from cones, cylinders and hemispheres, pour cones and balls into a glass, and see why a cone is (1 ÷ 3)πr²h. π = 22/7 throughout.",
};

export default function Page() {
  return <LessonPlayer />;
}
