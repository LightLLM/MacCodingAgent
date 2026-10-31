import type { NextConfig } from "next";

const agentOrigin = process.env.MCA_AGENT_URL ?? "http://127.0.0.1:8787";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/agent-api/:path*",
        destination: `${agentOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
