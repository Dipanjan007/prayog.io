"use client";

import { useEffect } from "react";
import { sendPending } from "@/lib/suggestion-queue";

/** Sends ideas that were written offline once the device is back online. */
export default function SendSuggestions() {
  useEffect(() => {
    sendPending();
    window.addEventListener("online", sendPending);
    return () => window.removeEventListener("online", sendPending);
  }, []);
  return null;
}
