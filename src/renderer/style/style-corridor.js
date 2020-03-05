import { WKT } from 'ol/format'
import defaultStyle from './style-default'
import { GEOS, proj } from './geos-utils'
import G_G_OAF from './G_G_OAF'
import G_G_OLAGM from './G_G_OLAGM'
import G_G_OLAGS from './G_G_OLAGS'
import G_G_OLAV from './G_G_OLAV'

const wktFormat = new WKT()

const writeWKTGeometry = feature => wktFormat.writeGeometry(
  feature.getGeometry(), {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  }
)

const readWKTGeometry = geometry => wktFormat.readGeometry(GEOS.writeWKT(geometry), {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
})

const corridorWidth = feature => feature.getProperties().corridor_area_width_dim

const geometry = fn => feature => {
  const wkt = writeWKTGeometry(feature)
  const geometry = fn(wkt, corridorWidth(feature))
  return readWKTGeometry(geometry)
}

const corridorStyle = fn => feature => {
  try {
    return defaultStyle(feature).map(style => {
      style.setGeometry(geometry(fn)(feature))
      return style
    })
  } catch (err) {
    console.error(err)
  }
}

const style = {
  'G-G-OAF---': [corridorStyle(G_G_OAF)],
  'G-G-OLAGM-': [corridorStyle(G_G_OLAGM)],
  'G-G-OLAGS-': [corridorStyle(G_G_OLAGS)],
  'G-G-OLAV--': [corridorStyle(G_G_OLAV)]
}

export default {
  style,
  defaultStyle: [
    feature => {
      const wkt = writeWKTGeometry(feature)
      const geometry = GEOS.readWKT(wkt)
        .transform((x, y) => proj.forward([x, y]))
        .buffer(corridorWidth(feature), 16, GEOS.CAP_ROUND, GEOS.JOIN_ROUND)
        .transform((x, y) => proj.inverse([x, y]))

      return defaultStyle(feature).map(style => {
        style.setGeometry(readWKTGeometry(geometry))
        return style
      })
    }
  ]
}
