import { GeoJSON } from 'ol/format'
import { DragAndDrop } from 'ol/interaction'
import inputLayers from '../../project/input-layers'

const dropImportInteraction = new DragAndDrop({
  formatConstructors: [GeoJSON]
})
dropImportInteraction.on('addfeatures', event => {
  if (!event.file || !event.features) return
  inputLayers.importLayer(event.file.name.replace('.json', ''), event.features)
})

export default dropImportInteraction
