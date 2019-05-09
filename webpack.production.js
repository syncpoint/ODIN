const path = require('path')

const renderer = {
  target: 'electron-renderer',

  /**
   * In production mode webpack applies internal optimization/minification:
   * no additional plugins necessary.
   */
  mode: 'production',
  context: path.resolve(__dirname, 'src/renderer'),
  entry: {
    renderer: './index.js',
    html: './index.html'
  },

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
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name:'img/[name]_[hash:7].[ext]',
          }
        }]
      }
    ]
  },

  plugins: [
    // TODO: remove index.html
    // new HtmlWebpackPlugin()
  ]
}

const main = {
  target: 'electron-main',
  mode: 'production',
  context: path.resolve(__dirname, 'src/main'),
  entry: {
    main: './main.js'
  }
}

module.exports = [renderer, main]
