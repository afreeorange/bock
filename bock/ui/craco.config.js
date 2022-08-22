module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === "production") {
        /** JS Overrides */
        webpackConfig.output.filename = "static/js/[name].js";
        webpackConfig.output.chunkFilename = "static/js/[name].chunk.js";

        /** CSS Overrides */
        webpackConfig.plugins[5].options.filename = "static/css/[name].css";
        webpackConfig.plugins[5].options.chunkFilename =
          "static/css/[name].chunk.css";

        /** TODO: Static asset overrides? */
      }

      return webpackConfig;
    },
  },
};
