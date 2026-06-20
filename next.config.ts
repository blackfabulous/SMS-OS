import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  allowedDevOrigins: [
    "preview-chat-9f66e737-322e-48f0-ad60-684db416657b.space-z.ai",
    ".space-z.ai",
    "localhost",
    "192.168.43.103",
  ],
};

export default nextConfig;
