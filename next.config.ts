import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // ponytail: pg imports `util/types` which Turbopack can't resolve by default.
  // Marking it external lets Node resolve it at runtime instead of bundling.
  serverExternalPackages: ["pg"],
  // Multi-tenant: allow subdomain-based routing
  experimental: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS: 1yr + preload. Verified working at 5min first; now that Cloudflare
          // tunnel + hivepos.id are stable, locking it in.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
