import { ipcRenderer } from 'electron'
import LayerGroup from 'ol/layer/Group'
import * as R from 'ramda'
import generateMgrsLayers from './mgrs'
import preferences from '../../project/preferences'
import { noop } from '../../../shared/combinators'

const grids = {
  mgrs: generateMgrsLayers
}

const layers = type => (grids[type] || R.always([]))()
const gridGroup = new LayerGroup()

const showGrid = type => {
  const groupLayers = gridGroup.getLayers()
  groupLayers.clear()
  layers(type).forEach(groupLayers.push.bind(groupLayers))
  ipcRenderer.send('IPC_GRID_TOGGLED', type)
}

let currentGrid

const handlers = {
  preferences: ({ preferences }) => {
    currentGrid = preferences.grid
    showGrid(currentGrid)
  },
  set: ({ key, value }) => {
    if (key !== 'grid') return
    currentGrid = value
    showGrid(currentGrid)
  },
  unset: ({ key }) => {
    if (key !== 'grid') return
    currentGrid = ''
    showGrid(currentGrid)
  }
}

preferences.register(event => (handlers[event.type] || noop)(event))

ipcRenderer.on('IPC_TOGGLE_GRID', (_, type) => currentGrid === type
  ? preferences.unset('grid')
  : preferences.set('grid', type)
)

export default () => gridGroup
