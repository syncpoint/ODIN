import L from 'leaflet'
import uuid from 'uuid-random'

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
const polygon = (root, options) => {
  console.log('polygon', options)
  const { styles } = options

  const group = L.SVG.create('g')
  const defs = L.SVG.create('defs')
  group.appendChild(defs)

  // TODO: get styles from options
  const linePath = L.SVG.path({
    'stroke-width': styles.strokeWidth,
    'stroke-dasharray': styles.strokeDashArray,
    stroke: styles.stroke,
    'fill-opacity': styles.fillOpacity
  })

  if (styles.fill === 'diagonal') {
    const patternId = `pattern-${uuid()}`
    defs.appendChild(L.SVG.diagonalPattern(patternId, styles))
    linePath.setAttribute('fill', `url(#${patternId})`)
  } else {
    linePath.setAttribute('fill', styles.fill)
  }

  group.appendChild(linePath)
  root.appendChild(group)

  const dispose = () => {
    root.removeChild(group)
  }

  const updateLayerPoints = layerPoints => {
    const d = L.SVG.pointsToPath(layerPoints,
      true,
      options.lineSmoothing
    )

    linePath.setAttribute('d', d)
  }


  return {
    dispose,
    updateLayerPoints
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
    strokeWidth: 3,
    strokeDashArray: strokeDashArray(),
    fill: 'none'
  }
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
  this.zoomend = () => {
    if (!this.shape) return
    this.shape.updateLayerPoints(this.layerPoints(map))
  }
  map.on('zoomend', this.zoomend)

  const shapeOptions = {
    styles: styleOptions(this.feature),
    labels: {}
  }

  // Add feature specific styles.
  // shapeOptions.styles.fill = 'diagonal'
  // shapeOptions.styles.fillOpacity = '0.2'

  console.log('this.options', this.options)

  this.shape = polygon(this.renderer._rootGroup, shapeOptions)
  this.shape.updateLayerPoints(this.layerPoints(map))
}

const onRemove = function (map) {
  map.off('zoomend', this.zoomend)
  delete this.zoomend
}

/**
 * Project feature's geometry to layer points.
 */
const layerPoints = function (map) {
  // NOTE: last = first for polygons:
  const rings = Geometry(this.feature.geometry).latlng()
  return rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
}

L.Feature.PolygonArea = L.Layer.extend({
  options,
  initialize,
  beforeAdd,
  onAdd,
  onRemove,

  layerPoints
})
