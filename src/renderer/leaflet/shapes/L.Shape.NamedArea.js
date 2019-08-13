import L from 'leaflet'
import './L.Polygon'

L.Shape.NamedArea = L.Shape.Polygon.extend({
  labels (feature) {
    return [ `<bold>${this.name}</bold>`, feature.title ]
  }
})
