import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "localhost,127.0.0.1,192.168.45.93")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: join(appDirectory, "../.."),
  },
};

export default nextConfig;
