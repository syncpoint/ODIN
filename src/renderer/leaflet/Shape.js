import L from 'leaflet'
import selection from '../components/App.selection'
import './SVG'
import uuid from 'uuid-random'
import * as R from 'ramda'
import { editors } from './editors/'

// FIXME: deprecated -> remove

const initialize = function (feature, options) {
  this.feature = feature
  // Shape-specific geometry (incompatible with GeoJSON geometry)
  this.geometry = this.createGeometry(feature)
  L.setOptions(this, options)
}

const beforeAdd = function (map) {
  this.map = map
  this.renderer = map.getRenderer(this)
}

const onAdd = function (map) {
  // FIXME: misleading; shape() has side-effect (this._group)
  const group = this.shape()
  this.renderer._rootGroup.appendChild(group)
  this.addInteractiveTarget(group)

  this.update()
  map.on('zoomend', this.update, this)
  this.on('click', this.edit, this)
}

const onRemove = function (map) {
  this.removeInteractiveTarget(this._group)
  map.off('zoomend', this.update, this)
  this.off('click', this.edit, this)
  this.renderer._rootGroup.removeChild(this._group)
  this.map.tools.dispose() // dispose editor/selection tool
}

const shape = function () {
  const id = uuid()
  this._group = L.SVG.create('g')
  const defs = L.SVG.create('defs')

  // Path/label clipping.
  const clip = L.SVG.mask({ id: `mask-${id}` })
  this._maskWhite = L.SVG.rect({ fill: 'white' })
  clip.appendChild(this._maskWhite)
  const labelCount = this.labelCount === 0 ? 0 : this.labelCount || 1
  this._labels = []
  this._masksBlack = []

  R.range(0, labelCount).forEach(i => {
    this._labels[i] = L.SVG.text({ 'font-size': 18, 'text-anchor': 'middle', 'alignment-baseline': 'central' })
    this._masksBlack[i] = L.SVG.rect({ fill: 'black' })
    L.DomUtil.addClass(this._labels[i], 'leaflet-interactive')
    this._group.appendChild(this._labels[i])
    clip.appendChild(this._masksBlack[i])
  })

  this._outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'black', 'opacity': 0.0 })
  this._linePath = L.SVG.path({ 'stroke-width': 2, stroke: 'black', fill: 'none', mask: `url(#mask-${id})` })

  L.DomUtil.addClass(this._outlinePath, 'leaflet-interactive')
  L.DomUtil.addClass(this._linePath, 'leaflet-interactive')

  defs.appendChild(clip)
  this._group.appendChild(defs)
  this._group.appendChild(this._outlinePath)
  this._group.appendChild(this._linePath)
  return this._group
}

const layerPoint = function (point) {
  return this.map.latLngToLayerPoint(point)
}

const layerPoints = function (rings) {
  return rings.map(ring => ring.map(latlng => this.map.latLngToLayerPoint(latlng)))
}

const edit = function () {
  if (selection.isSelected(this.urn)) return
  selection.select(this.urn)

  const callback = geometry => {
    this.geometry = geometry
    this.update()
    geometry.geoJSON && this.options.update(geometry.geoJSON())
  }

  this.editor = editors[this.editorType](this.map, this.geometry)
  this.editor.geometries.on('data', callback)

  const editor = {
    dispose: () => {
      this.editor.geometries.off('data', callback)
      this.editor.dispose()
      delete this.editor

      if (selection.isSelected(this.urn)) {
        selection.deselect()
      }
    }
  }

  this.map.tools.edit(editor)
}

const update = function () {
  this.updatePath()
  this.updateLabels()
  if (this.editor) this.editor.update()
}

const updatePath = function () {
  const path = this.path(this.geometry)
  if (path) {
    const d = L.SVG.pointsToPath(this.layerPoints(path))
    this._outlinePath.setAttribute('d', d)
    this._linePath.setAttribute('d', d)
    L.SVG.setAttributes(this._linePath)(this.style)
  }

  if (this._maskWhite) {
    const groupBBox = this._group.getBBox()
    L.SVG.setAttributes(this._maskWhite)({ ...L.SVG.inflate(groupBBox, 10) })
  }
}

const updateLabels = function () {
  if (!this._labels) return

  const label = this.label && this.label(this.geometry)
  if (label) {
    const labels = Array.isArray(label) ? label : [ label ]

    labels.forEach((label, i) => {
      this._labels[i].textContent = label.text
      const center = this.layerPoint(label.latlng)
      this._labels[i].setAttribute('transform', L.SVG.transformLabel(center, label.bearing))
      const bbox = this._labels[i].getBBox()

      L.SVG.setAttributes(this._masksBlack[i])({
        transform: L.SVG.transformBackdrop(center, bbox, label.bearing),
        width: bbox.width,
        height: bbox.height
      })
    })
  }
}

const updateData = function (feature) {
  this.feature = feature
  this.geometry = this.createGeometry(feature)
  this.update()
}

L.Shape = L.Layer.extend({
  initialize,
  beforeAdd,
  onAdd,
  onRemove,

  style: {},
  shape,
  layerPoint,
  layerPoints,
  edit,
  update,
  updatePath,
  updateLabels,
  updateData
})

L.Shape.arrow = (latlng, length, bearing) => [
  latlng.destinationPoint(length, bearing - 135),
  latlng,
  latlng.destinationPoint(length, bearing + 135)
]
