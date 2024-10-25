const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/main.tsx',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: 'ts-loader',
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          "css-modules-typescript-loader",
          // Translates CSS into CommonJS
          { loader: "css-loader", options: { modules: true } },
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ]
  },
  resolve: {
    extensions: [
      '.ts', '.tsx', '.js'
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 7676,
    allowedHosts: ["para.teamokadavr.work"],
    proxy: [{
      context: ['/api'],
      target: 'http://localhost:7677/'
    }],
    client: {
      webSocketURL: 'wss://para.teamokadavr.work/ws',
    }
  },
  plugins: [new HtmlWebpackPlugin({hash: true, template: 'index.html'})]
};
