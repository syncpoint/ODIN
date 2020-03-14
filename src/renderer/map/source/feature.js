import { Vector } from 'ol/source'
import { GeoJSON } from 'ol/format'
import fs from 'fs'

/**
 * Feature vector source for GeoJSON file.
 */
export const feature = filename => new Vector({

  /**
   * NOTE: function is bound to underlying VectorSource.
   */
  loader: function (extent, resolution, projection) {
    const file = fs.readFileSync(filename).toString()
    const format = this.getFormat()
    const features = format.readFeatures(file)
    this.addFeatures(features)
  },

  format: new GeoJSON({
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })
})
