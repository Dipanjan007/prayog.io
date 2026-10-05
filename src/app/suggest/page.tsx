import type { Metadata } from "next";
import SuggestForm from "./SuggestForm";

export const metadata: Metadata = { title: "Suggest an idea" };

export default function SuggestPage() {
  return (
    <div className="mx-auto max-w-xl pt-4">
      <SuggestForm />
    </div>
  );
}
