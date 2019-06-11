import places from './spotlight-places'
import bookmarks from './spotlight-bookmarks'
import pois from './spotlight-pois'
import layers from './spotlight-layers'

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
