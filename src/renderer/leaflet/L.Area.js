import L from 'leaflet'
import { K } from '../../shared/combinators'

L.Area = L.Polygon.extend({
  initialize (latlngs, options) {
    L.setOptions(this, options)
    L.Polygon.prototype.initialize.call(this, latlngs, options)
  },

  onAdd (map) {
    L.Polygon.prototype.onAdd.call(this, map)

    this.label = K(L.SVG.create('text'))(text => {
      const lines = []
      if (this.options.type) lines.push(this.options.type)
      if (this.options.t) lines.push(this.options.t)

      const point = this.centerOfMass()
      text.textContent = lines[0]
      text.setAttribute('x', point[0])
      text.setAttribute('y', point[1])
      text.setAttribute('text-anchor', 'middle')

      lines.splice(1).forEach(line => {
        const tspan = L.SVG.create('tspan')
        tspan.textContent = line
        tspan.setAttribute('text-anchor', 'middle')
        tspan.setAttribute('dy', '1.2em')
        tspan.setAttribute('x', point[0])
        text.appendChild(tspan)
      })

      const group = this._path.parentElement
      group.appendChild(text)
    })

    this.updateLabelPosition()
  },

  onRemove (map) {
    const group = this._path.parentElement
    if (this.label) group.removeChild(this.label)
    L.Polygon.prototype.onRemove.call(this, map)
  },

  redraw () {
    L.Polygon.prototype.redraw.call(this)
    this.updateLabelPosition()
  },

  updateLabelPosition () {
    if (!this.label) return
    const point = this.centerOfMass()
    this.label.setAttribute('x', point[0])
    this.label.setAttribute('y', point[1])

    Array.from(this.label.childNodes)
      .splice(1)
      .forEach(child => child.setAttribute('x', point[0]))
  },

  _project () {
    L.Polygon.prototype._project.call(this)
    this.updateLabelPosition()
  },

  /**
   * Optimization.
   * Mostly Polygon.getCenter() without layerPointToLatLng().
   *
   * @returns layer point instead of latlng
   */
  centerOfMass () {
    const points = this._rings[0]
    const len = points.length
    if (!len) return null

    // polygon centroid algorithm; only uses the first ring if there are multiple
    let area = 0
    let x = 0
    let y = 0

    for (let i = 0, j = len - 1; i < len; j = i++) {
      const f = points[i].y * points[j].x - points[j].y * points[i].x
      x += (points[i].x + points[j].x) * f
      y += (points[i].y + points[j].y) * f
      area += f * 3
    }

    if (area === 0) return points[0]
    else return [x / area, y / area]
  }
})
