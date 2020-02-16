import { GeoJSON } from 'ol/format'
import buffer from '@turf/buffer'
import defaultStyle from './style-default'

const format = new GeoJSON({
  featureProjection: 'EPSG:3857',
  dataProjection: 'EPSG:4326'
})

const featureBuffer = feature =>
  buffer(feature, feature.properties.corridor_area_width_dim / 2000, { units: 'kilometers' })

const style = {
  // 'G-G-OLAGM-': [],
  // 'G-G-OLAGS-': []
}

export default {
  style,
  defaultStyle: [
    feature => {
      const object = format.writeFeatureObject(feature)
      const buffered = format.readFeature(featureBuffer(object))
      return defaultStyle(feature).map(style => {
        style.setGeometry(buffered.getGeometry())
        return style
      })
    }
  ]
}
