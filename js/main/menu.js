const { app, Menu } = require('electron')
const tileProviders = require('./tile-providers')

const sendMessage = (event, ...args) => (menuItem, focusedWindow) => {
  if (!focusedWindow) return
  focusedWindow.send(event, ...args)
}

const providerMenu = provider => ({
  label: provider.name,
  type: 'checkbox',
  click: (menuItem, focusedWindow) => {
    menuItem.menu.items.filter(x => x !== menuItem).forEach(x => (x.checked = false))
    sendMessage('COMMAND_MAP_TILE_PROVIDER', provider)(menuItem, focusedWindow)
  }
})

const providerAccelerator = (menu, index) => {
  if (index < 9) menu.accelerator = 'CmdOrCtrl+' + (index + 1)
  return menu
}

const tileProvidersMenu = tileProviders()
  .map(providerMenu)
  .map(providerAccelerator)

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Map',
        submenu: [
          {
            label: 'Brightness',
            click: sendMessage('COMMAND_ADJUST_BRIGHTNESS')
          },
          {
            label: 'Contrast',
            click: sendMessage('COMMAND_ADJUST_CONTRAST')
          },
          {
            label: 'Grayscale',
            click: sendMessage('COMMAND_ADJUST_GRAYSCALE')
          },
          {
            label: 'Hue',
            click: sendMessage('COMMAND_ADJUST_HUE_ROTATE')
          },
          {
            label: 'Invert',
            click: sendMessage('COMMAND_ADJUST_INVERT')
          },
          {
            label: 'Sepia',
            click: sendMessage('COMMAND_ADJUST_SEPIA')
          },
          {
            label: 'Tile Providers',
            submenu: tileProvidersMenu
          }
        ]
      },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })

  // Edit menu
  template[1].submenu.push(
    { type: 'separator' }
  )

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
}

module.exports = {
  buildFromTemplate: () => Menu.buildFromTemplate(template)
}
