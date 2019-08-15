import L from 'leaflet'
import ms from 'milsymbol'
import { fromNow } from '../../shared/datetime'
import { K } from '../../shared/combinators'
import selection from '../components/App.selection'

const MODIFIER_MAP = {
  f: 'reinforcedReduced',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',
  z: 'speed'
}

const icon = symbol => L.divIcon({
  className: '',
  html: symbol.asSVG(),
  iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
})

const modifiers = feature => Object.entries(feature.properties)
  .filter(([key, value]) => MODIFIER_MAP[key] && value)
  .map(([key, value]) => ([key, key === 'w' ? fromNow(value) : value]))
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIER_MAP[key]] = value)), {})

const symbolOptions = feature => ({
  standard: {
    size: 34,
    colorMode: 'Light', // default: light
    simpleStatusModifier: true,
    ...modifiers(feature)
  },
  highlighted: {
    size: 34,
    colorMode: 'Light', // default: light
    simpleStatusModifier: true,
    monoColor: 'white',
    outlineColor: 'black',
    outlineWidth: 6,
    ...modifiers(feature)
  }
})

const symbol = (feature, options) => {
  const sidc = feature.properties.sidc
  return new ms.Symbol(sidc, options)
}

const options = {
  draggable: false, // only draggable in edit mode
  autoPan: true
}

const initialize = function (feature, options) {
  options = options || {}

  // Prepare standard and highlighted icons:
  this.icons = {}
  Object.keys(symbolOptions(feature)).forEach(key => {
    this.icons[key] = icon(symbol(feature, symbolOptions(feature)[key]))
  })

  options.icon = this.icons.standard

  L.Util.setOptions(this, options)

  const latlng = L.latLng(
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0])

  L.Marker.prototype.initialize.call(this, latlng)
}

const onAdd = function (map) {
  L.Marker.prototype.onAdd.call(this, map)
  this.on('click', this.select, this)
}

const onRemove = function (map) {
  this.off('click', this.select, this)
  L.Marker.prototype.onRemove.call(this, map)
}

const select = function () {
  selection.select(this.feature)
  this.setIcon(this.icons.highlighted)
  // TODO: only call this.edit() when not read-only
  this.edit()
}

const deselect = function () {
  this.dragging.disable()
  this.setIcon(this.icons.standard)
}

const edit = function () {
  // Remember original position in case dragging is cancelled:
  this.latlng = this.getLatLng()

  const editor = {
    dispose: () => this.deselect(),
    commit: () => {
      const { lat, lng } = this.getLatLng()
      const geometry = { type: 'Point', coordinates: [lng, lat] }
      this.feature.updateGeometry(geometry)
    },
    rollback: () => {
      this.deselect()
      this.setLatLng(this.latlng)
    }
  }

  this.dragging.enable()
  this._map.tools.edit(editor)
}

L.Feature.Symbol = L.Marker.extend({
  options,
  initialize,
  onAdd,
  onRemove,
  select,
  deselect,
  edit
})
