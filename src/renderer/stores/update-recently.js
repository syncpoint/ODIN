import { featureFromSidc } from '../model/mapPalette-feature'
import settings from '../model/settings'

const reorder = (arr, from, to) => {
  var element = arr[from]
  arr.splice(from, 1)
  arr.splice(to, 0, element)
}

export default (sidc, recentlyUsed) => {
  const object = featureFromSidc(sidc)
  const arr = recentlyUsed.features
  const index = arr.findIndex(feature => {
    return JSON.stringify(feature) === JSON.stringify(object)
  })
  index === -1
    ? arr.unshift(featureFromSidc(sidc))
    : reorder(arr, index, 0)
  if (arr.length > 6) arr.length = 6
  let stored = settings.palette.getRecentlyUsed()
  stored
    ? stored.unshift(sidc)
    : stored = [sidc]
  settings.palette.setRecentlyUsed(stored)
}
