/*
  CAUTION: This module must not be imported from different modules.
*/

import L from 'leaflet'
import ms from 'milsymbol'
import { K } from '../../shared/combinators'
import selection from '../components/App.selection'
import evented from '../evented'
import { fromNow } from '../../shared/datetime'
import gfxOptions from './gfx-options'

const MODIFIER_MAP = {
  f: 'reinforcedReduced',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',

  // w: 'dtg',
  z: 'speed'
}

const defaultOptions = {

  // symbol size derived from feature or global settings.
  size: _ => 34,
  draggable: false,
  selectable: false
}

const modifiers = feature => Object.entries(feature.properties)
  .filter(([key, value]) => MODIFIER_MAP[key] && value)
  .map(([key, value]) => ([key, key === 'w' ? fromNow(value) : value]))
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIER_MAP[key]] = value)), {})

const onEachFeature = function (feature, layer) {
  const { id, actions } = feature
  this.layers[this.key(id)] = layer

  layer.on('pm:edit', event => {
    const { target } = event
    const latlngs = target._latlng ? target._latlng : target._latlngs
    actions && actions.update && actions.update(latlngs)
  })

  layer.on('click', event => {
    const { target } = event
    target._map.pm.disableGlobalEditMode()
    this.select(id)

    const preventMarkerRemoval = feature.geometry.type === 'Point'
    layer.pm.enable({ preventMarkerRemoval })
  })
}

const pointToLayer = function (feature, latlng) {
  const { id, properties } = feature
  const { sidc } = properties

  const icon = symbol => L.divIcon({
    className: '',
    html: symbol.asSVG(),
    iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
  })

  const symbolOptions = {
    size: this.options.size(),
    colorMode: 'Light', // default: light
    simpleStatusModifier: true,
    ...modifiers(feature)
  }
  const icons = {
    standard: icon(new ms.Symbol(sidc, symbolOptions)),
    highlighted: icon(new ms.Symbol(sidc, {
      ...symbolOptions,
      monoColor: 'white',
      outlineColor: 'black',
      outlineWidth: 6
    }))
  }

  const markerOptions = {
    id, // feature identifier
    icons,
    draggable: this.options.draggable,
    keyboard: false, // default: true
    autoPan: true,
    autoPanSpeed: 10 // default: 10
  }

  return K(L.marker(latlng, markerOptions))(marker => {
    const ctrlKey = event => event.originalEvent.ctrlKey
    const set = (slot, message) => event => ctrlKey(event) && evented.emit('OSD_MESSAGE', { slot, message })
    const reset = slot => () => evented.emit('OSD_MESSAGE', { slot, message: '' })

    if (feature.title) {
      marker.on('mouseover', set('B1', feature.title))
      marker.on('mouseout', reset('B1'))
    }

    if (feature.properties.w) {
      marker.on('mouseover', set('B2', fromNow(feature.properties.w)))
      marker.on('mouseout', reset('B2'))
    }

    marker.setIcon(selection.selected()
      .find(selected => selected && this.layers[selected.key])
      ? marker.options.icons.highlighted
      : marker.options.icons.standard
    )
  })
}

const key = function (id) {
  return `feature://${this.options.id}/${id}`
}

const initialize = function (features, options) {
  this.layers = []
  L.setOptions(this, options)
  options.pointToLayer = pointToLayer.bind(this)
  options.onEachFeature = onEachFeature.bind(this)
  L.GeoJSON.prototype.initialize.call(this, features, options)

  selection.on('selected', object => this.selected(object))
  selection.on('deselected', object => this.deselected(object))
}

const select = function (id) {
  const [selected] = selection.selected()
  if (selected && selected.key === this.key(id)) return
  const marker = this.layers[this.key(id)]
  if (!marker) return

  const { actions } = marker.feature
  selection.select({ key: this.key(id), ...actions })
}

const selected = function ({ key }) {
  const marker = this.layers[key]
  if (!marker) return
  if (!marker.options.icons) return
  marker.setIcon(marker.options.icons.highlighted)
}

const deselected = function ({ key }) {
  const marker = this.layers[key]
  if (!marker) return
  if (!marker.options.icons) return
  marker.setIcon(marker.options.icons.standard)
}

const addFeature = function (feature) {
  this.addData(feature)
  this.select(feature.id)
}

const removeFeature = function (id) {
  const marker = this.layers[this.key(id)]
  if (!marker) return
  selection.deselect()
  this.removeLayer(marker)
  delete this.layers[this.key(id)]
}

const replaceFeature = function (id, feature) {
  const marker = this.layers[this.key(id)]
  if (!marker) return

  this.removeLayer(marker)
  delete this.layers[this.key(id)]
  this.addData(feature)
}

const moveFeature = function (id, lat, lng) {
  const marker = this.layers[this.key(id)]
  if (!marker) return
  if (marker.getLatLng().equals(L.latLng(lat, lng))) return
  marker.setLatLng(L.latLng(lat, lng))
}

const functionId = sidc => sidc.substring(4, 10)

L.Area = L.Polygon.extend({
  initialize (latlngs, options, properties) {
    L.Polygon.prototype.initialize.call(this, latlngs, options)
    this.properties = properties
  },

  onAdd (map) {
    L.Polygon.prototype.onAdd.call(this, map)

    const key = functionId(this.properties.sidc)
    const options = gfxOptions[key]

    this.label = K(L.SVG.create('text'))(text => {
      const lines = []
      if (options && options.type) lines.push(options.type)
      if (this.properties.t) lines.push(this.properties.t)
      lines.push('CA-928')

      const point = this.centerOfMass()
      text.textContent = lines[0]
      text.setAttribute('x', point[0])
      text.setAttribute('y', point[1])
      text.setAttribute('text-anchor', 'middle')

      lines.splice(1).forEach(line => {
        const tspan = L.SVG.create('tspan')
        tspan.textContent = line
        tspan.setAttribute('text-anchor', 'middle')
        tspan.setAttribute('dy', '1.2em')
        tspan.setAttribute('x', point[0])
        text.appendChild(tspan)
      })

      const group = this._path.parentElement
      group.appendChild(text)
    })

    this.updateLabelPosition()
  },

  onRemove (map) {
    const group = this._path.parentElement
    group.removeChild(this.typeLabel)
    L.Polygon.prototype.onRemove.call(this, map)
  },

  redraw () {
    L.Polygon.prototype.redraw.call(this)
    this.updateLabelPosition()
  },

  updateLabelPosition () {
    if (!this.label) return
    const point = this.centerOfMass()
    this.label.setAttribute('x', point[0])
    this.label.setAttribute('y', point[1])

    Array.from(this.label.childNodes)
      .splice(1)
      .forEach(child => child.setAttribute('x', point[0]))
  },

  _project () {
    L.Polygon.prototype._project.call(this)
    this.updateLabelPosition()
  },

  /**
   * Optimization.
   * Mostly Polygon.getCenter() without layerPointToLatLng().
   *
   * @returns layer point instead of latlng
   */
  centerOfMass () {
    const points = this._rings[0]
    const len = points.length
    if (!len) return null

    // polygon centroid algorithm; only uses the first ring if there are multiple
    let area = 0
    let x = 0
    let y = 0

    for (let i = 0, j = len - 1; i < len; j = i++) {
      const f = points[i].y * points[j].x - points[j].y * points[i].x
      x += (points[i].x + points[j].x) * f
      y += (points[i].y + points[j].y) * f
      area += f * 3
    }

    if (area === 0) return points[0]
    else return [x / area, y / area]
  }
})

const GEOMETRIES = {
  Polygon: (geojson, options) => {
    const geometry = geojson.type === 'Feature' ? geojson.geometry : geojson
    const coords = geometry ? geometry.coordinates : null
    const latlngs = L.GeoJSON.coordsToLatLngs(coords, 1)
    const polygon = new L.Area(latlngs, options, geojson.properties)
    return polygon
  }
}

const geometryToLayer = function (geojson, options) {
  const geometry = geojson.type === 'Feature' ? geojson.geometry : geojson
  const factory = GEOMETRIES[geometry.type] || L.GeoJSON.geometryToLayer
  return factory(geojson, options)
}

/**
 * Hook-in to provide own function geometryToLayer().
 */
const addData = function (geojson) {

  const features = L.Util.isArray(geojson) ? geojson : geojson.features

  if (features) {
    // When collection, add individual features recursively and return.
    features
      .filter(feature => feature.geometries || feature.geometry || feature.features || feature.coordinates)
      .forEach(feature => this.addData(feature))
    return this
  }

  const options = this.options
  if (options.filter && !options.filter(geojson)) return this
  const layer = geometryToLayer(geojson, options)
  if (!layer) return this

  layer.feature = L.GeoJSON.asFeature(geojson)
  layer.defaultOptions = layer.options
  this.resetStyle(layer)

  if (options.onEachFeature) options.onEachFeature(geojson, layer)
  return this.addLayer(layer)
}

L.GeoJSON.Symbols = L.GeoJSON.extend({
  options: defaultOptions,
  key,
  initialize,
  select,
  selected,
  deselected,
  addFeature,
  removeFeature,
  replaceFeature,
  moveFeature,
  addData
})
