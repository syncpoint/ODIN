/* eslint-disable */
import L from 'leaflet'
import selection from '../components/App.selection'
import { fromNow } from '../../shared/datetime'
import polygonShape from './polygon-shape'
import evented from '../evented'
import { findSpecificItem } from '../stores/feature-store'

// GeoJSON geometry helper.
const Geometry = geometry => {
  const { type, coordinates } = geometry

  const latlng = () => {
    switch (type) {
      case 'Point': return L.latLng(coordinates[1], coordinates[0])
      case 'LineString': return coordinates.map(([lon, lat]) => L.latLng(lat, lon))
      // NOTE: first ring only:
      case 'Polygon': return coordinates.map(ring => ring.map(([lon, lat]) => L.latLng(lat, lon)))
    }
  }

  return {
    latlng
  }
}


// Zero, one or more labels with one or more lines each.
const labelOptions = feature => {
  // const labels = ['north', 'south', 'east', 'west'].map(placement => ({
  //   placement,
  //   fontSize: 16,
  //   lines: [placement.toUpperCase(), 'SECONDS LINE', '<bold>THIRD LINE</bold>']
  // }))

  const labels = [
    {
      fontSize: 16,
      // INSIDE:  center
      // BORDER:  north | south | east | west | northeast | northwest
      // OUTSIDE: bottom | topleft
      placement: 'center',

      // center | left
      alignment: 'center',
      lines: ['<bold>TAI</bold>', feature.properties.t]
    }
  ]

  // const labels = [
  //   {
  //     placement: 'center',
  //     alignment: 'left',
  //     fontSize: 18,
  //     lines: [
  //       '<bold>ACA</bold>',
  //       '53ID (M)',
  //       'MIN ALT: 500 FT AGL',
  //       'MAX ALT: 3000 FT AGL',
  //       'GRIDS: NK2313 to NK3013',
  //       'TIME FROM: 281400ZAPR',
  //       'TIME TO: 281530ZAPR'
  //     ]
  //   }
  // ]

  // const labels = ['north', 'south', 'east', 'west'].map(placement => ({
  //   fontSize: 18,
  //   placement,
  //   lines: ['<bold>M</bold>']
  // }))

  return labels
}

const options = {
  dummy: false
}

const initialize = function (feature, renderOptions, options) {
  this.feature = feature
  this.renderOptions = renderOptions
  L.setOptions(this, options)

  const item = findSpecificItem(this.feature.properties.sidc)

  this.mouseover = event => {
    const { title, properties } = this.feature
    if (!event.originalEvent.ctrlKey) return
    if (item && item.name) evented.emit('OSD_MESSAGE', { slot: 'B1', message: `${item.name} (${properties.sidc})` })
    if (title) evented.emit('OSD_MESSAGE', { slot: 'B2', message: title })
    if (properties.w) evented.emit('OSD_MESSAGE', { slot: 'B3', message: fromNow(properties.w) })
  }

  this.mouseout = () => {
    evented.emit('OSD_MESSAGE', { slot: 'B1', message: '' })
    evented.emit('OSD_MESSAGE', { slot: 'B2', message: '' })
    evented.emit('OSD_MESSAGE', { slot: 'B3', message: '' })
  }
}

const beforeAdd = function (map) {
  this.renderer = map.getRenderer(this)
}

const onAdd = function (map) {
  this.zoomend = () => this.onGeometry && this.onGeometry(this.feature.geometry)
  this.click = () => this.edit(map)

  map.on('zoomend', this.zoomend)
  this.on('click', this.click)
  this.on('mouseover', this.mouseover)
  this.on('mouseout', this.mouseout)

  const shapeOptions = {
    styles: this.renderOptions.styles(this.feature),
    labels: this.renderOptions.labels(this.feature)
  }

  const rings = Geometry(this.feature.geometry).latlng()
  const points = rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
  shapeOptions.interactive = this.options.interactive
  this.shape = polygonShape(map.getRenderer(this), points, shapeOptions)

  this.onLatLngs = latlngs => {
    latlngs = [...latlngs, latlngs[0]]
    const layerPoints = latlngs.map(latlng => map.latLngToLayerPoint(latlng))
    this.shape = this.shape.updatePoints([layerPoints], this.options.lineSmoothing)
  }

  this.onGeometry = geometry => {
    const rings = Geometry(geometry).latlng()
    const layerPoints = rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    this.shape = this.shape.updatePoints(layerPoints, this.options.lineSmoothing)
  }

  if (this.options.interactive) this.addInteractiveTarget(this.shape.element)
  this.onGeometry(this.feature.geometry)

  // FIXME: why do we need this here?
  this.shape = this.shape.updateStyles(this.renderOptions.styles(this.feature))
}

const onRemove = function (map) {
  if (this.options.interactive) this.removeInteractiveTarget(this.shape.element)
  this.off('click', this.click)
  map.off('zoomend', this.zoomend)
  delete this.click
  delete this.zoomend
  this.shape.dispose()
  map.tools.dispose() // dispose editor/selection tool
}

const edit = function (map) {

  if (selection.isSelected(this.urn)) return
  selection.select(this.urn)

  const callback = event => {
    switch (event.type) {
      case 'latlngs': return this.onLatLngs(event.latlngs)
      case 'geometry': return this.options.update({ geometry: event.geometry })
    }
  }

  this.markerGroup = new L.Feature.MarkerGroup(this.feature.geometry, callback)
  this.markerGroup.addTo(map)

  const editor = {
    dispose: () => {
      map.removeLayer(this.markerGroup)
      delete this.markerGroup
      if (selection.isSelected(this.urn)) {
        selection.deselect()
      }
    }
  }

  map.tools.edit(editor)
}

const updateData = function (feature) {
  this.feature = feature

  // TODO: deep compare properties and update shape options accordingly
  this.shape = this.shape.updateStyles(this.renderOptions.styles(feature))
  this.shape = this.shape.updateLabels(this.renderOptions.labels(feature))

  this.onGeometry && this.onGeometry(feature.geometry)
  this.markerGroup && this.markerGroup.updateGeometry(feature.geometry)
}

L.Feature.PolygonArea = L.Layer.extend({
  options,
  initialize,
  beforeAdd,
  onAdd,
  onRemove,

  edit,
  updateData
})