import searchItems from './App.search'

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
    placeholder: 'Spotlight Search',
    close: options.close,
    searchItems
  }
}
