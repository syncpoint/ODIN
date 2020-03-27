import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import Feature from 'ol/Feature'
import * as R from 'ramda'
import { selectInteraction, modifyInteraction, translateInteraction } from './interactions'
import project from '../project'
import style from './style/style'


/**
 * GeoJSON, by definitions, comes in WGS84.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})


/**
 * Map feature geometry to polygon, line or point layer.
 */
const geometryType = object => {
  const type = object instanceof Feature
    ? object.getGeometry().getType()
    : object.getType()

  switch (type) {
    case 'Point':
    case 'LineString':
    case 'Polygon': return type
    default: return 'Polygon'
  }
}


/**
 * Move feature between sources.
 * move :: Source -> Source -> Feature -> Unit
 */
const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }
const source = features => new VectorSource({ features })
const layer = source => new VectorLayer({ source, style })


const loadLayers = async filenames => {
  // Read features of all GeoJSON layer files,
  // then distribute features to sets depending on their geometry type:
  const readFile = filename => fs.promises.readFile(filename, 'utf8')
  const readFeatures = file => geoJSON.readFeatures(file)
  const files = await Promise.all(filenames.map(readFile))
  const features = files.map(readFeatures)
  const featureSets = R.groupBy(geometryType)(features.flat())

  // Layer order: polygons first, points last:
  const order = ['Polygon', 'LineString', 'Point']

  // Geometry#type -> VectorSource
  const sources = order.reduce((acc, type) => {
    acc[type] = source(featureSets[type])
    return acc
  }, {})

  const layers = ['Polygon', 'LineString', 'Point']
    .map(type => layer(sources[type]))

  // Bind writer functions 'sync' to features:
  R.zip(filenames, features).map(([filename, features]) => {
    // TODO: filter feature properties which should not be written
    const sync = () => fs.writeFileSync(filename, geoJSON.writeFeatures(features))
    const bind = feature => feature.set('sync', sync)
    features.forEach(bind)
  })

  return {
    sources,
    layers
  }
}



export default map => {
  let sources = {}
  let layers = []
  let selectionSource
  let selectionLayer
  let select
  let translate
  let modify

  const commands = {}

  commands.initialize = project => ({
    apply: async () => {
      const result = await loadLayers(project.layerFiles())
      sources = result.sources
      layers = result.layers
      layers.forEach(map.addLayer)

      // Dedicated layer for selected features:
      selectionSource = new VectorSource()
      selectionLayer = new VectorLayer({ style, source: selectionSource })
      map.addLayer(selectionLayer)
      select = selectInteraction(layers)
      map.addInteraction(select)

      select.on('select', ({ selected, deselected }) => {
        // Dim feature layers except selection layer:
        layers.forEach(layer => layer.setOpacity(selected.length ? 0.35 : 1))

        selected.forEach(feature => {
          const from = sources[geometryType(feature)]
          move(from, selectionSource)(feature)
        })

        deselected.forEach(feature => {
          const to = sources[geometryType(feature)]
          move(selectionSource, to)(feature)
        })
      })

      translate = translateInteraction(commands)(select.getFeatures())
      modify = modifyInteraction(commands)(select.getFeatures())
      map.addInteraction(translate)
      map.addInteraction(modify)
    }
  })

  commands.dispose = () => ({
    apply: () => {
      layers.forEach(map.removeLayer)
      map.removeInteraction(modify)
      map.removeInteraction(translate)
      map.removeInteraction(select)
      map.removeLayer(selectionLayer)

      layers = []
      modify = null
      translate = null
      select = null
      selectionLayer = null
      sources = {}
    }
  })

  commands.updateFeatureGeometry = (initial, current) => ({
    inverse: () => commands.updateFeatureGeometry(current, initial),
    apply: () => {
      Object.entries(initial).forEach(([id, geometry]) => {
        // TODO: also check selection layer
        const source = sources[geometryType(geometry)]
        source.uidIndex_[id].setGeometry(geometry)
      })
    }
  })

  commands.updateViewport = project => ({
    apply: () => {
      const { center, zoom } = project.preferences().viewport
      map.setCenter(fromLonLat(center))
      map.setZoom(zoom)
    }
  })


  project.register(event => {
    switch (event) {
      case 'open':
        commands.initialize(project).apply()
        commands.updateViewport(project).apply()
        break
      case 'close':
        commands.dispose().apply()
        break
    }
  })
}
