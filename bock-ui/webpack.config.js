const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLPlugin = require('html-webpack-plugin');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const packageInfo = require('./package.json');

const outputFolder = 'cached_dist';
const entryPoints = [
  './src/contrib/reset.css',
  './src/contrib/code-highlight.css',
  './src/contrib/pymdown-header-anchors.css',
  './src/contrib/pymdown-critic.css',
  './src/contrib/ionicons.min.css',

  './src/Bock.js',
];

/* Configure plugins */
const CleanOutputs = new CleanWebpackPlugin([outputFolder]);
const BockCSS = new ExtractTextPlugin('Bock.css');
const BockTemplate = new HTMLPlugin({
  template: './src/Bock.html',
  favicon: './src/favicon.ico',
  minify: {
    collapseWhitespace: true,
    html5: true,
    minifyCSS: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
  },
});
const variables = new webpack.DefinePlugin({
  'process.env': {
    BOCK_GA_TOKEN: JSON.stringify(process.env.BOCK_GA_TOKEN),
  },
  projectVersion: JSON.stringify(packageInfo.version),
});

module.exports = {
  entry: entryPoints,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                ['transform-react-jsx', { pragma: 'm' }],
              ],
            },
          }, // babel-loader
          {
            loader: 'eslint-loader',
            options: {
              emitWarning: true,
            },
          }, // eslint-loader
        ],
      },
      // End JS config

      {
        test: /\.(sass|css)$/,
        use: BockCSS.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true,
              },
            },
            'sass-loader',
          ],
        }),
      },
      // End CSS config

      {
        test: /\.(woff|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'base64-font-loader',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, outputFolder),
    publicPath: '/',
    filename: 'Bock.js',
  },
  plugins: [
    CleanOutputs,
    BockCSS,
    BockTemplate,
    variables,
    new UglifyJsPlugin(),
  ],
  devServer: {
    contentBase: path.resolve(__dirname, outputFolder),
    compress: true,
    port: 9000,
  },
};
