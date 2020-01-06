/**
 * Attempt to understand feature interactions.
 *
 * SELECTION FEATURES:
 *   Bounding boxes and other lines which give visual hints
 *   about selected (business domain) feature.
 *
 * EDITOR FEATURES:
 *   Mainly handles for changing geometry points while editing
 *   (business domain) feature.
 *   Editor features usually also include selection features.
 *
 * AUXILIARY FEATURES:
 *   Selection and/or editor features.
 */

import * as R from 'ramda'
import { Collection } from 'ol'
import { Pointer as PointerInteraction } from 'ol/interaction'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Fill, Stroke, Circle, Style } from 'ol/style'
import { selectionFeatures, editorFeatures } from './styles/tacgrp'
import { featuresAtPixel, clearFeatues, addFeatures } from './map-utils'


/**
 *
 */
export function CustomInteraction (options) {
  this.options = options || { hitTolerance: 4 }

  // Keep track of selected features.
  // NOTE: Setting unique option throws assertion error instread silently ignoring duplicate entry.
  this.selection = new Collection()

  const selectionChanged = () => {
    this.clearFeatues()
    if (this.selection.getLength() > 0) this.drawFeatures()
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

CustomInteraction.prototype.clearFeatues = function () {
  const fast = true // no event dispatching
  clearFeatues(fast)(this.overlay.getSource())
}


/**
 *
 */
CustomInteraction.prototype.drawFeatures = function () {
  const disposeAuxiliaries = feature => this.overlay.getSource().removeFeature(feature)
  const multiselect = this.selection.getLength() > 1
  const auxiliaryFeatures = multiselect ? selectionFeatures : editorFeatures
  const overlayFeatures = this.selection.getArray().flatMap(feature => {

    // Nasty side effect ahead:
    // Since we want to be able to selectively remove auxiliary features
    // from overlay when a feature needs to be redrawn (or is removed from selection),
    // we need a way to associate those auxiliary features with the business
    // domain feature. The association is captured in a clean-up function that
    // is stored within the business domain feature.

    const auxiliaries = auxiliaryFeatures(feature)(feature)
    feature.set('dispose', () => auxiliaries.forEach(disposeAuxiliaries))
    return auxiliaries
  })

  addFeatures(false)(this.overlay.getSource(), overlayFeatures)
}


/**
 *
 */
CustomInteraction.prototype.setMap = function (map) {
  PointerInteraction.prototype.setMap.call(this, map)

  /**
   * Style for editor/selection (i.e. auxiliary) features.
   */
  const image = new Circle({
    fill: new Fill({ color: 'white' }),
    stroke: new Stroke({ color: 'red', width: 1 }),
    radius: 8
  })

  const stroke = new Stroke({ color: 'red', width: 1.25, lineDash: [18, 5, 3, 5] })

  // Setup editor/selection feature overlay.
  // NOTE: This layer is unmanaged.
  this.overlay = new VectorLayer({
    map,
    // TODO: performance - attach style directly to auxiliary features
    style: () => new Style({ image, stroke }),
    source: new VectorSource({
      features: new Collection(),
      useSpatialIndex: false,
      wrapX: false
    })
  })

  this.featuresAtPixel = featuresAtPixel(map, {
    hitTolerance: this.options.hitTolerance,
    // Exclude interaction overlay from hit test:
    layerFilter: layer => layer !== this.overlay
  })

  const role = name => feature => feature.get('role') === name
  this.handlesAtPixel = pixel => featuresAtPixel(map, {
    hitTolerance: this.options.hitTolerance,
    layerFilter: layer => layer === this.overlay
  })(pixel).filter(role('handle'))
}


/**
 *
 */
CustomInteraction.prototype.removeSelection = function (feature) {
  feature.un('change', feature.get('change'))
  feature.unset('change')
  this.selection.remove(feature)
}


/**
 *
 */
CustomInteraction.prototype.extendSelection = function (features) {
  const geometryChanged = feature => event => {
    console.log('[feature] dispose', feature.get('dispose'))
    const dispose = feature.get('dispose') || (() => {})
    dispose()
    feature.unset('dispose')
    // TODO: performance - selectively re-draw single feature
    this.drawFeatures()
  }

  features.forEach(feature => {
    const handler = geometryChanged(feature)
    feature.set('change', handler) // store handler for later removal
    feature.on('change', handler)
  })

  this.selection.extend(features)
}


/**
 *
 */
CustomInteraction.prototype.clearSelection = function () {
  this.selection.getArray().forEach(feature => {
    // unregister and remove change handler from feature:
    feature.un('change', feature.get('change'))
    feature.unset('change')
  })

  this.selection.clear()
}


/**
 * @return {boolean} `true` to start the drag sequence.
 */
CustomInteraction.prototype.handleDownEvent = function (event) {
  const { pixel, originalEvent } = event
  const multiselect = originalEvent.shiftKey
  const selected = feature => this.selection.getArray().indexOf(feature) !== -1
  const [positives, negatives] = R.partition(selected)(this.featuresAtPixel(pixel))

  // Remove positives when multi-select, add negatives unconditionally.
  if (multiselect) positives.forEach(feature => this.removeSelection(feature))
  else if (negatives.length > 0 || positives.length === 0) this.clearSelection()
  this.extendSelection(negatives)

  if (this.selection.getArray().length === 0) return
  if (this.dragCoordinate) return

  this.dragCoordinate = event.coordinate
  this.handleMoveEvent(event)
  return true // initiate drag sequence
}


/**
 * @return {boolean} `false` to stop the drag sequence.
 */
CustomInteraction.prototype.handleUpEvent = function (event) {
  if (!this.dragCoordinate) return

  console.log('[handleUpEvent] updating store...', this.dragCoordinate)
  delete this.dragCoordinate
  this.handleMoveEvent(event)
  return false // stop drag sequence
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
  if (!this.dragCoordinate) return

  const deltaX = event.coordinate[0] - this.dragCoordinate[0]
  const deltaY = event.coordinate[1] - this.dragCoordinate[1]

  // NOTE: `translate` mutates feature geometry.
  const translate = (dx, dy) => feature => feature.getGeometry().translate(dx, dy)
  this.selection.forEach(translate(deltaX, deltaY))
  this.dragCoordinate = event.coordinate
}


/**
 * getFeatures :: () -> [feature]
 *
 * Get the selected features.
 * Can be used by other interactions to determine current selection.
 * See also `ol/interaction/Select#getFeatures()`
 */
CustomInteraction.prototype.getFeatures = function () {
  return this.selection
}
