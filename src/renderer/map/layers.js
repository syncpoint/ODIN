import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import * as R from 'ramda'
import disposable from '../../shared/disposable'
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
const geometryType = feature => {
  const type = feature.getGeometry().getType()
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


/** Handle project open/close. */
const projectEventHandler = map => {

  // Layers/interactions are disposed on project close:
  let layers = disposable.of()
  let interactions = disposable.of()

  const addLayer = layer => {
    map.addLayer(layer)
    layers.addDisposable(() => map.removeLayer(layer))
    return layer
  }

  const addInteraction = interaction => {
    map.addInteraction(interaction)
    interactions.addDisposable(() => map.removeInteraction(R.intersection))
    return interaction
  }


  // Handle project open event.
  const open = async () => {

    // Read features of all GeoJSON layer files,
    // then distribute features to sets depending on their geometry type:
    const readFile = filename => fs.promises.readFile(filename, 'utf8')
    const readFeatures = file => geoJSON.readFeatures(file)
    const filenames = project.layerFiles()
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
      .map(addLayer)


    // Bind writer functions 'sync' to features:
    R.zip(filenames, features).map(([filename, features]) => {
      // TODO: filter feature properties which should not be written
      const sync = () => fs.writeFileSync(filename, geoJSON.writeFeatures(features))
      const bind = feature => feature.set('sync', sync)
      features.forEach(bind)
    })


    // Dedicated layer for selected features:
    const selectionSource = new VectorSource()
    const select = addInteraction(selectInteraction(layers))
    addLayer(new VectorLayer({ style, source: selectionSource }))

    const selectFeature = feature => {
      const from = sources[geometryType(feature)]
      move(from, selectionSource)(feature)
    }

    const deselectFeature = feature => {
      const to = sources[geometryType(feature)]
      move(selectionSource, to)(feature)
    }

    select.on('select', ({ selected, deselected }) => {
      // Dim feature layers except selection layer:
      layers.forEach(layer => layer.setOpacity(selected.length ? 0.35 : 1))
      selected.forEach(selectFeature)
      deselected.forEach(deselectFeature)
    })

    addInteraction(translateInteraction(select.getFeatures()))
    addInteraction(modifyInteraction(select.getFeatures()))

    // Set center/zoom.
    const { center, zoom } = project.preferences().viewport
    map.setCenter(fromLonLat(center))
    map.setZoom(zoom)
  }

  // Handle project close event.
  // Clear feature layers and interactions.
  const close = () => {
    layers.dispose()
    layers = disposable.of()
    interactions.dispose()
    interactions = disposable.of()
  }

  return {
    open,
    close
  }
}

export default map => {
  const handlers = projectEventHandler(map)
  project.register(event => (handlers[event] || (() => {}))(event))
}
