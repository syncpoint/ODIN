import { Vector } from 'ol/source'
import { GeoJSON } from 'ol/format'
import fs from 'fs'


export const defaultFormat = new GeoJSON({
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
})


export const readFeatures = format => filename => {
  const file = fs.readFileSync(filename).toString()
  return format.readFeatures(file)
}


/**
 * Feature vector source for GeoJSON file.
 */
export const feature = filename => new Vector({

  /**
   * NOTE: function is bound to underlying VectorSource.
   */
  loader: function (extent, resolution, projection) {
    const features = readFeatures(this.getFormat())(filename)
    this.addFeatures(features)
  },

  format: defaultFormat
})
