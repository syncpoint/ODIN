import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
import * as R from 'ramda'
import disposable from '../../shared/disposable'
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

/** Handle project open/close. */
const projectEventHandler = callbacks => {

  // Layers are disposed on project close:
  let layers = disposable.of()

  const addLayer = layer => {
    callbacks.addLayer(layer)
    layers.addDisposable(() => callbacks.removeLayer(layer))
  }

  const open = async () => {

    // Read features of all GeoJSON layer files,
    // then distribute features to sets depending on their geometry:
    const readFile = filename => fs.promises.readFile(filename, 'utf8')
    const readFeatures = file => geoJSON.readFeatures(file)
    const files = await Promise.all(project.layerFiles().map(readFile))
    const features = files.flatMap(readFeatures)
    const featureSets = R.groupBy(geometryType)(features)

    // Layer order: polygons first, points last:
    ;['Polygon', 'LineString', 'Point'].forEach(type => {
      const source = new VectorSource({ features: featureSets[type] })
      addLayer(new VectorLayer({ source, style }))
    })

    // Set center/zoom.
    const { center, zoom } = project.preferences().viewport
    callbacks.setCenter(fromLonLat(center))
    callbacks.setZoom(zoom)
  }

  const close = () => {
    // Clear feature layers.
    layers.dispose()
    layers = disposable.of()
  }

  return {
    open,
    close
  }
}

export default callbacks => {
  const handlers = projectEventHandler(callbacks)
  project.register(event => (handlers[event] || (() => {}))(event))
}
