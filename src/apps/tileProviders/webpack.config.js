const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const getWebpackConfigFor = (outputFolder, mode) => ({
  context: path.resolve(__dirname, 'src'),
  target: 'electron-renderer',

  // In production mode webpack applies internal optimization/minification:
  // no additional plugins necessary.
  // For advanced options: babel-minify-webpack-plugin: https://webpack.js.org/plugins/babel-minify-webpack-plugin
  mode: mode,
  stats: 'errors-only',
  entry: {
    tileProviders: './index.js'
  },
  output: {
    path: path.resolve(outputFolder, 'tileProviders')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Tile Providers'
    })
  ]
})

module.exports = getWebpackConfigFor

