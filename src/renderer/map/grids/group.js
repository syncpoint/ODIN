
import LayerGroup from 'ol/layer/Group'
import generateMgrsLayers from './mgrs'
import { ipcRenderer } from 'electron'
import project from '../../project'


const getGridLayerGroup = (options = {}) => {

  const mgrsGrids = generateMgrsLayers()

  const gridGroup = new LayerGroup({
    ...options,
    layers: []
  })

  const toggleGrid = (type) => {
    project.updatePreferences({ grid: type })
    gridGroup.getLayers().clear()
    switch (type) {
      case 'mgrs':
        mgrsGrids.forEach(layer => {
          gridGroup.getLayers().push(layer)
        })
        break
    }
  }

  projectListener(toggleGrid)
  ipcRenderer.on('grid', (event, type) => toggleGrid(type))

  return gridGroup
}
const projectListener = (toggleGrid) => {
  project.register(event => {
    if (event === 'open') {
      const gridType = project.preferences().grid
      ipcRenderer.send('grid', gridType)
      toggleGrid(gridType)
    }
  })
}
export default getGridLayerGroup
