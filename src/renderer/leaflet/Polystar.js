import L from 'leaflet'
import selection from '../components/App.selection'
import './Feature'
import './MarkerGroup'

const initialize = function (feature, options) {
  this.feature = feature
  this.urn = feature.urn
  L.setOptions(this, options)
}

const beforeAdd = function (map) {
  this.map = map
  this.renderer = map.getRenderer(this)
}

const onAdd = function (map) {
  this.shape = this.createShape({
    layerPoint: point => this.map.latLngToLayerPoint(point),
    layerPoints: rings => rings.map(ring => ring.map(latlng => this.map.latLngToLayerPoint(latlng))),
    labels: () => this.labels(this.feature)
  })

  this.renderer._rootGroup.appendChild(this.shape.element)
  this.addInteractiveTarget(this.shape.element)
  this.update(L.Feature.Polystar.latlngs(this.feature.geometry))

  map.on('zoomend', () => this.update(), this)
  this.on('click', this.select, this)
}

const onRemove = function (map) {
  this.removeInteractiveTarget(this.shape.element)
  this.renderer._rootGroup.removeChild(this.shape.element)
  map.off('zoomend', () => this.update(), this)
  this.off('click', this.select, this)
  this.map.tools.dispose() // dispose editor/selection tool
}

// Re-project shape(s) for current geometry:
const update = function (latlngs) {
  this.latlngs = latlngs || this.latlngs
  if (this.latlngs) this.shape.update(this.latlngs)
}

const select = function () {
  if (selection.isSelected(this.urn)) return
  selection.select(this.urn)
  // TODO: only call this.edit() when not read-only
  this.edit()
}

const edit = function () {

  const callback = event => {
    switch (event.type) {
      case 'latlngs': return this.update(event.latlngs)
      case 'geometry': return this.feature.updateGeometry(event.geometry)
    }
  }

  this.markerGroup = new L.Feature.MarkerGroup(this.feature.geometry, callback).addTo(this.map)

  const editor = {
    dispose: () => {
      this.map.removeLayer(this.markerGroup)
      delete this.markerGroup
      if (selection.isSelected(this.urn)) {
        selection.deselect()
      }
    }
  }

  this.map.tools.edit(editor)
}

const labels = function (feature) {
  return feature.title ? [ feature.title ] : []
}

const updateData = function (feature) {
  this.feature.geometry = feature.geometry
  const latlngs = L.Feature.Polystar.latlngs(feature.geometry)
  this.shape.update(latlngs)
  if (this.markerGroup) this.markerGroup.updateGeometry(feature.geometry)
}

// abstract polygon/polyline.
L.Feature.Polystar = L.Layer.extend({
  initialize,
  beforeAdd,
  onAdd,
  onRemove,
  update,
  select,
  edit,
  labels,
  updateData
})

L.Feature.Polystar.minimumPoints = geometry => {
  switch (geometry.type) {
    case 'LineString': return 2
    case 'Polygon': return 3
  }
}

L.Feature.Polystar.latlngs = ({ type, coordinates }) => {
  switch (type) {
    case 'LineString': return coordinates.map(([lon, lat]) => L.latLng(lat, lon))
    case 'Polygon': return coordinates[0].slice(0, -1).map(([lon, lat]) => L.latLng(lat, lon))
  }
}
