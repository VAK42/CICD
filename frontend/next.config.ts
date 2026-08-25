import type { NextConfig } from "next"
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-ekgh.onrender.com"
const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  async rewrites() {
    return [
      {
        source: "/api/health",
        destination: `${backendUrl.replace(/\/+$/, "")}/health`
      }
    ]
  }
}
export default nextConfig