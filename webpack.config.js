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
  // Add polyfills and fallbacks for node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    vm: require.resolve("vm-browserify"),
    buffer: require.resolve("buffer/"),
    util: require.resolve("util/"),
    url: require.resolve("url/"),
    process: require.resolve("process/browser"),
  }; // Add necessary plugins for polyfills
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
      URL: ["url", "URL"],
      Html5QrcodeScanner: ["html5-qrcode", "Html5QrcodeScanner"],
    })
  );

  // Add define plugin to force specific files to be handled properly
  config.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
      __DEV__: process.env.NODE_ENV !== "production",
    })
  );
  // Ignore source map warnings for html5-qrcode package and any other similar warnings
  config.ignoreWarnings = [
    // Ignore warnings about html5-qrcode source maps
    {
      module: /html5-qrcode/,
      message: /Failed to parse source map/,
    },
    // Ignore any other source map warnings if needed
    {
      message: /Failed to parse source map/,
    },
  ];
  // Disable source map loading for html5-qrcode module
  const sourceMapLoaderConfig = require("./source-map-loader.config.js");
  config.module.rules.push({
    test: /\.js$/,
    use: [
      {
        loader: "source-map-loader",
        options: sourceMapLoaderConfig,
      },
    ],
    enforce: "pre",
    exclude: /node_modules\/html5-qrcode/,
  });

  // Add any necessary resolve aliases for web compatibility
  config.resolve.alias = {
    ...config.resolve.alias,
    "react-native$": "react-native-web",
    "@react-native-async-storage/async-storage": path.resolve(
      __dirname,
      "./utils/asyncStoragePolyfill.js"
    ),
    "url-parse": "url-parse/dist/url-parse.js",
  };

  return config;
};
