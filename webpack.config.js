const path = require('path')
const { spawn } = require('child_process')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const hash = 'hash:base64:8'

const RULES = {
  javascript: {
    test: /\.js$/,
    exclude: /node_modules/,
    use: ['babel-loader', 'eslint-loader']
  },

  css: {
    // css-loader: resolve/load required/imported CSS dependencies from JavaScript
    // style-loader: wrap CSS string from css-loader with <style> tag
    // Note: loaders are applied from right to left, i.e. css-loader -> style-loader
    //
    test: /\.css$/,
    use: ['style-loader', 'css-loader']
  },

  image: {
    test: /\.(png|svg|jpg|gif)$/,
    use: [{
      loader: 'file-loader',
      options: {
        name: `img/[name]__[${hash}].[ext]`
      }
    }]
  },

  font: {
    test: /\.(eot|svg|ttf|woff|woff2)$/,
    use: [{ loader: `file-loader?name=font/[name]__[${hash}].[ext]` }]
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
  stats: 'errors-only',
  module: { rules: rules() },
  entry: {
    renderer: ['react-hot-loader/patch', './index.js']
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: 'ODIN - C2IS'
    })
  ]
})

const mainConfig = (env, argv) => ({
  context: path.resolve(__dirname, 'src/main'),
  target: 'electron-main',
  mode: mode(env),
  stats: 'errors-only',
  entry: {
    main: './main.js'
  }
})

const devServer = env => {
  if (env.production) return ({}) // no development server for production
  return ({
    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      before () {
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
  if (env.production) return ({}) // no source maps for production
  return ({
    devtool: 'cheap-source-map'
  })
}

module.exports = (env, argv) => {
  env = env || {}

  // Merge development server and devtool to renderer configuration when necessary:
  const renderer = Object.assign(
    {},
    rendererConfig(env, argv),
    devServer(env),
    devtool(env)
  )

  const main = mainConfig(env, argv)
  return [renderer, main]
}
