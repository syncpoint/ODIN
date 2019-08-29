import L from 'leaflet'
import './Polygon'

L.Feature.NamedArea = L.Feature.Polygon.extend({
  labels (feature) {
    const xs = [ `<bold>${this.name}</bold>` ]
    if (feature.properties.t) xs.push(feature.properties.t)
    return xs
  }
})
