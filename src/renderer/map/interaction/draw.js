import Mousetrap from 'mousetrap'
import Draw from 'ol/interaction/Draw'
import { GeoJSON } from 'ol/format'

import evented from '../../evented'
import inputLayers from '../../project/input-layers'
import { K } from '../../../shared/combinators'
import { drawOptions } from './draw-options'

const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

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

const drawend = (map, options) => ({ feature }) => {
  // NOTE: side-effect may modify feature/geometry
  (options.complete || (() => {}))(map, feature)
  const content = [feature].map(feature => geoJSON.writeFeature(feature))
  inputLayers.addFeatures(content)
  unsetInteraction(map)
}

const setInteraction = map => descriptor => {
  unsetInteraction(map)

  const options = drawOptions.find(options => options.match(descriptor))
  if (!options) return

  interaction = K(new Draw(options.options(descriptor)))(interaction => {
    if (!interaction) return console.log('undefined draw interaction', descriptor.geometry)
    interaction.on('drawabort', () => unsetInteraction(map))
    interaction.on('drawstart', drawstart(descriptor))
    interaction.on('drawend', drawend(map, options))
  })

  map.addInteraction(interaction)
  map.getTargetElement().focus()
}

export default map => {
  evented.on('MAP_DRAW', setInteraction(map))
  Mousetrap.bind('esc', () => unsetInteraction(map))
}
