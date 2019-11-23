import * as R from 'ramda'
import { Collection } from 'ol'
import { Pointer as PointerInteraction } from 'ol/interaction'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import tacgrp, { normalizeSIDC } from './styles/tacgrp'
import { featuresAtPixel, clearFeatues, addFeatures } from './map-utils'


/**
 * featureEditor :: feature -> feature -> [feature]
 */
const featureEditor = feature => {
  const noop = () => []
  const { sidc } = feature.getProperties()
  if (!sidc) return noop
  if (!tacgrp[normalizeSIDC(sidc)]) return noop
  return tacgrp[normalizeSIDC(sidc)].editorFeatures || noop
}


/**
 * featureSelection :: feature -> feature -> [feature]
 */
const featureSelection = feature => {
  const noop = () => []
  const { sidc } = feature.getProperties()
  if (!sidc) return noop
  if (!tacgrp[normalizeSIDC(sidc)]) return noop
  return tacgrp[normalizeSIDC(sidc)].selectionFeatures || noop
}


/**
 *
 */
export function CustomInteraction (options) {

  // Keep track of selected features.
  // NOTE: Setting unique option throws assertion error instread silently ignoring duplicate entry.
  this.selection = new Collection()

  const selectionChanged = () => {
    const fast = true // no event dispatching
    clearFeatues(fast)(this.overlay.getSource())
    if (this.selection.getLength() === 0) return

    const multiselect = this.selection.getLength() > 1
    const features = multiselect ? featureSelection : featureEditor
    const overlayFeatures = this.selection.getArray().flatMap(feature => features(feature)(feature))
    addFeatures(false)(this.overlay.getSource(), overlayFeatures)
  }

  // TODO: unbind listener when interaction is removed from map.
  this.selection.on('change:length', selectionChanged)

  PointerInteraction.call(this, {
    handleDownEvent: this.handleDownEvent,
    handleUpEvent: this.handleUpEvent,
    handleMoveEvent: this.handleMoveEvent,
    handleDragEvent: this.handleDragEvent
  })
}


/**
 * Initialize prototype chain before adding methods and/or properties.
 */
CustomInteraction.prototype = Object.create(PointerInteraction.prototype)
CustomInteraction.prototype.constructor = CustomInteraction


/**
 *
 */
CustomInteraction.prototype.setMap = function (map) {
  PointerInteraction.prototype.setMap.call(this, map)

  // Setup editor feature overlay.
  // NOTE: This layer is unmanaged.
  this.overlay = new VectorLayer({
    map,
    source: new VectorSource({
      features: new Collection(),
      useSpatialIndex: false,
      wrapX: false
    })
  })

  this.featuresAtPixel = featuresAtPixel(map, {
    hitTolerance: 4,
    // Exclude interaction overlay from hit test:
    layerFilter: layer => layer !== this.overlay
  })
}


/**
 *
 */
CustomInteraction.prototype.handleDownEvent = function (event) {
  const { pixel, originalEvent } = event
  const appendSelection = originalEvent.shiftKey
  if (!appendSelection) this.selection.clear()
  const alreadySelected = feature => this.selection.getArray().indexOf(feature) !== -1
  const [selected, notSelected] = R.partition(alreadySelected)(this.featuresAtPixel(pixel))
  if (appendSelection) selected.forEach(feature => this.selection.remove(feature))
  this.selection.extend(notSelected)
}


/**
 *
 */
CustomInteraction.prototype.handleUpEvent = function (event) {
  console.log('event', event.type)
}


/**
 *
 */
CustomInteraction.prototype.handleMoveEvent = function ({ map, pixel }) {
  const hit = this.featuresAtPixel(pixel).length > 0
  const cursor = hit ? 'pointer' : ''
  map.getTargetElement().style.cursor = cursor
}


/**
 *
 */
CustomInteraction.prototype.handleDragEvent = function (event) {
  console.log('event', event.type)
}
