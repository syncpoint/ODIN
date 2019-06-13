import places from '../model/spotlight-places'
import bookmarks from '../model/spotlight-bookmarks'
import pois from '../model/spotlight-pois'
import layers from '../model/spotlight-layers'

import searchItems from './App.search'

// Available providers (order matter):
const itemProviders = [
  layers,
  pois,
  bookmarks,
  places
]

const items = options => term => Promise
  .all(itemProviders.map(fn => fn(options)(term)))
  .then(xs => xs.reduce((acc, x) => acc.concat(x), []))

/**
 * @param {object} options
 * @param {App} options.context
 * @param {() => L.LatLng} options.center useful for ordering by distance
 * @param {() => Number} options.zoom
 * @param {() => {}} options.close
 */
export const spotlightOptions = options => {
  // reset search term:
  searchItems.updateFilter()
  return {
    items: items(options),
    placeholder: 'Spotlight Search',
    close: options.close,
    searchItems
  }
}
