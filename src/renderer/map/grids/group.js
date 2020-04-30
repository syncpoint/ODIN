
import LayerGroup from 'ol/layer/Group'
import generateMgrsLayers from './mgrs'
import { ipcRenderer } from 'electron'
import project from '../../project'

const noLayers = () => []
const grids = {
  mgrs: generateMgrsLayers
}

const layers = type => (grids[type] || noLayers)()
const gridGroup = new LayerGroup()

const toggleGrid = (type) => {
  ipcRenderer.send('IPC_GRID_TOGGLED', type)
  const groupLayers = gridGroup.getLayers()
  project.updatePreferences({ grid: type })
  groupLayers.clear()
  layers(type).forEach(groupLayers.push.bind(groupLayers))
}

project.register(event => {
  if (event === 'open') {
    const gridType = project.preferences().grid
    toggleGrid(gridType)
  }
})

ipcRenderer.on('IPC_TOGGLE_GRID', (event, type) => {
  const storedType = project.preferences().grid
  toggleGrid(storedType === type ? '' : type)
})

export default () => gridGroup
