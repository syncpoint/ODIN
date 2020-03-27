import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import * as R from 'ramda'
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



/**
 * Move feature between sources.
 * move :: Source -> Source -> Feature -> Unit
 */
const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }
const source = features => new VectorSource({ features })
const layer = source => new VectorLayer({ source, style })


const loadLayers = async (context, filenames) => {

  // TODO: set layer/feature URIs/IDs

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
  context.sources = order.reduce((acc, type) => {
    acc[type] = source(featureSets[type])
    return acc
  }, {})

  context.layers = ['Polygon', 'LineString', 'Point']
    .map(type => layer(context.sources[type]))

  // Bind writer functions 'sync' to features:
  R.zip(filenames, features).map(([filename, features]) => {
    // TODO: filter feature properties which should not be written
    const sync = () => fs.writeFileSync(filename, geoJSON.writeFeatures(features))
    const bind = feature => feature.set('sync', sync)
    features.forEach(bind)
  })
}


const initialize = async (context, project) => {
  await loadLayers(context, project.layerFiles())
  context.layers.forEach(context.map.addLayer)

  // Dedicated layer for selected features:
  context.selectionSource = new VectorSource()
  context.selectionLayer = new VectorLayer({ style, source: context.selectionSource })
  context.map.addLayer(context.selectionLayer)
  context.select = select(context)
  context.map.addInteraction(context.select)

  context.select.on('select', ({ selected, deselected }) => {
    // Dim feature layers except selection layer:
    context.layers.forEach(layer => layer.setOpacity(selected.length ? 0.35 : 1))

    selected.forEach(feature => {
      const from = context.sources[geometryType(feature)]
      move(from, context.selectionSource)(feature)
    })

    deselected.forEach(feature => {
      const to = context.sources[geometryType(feature)]
      move(context.selectionSource, to)(feature)
    })
  })

  context.translate = translate(context)
  context.modify = modify(context)
  context.map.addInteraction(context.translate)
  context.map.addInteraction(context.modify)
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
