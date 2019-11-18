import { Collection } from 'ol'
import { Pointer as PointerInteraction } from 'ol/interaction'
import tacgrp, { normalizeSIDC } from './styles/tacgrp'


export function CustomInteraction (options) {
  this.hitTolerance = 4
  this.selection = new Collection()
  console.log('creating custom interaction', this.selection)

  PointerInteraction.call(this, {
    handleDownEvent: this.handleDownEvent,
    handleUpEvent: this.handleUpEvent,
    handleMoveEvent: this.handleMoveEvent,
    handleDragEvent: this.handleDragEvent
  })
}

// Initialize prototype chain before adding methods and/or properties.
CustomInteraction.prototype = Object.create(PointerInteraction.prototype)
CustomInteraction.prototype.constructor = CustomInteraction

CustomInteraction.prototype.handleDownEvent = function ({ map, pixel }) {
  const options = { hitTolerance: this.hitTolerance }
  const callback = (feature, layer) => {
    const { sidc } = feature.getProperties()
    console.log('callback', tacgrp[normalizeSIDC(sidc)])
  }

  map.forEachFeatureAtPixel(pixel, callback, options)
}

CustomInteraction.prototype.handleUpEvent = function (event) {
  console.log('event', event.type)
}

CustomInteraction.prototype.handleMoveEvent = function ({ map, pixel }) {
  const options = { hitTolerance: this.hitTolerance }
  const hit = map.forEachFeatureAtPixel(pixel, () => true, options)
  const cursor = hit ? 'pointer' : ''
  map.getTargetElement().style.cursor = cursor
}

CustomInteraction.prototype.handleDragEvent = function (event) {
  console.log('event', event.type)
}
