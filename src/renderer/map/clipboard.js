import { ipcRenderer } from 'electron'
import Mousetrap from 'mousetrap'
import { GeoJSON } from 'ol/format'

import undo from '../undo'
import evented from '../evented'
import selection from '../selection'
import inputLayers from '../project/input-layers'
import Feature from '../project/Feature'
import URI from '../project/URI'
import { noop } from '../../shared/combinators'

/**
 * features :: [ol/Feature]
 * Current set of loaded features.
 */
const features = {}

let activeLayerId

/**
 * GeoJSON data, by definitions, comes in WGS84;
 * OL uses Web-Mercator by default.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

/**
 * clipboardWrite :: [string] -> unit
 * Write serialize (JSON) features to clipboard.
 */
const clipboardWrite = featureIds => {
  const writeFeatures = feature => [Feature.layerId(feature), geoJSON.writeFeature(feature)]
  const content = featureIds
    .map(featureId => features[featureId])
    .map(writeFeatures)

  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}

/**
 * editSelectAll :: () -> unit
 */
const editSelectAll = () => {
  const featureIds = Object.values(features)
    .filter(Feature.unlocked)
    .filter(Feature.showing)
    .map(Feature.id)

  selection.deselect()
  selection.select(featureIds)
}

/**
 * editDelete :: () -> unit
 * Delete selected features.
 */
const editDelete = () =>
  inputLayers.removeFeatures(selection.selected(URI.isFeatureId))

/**
 * editCut :: () -> unit
 * Write current selection to clipboard and delete selected features.
 */
const editCut = () => {
  const featureIds = selection.selected(URI.isFeatureId)
  clipboardWrite(featureIds)
  inputLayers.removeFeatures(featureIds)
}

/**
 * editCopy :: () -> unit
 * Write current selection to clipboard.
 */
const editCopy = () =>
  clipboardWrite(selection.selected(URI.isFeatureId))

/**
 * editPaste :: () -> unit
 * Insert features from clipboard.
 */
const editPaste = async () => {
  const content = await ipcRenderer.invoke('IPC_CLIPBOARD_READ')
  if (content) {
    // Overwrite target layer if any.
    if (activeLayerId) content.forEach(tuple => (tuple[0] = activeLayerId))
    inputLayers.addFeatures(content)
  }
}


Mousetrap.bind('del', editDelete) // macOS: fn+backspace
Mousetrap.bind('command+backspace', editDelete)
Mousetrap.bind('esc', () => selection.deselect())

evented.on('EDIT_CUT', editCut)
evented.on('EDIT_COPY', editCopy)
evented.on('EDIT_PASTE', editPaste)


// Only handle the following when map has focus.

const engage = () => {
  evented.on('EDIT_UNDO', undo.undo)
  evented.on('EDIT_REDO', undo.redo)
  evented.on('EDIT_SELECT_ALL', editSelectAll)
}

const disengage = () => {
  evented.off('EDIT_UNDO', undo.undo)
  evented.off('EDIT_REDO', undo.redo)
  evented.off('EDIT_SELECT_ALL', editSelectAll)
}

const layeractivated = ({ layerId }) => (activeLayerId = layerId)
const addFeature = feature => (features[Feature.id(feature)] = feature)
const addFeatures = ({ features }) => features.forEach(addFeature)
const deleteFeatures = ({ ids }) => ids.forEach(id => delete features[id])

const eventHandlers = {
  layeractivated,
  featuresadded: addFeatures,
  featuresremoved: deleteFeatures
}

inputLayers.register(event => (eventHandlers[event.type] || noop)(event))

export default {
  engage,
  disengage
}
