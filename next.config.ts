import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Sentry is enabled only when a DSN is configured, so local builds and CI
// without Sentry credentials are unaffected.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export default dsn
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      sourcemaps: {
        disable: true,
      },
    })
  : nextConfig;
