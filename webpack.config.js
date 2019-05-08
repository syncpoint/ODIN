const path = require('path')

const renderer = {
  context: path.resolve(__dirname, 'src/renderer'),
  entry: {
    renderer: './index.js',
    html: './index.html'
  },

  target: 'electron-renderer',
  devtool: 'source-map', // source-map: production quality (slow)
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        // css-loader: resolve/load required/imported CSS dependencies from JavaScript
        // style-loader: wrap CSS string from css-loader with <style> tag
        // Note: loaders are applied from right to left, i.e. css-loader -> style-loader
        //
        test: /\.css$/,
        use: ['style-loader', 'css-loader' ]
      },
      {
        test: /\.html$/,
        loader: "file-loader?name=[name].[ext]",
      }
    ]
  }
}

const main = {
  context: path.resolve(__dirname, 'src/main'),
  entry: {
    main: './main.js'
  },

  target: 'electron-main'
}

module.exports = [renderer, main]
