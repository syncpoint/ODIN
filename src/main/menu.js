import { app, Menu } from 'electron'
import mapSettings from '../renderer/components/map/settings'
import settings from 'electron-settings'
import tileProviders from './tile-providers'

const sendMessage = (event, ...args) => (menuItem, focusedWindow) => {
  if (!focusedWindow) return
  focusedWindow.send(event, ...args)
}

const osdOptions = mapSettings.get('osd-options') ||
    ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']

// Get last provider (if any) to check corresponding menu item:
const lastProviderId = settings.get('tileProvider')
const hiDPISupport = mapSettings.get('hiDPISupport') || false

const providerMenu = provider => ({
  id: provider.id,
  label: provider.name,
  type: 'checkbox',
  checked: provider.id === lastProviderId,
  click: (menuItem, focusedWindow) => {
    menuItem.menu.items.filter(x => x !== menuItem).forEach(x => (x.checked = false))
    sendMessage('COMMAND_MAP_TILE_PROVIDER', provider)(menuItem, focusedWindow)
    settings.set('tileProvider', provider.id)
  }
})

const providerAccelerator = (menu, index) => {
  if (index < 9) menu.accelerator = 'CmdOrCtrl+' + (index + 1)
  return menu
}

const tileProvidersMenu = tileProviders()
  .map(providerMenu)
  .map(providerAccelerator)

const preferences = {
  label: 'Preferences',
  submenu: [
    {
      label: 'Coordinate format',
      submenu: [
        {
          label: 'Sexagesimal - 40°26′46″N 79°58′56″W',
          click: sendMessage('COMMAND_COORD_FORMAT', 'dms')
        },
        {
          label: 'Degrees/decimal minutes - 40°26.767′N 79°58.933′W',
          click: sendMessage('COMMAND_COORD_FORMAT', 'dm')
        },
        {
          label: 'Decimal degrees - 40.446° N 79.982° W',
          click: sendMessage('COMMAND_COORD_FORMAT', 'd')
        },
        {
          label: 'UTM - 32U 461344 5481745',
          click: sendMessage('COMMAND_COORD_FORMAT', 'utm')
        },
        {
          label: 'MGRS - 32U MV 61344 81745',
          click: sendMessage('COMMAND_COORD_FORMAT', 'mgrs')
        }
      ]
    }
  ]
}

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
            label: 'Filter',
            submenu: [
              {
                label: 'Brightness',
                click: sendMessage('COMMAND_ADJUST', 'brightness'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+1' : 'Ctrl+Shift+1'
              },
              {
                label: 'Contrast',
                click: sendMessage('COMMAND_ADJUST', 'contrast'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+2' : 'Ctrl+Shift+2'
              },
              {
                label: 'Grayscale',
                click: sendMessage('COMMAND_ADJUST', 'grayscale'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+3' : 'Ctrl+Shift+3'
              },
              {
                label: 'Hue',
                click: sendMessage('COMMAND_ADJUST', 'hue-rotate'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+4' : 'Ctrl+Shift+4'
              },
              {
                label: 'Invert',
                click: sendMessage('COMMAND_ADJUST', 'invert'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+5' : 'Ctrl+Shift+5'
              },
              {
                label: 'Sepia',
                click: sendMessage('COMMAND_ADJUST', 'sepia'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+6' : 'Ctrl+Shift+6'
              },
              {
                label: 'Reset',
                click: sendMessage('COMMAND_RESET_FILTERS'),
                accelerator: process.platform === 'darwin' 
                  ? 'Alt+Cmd+0' : 'Ctrl+Shift+9'
              }
            ]
          },
          {
            label: 'Tile Providers',
            submenu: tileProvidersMenu
          }
        ]
      },
      {
        label: 'HiDPI Support',
        type: 'checkbox',
        checked: hiDPISupport,
        click: (menuItem, focusedWindow) => {
          settings.set('hiDPISupport', menuItem.checked)
          sendMessage('COMMAND_HIDPI_SUPPORT', menuItem.checked)(menuItem, focusedWindow)
        }
      },
      {
        label: 'Copy Coordinates',
        accelerator: 'ALT + C',
        click: sendMessage('COMMAND_COPY_COORDS')
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
      { role: 'togglefullscreen' },
      { type: 'separator' },
      {
        label: 'Show',
        submenu: [
          {
            label: 'Date and Time',
            click: sendMessage('COMMAND_TOGGLE_OSD_OPTIONS', 'C1'),
            type: 'checkbox',
            checked: osdOptions.includes('C1')
          },
          {
            label: 'Scale',
            click: sendMessage('COMMAND_TOGGLE_OSD_OPTIONS', 'C2'),
            type: 'checkbox',
            checked: osdOptions.includes('C2')
          },
          {
            label: 'Position',
            click: sendMessage('COMMAND_TOGGLE_OSD_OPTIONS', 'C3'),
            type: 'checkbox',
            checked: osdOptions.includes('C3')
          }
        ]
      }
    ]
  },
  {
    label: 'Go',
    submenu: [
      {
        label: 'Add bookmark',
        accelerator: 'CmdOrCtrl+B',
        click: sendMessage('COMMAND_ADD_BOOKMARK')
      },
      {
        label: 'Find ...',
        accelerator: 'CmdOrCtrl+F',
        click: sendMessage('COMMAND_GOTO_PLACE')
      }
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
      preferences,
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
  template[4].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
} else {
  // Append preferenes to 'Edit' submenu:
  template[0].submenu.push({ type: 'separator' })
  template[0].submenu.push(preferences)
}

export const buildFromTemplate = () => Menu.buildFromTemplate(template)
