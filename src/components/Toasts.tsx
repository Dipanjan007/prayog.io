"use client";

import { useCallback, useState } from "react";

export interface Toast {
  id: number;
  text: string;
  big?: boolean;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, big = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, big }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), big ? 3500 : 2500);
  }, []);
  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-pop rounded-full px-5 py-2.5 font-semibold shadow-2xl ${
            t.big
              ? "bg-gradient-to-r from-amber-300 via-pink-400 to-violet-400 text-black"
              : "glass text-white"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
