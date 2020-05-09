import { ipcRenderer } from 'electron'
import Mousetrap from 'mousetrap'
import { GeoJSON } from 'ol/format'

import undo from '../undo'
import evented from '../evented'
import selection from '../selection'
import inputLayers from '../project/input-layers'
import Feature from '../project/Feature'
import URI from '../project/URI'
import { K, noop } from '../../shared/combinators'

/**
 * features :: [ol/Feature]
 * Current set of loaded features.
 */
const features = {}

/**
 * deletableSelection :: () -> [string]
 * Ids of selected features which are neither locked nor hidden.
 */
const deletableSelection = () =>
  selection.selected(URI.isFeatureId)
    .map(id => features[id])
    .filter(Feature.showing)
    .filter(Feature.unlocked)
    .map(Feature.id)

/**
 * GeoJSON data, by definitions, comes in WGS84;
 * OL uses Web-Mercator by default.
 */
const geoJSON = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})


// -- SECTION: ...

const clipboardHandlers = {}

const registerClipboardHandler = (scheme, handler) => (clipboardHandlers[scheme] = handler)

registerClipboardHandler(URI.SCHEME_FEATURE, {
  // NOTE: For COPY operation, feature may be locked.
  copy: () => selection.selected(URI.isFeatureId)
    .map(featureId => features[featureId])
    .map(feature => geoJSON.writeFeature(feature)),

  paste: content => inputLayers.addFeatures(content),

  // NOTE: For CUT operation, feature must not be locked.
  cut: () => {
    const ids = deletableSelection()
    const content = ids
      .map(featureId => features[featureId])
      .map(feature => geoJSON.writeFeature(feature))

    inputLayers.removeFeatures(ids)
    return content
  }
})

// registerClipboardHandler(URI.SCHEME_LAYER, {
//   copy: () => {
//     const ids = selection.selected(URI.isLayerId)
//     console.log(URI.SCHEME_LAYER, 'copy', ids)
//   },
//   paste: content => console.log(URI.SCHEME_LAYER, 'paste'),
//   cut: () => console.log(URI.SCHEME_LAYER, 'cut')
// })

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
  inputLayers.removeFeatures(deletableSelection())


/**
 * editCut :: () -> unit
 * Write current selection to clipboard and delete selected features.
 */
const editCut = () => {
  const content = Object
    .entries(clipboardHandlers)
    .reduce((acc, [scheme, handler]) => K(acc)(acc => {
      const content = handler.cut()
      if (content && content.length) acc[scheme] = content
    }), {})

  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}

/**
 * editCopy :: () -> unit
 * Write current selection to clipboard.
 */
const editCopy = () => {
  const content = Object
    .entries(clipboardHandlers)
    .reduce((acc, [scheme, handler]) => K(acc)(acc => {
      const content = handler.copy()
      if (content && content.length) acc[scheme] = content
    }), {})

  ipcRenderer.send('IPC_CLIPBOARD_WRITE', content)
}

/**
 * editPaste :: () -> unit
 * Insert features from clipboard.
 */
const editPaste = async () => {
  const content = await ipcRenderer.invoke('IPC_CLIPBOARD_READ')
  console.log(content)
  Object.entries(content)
    .forEach(([scheme, content]) => clipboardHandlers[scheme].paste(content))
}

// Block certain ops when text input field is focused.

const activeElement = () => document.activeElement
const inputFocused = () => activeElement() instanceof HTMLInputElement
const block = p => fn => () => (p() ? noop : fn)()

document.addEventListener('cut', () => evented.emit('EDIT_CUT'))
document.addEventListener('copy', () => evented.emit('EDIT_COPY'))
document.addEventListener('paste', () => evented.emit('EDIT_PASTE'))

evented.on('EDIT_CUT', block(inputFocused)(editCut))
evented.on('EDIT_COPY', block(inputFocused)(editCopy))
evented.on('EDIT_PASTE', block(inputFocused)(editPaste))
evented.on('EDIT_UNDO', block(inputFocused)(undo.undo))
evented.on('EDIT_REDO', block(inputFocused)(undo.redo))
evented.on('EDIT_SELECT_ALL', block(inputFocused)(editSelectAll))

Mousetrap.bind('del', editDelete) // macOS: fn+backspace
Mousetrap.bind('command+backspace', editDelete)
Mousetrap.bind('esc', () => selection.deselect())

const addFeature = feature => (features[Feature.id(feature)] = feature)
const addFeatures = ({ features }) => features.forEach(addFeature)
const deleteFeatures = ({ ids }) => ids.forEach(id => delete features[id])

const eventHandlers = {
  featuresadded: addFeatures,
  featuresremoved: deleteFeatures
}

inputLayers.register(event => (eventHandlers[event.type] || noop)(event))
