import { Vector } from 'ol/source'
import { GeoJSON } from 'ol/format'

// TODO: transform sample file to WGS84 (GeoJSON no longer supports `crs` property)
import layer from './layer.json'

/**
 * Feature vector source for GeoJSON file.
 *
 * TODO: provide loader function (or better, file name)
 */
export const feature = () => new Vector({

  /**
   * NOTE: function is bound to underlying VectorSource.
   */
  loader: function (extent, resolution, projection) {
    const format = this.getFormat()
    const features = format.readFeatures(layer)
    this.addFeatures(features)
  },
  format: new GeoJSON({ dataProjection: 'EPSG:3857' })
})
