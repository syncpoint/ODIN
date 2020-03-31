import { Application } from 'spectron'
import path from 'path'

module.exports = {
  async startApp () {
    const app = await new Application({
      startTimeout: 30000,
      path: path.resolve(__dirname, '../node_modules/.bin/electron'),
      args: [path.join(__dirname, '..'), '--noDevServer']
    }).start()
    return app
  },

  async stopApp (app) {
    if (app && app.isRunning()) {
      await app.stop()
    }
  }
}
