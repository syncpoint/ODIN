import L from 'leaflet'

const { stamp } = L.Util
const DomUtil = L.DomUtil

/* eslint-disable */

L.SVG.addInitHook(function () {

  /**
   *
   */
  this._initGroup = function (layer) {
    var group = layer._group = L.SVG.create('g')

    // TODO: propagate `className` if necessary
    // if (layer.options.className) {
    // 	DomUtil.addClass(group, layer.options.className);
    // }

    // TODO: propagate `interactive` to group/relevant group children
    // if (layer.options.interactive) {
    // 	DomUtil.addClass(group, 'leaflet-interactive');
    // }

    // TODO: do we need this somehow?
    // this._updateStyle(layer)

    this._layers[stamp(layer)] = layer
  }


  /**
   *
   */
  this._addGroup = function (layer) {
    if (!this._rootGroup) this._initContainer()
    this._rootGroup.appendChild(layer._group)

    // TODO: register group children as interactive targets
    // TODO: get interactive target(s) from layer
    // layer.addInteractiveTarget(layer._group)
  },


  /**
   *
   */
  this._removeGroup = function (layer) {
    DomUtil.remove(layer._group)

    // TODO: de-register
    // layer.removeInteractiveTarget(layer._path);
    delete this._layers[stamp(layer)]
  }
})
