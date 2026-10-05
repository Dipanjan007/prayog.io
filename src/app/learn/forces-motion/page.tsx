import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "How Forces Affect Motion",
  description: "Class 9 NCERT Physics: Newton's three laws and momentum on an air track with colliding carts, a push you control and spring recoil.",
};

export default function Page() {
  return <LessonPlayer />;
}
