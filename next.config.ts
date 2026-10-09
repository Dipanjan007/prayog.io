import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Everything Prayog loads comes from its own origin, so the browser is told
 * to refuse anything else. Inline scripts stay allowed for Next's hydration;
 * dev also needs eval for fast refresh. The one exception is Razorpay's
 * checkout, which the plans page loads only when a parent presses Pay.
 */
const razorpay = "https://checkout.razorpay.com https://api.razorpay.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.razorpay.com",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""} ${razorpay} https://lumberjack.razorpay.com`,
  `frame-src ${razorpay}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: `camera=(), microphone=(), geolocation=(), payment=(self "https://api.razorpay.com"), usb=(), interest-cohort=()` },
  // Razorpay opens bank and UPI pages in pop-ups that report back to checkout.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Vercel PR previews open every lab, so a reviewer can try new ones without
  // signing in (previews have no email settings, so sign-in codes can't go out).
  env: { PRAYOG_PREVIEW: process.env.VERCEL_ENV === "preview" ? "1" : "" },
  // The Lab tab was removed; its wind tunnel lives on in the Class 8 lesson.
  async redirects() {
    return [{ source: "/lab", destination: "/learn", permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
