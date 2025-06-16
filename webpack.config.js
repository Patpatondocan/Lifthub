const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const webpack = require("webpack");
const path = require("path");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          "@react-native-async-storage/async-storage",
        ],
      },
    },
    argv
  );

  // Add polyfills for crypto and Buffer
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      crypto: ["crypto-browserify"],
    })
  );

  // Configure fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    buffer: require.resolve("buffer/"),
    stream: require.resolve("stream-browserify"),
    vm: require.resolve("vm-browserify"),
  };

  // Fix React Native Web imports
  config.resolve.alias = {
    ...config.resolve.alias,
    "react-native$": "react-native-web",
    "html5-qrcode": path.resolve(
      __dirname,
      "node_modules/html5-qrcode/html5-qrcode.min.js"
    ),
  };

  // Ignore source map warnings for html5-qrcode
  config.ignoreWarnings = [
    {
      module: /html5-qrcode/,
      message: /Failed to parse source map/,
    },
  ];

  return config;
};
