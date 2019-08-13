import L from 'leaflet'
import './shapes/L.Shape'

const genericShape = (feature, options) => {
  console.log('genericShape', feature.geometry)
  switch (feature.geometry.type) {
    case 'Point': return new L.Symbol(feature)
    case 'Polygon': return new L.Shape.Polygon(feature, options)
    case 'LineString': return new L.Shape.Polyline(feature, options)
    default: return null
  }
}

const initialize = function (name, geojson, options) {
  L.Util.setOptions(this, options)

  this.name = name
  // Name `_layers` is required by Leaflet LayerGroup:
  this._layers = {}

  if (geojson) this.addData(geojson)
}

const addData = function (geojson) {
  if (!geojson) return
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(feature => this.addData(feature))
    return
  }

  const feature = geojson
  const options = { interactive: true, bubblingMouseEvents: false }
  const sidc = feature.properties.sidc
  if (!sidc) return null
  console.log(sidc, L.Shape)
  const key = `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}*****`
  const layer = L.Shape[key] ? new L.Shape[key](feature, options) : genericShape(feature, options)

  if (!layer) return this

  layer.feature = feature
  return this.addLayer(layer)
}

L.TACGRP = {}
L.TACGRP.FeatureGroup = L.FeatureGroup.extend({
  initialize,
  addData
})
