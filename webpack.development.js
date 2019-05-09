const { spawn } = require('child_process')
const path = require('path')

// TODO: DRY - combine development and production configurations

const renderer = {
  target: 'electron-renderer',
  mode: 'development', // controls webpack-internal optimizations
  devtool: 'cheap-source-map',
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
            name: 'img/[name]_[hash:7].[ext]',
          }
        }]
      }
   ]
  },

  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    before() {
      spawn(
        'electron',
        ['.'],
        { shell: true, env: process.env, stdio: 'inherit' }
      )
      .on('close', code => process.exit(code))
      .on('error', error => console.error(error))
    }
  },

  plugins: [
    // TODO: check for more recent alternatives
  ]
}

const main = {
  target: 'electron-main',
  mode: 'development',
  context: path.resolve(__dirname, 'src/main'),
  entry: {
    main: './main.js'
  }
}

module.exports = [renderer, main]
