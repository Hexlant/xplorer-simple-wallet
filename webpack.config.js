const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  devtool: "inline-source-map",
  plugins: [
    new HtmlWebpackPlugin({
      template: "dist/index.html",
      inject: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /[\.js]$/,
        exclude: /node_module/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_module/,
        use: {
          loader: "ts-loader",
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    host: "localhost",
    port: 5000,
    static: {
      directory: path.join(__dirname, "dist"),
    },
    open: true,
  },
};
