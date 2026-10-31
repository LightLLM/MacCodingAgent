import type { NextConfig } from "next";

const agentOrigin = process.env.MCA_AGENT_URL ?? "http://127.0.0.1:8787";
const useHostedApi =
  process.env.VERCEL === "1" || process.env.MCA_USE_HOSTED_API === "1";

const nextConfig: NextConfig = {
  async rewrites() {
    if (useHostedApi) {
      return [
        {
          source: "/agent-api/:path*",
          destination: "/api/:path*",
        },
      ];
    }
    return [
      {
        source: "/agent-api/:path*",
        destination: `${agentOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
