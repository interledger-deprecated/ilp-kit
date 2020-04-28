// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

module.exports = {
  mode: "development",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "babel-loader"
      },
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }
    ]
  },
  output: {
    filename: "webpack.bundle.js",
    path: path.resolve(__dirname, "public")
  },
  resolve: {
    extensions: [".ts", ".js", ".json"]
  }
};
