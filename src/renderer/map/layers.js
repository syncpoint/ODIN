import fs from 'fs'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { GeoJSON } from 'ol/format'
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


// TODO: I/O could be asynchronous
const readGeoJSONFeatures = filename => {
  const file = fs.readFileSync(filename).toString()
  return geoJSON.readFeatures(file)
}


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

  const open = () => {

    // TODO: use ramda to group features

    const featureSets = {
      Polygon: [],
      LineString: [],
      Point: []
    }

    // Read features of all GeoJSON layer files,
    // then distribute features to sets depending on their geometry:
    project.layerFiles()
      .flatMap(readGeoJSONFeatures)
      .reduce((acc, feature) => {
        acc[geometryType(feature)].push(feature)
        return acc
      }, featureSets)

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
