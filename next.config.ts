import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/emailhr";

const nextConfig: NextConfig = {
  basePath: basePath === "" ? undefined : basePath,
};

export default nextConfig;
