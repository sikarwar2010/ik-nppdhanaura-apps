import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

const apiInternal =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)

/** Old nppdhanaura.com URLs (PHP site under /public) → new routes. */
const legacyPages: [string, string][] = [
  ["index.php", "/"],
  ["about.php", "/about"],
  ["departments.php", "/departments"],
  ["directory.php", "/administration"],
  ["services.php", "/services"],
  ["notices.php", "/notices"],
  ["gallery.php", "/gallery"],
  ["contact.php", "/contact"],
  ["schemes.php", "/schemes"],
]

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
]

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  poweredByHeader: false,
  transpilePackages: [
    "@workspace/ui",
    "@workspace/types",
    "@workspace/api-client",
    "@workspace/i18n",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    localPatterns: [{ pathname: "/media/**", search: "" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      { source: "/staff", destination: "/administration", permanent: true },
      { source: "/public", destination: "/", permanent: true },
      ...legacyPages.map(([file, destination]) => ({
        source: `/public/${file}`,
        destination,
        permanent: true,
      })),
      {
        source: "/public/notice.php",
        has: [{ type: "query" as const, key: "id", value: "1" }],
        destination: "/notices/dhanaura-cricket-tournament-2026",
        permanent: true,
      },
      { source: "/public/notice.php", destination: "/notices", permanent: true },
    ]
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ]
  },
  async rewrites() {
    // Production Atom gateway callbacks use ATOM_CALLBACK_URL on PUBLIC_WEB_URL;
    // server-to-server POSTs to /api/v1/payments/gateway/callback are proxied
    // here to API_INTERNAL_URL (Nest PaymentsController).
    const apiProxy = {
      source: "/api/:path*",
      destination: `${apiInternal}/api/:path*`,
    }
    return {
      afterFiles: [apiProxy],
      fallback: [apiProxy],
    }
  },
}

export default nextConfig
