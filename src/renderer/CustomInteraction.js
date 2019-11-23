import * as R from 'ramda'
import { Collection } from 'ol'
import { Pointer as PointerInteraction } from 'ol/interaction'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Fill, Stroke, Circle, Style } from 'ol/style'
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

CustomInteraction.prototype.drawFeatures = function () {
  const multiselect = this.selection.getLength() > 1
  const features = multiselect ? featureSelection : featureEditor
  const overlayFeatures = this.selection.getArray().flatMap(feature => features(feature)(feature))
  addFeatures(false)(this.overlay.getSource(), overlayFeatures)
}

/**
 * Style for editor/selection features.
 */
const defaultStyle = [new Style({
  image: new Circle({
    fill: new Fill({ color: 'white' }),
    stroke: new Stroke({ color: 'red', width: 1 }),
    radius: 8
  }),
  stroke: new Stroke({ color: 'red', width: 1.25, lineDash: [18, 5, 3, 5] })
})]


/**
 *
 */
CustomInteraction.prototype.setMap = function (map) {
  PointerInteraction.prototype.setMap.call(this, map)

  // Setup editor feature overlay.
  // NOTE: This layer is unmanaged.
  this.overlay = new VectorLayer({
    map,
    style: () => defaultStyle,
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
}


/**
 *
 */
CustomInteraction.prototype.handleDownEvent = function (event) {
  const { pixel, originalEvent } = event
  const multiselect = originalEvent.shiftKey
  const selected = feature => this.selection.getArray().indexOf(feature) !== -1
  const [positives, negatives] = R.partition(selected)(this.featuresAtPixel(pixel))

  // Remove positives when multi-select, add negatives unconditionally.
  if (multiselect) positives.forEach(feature => this.selection.remove(feature))
  else if (negatives.length > 0 || positives.length === 0) this.selection.clear()

  this.selection.extend(negatives)
  if (this.selection.getArray().length === 0) return
  if (this.dragCoordinate) return

  this.dragCoordinate = event.coordinate
  this.handleMoveEvent(event)
  return true // initiate drag operation
}


/**
 *
 */
CustomInteraction.prototype.handleUpEvent = function (event) {
  if (!this.dragCoordinate) return

  delete this.dragCoordinate
  this.handleMoveEvent(event)
  this.drawFeatures()
  return true // terminate drag operation
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

  this.clearFeatues()
  const deltaX = event.coordinate[0] - this.dragCoordinate[0]
  const deltaY = event.coordinate[1] - this.dragCoordinate[1]

  // NOTE: `translate` mutates feature geometry.
  const translate = (dx, dy) => feature => feature.getGeometry().translate(dx, dy)
  this.selection.forEach(translate(deltaX, deltaY))
  this.dragCoordinate = event.coordinate
}


/**
 *  getFeatures :: () -> [feature]
 */
CustomInteraction.prototype.getFeatures = function () {
  return this.selection
}
