import places from '../model/spotlight-places'
import bookmarks from '../model/spotlight-bookmarks'
import pois from '../model/spotlight-pois'
import layers from '../model/spotlight-layers'

// FIXME: does not scale well, needs contribution interface
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

const spotlightOptions = options => {
  return {
    items: items(options),
    placeholder: 'Spotlight Search',
    close: options.close
  }
}

export default spotlightOptions
