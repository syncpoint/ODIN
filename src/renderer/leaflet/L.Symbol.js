import L from 'leaflet'
import ms from 'milsymbol'
import { fromNow } from '../../shared/datetime'
import { K } from '../../shared/combinators'

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
  size: 34,
  colorMode: 'Light', // default: light
  simpleStatusModifier: true,
  ...modifiers(feature)
})

const symbol = feature => {
  const sidc = feature.properties.sidc
  return new ms.Symbol(sidc, symbolOptions(feature))
}

const options = {
  draggable: true,
  autoPan: true
}

const initialize = function (feature, options) {
  options = options || {}
  options.icon = icon(symbol(feature))

  L.Util.setOptions(this, options)

  const latlng = L.latLng(
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0])

  L.Marker.prototype.initialize.call(this, latlng)
}

const onAdd = function (map) {
  L.Marker.prototype.onAdd.call(this, map)
}

L.Symbol = L.Marker.extend({
  options,
  initialize,
  onAdd
})
