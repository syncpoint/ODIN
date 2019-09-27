import L from 'leaflet'
import selection from '../components/App.selection'
import { fromNow } from '../../shared/datetime'
import polygonShape from './polygon-shape'
import GeoJSON from './GeoJSON'
import evented from '../evented'
import { findSpecificItem } from '../stores/feature-store'


/**
 *
 */
const initialize = function (feature, renderOptions, options) {
  this.feature = feature

  // TODO: can we merge renderOptions and options?
  this.renderOptions = renderOptions
  L.setOptions(this, options)

  const { sidc } = this.feature.properties
  const item = sidc ? findSpecificItem(sidc) : null

  this.mouseover = event => {
    const { title, properties } = this.feature
    if (!event.originalEvent.ctrlKey) return
    if (item && item.name) evented.emit('OSD_MESSAGE', { slot: 'B1', message: `${item.name} (${properties.sidc})` })
    if (title) evented.emit('OSD_MESSAGE', { slot: 'B2', message: title })
    if (properties.w) evented.emit('OSD_MESSAGE', { slot: 'B3', message: fromNow(properties.w) })
  }

  this.mouseout = () =>
    ['B1', 'B2', 'B3'].forEach(slot => evented.emit('OSD_MESSAGE', { slot, message: '' }))
}


/**
 *
 */
const beforeAdd = function (map) {
  this._map = map
  this._renderer = map.getRenderer(this)
}


/**
 *
 */
const onAdd = function (map) {
  map.on('zoomend', this.updateShape, this)
  this.on('click', this.edit, this)
  this.on('mouseover', this.mouseover)
  this.on('mouseout', this.mouseout)

  const createShape = () => {
    const shapeOptions = {
      styles: this.renderOptions.styles(this.feature),
      labels: this.options.hideLabels ? [] : this.renderOptions.labels(this.feature),
      interactive: this.options.interactive
    }

    const rings = GeoJSON.latlng(this.feature.geometry)
    const points = rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    const shape = polygonShape(map.getRenderer(this), points, shapeOptions)
    if (this.options.interactive) this.addInteractiveTarget(shape.element)
    return shape
  }

  this.shape = createShape()
  this.shape = this.shape.updateStyles(this.renderOptions.styles(this.feature))
  this.updateShape()
}


/**
 *
 */
const onRemove = function (map) {
  if (this.options.interactive) this.removeInteractiveTarget(this.shape.element)
  this.off('click', this.edit, this)
  map.off('zoomend', this.updateShape, this)
  this.shape.dispose()
  map.tools.dispose() // dispose editor/selection tool
}


/**
 *
 */
const edit = function () {
  if (selection.isSelected(this.urn)) return
  selection.select(this.urn)

  const callback = event => {
    const onLatLngs = latlngs => {
      latlngs = [...latlngs, latlngs[0]]
      const layerPoints = latlngs.map(latlng => this._map.latLngToLayerPoint(latlng))
      this.shape = this.shape.updatePoints([layerPoints], this.options.lineSmoothing)
    }

    switch (event.type) {
      case 'latlngs': return onLatLngs(event.latlngs)
      case 'geometry': return this.options.update({ geometry: event.geometry })
    }
  }

  this.markerGroup = new L.Feature.MarkerGroup(this.feature.geometry, callback)
  this.markerGroup.addTo(this._map)

  const editor = {
    dispose: () => {
      this._map.removeLayer(this.markerGroup)
      delete this.markerGroup
      if (selection.isSelected(this.urn)) {
        selection.deselect()
      }
    }
  }

  this._map.tools.edit(editor)
}


/**
 * Update shape's geometry/points.
 */
const updateShape = function () {
  const rings = GeoJSON.latlng(this.feature.geometry)
  const layerPoints = rings.map(ring => ring.map(latlng => this._map.latLngToLayerPoint(latlng)))
  this.shape = this.shape.updatePoints(layerPoints, this.options.lineSmoothing)
}


/**
 *
 */
const updateData = function (feature) {
  this.feature = feature

  // TODO: deep compare properties and update shape options accordingly
  this.shape = this.shape.updateStyles(this.renderOptions.styles(feature))
  const labels = this.options.hideLabels ? [] : this.renderOptions.labels(this.feature)
  this.shape = this.shape.updateLabels(labels)

  this.updateShape()
  this.markerGroup && this.markerGroup.updateGeometry(feature.geometry)
}

L.Feature.PolygonArea = L.Layer.extend({
  initialize,
  beforeAdd,
  onAdd,
  onRemove,

  edit,
  updateShape,
  updateData
})
