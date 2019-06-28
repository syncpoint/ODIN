import L from 'leaflet'
import * as R from 'ramda'
import { K } from '../../shared/combinators'
import echelons from './echelons'

const setAttributes = xs => element => Object.entries(xs)
  .filter(([key]) => key !== 'type')
  .forEach(([key, value]) => element.setAttribute(key, value))

const style = {
  'stroke-width': 4,
  'stroke': 'black',
  'fill': 'none'
}

// NOTE: affine transformations are applied right to left.
const transformLabel = (center, angle) => `
  translate(${center[0]} ${center[1]})
  rotate(${angle / Math.PI * 180})
  scale(0.5 0.5),
  translate(-100 -178)`

const transformBackdrop = (center, angle, bbox) => `
  translate(${center[0]} ${center[1]})
  rotate(${angle / Math.PI * 180})
  translate(${bbox.width / -4} ${bbox.height / -4})`

/**
 * Polyline with echelon decoration.
 */
L.Boundary = L.Polyline.extend({
  initialize (latlngs, options) {
    L.setOptions(this, options)
    L.Polyline.prototype.initialize.call(this, latlngs, options)

    // Received echelon/backdrop pairs for easy reference.
    this.labels = []
    this.onZoomEnd = ({ target: map }) => {
      const currentZoom = this.zoom
      this.zoom = map.getZoom()
      if (currentZoom < 11 && this.zoom >= 11) {
        this._createLabels()
      } else if (currentZoom >= 11 && this.zoom < 11) {
        this._removeLabels()
      }
    }
  },

  onAdd (map) {
    L.Polyline.prototype.onAdd.call(this, map)
    map.on('zoomend', this.onZoomEnd)
    this.zoom = map.getZoom()
    this._createLabels()
  },

  onRemove (map) {
    map.off('zoomend', this.onZoomEnd)
    this._removeLabels()
    L.Polygon.prototype.onRemove.call(this, map)
  },

  _removeLabels () {
    const parent = this._path.parentElement
    this.labels.forEach(label => {
      parent.removeChild(label[0])
      parent.removeChild(label[1])
    })

    this.labels = []
  },

  _segments () {
    // TODO: filter segments to short for echelon label
    return R.aperture(2, this._rings[0])
      .map(([a, b]) => [
        Math.atan((b.y - a.y) / (b.x - a.x)),
        [(a.x + b.x) / 2, (a.y + b.y) / 2]
      ])
  },

  /**
   * (Re-)create label list based on current set of vertices.
   */
  _createLabels () {
    this._removeLabels()
    if (this.zoom < 11) return

    const parent = this._path.parentElement
    const group = echelons[this.options.b]
    if (!group) return /* nothing to do. */

    this._segments().forEach(([angle, center]) => K(L.SVG.create('g'))(label => {
      setAttributes(style)(label)

      group.forEach(x => K(L.SVG.create(x.type))(element => {
        setAttributes(x)(element)
        label.appendChild(element)
      }))

      label.setAttribute('transform', transformLabel(center, angle))
      parent.appendChild(label)
      const bbox = label.getBBox()

      // White/transparent backdrop to increase readability.
      K(L.SVG.create('rect'))(rect => {
        rect.setAttribute('transform', transformBackdrop(center, angle, bbox))
        rect.setAttribute('width', bbox.width / 2)
        rect.setAttribute('height', bbox.height / 2)
        rect.setAttribute('fill', 'rgba(255, 255, 255, 0.7)')

        // no z-order in SVG, place backdrop 'under' (i.e. before) the label:
        parent.insertBefore(rect, label)
        this.labels.push([label, rect])
      })
    }))
  },

  /**
   * Update label positions without changing label list.
   */
  _updatLabels () {
    this._segments().forEach(([angle, center], index) => {
      const [label, rect] = this.labels[index]
      const bbox = label.getBBox()
      label.setAttribute('transform', transformLabel(center, angle))
      rect.setAttribute('transform', transformBackdrop(center, angle, bbox))
      rect.setAttribute('width', bbox.width / 2)
      rect.setAttribute('height', bbox.height / 2)
    })
  },

  _project () {
    L.Polyline.prototype._project.call(this)
    const parent = this._path.parentElement
    if (!parent) return

    if (this._rings[0].length - 1 !== this.labels.length) this._createLabels()
    else this._updatLabels()
  }
})
