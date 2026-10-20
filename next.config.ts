import type { NextConfig } from "next";

// Sent with every page and API response.
const securityHeaders = [
  // No other site may show our pages inside a frame (stops "clickjacking",
  // where a fake page hides our buttons under its own).
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must trust our Content-Type and not guess, so a JSON or text
  // response can never be run as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites we link to see only our domain, never the full URL
  // (which could include a ticket ID).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // Don't announce "X-Powered-By: Next.js" to everyone who asks.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The About page became the home page; keep old links working.
  async redirects() {
    return [{ source: "/about", destination: "/", permanent: false }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
