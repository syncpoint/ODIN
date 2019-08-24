import L from 'leaflet'
import './Polygon'

L.Feature.NamedArea = L.Feature.Polygon.extend({
  labels (feature) {
    const xs = [ `<bold>${this.name}</bold>` ]
    if (feature.title) xs.push(feature.title)
    return xs
  }
})
