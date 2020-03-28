import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import Collection from 'ol/Collection'
import * as R from 'ramda'
import uuid from 'uuid-random'
import { select, modify, translate } from './layers-interactions'
import project from '../project'
import style from './style/style'
import { geometryType } from './layers-util'


/**
 * GeoJSON, by definitions, comes in WGS84.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})



const source = features => new VectorSource({ features })
const layer = source => new VectorLayer({ source, style })


const loadLayers = async (context, filenames) => {

  // inputLayers :: [Collection<Feature>]
  const inputLayers = await Promise.all(filenames.map(async filename => {
    const layerId = uuid()
    const contents = await fs.promises.readFile(filename, 'utf8')
    const features = new Collection(geoJSON.readFeatures(contents))
    features.set('uri', `layer:${layerId}`)
    features.set('filename', filename)

    // TODO: filter feature properties not to be written
    const sync = () => fs.writeFileSync(filename, geoJSON.writeFeatures(features.getArray()))
    features.forEach(feature => {
      feature.setId(`feature:${layerId}/${uuid()}`)
      feature.set('sync', sync)
    })

    return features
  }))


  // Distribute features to sets depending on feature geometry type:
  // Layer order: polygons first, points last:
  const order = ['Polygon', 'LineString', 'Point']
  const features = inputLayers.map(xs => xs.getArray()).flat()
  const featureSets = R.groupBy(geometryType)(features)

  // context.sources :: Geometry#type -> VectorSource
  context.sources = order.reduce((acc, type) => {
    acc[type] = source(featureSets[type])
    return acc
  }, {})

  context.layers = ['Polygon', 'LineString', 'Point']
    .map(type => layer(context.sources[type]))
}


const initialize = async (context, project) => {
  await loadLayers(context, project.layerFiles())
  context.layers.forEach(context.map.addLayer)

  // Dedicated layer for selected features:
  context.selectionSource = new VectorSource()
  context.selectionLayer = new VectorLayer({ style, source: context.selectionSource })
  context.map.addLayer(context.selectionLayer)

  context.select = select(context)
  context.translate = translate(context)
  context.modify = modify(context)
  context.map.addInteraction(context.translate)
  context.map.addInteraction(context.modify)
  context.map.addInteraction(context.select)
}


const dispose = context => {
  context.layers.forEach(context.map.removeLayer)
  context.map.removeInteraction(context.modify)
  context.map.removeInteraction(context.translate)
  context.map.removeInteraction(context.select)
  context.map.removeLayer(context.selectionLayer)

  delete context.layers
  delete context.modify
  delete context.translate
  delete context.select
  delete context.selectionLayer
  delete context.sources
}


const updateViewport = (context, project) => {
  const { center, zoom } = project.preferences().viewport
  context.map.setCenter(fromLonLat(center))
  context.map.setZoom(zoom)
}


export default map => {
  const context = { map }

  project.register(event => {
    switch (event) {
      case 'open':
        initialize(context, project)
        updateViewport(context, project)
        break
      case 'close':
        dispose(context)
        break
    }
  })
}
