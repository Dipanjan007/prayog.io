import type { ReactNode } from "react";

/**
 * Small hand-drawn, ink-like SVG accents. All inline, all use currentColor,
 * so they take the colour of the text around them.
 */

type Props = { className?: string };

/** A loose, hand-drawn underline swash. */
export function InkUnderline({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 300 18" fill="none" preserveAspectRatio="none" aria-hidden className={className}>
      <path
        d="M3 12.5c38-5.2 82-8.4 131-8.9 47-.5 105 1.9 163 6.6M41 15.6c46-3.4 98-4.9 152-3.9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="ink-draw"
        style={{ ["--len" as string]: 420 }}
      />
    </svg>
  );
}

/** A quiet section divider: a wave drawn by hand, with a pendulum bob in the middle. */
export function InkDivider({ className = "" }: Props) {
  return (
    <div className={`flex items-center justify-center gap-4 text-faint ${className}`} aria-hidden>
      <svg viewBox="0 0 160 16" fill="none" className="h-4 w-28 sm:w-40">
        <path
          d="M2 8.4c6.5-5.2 13.1-5.3 19.6-.2s13.1 5.1 19.6 0 13.1-5.2 19.6-.1 13.1 5.2 19.6.1 13.1-5.1 19.6 0 13.1 5.1 19.6 0 13.1-5 19.6-.1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <svg viewBox="0 0 24 32" fill="none" className="h-7 w-5 text-saffron-400">
        <path d="M12 2.5v17.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M6 2.4h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="12" cy="24" r="4.6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <svg viewBox="0 0 160 16" fill="none" className="h-4 w-28 -scale-x-100 sm:w-40">
        <path
          d="M2 8.4c6.5-5.2 13.1-5.3 19.6-.2s13.1 5.1 19.6 0 13.1-5.2 19.6-.1 13.1 5.2 19.6.1 13.1-5.1 19.6 0 13.1 5.1 19.6 0 13.1-5 19.6-.1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

/** A hand-drawn arrow, curving down and to the right. */
export function InkArrow({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 60 40" fill="none" aria-hidden className={className}>
      <path d="M4 6c14-2 30 3 40 15 3 4 5 8 6 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M43 28.5l7.2 5.6 2.3-8.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STRAND_PATHS: Record<string, ReactNode> = {
  // A thrown ball's arc, with dots for each moment.
  motion: (
    <>
      <path d="M3 20c4-10 9-14 14-13 3 .6 5 3.4 6 6" strokeDasharray="0.1 3.6" strokeWidth="2.2" />
      <circle cx="21.4" cy="15.6" r="2.2" />
      <path d="M2 21.5h20" opacity="0.5" />
    </>
  ),
  // A push: a block and an arrow.
  force: (
    <>
      <rect x="12.5" y="9" width="9" height="9" rx="1.6" />
      <path d="M2.5 13.6h7.6M7.2 10.6l3 3-3 3" />
      <path d="M2 21h20" opacity="0.5" />
    </>
  ),
  // Air bending round a wing.
  fluids: (
    <>
      <path d="M2 8c5-2 9 1.6 13 .4 3-.9 5-2.6 7-2.2" />
      <path d="M2 13.4c5-1.4 8 1.2 12 .6s6-2.4 8-1.6" />
      <path d="M2 18.6c5-1 9 1.4 13 .8 3-.4 5-1.6 7-1.4" />
    </>
  ),
  // A pendulum swinging: energy changing form.
  energy: (
    <>
      <path d="M12 3v11.5" />
      <circle cx="12" cy="17.6" r="3" />
      <path d="M5.4 15.4c-1-2.2-1.2-4.2-.6-6M18.6 15.4c1-2.2 1.2-4.2.6-6" opacity="0.6" />
    </>
  ),
  // A bulb on a loop of wire.
  electricity: (
    <>
      <path d="M8.6 14.2a4.6 4.6 0 1 1 6.8 0c-.8.8-1.2 1.6-1.2 2.6h-4.4c0-1-.4-1.8-1.2-2.6z" />
      <path d="M10 20h4" />
      <path d="M12 2.6v1.6M4.6 9.6h-1.6M21 9.6h-1.6M6.6 4.4l1 1M17.4 4.4l-1 1" opacity="0.6" />
    </>
  ),
  // A ray bending through a prism.
  light: (
    <>
      <path d="M12 4l7.6 14H4.4z" />
      <path d="M2 13.2l7.6-1.6 6 2.4 6.2 3M15.6 14l6.2 1" opacity="0.7" />
    </>
  ),
  // A sound wave from a speaker.
  waves: (
    <>
      <path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0" />
      <path d="M3 18.4h18" opacity="0.4" />
    </>
  ),
};

/** A small line icon for each physics strand. */
export function StrandIcon({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {STRAND_PATHS[id] ?? <circle cx="12" cy="12" r="4" />}
    </svg>
  );
}

/** Four tiny sketches for the Predict, Play, Discover, Master loop. */
export function LoopIcon({ step, className = "" }: { step: number; className?: string }) {
  const paths = [
    // Predict: a question mark in a thought bubble.
    <>
      <path d="M5 15.5c-2.2-1.4-3-3.6-3-5.6C2 5.6 6.4 3 12 3s10 2.6 10 6.9-4.4 6.9-10 6.9c-1.2 0-2.3-.1-3.4-.4L4.6 19z" />
      <path d="M10 8.2c.3-1.2 1.2-1.8 2.2-1.8 1.3 0 2.2.8 2.2 1.9 0 1.6-2.3 1.6-2.3 3.3" />
      <circle cx="12.1" cy="13.6" r="0.4" fill="currentColor" />
    </>,
    // Play: a hand-drawn slider.
    <>
      <path d="M3 12h18" />
      <circle cx="14" cy="12" r="3.2" />
      <path d="M3 6.4h6M3 17.6h10" opacity="0.5" />
    </>,
    // Discover: a magnifying lens.
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="M14.6 14.6L21 21" />
      <path d="M7.4 8.4c.6-1.4 1.8-2.2 3.2-2.4" opacity="0.6" />
    </>,
    // Master: a ribbon medal.
    <>
      <circle cx="12" cy="9" r="5.6" />
      <path d="M8.6 13.6L7 21l5-2.6 5 2.6-1.6-7.4" />
      <path d="M10 9.2l1.4 1.4 2.8-2.8" />
    </>,
  ];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {paths[step] ?? paths[0]}
    </svg>
  );
}
