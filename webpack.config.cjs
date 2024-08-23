const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, "src/main/index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "fluent.bundle.js",
    library: "fluent",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  mode: "production"
}