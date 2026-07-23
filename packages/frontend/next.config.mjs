/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: false,
  experimental: {},
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    // ignoreBuildErrors: true,
  },
  devIndicators: false, // turn off the next logo
  // lint is a separate CI/editor step against the root eslint config, which does type-aware
  // linting over every packages/*/tsconfig.json. A production build shouldn't drag the whole
  // monorepo's lint toolchain in just to lint. Type-checking still runs and still fails the build.
  eslint: { ignoreDuringBuilds: true },
  // transpilePackages: ["common"], // attemptingtospeedbuildtimes
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    // this is supposed to let us import svg as react components
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
