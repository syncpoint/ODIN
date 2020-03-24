import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import { Modify, Select } from 'ol/interaction'
import { click } from 'ol/events/condition'
import * as R from 'ramda'
import disposable from '../../shared/disposable'
import project from '../project'
import style from './style/style'

const hitTolerance = 3

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
    const source = features => new VectorSource({ features })
    const sources = order.reduce((acc, type) => {
      acc[type] = source(featureSets[type])
      return acc
    }, {})

    const layer = source => new VectorLayer({ source, style })
    const layers = ['Polygon', 'LineString', 'Point']
      .map(type => layer(sources[type]))
      .map(addLayer)


    // 'Modify' interaction on dedicated selection source/layer.

    // Bind writer functions to features:
    R.zip(filenames, features).map(([filename, features]) => {
      // TODO: filter feature properties which should not be written
      const sync = () => fs.writeFileSync(filename, geoJSON.writeFeatures(features))
      const bind = feature => feature.set('sync', sync)
      features.forEach(bind)
    })

    // For modify interaction we either need a single source or
    // a feature __COLLECTION__, feature array won't do.

    const sync = feature => feature.get('sync')
    const uniqSync = features => R.uniq(features.getArray().map(sync))
    const modifyend = ({ features }) => uniqSync(features).forEach(fn => fn())

    const modify = source => {
      const modify = new Modify({ source })
      // NOTE: modifystart/end report ALL features of underlying source.
      modify.on('modifyend', modifyend)
      return modify
    }

    const selectionSource = new VectorSource()
    addLayer(new VectorLayer({ style, source: selectionSource }))
    addInteraction(modify(selectionSource))


    // 'Select' interaction.
    // Note: Default condition is changed to ignore alt/option-click, because
    // alt/option conflicts with modify interaction (delete point).
    const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true
    const conjunction = (...ps) => v => ps.reduce((a, b) => a(v) && b(v))
    const condition = conjunction(click, noAltKey)
    const select = addInteraction(new Select({
      hitTolerance,
      layers,
      style,
      condition
    }))

    /**
     * Move feature between sources.
     * move :: Source -> Source -> Feature -> Unit
     */
    const move = (from, to) => f => { from.removeFeature(f); to.addFeature(f) }

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


    // Set center/zoom.
    const { center, zoom } = project.preferences().viewport
    map.setCenter(fromLonLat(center))
    map.setZoom(zoom)
  }

  // Handle project close event.
  const close = () => {
    // Clear feature layers and interactions.
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
