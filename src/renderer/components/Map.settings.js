import path from 'path'
import settings from 'electron-settings'

// Dedicated file for map settings:
settings.setPath(path.format({
  dir: path.dirname(settings.file()),
  base: 'MapSettings'
}))

export default settings
