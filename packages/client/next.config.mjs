/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  transpilePackages: ["common"], // attemptingtospeedbuildtimes

  webpack: (config) => {
    // this part of the config is from chat-gpt and is supposed to let us import svg as react components
    config.module.rules.push({
      test: /\.svg$/, // Test for .svg files
      use: ["@svgr/webpack"], // Use the svgr webpack loader
    });
    return config;
  },
};

export default nextConfig;
