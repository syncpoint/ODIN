import { Application } from 'spectron'
import electron from 'electron'
import path from 'path'

module.exports = {
  async startApp () {
    const app = await new Application({
      path: electron,
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
