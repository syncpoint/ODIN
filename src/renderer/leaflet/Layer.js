import L from 'leaflet'
import './Feature'

const genericShape = (feature, options) => {
  switch (feature.geometry.type) {
    case 'Point': return new L.Feature.Symbol(feature)
    case 'Polygon': return new L.Feature.Polygon(feature, options)
    case 'LineString': return new L.Feature.Polyline(feature, options)
    default: return null
  }
}

const initialize = function (features, options) {
  L.Util.setOptions(this, options)

  // Property `_layers` is required by Leaflet LayerGroup:
  this._layers = {}
  if (features) features.forEach(feature => this.addData(feature))
}

const addData = function (feature) {
  const options = { interactive: true, bubblingMouseEvents: false }
  const sidc = feature.properties.sidc
  if (!sidc) return null
  const key = `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  const layer = L.Feature[key] ? new L.Feature[key](feature, options) : genericShape(feature, options)

  if (!layer) return this
  layer.feature = feature
  return this.addLayer(layer)
}

L.Feature.Layer = L.FeatureGroup.extend({
  initialize,
  addData
})
