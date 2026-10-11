import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Tiles, cubes and 1729",
  description:
    "Class 8 NCERT Maths (Ganita Prakash): perfect squares and cubes with tiles and unit cubes, the odd-number pattern 1 + 3 + 5 + … = n², square roots by fitting tiles, and Ramanujan's taxi number 1729.",
};

export default function Page() {
  return <LessonPlayer />;
}
