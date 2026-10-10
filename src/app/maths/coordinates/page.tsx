import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Drone over the grid",
  description:
    "Class 9 NCERT Maths (Ganita Manjari): coordinates (x, y), the four quadrants, mirror images in the axes, the distance formula and the midpoint, with a delivery drone.",
};

export default function Page() {
  return <LessonPlayer />;
}
