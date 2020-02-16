import { GeoJSON } from 'ol/format'
import { bbox } from 'ol/loadingstrategy'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'

import loaders from './loaders'
import style from './style'

const source = new VectorSource({
  format: new GeoJSON({ dataProjection: 'EPSG:3857' }),

  // Strategy function for loading features based on the
  // view's extent and resolution.
  strategy: bbox,
  loader: loaders.mipdb
})


export const featureLayer = new VectorLayer({ style, source: source })
export const selectionLayer = new VectorLayer({ style, source: new VectorSource() })
