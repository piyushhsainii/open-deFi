/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert"),
        os: false,
        path: false,
        buffer: require.resolve("buffer"), // ← Polyfill Buffer
      };
    }

    // Provide Buffer globally in client
    const webpack = require("webpack");
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      })
    );

    return config;
  },
  transpilePackages: ["@solana/wallet-adapter-base"],
};

module.exports = nextConfig;
