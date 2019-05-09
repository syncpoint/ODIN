const path = require('path')
const { spawn } = require('child_process')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const RULES = {
  javascript: {
    test: /\.js$/,
    exclude: /node_modules/,
    use: ["babel-loader"]
  },

  css: {
    // css-loader: resolve/load required/imported CSS dependencies from JavaScript
    // style-loader: wrap CSS string from css-loader with <style> tag
    // Note: loaders are applied from right to left, i.e. css-loader -> style-loader
    //
    test: /\.css$/,
    use: ['style-loader', 'css-loader' ]
  },

  image: {
    test: /\.(png|svg|jpg|gif)$/,
    use: [{
      loader: 'file-loader',
      options: {
        name:'img/[name]_[hash:7].[ext]',
      }
    }]
  },

  font: {
    test: /\.(eot|svg|ttf|woff|woff2)$/,
    use: [{ loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]' }]
  }
}

const rules = () => Object.values(RULES)
const mode = env => env.production ? 'production' : 'development'

const rendererConfig = (env, argv) => ({
  context: path.resolve(__dirname, 'src/renderer'),
  target: 'electron-renderer',

  // In production mode webpack applies internal optimization/minification:
  // no additional plugins necessary.
  // For advanced options: babel-minify-webpack-plugin: https://webpack.js.org/plugins/babel-minify-webpack-plugin
  mode: mode(env),
  module: { rules: rules() },
  entry: {
    renderer: './index.js',
    // html: './index.html'
  },

  plugins: [
    // TODO: remove index.html
    new HtmlWebpackPlugin({
      title: 'ODIN - C2IS'
    })
  ]
})

const mainConfig = (env, argv) => ({
  context: path.resolve(__dirname, 'src/main'),
  target: 'electron-main',
  mode: mode(env),
  entry: {
    main: './main.js'
  }
})

const devServer = env => {
  if(env.production) return ({}) // no development server for production
  else return ({
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
    }
  })
}

const devtool = env => {
  if(env.production) return ({}) // no source maps for production
  else return ({
    devtool: 'cheap-source-map'
  })
}

module.exports = (env, argv) => {
  env = env || {}
  return [
    // Merge development server and devtool to renderer configuration when necessary:
    Object.assign({}, rendererConfig(env, argv), devServer(env), devtool(env)),
    mainConfig(env, argv)
  ]
}