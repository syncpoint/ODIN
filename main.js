const { app, BrowserWindow, Menu } = require('electron')
const settings = require('electron-settings')
const { K } = require('./js/shared/predef')
const { buildFromTemplate } = require('./js/main/menu')
require('./js/main/ipc')

let win

function createWindow (name) {
  const bounds = settings.get(`windowState.${name}`) || { width: 800, height: 600 }
  const options = Object.assign({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  }, bounds)

  win = K(new BrowserWindow(options))(window => {
    
    //workaround for windows; see issue 10862 on electron github
    if (process.platform === 'win32') {
      window.setBounds(Object.assign({}, { x: 0, y: 0 }, bounds))
    } 

    window.loadFile('index.html')
    window.on('closed', () => (win = null))
    window.once('ready-to-show', () => window.show()) // window has been rendered

    // track and store window size and position:
    ;['resize', 'move', 'close'].forEach(event => window.on(event, () => {
      const state = K(window.getBounds())(state => {
        // NOTE: setting fullscreen option to false disables fullscreen toggle.
        if(window.isFullScreen()) state.fullscreen = true
      })
      settings.set(`windowState.${name}`, state)
    }))
  })
}

app.on('ready', () => {
  createWindow('main')
  Menu.setApplicationMenu(buildFromTemplate())
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow('main')
  }
})
