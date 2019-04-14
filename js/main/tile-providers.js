const fs = require('fs')
const path = require('path')

const filename = path.join(process.cwd(), './tile-providers.json')

const readProviders = () => JSON.parse(fs.readFileSync(filename))
const defaultProviders = () => [
  {
    'id': 'OpenStreetMap.Mapnik',
    'name': 'OpenStreetMap',
    'url': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'maxZoom': 19,
    'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
]

module.exports = (fs.existsSync(filename) ? readProviders : defaultProviders)
