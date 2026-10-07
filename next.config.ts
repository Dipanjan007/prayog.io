import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Lab tab was removed; its wind tunnel lives on in the Class 8 lesson.
  async redirects() {
    return [{ source: "/lab", destination: "/learn", permanent: false }];
  },
  async headers() {
    return [
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
