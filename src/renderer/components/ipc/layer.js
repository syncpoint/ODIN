import evented from '../../evented'
import { importLayers, importLayersPrompt } from '../../filesystem/layer-fs'


export const COMMAND_IMPORT_LAYER = () => importLayersPrompt

// Hook-in drag and drop capabilities:
evented.on('MAP_CREATED', map => {
  map._container.ondragover = () => false
  map._container.ondragleave = () => false
  map._container.ondragend = () => false

  map._container.ondrop = event => {
    event.preventDefault()

    // Extract file paths and notify main process:
    const filenames = []
    for (let file of event.dataTransfer.files) filenames.push(file.path)
    importLayers(filenames)
    return false
  }
})
