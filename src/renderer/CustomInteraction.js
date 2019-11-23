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
  const { sidc } = feature.getProperties()
  if (!sidc) return
  if (!tacgrp[normalizeSIDC(sidc)]) return
  return tacgrp[normalizeSIDC(sidc)].editor || (() => [])
}


/**
 *
 */
export function CustomInteraction (options) {
  this.selection = new Collection()

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
  this.overlay = new VectorLayer({
    map,
    source: new VectorSource({
      features: new Collection(),
      useSpatialIndex: false,
      wrapX: false
    })
  })

  const options = { hitTolerance: 4 }
  this.featuresAtPixel = featuresAtPixel(map, options)
}


/**
 *
 */
CustomInteraction.prototype.handleDownEvent = function (event) {
  const { pixel, originalEvent } = event
  const editorFeatures = this.featuresAtPixel(pixel)
    .flatMap(feature => featureEditor(feature)(feature))

  const fast = true // no event dispatching
  const handle = editorFeatures.length === 0
    ? clearFeatues(fast)
    : addFeatures(originalEvent.shiftKey)

  handle(this.overlay.getSource(), editorFeatures)
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
  // TODO: choose cursor depending on feature type
  const cursor = hit ? 'pointer' : ''
  map.getTargetElement().style.cursor = cursor
}


/**
 *
 */
CustomInteraction.prototype.handleDragEvent = function (event) {
  console.log('event', event.type)
}
