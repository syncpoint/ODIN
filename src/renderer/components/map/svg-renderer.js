import L from 'leaflet'

const { stamp } = L.Util
const DomUtil = L.DomUtil

L.SVG.addInitHook(function () {

  /**
   *
   */
  this._initGroup = function (layer) {

    // Not pretty, but that's the Leaflet way:
    layer._group = L.SVG.create('g')

    // For now, no need to propagate `className`.

    // Settings CSS class 'leaflet-interactive' is handled in layer/shape.
    // NOTE: This class affects only paths and similar, not groups.

    this._layers[stamp(layer)] = layer
  }


  /**
   * Spit image of L.SVG._addPath().
   */
  this._addGroup = function (layer) {
    if (!this._rootGroup) this._initContainer()
    this._rootGroup.appendChild(layer._group)
    layer.addInteractiveTarget(layer._group)
  }


  /**
   *
   */
  this._removeGroup = function (layer) {
    DomUtil.remove(layer._group)
    layer.removeInteractiveTarget(layer._group)
    delete this._layers[stamp(layer)]
  }
})
