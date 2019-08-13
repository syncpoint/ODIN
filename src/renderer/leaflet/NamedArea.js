import L from 'leaflet'
import './Polygon'

L.Feature.NamedArea = L.Feature.Polygon.extend({
  labels (feature) {
    return [ `<bold>${this.name}</bold>`, feature.title ]
  }
})
