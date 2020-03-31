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
import disposable from '../../shared/disposable'


/**
 * GeoJSON, by definitions, comes in WGS84.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})



const loadLayers = async (context, filenames) => {

  // inputLayers :: [Collection<Feature>]
  const inputLayers = await Promise.all(filenames.map(async filename => {
    const layerId = uuid()
    const contents = await fs.promises.readFile(filename, 'utf8')
    const features = new Collection(geoJSON.readFeatures(contents))
    features.set('uri', `layer:${layerId}`)
    features.set('filename', filename)

    const sync = () => {
      // Filter feature properties not to be written:
      // Feature id is excluded from clone by default.
      const clones = features.getArray().map(feature => {
        const clone = feature.clone()
        clone.unset('selected')
        return clone
      })

      fs.writeFileSync(filename, geoJSON.writeFeatures(clones))
    }

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
    acc[type] = new VectorSource({ features: featureSets[type] })
    return acc
  }, {})

  context.layers = ['Polygon', 'LineString', 'Point']
    .map(type => new VectorLayer({ source: context.sources[type], style }))
}


const initialize = async (context, project) => {
  await loadLayers(context, project.layerFiles())
  context.layers.forEach(context.addLayer)

  // Dedicated layer for selected features:
  context.selectionSource = new VectorSource()
  context.addLayer(new VectorLayer({
    style,
    source: context.selectionSource
  }))

  const selectInteraction = context.addInteraction(select(context))
  // CAUTION: selectedFeatures - shared/mutable feature collection
  const selectedFeatures = selectInteraction.getFeatures()
  context.addInteraction(translate(context, selectedFeatures))
  context.addInteraction(modify(context, selectedFeatures))
}

const updateViewport = (context, project) => {
  const { center, zoom } = project.preferences().viewport
  context.map.setCenter(fromLonLat(center))
  context.map.setZoom(zoom)
}


export default map => {

  // This baby carries a ton of mutable state:
  // - map - interface to map
  // - sources :: String -> VectorSource - feature source per geometry type
  // - layers :: [VectorLayer] - ordered list of feature layers per geometry type
  // - selectionSource :: VectorSource - dedicated source for selected features

  let disposables = disposable.of()
  const dispose = () => {
    disposables.dispose()
    disposables = disposable.of()
  }

  const context = {
    map,

    addInteraction: interaction => {
      map.addInteraction(interaction)
      disposables.addDisposable(() => map.removeInteraction(interaction))
      return interaction
    },

    addLayer: layer => {
      map.addLayer(layer)
      disposables.addDisposable(() => map.removeLayer(layer))
      return layer
    }
  }

  project.register(event => {
    switch (event) {
      case 'open':
        initialize(context, project)
        updateViewport(context, project)
        break
      case 'close':
        dispose()
        break
    }
  })
}
