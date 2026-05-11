import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-9f66e737-322e-48f0-ad60-684db416657b.space-z.ai",
    ".space-z.ai",
    "localhost",
  ],
};

export default nextConfig;
