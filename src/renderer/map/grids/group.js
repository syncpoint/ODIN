
import LayerGroup from 'ol/layer/Group'
import generateMgrsLayers from './mgrs'
import { ipcRenderer } from 'electron'

const mgrsGrids = generateMgrsLayers()

const getGridLayerGroup = (options = {}) => {

  const gridGroup = new LayerGroup({
    ...options,
    layers: []
  })

  const toggleGrid = (event, type) => {
    switch (type) {
      case 'mgrs':
        mgrsGrids.forEach(layer => {
          gridGroup.getLayers().push(layer)
        })
        break
      default:
        gridGroup.getLayers().clear()
    }
  }

  ipcRenderer.on('grid', toggleGrid)


  return gridGroup
}



export default getGridLayerGroup
