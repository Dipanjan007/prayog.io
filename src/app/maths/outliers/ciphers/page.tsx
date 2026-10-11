import type { Metadata } from "next";
import LessonPlayer from "./LessonPlayer";

export const metadata: Metadata = {
  title: "Crack the code",
  description:
    "Maths Outliers lab: write secret messages with a Caesar cipher wheel, do clock arithmetic with mod, crack a shift code by counting letters like Al-Kindi, and see why big primes keep public-key codes safe.",
};

export default function Page() {
  return <LessonPlayer />;
}
