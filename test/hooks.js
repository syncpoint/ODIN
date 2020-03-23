import { Application } from 'spectron'
import electron from 'electron'
import os from 'os'
import path from 'path'

const projectPath = os.homedir()

module.exports = {
  async startApp () {
    const app = await new Application({
      path: electron,
      args: [path.join(__dirname, '..'), '--noDevServer', `--projectPath=${projectPath}`]
    }).start()
    return app
  },

  async stopApp (app) {
    if (app && app.isRunning()) {
      await app.stop()
    }
  }
}
