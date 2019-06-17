/*
  CAUTION: This module must not be imported from different modules.
*/

import L from 'leaflet'
import ms from 'milsymbol'
import { K } from '../../shared/combinators'
import selection from '../components/App.selection'

// TODO: map remaining (text) modifiers
const MODIFIER_MAP = {
  f: 'reinforcedReduced',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',

  // TODO: find more compact form for DTG
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
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIER_MAP[key]] = value)), {})

const onEachFeature = function (feature, layer) {
  const { id, actions } = feature

  this.layers[this.key(id)] = layer

  layer.on('pm:edit', event => {
    const { target } = event
    console.log('[pm:edit]', target)
    const latlngs = target._latlng ? target._latlng : target._latlngs
    actions.update && actions.update(latlngs)
  })

  layer.on('pm:cut', event => {
    const { target } = event
    console.log('[pm:cut]', target)
    actions.update && actions.update(target._latlngs)
  })

  layer.on('click', event => {
    const { target } = event
    target._map.pm.disableGlobalEditMode()
    this.select(id)
    layer.pm.enable()
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

  const symbolOptions = { size: this.options.size(), ...modifiers(feature) }
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

  if (options.selectable) {
    selection.on('selected', object => this.selected(object))
    selection.on('deselected', object => this.deselected(object))
  }
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
  moveFeature
})
