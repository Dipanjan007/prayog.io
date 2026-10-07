import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Pulleys, ramps and the work meter",
  description:
    "Class 9 NCERT Physics: positive, negative and zero work, power P = W ÷ t, pulleys and mechanical advantage, and pulling a cart up an inclined plane with a spring balance.",
};

export default function Page() {
  return <LessonPlayer />;
}
