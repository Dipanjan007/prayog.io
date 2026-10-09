import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Kaleidoscopes and burning spots",
  description:
    "Class 8 NCERT Curiosity, Light: Mirrors and Lenses: hinge two mirrors to count images with n = 360 ÷ θ − 1, build a kaleidoscope and a barber-shop mirror tunnel, then focus sunlight with a magnifying glass and a solar cooker dish to find the focal length.",
};

export default function Page() {
  return <LessonPlayer />;
}
