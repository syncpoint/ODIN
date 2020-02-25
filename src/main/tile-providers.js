import electron from 'electron'
import fs from 'fs'
import path from 'path'

const userData = (electron.app || electron.remote.app).getPath('userData')
const filename = path.join(userData, './tile-providers.json')
const readProviders = () => {
  console.log(`reading ${filename}`)
  return JSON.parse(fs.readFileSync(filename))
}
const defaultProviders = () => [{
  'id': 'OpenStreetMap.Mapnik',
  'name': 'OpenStreetMap',
  'url': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'maxZoom': 19,
  'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}]

export const persist = tileProviders => {
  fs.writeFileSync(filename, JSON.stringify(tileProviders))
  console.log('persisted tileproviders to ' + filename)
}

export default (fs.existsSync(filename) ? readProviders : defaultProviders)
