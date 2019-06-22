import L from 'leaflet'
import * as R from 'ramda'
import { K } from '../../shared/combinators'
import echelons from './echelons'

const setAttributes = o => element =>
  Object.entries(o)
    .filter(([key]) => key !== 'type')
    .forEach(([key, value]) => element.setAttribute(key, value))

const style = {
  'stroke-width': 4,
  'stroke': 'black',
  'fill': 'none'
}

L.Boundary = L.Polyline.extend({
  initialize (latlngs, options) {
    L.setOptions(this, options)
    L.Polyline.prototype.initialize.call(this, latlngs, options)

    // Received echelon/backdrop pairs for easy reference.
    this.labels = []
  },

  onAdd (map) {
    L.Polyline.prototype.onAdd.call(this, map)
    this._createLabels()
  },

  onRemove (map) {
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

  /**
   * (Re-)create label list based on current set of vertices.
   */
  _createLabels () {
    this._removeLabels()
    const parent = this._path.parentElement

    const group = echelons[this.options.b]
    if (!group) return /* nothing to do. */

    // TODO: filter short segments
    const segments = R.aperture(2, this._rings[0])
      .map(([a, b]) => [
        Math.atan((b.y - a.y) / (b.x - a.x)),
        [(a.x + b.x) / 2, (a.y + b.y) / 2]
      ])

    segments.forEach(([angle, center]) => {
      const label = L.SVG.create('g')
      setAttributes(style)(label)

      group.forEach(x => {
        const element = L.SVG.create(x.type)
        setAttributes(x)(element)
        label.appendChild(element)
      })

      label.setAttribute('transform', `translate(${center[0]} ${center[1]}) rotate(${angle / Math.PI * 180}) scale(0.5 0.5), translate(-100 -180)`)
      parent.appendChild(label)
      const bbox = label.getBBox()

      K(L.SVG.create('rect'))(rect => {
        rect.setAttribute('transform', `translate(${center[0]} ${center[1]}) rotate(${angle / Math.PI * 180}) translate(${bbox.width / -4} ${bbox.height / -4})`)
        rect.setAttribute('width', bbox.width / 2)
        rect.setAttribute('height', bbox.height / 2)
        rect.setAttribute('fill', 'rgba(255, 255, 255, 0.7)')
        parent.insertBefore(rect, label)
        this.labels.push([label, rect])
      })
    })
  },

  /**
   * Update label positions without changing label list.
   */
  _updatLabels () {
    R.aperture(2, this._rings[0])
      .map(([a, b]) => [
        Math.atan((b.y - a.y) / (b.x - a.x)),
        [(a.x + b.x) / 2, (a.y + b.y) / 2]
      ])
      .forEach(([angle, center], index) => {
        const label = this.labels[index][0]
        label.setAttribute('transform', `translate(${center[0]} ${center[1]}) rotate(${angle / Math.PI * 180}) scale(0.5 0.5), translate(-100 -180)`)
        const bbox = label.getBBox()
        const rect = this.labels[index][1]

        rect.setAttribute('transform', `translate(${center[0]} ${center[1]}) rotate(${angle / Math.PI * 180}) translate(${bbox.width / -4} ${bbox.height / -4})`)
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
