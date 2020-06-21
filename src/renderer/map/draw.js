import Mousetrap from 'mousetrap'
import GeometryType from 'ol/geom/GeometryType'
import Draw from 'ol/interaction/Draw'
import { GeoJSON } from 'ol/format'

import evented from '../evented'
import inputLayers from '../project/input-layers'
import { K } from '../../shared/combinators'

const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

const options = geometry => {
  switch (geometry) {
    case 'point': return { type: GeometryType.POINT }
    case 'polygon': return { type: GeometryType.POLYGON }
    case 'line': return { type: GeometryType.LINE_STRING }
    case 'line-2pt': return { type: GeometryType.LINE_STRING, maxPoints: 2 }
    // FIXME: min/max points seem not to be supported for MULTI_POINT
    case 'fan': return { type: GeometryType.MULTI_POINT, minPoints: 3, maxPoints: 3 }
    default: console.log('unsupported geometry', geometry)
  }
}

// TODO: check if singleton could be of use (layers.js:460)
let interaction = null

const unsetInteraction = map => {
  if (!interaction) return
  map.removeInteraction(interaction)
  interaction = null
  evented.emit('MAP_DRAWEND')
}

const drawstart = descriptor => ({ feature }) => {
  feature.set('sidc', descriptor.sidc)
}

const drawend = map => ({ feature }) => {
  // TODO: use feature-specific function to complete geometry
  const content = [feature].map(feature => geoJSON.writeFeature(feature))
  inputLayers.addFeatures(content)
  unsetInteraction(map)
}

const setInteraction = map => descriptor => {
  unsetInteraction(map)

  interaction = K(new Draw(options(descriptor.geometry)))(interaction => {
    if (!interaction) return console.log('undefined draw interaction', descriptor.geometry)
    interaction.on('drawabort', () => unsetInteraction(map))
    interaction.on('drawstart', drawstart(descriptor))
    interaction.on('drawend', drawend(map))
  })

  map.addInteraction(interaction)
  map.getTargetElement().focus()
}

export default map => {
  evented.on('MAP_DRAW', setInteraction(map))
  Mousetrap.bind('esc', () => unsetInteraction(map))
}
