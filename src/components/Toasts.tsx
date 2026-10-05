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
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-pop rounded-full border px-5 py-2.5 font-semibold shadow-[0_12px_40px_-12px_rgb(0_0_0/0.7)] ${
            t.big ? "border-saffron-300 bg-saffron-400 text-ink" : "border-line-strong bg-raised text-cream"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
