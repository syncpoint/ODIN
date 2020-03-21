import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { defaultFormat, readFeatures } from '../source/feature'
import { feature as featureLayer } from '../layer/feature'
import disposable from '../../../shared/disposable'
import project from '../../project'

const geometryType = feature => {
  const type = feature.getGeometry().getType()
  switch (type) {
    case 'Point':
    case 'LineString':
    case 'Polygon': return type
    case 'MultiPoint': return 'Point'
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

    const featureSets = {
      Polygon: [],
      LineString: [],
      Point: []
    }

    // Distribute features to sets depending on their geometry:
    project.layers()
      .flatMap(readFeatures(defaultFormat))
      .reduce((acc, feature) => {
        acc[geometryType(feature)].push(feature)
        return acc
      }, featureSets)

    // Layer order: polygons first, points last:
    ;['Polygon', 'LineString', 'Point'].forEach(type => {
      const source = new VectorSource({ features: featureSets[type] })
      addLayer(featureLayer(source))
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
