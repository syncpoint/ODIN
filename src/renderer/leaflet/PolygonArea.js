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
  const id = uuid()
  const elementCache = {}
  const cache = (id, element) => dispose => {
    elementCache[id] && elementCache[id]()
    elementCache[id] = dispose
    return element
  }

  const group = L.SVG.create('g')
  const defs = L.SVG.create('defs')
  group.appendChild(defs)

  // Label Clipping:
  const clip = L.SVG.mask({ id: `mask-${id}` })
  defs.appendChild(clip)
  const whiteMask = L.SVG.rect({ fill: 'white' })
  clip.appendChild(whiteMask)

  // Transparent path to increase clickable area:
  const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'red', fill: 'none', 'opacity': 0.0 })
  const linePath = L.SVG.path({ })
  const labels = {}

  if (options.interactive) {
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')
  }

  group.appendChild(outlinePath)
  group.appendChild(linePath)
  renderer._rootGroup.appendChild(group)

  const dispose = () => {
    renderer._rootGroup.removeChild(group)
  }

  const updateLayerPoints = (layerPoints, smoothing) => {
    const bounds = L.bounds(layerPoints[0])
    const centroid = L.Point.centroid(layerPoints[0])
    const placement = { center: centroid }

    const intersectionPoints = R.aperture(2, layerPoints[0]).reduce((acc, segment) => {
      const segmenBounds = L.bounds(segment)

      {
        const w = [segment[0].x, segment[0].y]
        const x = [segment[1].x, segment[1].y]
        const y = [bounds.min.x, centroid.y]
        const z = [bounds.max.x, centroid.y]
        const intersection = math.intersect(w, x, y, z)
        if (intersection) {
          const point = L.point(intersection[0], intersection[1])
          if (segmenBounds.contains(point)) acc.push(point)
        }
      }

      {
        const w = [segment[0].x, segment[0].y]
        const x = [segment[1].x, segment[1].y]
        const y = [centroid.x, bounds.min.y]
        const z = [centroid.x, bounds.max.y]
        const intersection = math.intersect(w, x, y, z)
        if (intersection) {
          const point = L.point(intersection[0], intersection[1])
          if (segmenBounds.contains(point)) acc.push(point)
        }
      }

      return acc
    }, [])

    if (intersectionPoints.length === 4) {
      // Bring order to chaos.
      // Each point should have the correct placement: 'north', 'south', etc.
      const eastWest = R.sortBy(R.prop('x'))(intersectionPoints)
      const northSouth = R.sortBy(R.prop('y'))(intersectionPoints)
      placement.west = eastWest[0]
      placement.east = eastWest[3],
      placement.north = northSouth[0]
      placement.south = northSouth[3]

      // => labels

      Object.values(labels).forEach(label => group.removeChild(label))

      const textAnchor = alignment => {
        switch (alignment) {
          case 'left': return 'start'
          case 'right': return 'end'
          case 'center': return 'middle'
          default: return 'middle'
        }
      }

      options.labels.forEach(label => {
        labels[label.placement] = L.SVG.text({
          'font-size': 18,
          x: placement[label.placement].x,
          y: placement[label.placement].y
        })

        label.lines.forEach((line, index) => {
          if (!index) {
            const match = line.match(/<bold>(.*)<\/bold>/)
            const bold = (match && !!match[1]) || false
            labels[label.placement].textContent = bold ? match[1] : line
            labels[label.placement].setAttribute('font-weight', bold ? 'bold' : 'normal')
            labels[label.placement].setAttribute('text-anchor', textAnchor(label.alignment))
            labels[label.placement].setAttribute('alignment-baseline', 'central')

          } else {
            const tspan = L.SVG.tspan({
              dy: '1.2em',
              'text-anchor': textAnchor(label.alignment),
              'alignment-baseline': 'central'
            })

            const match = line.match(/<bold>(.*)<\/bold>/)
            const bold = (match && !!match[1]) || false
            tspan.textContent = bold ? match[1] : line
            tspan.setAttribute('x', placement[label.placement].x)
            tspan.setAttribute('font-weight', bold ? 'bold' : 'normal')
            labels[label.placement].appendChild(tspan)
          }
        })

        group.appendChild(labels[label.placement])
        const labelBox = labels[label.placement].getBBox()
        const tx =
          label.alignment === 'left' ? -labelBox.width / 2 :
          label.alignment === 'right' ? labelBox.width / 2 : 0

        labels[label.placement].setAttribute('transform', `translate(${tx} ${9 - labelBox.height / 2})`)

        const maskBox = L.SVG.inflate(labels[label.placement].getBBox(), 8)
        const blackMask = L.SVG.rect({
          x: maskBox.x + tx,
          y: maskBox.y + 9 - labelBox.height / 2,
          width: maskBox.width,
          height: maskBox.height,
          fill: 'black'
        })

        clip.appendChild(blackMask)
      })

      // <= labels

    } else {
      console.log('# intersections', intersectionPoints.length)
    }

    const d = L.SVG.pointsToPath(layerPoints,
      true,
      !!smoothing
    )

    outlinePath.setAttribute('d', d)
    linePath.setAttribute('d', d)
    const groupBBox = group.getBBox()
    L.SVG.setAttributes(whiteMask)({ ...L.SVG.inflate(groupBBox, 20) })
  }

  const updateStyles = styles => {
    L.SVG.setAttributes(linePath)({
      'stroke-width': styles.strokeWidth,
      'stroke-dasharray': styles.strokeDashArray,
      stroke: styles.stroke,
      'fill-opacity': styles.fillOpacity,
      'stroke-linejoin': 'round',
    })

    linePath.setAttribute('mask', `url(#mask-${id})`)
    if (styles.fill === 'diagonal') {
      const patternId = `pattern-${uuid()}`
      const pattern = cache('pattern', L.SVG.diagonalPattern(patternId, styles))(() => defs.removeChild(pattern))
      defs.appendChild(pattern)
      linePath.setAttribute('fill', `url(#${patternId})`)
    } else {
      linePath.setAttribute('fill', styles.fill)
    }
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
    fill: 'none' // TODO: supply from PolygonArea client
  }
}

// Zero, one or more labels with one or more lines each.
const labelOptions = feature => {
  // const labels = ['north', 'south', 'east', 'west'].map(placement => ({
  //   placement,
  //   lines: [placement.toUpperCase(), 'SECONDS LINE', '<bold>THIRD LINE</bold>']
  // }))

  // labels.push({
  //   // INSIDE:  center
  //   // BORDER:  north | south | east | west | northeast | northwest
  //   // OUTSIDE: bottom | topleft
  //   placement: 'center',

  //   // center | left
  //   alignment: 'center',
  //   lines: ['<bold>TAI</bold>', feature.properties.t, '12345', 'WWWXXXWWW', '12345', 'WWWXXXWWW']
  // })

  // const labels = [
  //   {
  //     placement: 'center',
  //     alignment: 'left',
  //     lines: [
  //       '<bold>ACA</bold>',
  //       '53ID (M)',
  //       'MIN ALT: 500 FT AGL',
  //       'MAX ALT: 3000 FT AGL',
  //       'GRIDS: NK2313 to NK3013',
  //       'TIME FROM: 281400ZAPR',
  //       'TIME TO: 281530ZAPR'
  //     ]
  //   }

  const labels = ['north', 'south', 'east', 'west'].map(placement => ({
    placement,
    lines: ['<bold>M</bold>']
  }))

  return labels
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
  this.shape = polygon(map.getRenderer(this), shapeOptions)

  this.onLatLngs = latlngs => {
    latlngs = [...latlngs, latlngs[0]]
    const layerPoints = latlngs.map(latlng => map.latLngToLayerPoint(latlng))
    this.shape.updateLayerPoints([layerPoints], this.options.lineSmoothing)
  }

  this.onGeometry = geometry => {
    const rings = Geometry(geometry).latlng()
    const layerPoints = rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    this.shape.updateLayerPoints(layerPoints, this.options.lineSmoothing)
  }

  if (this.options.interactive) this.addInteractiveTarget(this.shape.element)
  this.onGeometry(this.feature.geometry)
  const styles = styleOptions(this.feature)
  this.shape.updateStyles(styles)
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
  this.shape.updateStyles(styleOptions(feature))

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
