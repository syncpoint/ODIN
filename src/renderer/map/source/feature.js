import { Vector } from 'ol/source'
import layer from './layer.json'
import { GeoJSON } from 'ol/format'

/**
 * Feature vector source for GeoJSON file.
 *
 * TODO: provide loader function (or better, file name)
 * TODO: take SRID from GeoJSON file when supplied
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
