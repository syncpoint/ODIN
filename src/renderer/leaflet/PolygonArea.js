/* eslint-disable */
import L from 'leaflet'
import uuid from 'uuid-random'
import * as math from 'mathjs'
import * as R from 'ramda'
import selection from '../components/App.selection'

const ColorSchemes = {
  dark: {
    red: 'RGB(200, 0, 0)',
    blue: 'RGB(0, 107, 140)',
    green: 'RGB(0, 160, 0)',
    yellow: 'RGB(225, 220, 0)',
    purple: 'RGB(80, 0, 80)'
  },
  medium: {
    red: 'RGB(255, 48, 49)',
    blue: 'RGB(0, 168, 220)',
    green: 'RGB(0, 226, 0)',
    yellow: 'RGB(255, 255, 0)',
    purple: '128, 0, 128'
  }
}

// GeoJSON geometry helper.
const Geometry = geometry => {
  const { type, coordinates } = geometry

  const latlng = () => {
    switch (type) {
      case 'Point': return L.latLng(coordinates[1], coordinates[0])
      case 'LineString': return coordinates.map(([lon, lat]) => L.latLng(lat, lon))
      // NOTE: first ring only:
      case 'Polygon': return coordinates.map(ring => ring.map(([lon, lat]) => L.latLng(lat, lon)))
    }
  }

  return {
    latlng
  }
}

// writable properties:
// * points (pixel coordinates)
// * styles (stroke-weight, color, fill, line-smoothing, etc.)
// * labels (content, alignment, placement)
const polygon = (renderer, options) => {
  console.log('[polygon]', options)
  const { styles } = options

  const group = L.SVG.create('g')
  const defs = L.SVG.create('defs')
  group.appendChild(defs)

  const box = L.SVG.rect({ 'stroke-width': 0.5, stroke: 'red', 'stroke-dasharray': '10 5', fill: 'none' })
  const centerMarker = L.SVG.circle({ r: 5, stroke: 'red', fill: 'red' })
  const intersections = R.range(0, 4).map(() => L.SVG.circle({ r: 15, 'stroke-width': 2, stroke: 'red', fill: 'none' }))

  group.appendChild(box)
  group.appendChild(centerMarker)
  intersections.forEach(element => group.appendChild(element))


  // Transparent path to increase clickable area:
  const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'red', fill: 'none', 'opacity': 0.0 })
  const linePath = L.SVG.path({
    'stroke-width': styles.strokeWidth,
    'stroke-dasharray': styles.strokeDashArray,
    stroke: styles.stroke,
    'fill-opacity': styles.fillOpacity
  })

  if (options.interactive) {
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')
  }

  if (styles.fill === 'diagonal') {
    const patternId = `pattern-${uuid()}`
    defs.appendChild(L.SVG.diagonalPattern(patternId, styles))
    linePath.setAttribute('fill', `url(#${patternId})`)
  } else {
    linePath.setAttribute('fill', styles.fill)
  }

  // => labels

  options.labels.forEach(label => {
    console.log('label', label)
  })

  // <= labels

  group.appendChild(outlinePath)
  group.appendChild(linePath)
  renderer._rootGroup.appendChild(group)

  const dispose = () => {
    renderer._rootGroup.removeChild(group)
  }

  const updateLayerPoints = layerPoints => {
    const bounds = L.bounds(layerPoints[0])
    L.SVG.setAttributes(box)({
      x: bounds.min.x,
      y: bounds.min.y,
      width: bounds.getSize().x,
      height: bounds.getSize().y
    })

    const centroid = L.Point.centroid(layerPoints[0])
    L.SVG.setAttributes(centerMarker)({
      cx: centroid.x,
      cy: centroid.y
    })

    const intersectionPoints = R.aperture(2, layerPoints[0]).reduce((acc, segment) => {
      const segmenBounds = L.bounds(segment)

      {
        const w = [segment[0].x, segment[0].y]
        const x = [segment[1].x, segment[1].y]
        const y = [centroid.x, centroid.y]
        const z = [bounds.min.x, centroid.y]
        const intersection = math.intersect(w, x, y, z)
        if (intersection) {
          const point = L.point(intersection[0], intersection[1])
          if (segmenBounds.contains(point)) acc.push(point)
        }
      }

      {
        const w = [segment[0].x, segment[0].y]
        const x = [segment[1].x, segment[1].y]
        const y = [centroid.x, centroid.y]
        const z = [centroid.x, bounds.min.y]
        const intersection = math.intersect(w, x, y, z)
        if (intersection) {
          const point = L.point(intersection[0], intersection[1])
          if (segmenBounds.contains(point)) acc.push(point)
        }
      }

      return acc
    }, [])

    if (intersectionPoints.length === 4) {
      intersectionPoints.forEach((point, index) => {
        L.SVG.setAttributes(intersections[index])({
          cx: point.x,
          cy: point.y
        })
      })
    } else {
      console.log('# intersections', intersectionPoints.length)
    }

    const d = L.SVG.pointsToPath(layerPoints,
      true,
      options.lineSmoothing
    )

    outlinePath.setAttribute('d', d)
    linePath.setAttribute('d', d)
  }

  const updateStyles = styles => {
    L.SVG.setAttributes(linePath)({
      'stroke-dasharray': styles.strokeDashArray,
      stroke: styles.stroke,
      'fill-opacity': styles.fillOpacity
    })
  }

  return {
    dispose,
    updateLayerPoints,
    updateStyles,
    // We must expose group element to handle interactive targets on layer.
    element: group
  }
}

const styleOptions = feature => {
  const colorSchemes = ColorSchemes['dark']

  const { sidc, n } = feature.properties
  const stroke = () => {
    if (n === 'ENY') return colorSchemes.red

    switch (sidc[1]) {
      case 'F': return colorSchemes.blue
      case 'H': return colorSchemes.red
      case 'N': return colorSchemes.green
      default: return 'black'
    }
  }

  const strokeDashArray = () => {
    if (sidc[3] === 'A') return '10 5'
  }

  return {
    stroke: stroke(),
    patternStroke: stroke(),
    strokeWidth: 3,
    strokeDashArray: strokeDashArray(),
    fill: 'none'
  }
}

// Zero, one or more labels with one or more lines each.
const labelOptions = feature => {
  return [
    {
      // INSIDE:  center
      // BORDER:  north | south | east | west | northeast | northwest
      // OUTSIDE: bottom | topleft
      placement: 'center',

      // center | left
      alignment: 'center',
      lines: ['<bold>TAI</bold>', feature.properties.t]
    }
  ]
}

const options = {
  dummy: false
}

const initialize = function (feature, options) {
  this.feature = feature
  L.setOptions(this, options)
}

const beforeAdd = function (map) {
  this.renderer = map.getRenderer(this)
}

const onAdd = function (map) {
  this.zoomend = () => this.onGeometry && this.onGeometry(this.feature.geometry)
  this.click = () => this.edit(map)

  map.on('zoomend', this.zoomend)
  this.on('click', this.click)

  const shapeOptions = {
    styles: styleOptions(this.feature),
    labels: labelOptions(this.feature)
  }

  shapeOptions.interactive = this.options.interactive

  // Add feature specific styles.
  shapeOptions.styles.fill = 'diagonal'
  // shapeOptions.styles.fillOpacity = '0.2'
  // shapeOptions.styles.stroke = 'black'
  // shapeOptions.styles.patternStroke = ColorSchemes['dark'].yellow

  this.shape = polygon(map.getRenderer(this), shapeOptions)

  this.onLatLngs = latlngs => {
    latlngs = [...latlngs, latlngs[0]]
    const layerPoints = latlngs.map(latlng => map.latLngToLayerPoint(latlng))
    this.shape.updateLayerPoints([layerPoints])
  }

  this.onGeometry = geometry => {
    const rings = Geometry(geometry).latlng()
    const layerPoints = rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    this.shape.updateLayerPoints(layerPoints)
  }

  if (this.options.interactive) this.addInteractiveTarget(this.shape.element)
  this.onGeometry(this.feature.geometry)
}

const onRemove = function (map) {
  if (this.options.interactive) this.removeInteractiveTarget(this.shape.element)
  this.off('click', this.click)
  map.off('zoomend', this.zoomend)
  delete this.click
  delete this.zoomend
  this.shape.dispose()
}

const edit = function (map) {

  if (selection.isSelected(this.urn)) return
  selection.select(this.urn)

  const callback = event => {
    switch (event.type) {
      case 'latlngs': return this.onLatLngs(event.latlngs)
      case 'geometry': return this.options.update({ geometry: event.geometry })
    }
  }

  this.markerGroup = new L.Feature.MarkerGroup(this.feature.geometry, callback)
  this.markerGroup.addTo(map)

  const editor = {
    dispose: () => {
      map.removeLayer(this.markerGroup)
      delete this.markerGroup
      if (selection.isSelected(this.urn)) {
        selection.deselect()
      }
    }
  }

  map.tools.edit(editor)
}

const updateData = function (feature) {
  console.log('[updateData]', feature)
  const styles = styleOptions(feature)
  this.shape.updateStyles(styles)

  // TODO: deep compare properties and update shape options accordingly

  this.feature = feature
  this.onGeometry && this.onGeometry(feature.geometry)
  this.markerGroup && this.markerGroup.updateGeometry(feature.geometry)
}

L.Feature.PolygonArea = L.Layer.extend({
  options,
  initialize,
  beforeAdd,
  onAdd,
  onRemove,

  edit,
  updateData
})
