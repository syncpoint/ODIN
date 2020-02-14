import L from 'leaflet'
import ms from 'milsymbol'
import { fromNow } from '../../shared/datetime'
import { K } from '../../shared/combinators'
import selection from '../components/App.selection'
import evented from '../evented'
import { findSpecificItem } from '../stores/feature-store'
import './features/Feature'

const MODIFIER_MAP = {
  c: 'quantity',
  f: 'reinforcedReduced',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',
  v: 'type',
  w: 'dtg',
  z: 'speed',
  aa: 'specialHeadquarters'
}

const icon = symbol => L.divIcon({
  className: '',
  html: symbol.asSVG(),
  iconAnchor: new L.Point(symbol.getAnchor().x, symbol.getAnchor().y)
})

const modifiers = feature => Object.entries(feature.properties)
  .filter(([key, value]) => MODIFIER_MAP[key] && value)
  .reduce((acc, [key, value]) => K(acc)(acc => (acc[MODIFIER_MAP[key]] = value)), {})

const symbolOptions = feature => ({
  standard: {
    size: 34,
    colorMode: 'Light', // default: light
    outlineWidth: 3,
    outlineColor: 'white',
    ...modifiers(feature)
  },
  highlighted: {
    size: 34,
    colorMode: 'Light', // default: light
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
  this.title = feature.title
  this.properties = feature.properties

  // Prepare standard and highlighted icons:
  L.Util.setOptions(this, options)
  this.prepareIcons(feature)

  // TODO: move to GeoJSON helper
  const latlng = L.latLng(
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0])

  L.Marker.prototype.initialize.call(this, latlng)

  this.selected = urn => {
    if (this.urn !== urn) return
    this.dragging.enable()
    this.setIcon(this.icons.highlighted)
  }

  this.deselected = urn => {
    if (this.urn !== urn) return
    this.dragging.disable()
    this.setIcon(this.icons.standard)
  }

  const item = findSpecificItem(this.properties.sidc)

  this.mouseover = event => {
    if (!event.originalEvent.ctrlKey) return
    if (item && item.name) evented.emit('OSD_MESSAGE', { slot: 'B1', message: item.name })
    if (this.title) evented.emit('OSD_MESSAGE', { slot: 'B2', message: this.title })
    if (this.properties.w) evented.emit('OSD_MESSAGE', { slot: 'B3', message: fromNow(this.properties.w) })
  }

  this.mouseout = () => {
    evented.emit('OSD_MESSAGE', { slot: 'B1', message: '' })
    evented.emit('OSD_MESSAGE', { slot: 'B2', message: '' })
    evented.emit('OSD_MESSAGE', { slot: 'B3', message: '' })
  }
}

const prepareIcons = function (feature) {
  this.icons = {}
  Object.keys(symbolOptions(feature)).forEach(key => {
    this.icons[key] = icon(symbol(feature, {
      ...symbolOptions(feature)[key],
      infoFields: !this.options.hideLabels
    }))
  })
}

const onAdd = function (map) {
  L.Marker.prototype.onAdd.call(this, map)

  this.on('click', this.edit, this)
  this.on('dragend', this.onDragend, this)
  selection.on('selected', this.selected)
  selection.on('deselected', this.deselected)
  this.on('mouseover', this.mouseover)
  this.on('mouseout', this.mouseout)

  this.setIcon(selection.isSelected(this.urn) ? this.icons.highlighted : this.icons.standard)
  if (selection.isPreselected(this.urn)) setImmediate(() => this.edit())
}

const onRemove = function (map) {
  selection.off('deselected', this.deselected)
  selection.off('selected', this.selected)
  this.off('dragend', this.onDragend, this)
  this.off('click', this.edit, this)
  this.off('mouseover', this.mouseover)
  this.off('mouseout', this.mouseout)
  L.Marker.prototype.onRemove.call(this, map)
}

const edit = function () {
  if (selection.isSelected(this.urn)) return
  selection.select(this.urn)

  const editor = {
    dispose: () => {
      if (selection.isSelected(this.urn)) {
        selection.deselect()
      }
    }
  }

  this._map.tools.edit(editor)
}

const onDragend = function () {
  this.options.update({ geometry: this.geometry() })
}

const updateData = function (feature) {

  // TODO: move to GeoJSON helper
  const latlng = L.latLng(
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0])

  this.setLatLng(latlng)

  this.prepareIcons(feature)
  const selected = selection.isSelected(this.urn)
  this.setIcon(selected ? this.icons.highlighted : this.icons.standard)
}

const geometry = function () {
  const { lat, lng } = this.getLatLng()
  return { type: 'Point', coordinates: [lng, lat] }
}

L.Feature.Symbol = L.Marker.extend({
  options,
  initialize,
  prepareIcons,
  onAdd,
  onRemove,
  edit,
  onDragend,
  geometry,
  updateData
})
