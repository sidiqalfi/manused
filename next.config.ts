import type { NextConfig } from "next"

const securityHeaders = [
  // Klikjacking: larang framing oleh pihak lain.
  { key: "X-Frame-Options", value: "DENY" },
  // Paksa HTTPS hanya via browser (proxy berikutnya sudah handle HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Matikan fitur browser yang tidak dipakai.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
