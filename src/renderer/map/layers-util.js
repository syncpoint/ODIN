import * as R from 'ramda'
import Feature from 'ol/Feature'
import Collection from 'ol/Collection'

// Syncing, i.e. writing, feature layer back to fs.
// Shared by Modify and Translate interactions.
// NOTE: Features are expected to supply a 'sync' function,
// which writes the feature along with its originating layer
// back to disk.

const sync = feature => feature.get('sync')
const uniqSync = features => R.uniq(features.map(sync))
const featureArray = features => features instanceof Collection
  ? features.getArray()
  : features

export const syncFeatures = features =>
  uniqSync(featureArray(features)).forEach(fn => fn())


/**
 * Map feature geometry to polygon, line or point layer.
 */
export const geometryType = object => {
  const type = object instanceof Feature
    ? object.getGeometry().getType()
    : object.getType()

  switch (type) {
    case 'Point':
    case 'LineString':
    case 'Polygon': return type
    default: return 'Polygon'
  }
}
