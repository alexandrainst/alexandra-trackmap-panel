const path = require('path');
const webpack = require('webpack');
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'node',
  context: path.join(__dirname, 'src'),
  entry: {
    module: './module.js'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: "amd"
  },
  externals: [
    'jquery', 'lodash', 'moment',
    function (context, request, callback) {
      var prefix = 'grafana/';
      if (request.indexOf(prefix) === 0) {
        return callback(null, request.substr(prefix.length));
      }
      callback();
    }
  ],
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      { from: 'plugin.json', to: '.'},
      { from: 'partials/*', to: '.'},
      { from: '../README.md', to: '.'},
      { from: '../LICENSE', to: '.'}
    ])
  ],
  resolve: {
    alias: {
      'src': path.join(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      }
    ]
  }
}
