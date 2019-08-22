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
  autoPan: true,
  keyboard: false
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

  this.selected = selected => {
    if (this.feature.featureId !== selected.featureId) return
    this.dragging.enable()
    this.setIcon(this.icons.highlighted)
  }

  this.deselected = deselected => {
    if (this.feature.featureId !== deselected.featureId) return
    this.dragging.disable()
    this.setIcon(this.icons.standard)
  }

  selection.on('selected', this.selected)
  selection.on('deselected', this.deselected)
}

const onAdd = function (map) {
  L.Marker.prototype.onAdd.call(this, map)
  this.on('click', this.edit, this)
}

const onRemove = function (map) {
  this.off('click', this.edit, this)
  L.Marker.prototype.onRemove.call(this, map)
}

const edit = function () {
  if (selection.isSelected(this.feature)) return
  selection.select(this.feature)

  // Remember original position in case dragging is cancelled:
  this.latlng = this.getLatLng()

  const editor = {
    dispose: reset => {
      if (selection.isSelected(this.feature)) selection.deselect()
      if (reset) this.setLatLng(this.latlng)
      else {
        const { lat, lng } = this.getLatLng()
        const geometry = { type: 'Point', coordinates: [lng, lat] }
        this.feature.updateGeometry(geometry)
      }
    }
  }

  this._map.tools.edit(editor)
}

const updateData = function (feature) {
  const latlng = L.latLng(
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0])

  this.setLatLng(latlng)
}

L.Feature.Symbol = L.Marker.extend({
  options,
  initialize,
  onAdd,
  onRemove,
  edit,
  updateData
})
