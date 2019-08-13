import EventEmitter from 'events'
import bookmarks from '../model/spotlight-bookmarks'
import places from '../model/spotlight-places'
import layers from '../model/spotlight-layers'
import features from '../model/spotlight-features'

const searchItems = new EventEmitter()

// maintain ordered list of contributions.
let searchTerm
const contributions = []
const contributors = []

searchItems.updateFilter = term => {
  searchTerm = term
  contributors.forEach(c => setImmediate(() => c.updateFilter()))
}

searchItems.snapshot = () => contributions.reduce((acc, val) => acc.concat(val), [])

const register = contributor => {
  const slot = contributors.length
  contributors.push(contributor)
  contributor.on('updated', contribution => {
    contributions[slot] = contribution
    searchItems.emit('updated', contributions.reduce((acc, val) => acc.concat(val), []))
  })

  return () => searchTerm
}

bookmarks(register)
layers(register)
features(register)
places(register)

export default searchItems
