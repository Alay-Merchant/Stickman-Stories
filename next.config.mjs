/** @type {import('next').NextConfig} */
const nextConfig = {
  // These modules load native binaries or run their own server-side bundler.
  // Keeping them external prevents Next from packaging renderer internals into
  // the application server bundle.
  serverExternalPackages: [
    "better-sqlite3",
    "@remotion/bundler",
    "@remotion/renderer",
    "ffmpeg-static",
  ],
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"},
          {key: "Cross-Origin-Opener-Policy", value: "same-origin"},
          {key: "Cross-Origin-Resource-Policy", value: "same-origin"},
          {key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()"},
          {key: "Referrer-Policy", value: "same-origin"},
          {key: "X-Content-Type-Options", value: "nosniff"},
          {key: "X-Frame-Options", value: "DENY"},
        ],
      },
    ];
  },
};

export default nextConfig;
