import L from 'leaflet'
import * as R from 'ramda'
import GeoJSON from '../GeoJSON'
import * as math from 'mathjs'

/* eslint-disable */

const intersect = lines => lines[0].intersection(lines[1])
const unzip = n => xs => xs.reduce((acc, x) => {
  R.range(0, n).forEach(i => acc[i].push(x[i]))
  return acc
}, R.range(0, n).map(_ => []))

const corridor = (latlngs, width) => {

  // TODO: add additional segment for arrow

  const center = R.aperture(2, latlngs).map(L.LatLng.line)
  const c1 = center[0]
  const cn = center[center.length - 1]

  // MIL-STD-2525C: P0 is at arrow's tip.
  // MIL-STD-2525C: Width is defined through arrow (not corridor) width

  const envelope = (factor = 1) => {
    const w = width * factor
    const [right, left] = center.reduce((acc, line) => {
      acc[0].push(line.translate(w, 90))
      acc[1].push(line.translate(w, -90))
      return acc
    }, [[], []])

    return R.zip([
      c1.points[0].destinationPoint(w, c1.initialBearing + 90),
      ...R.aperture(2, right).map(intersect),
      cn.points[1].destinationPoint(w, cn.finalBearing + 90)
    ], [
      c1.points[0].destinationPoint(w, c1.initialBearing - 90),
      ...R.aperture(2, left).map(intersect),
      cn.points[1].destinationPoint(w, cn.finalBearing - 90)
    ])
  }

  return {
    latlngs,
    width,
    envelope
  }
}

const sq = x => x * x

// Line: [v1, v2]
const projectedPoint = (v1, v2, p) => {
  const e1 = [v2.x - v1.x, v2.y - v1.y]
  const e2 = [p.x - v1.x, p.y - v1.y]
  const dp = math.dot(e1, e2)
  const d = e1[0] * e1[0] + e1[1] * e1[1]
  return L.point(v1.x + (dp * e1[0]) / d, v1.y + (dp * e1[1]) / d)
}

const line = points => {

  const d = Math.sqrt(
    sq(points[0].x - points[1].x) +
    sq(points[0].y - points[1].y)
  )

  const point = f => L.point(
    points[0].x + f * (points[1].x - points[0].x),
    points[0].y + f * (points[1].y - points[0].y)
  )

  return {
    d,
    point
  }
}

const corridorShape = group => {

  const outline = L.SVG.path({
    stroke: 'black',
    'stroke-width': 7,
    fill: 'none',
    'stroke-linejoin': 'round'
  })

  const path = L.SVG.path({
    stroke: 'RGB(0, 168, 220)',
    // stroke: 'RGB(128, 224, 255)',
    'stroke-width': 3,
    fill: 'none',
    'stroke-linejoin': 'round'
  })

  group.appendChild(outline)
  group.appendChild(path)

  // NOTE: fully width envelope
  const updateFrame = ({ center, envelope }) => {

    const dw = line(envelope[0]).d
    const ds = line(center.slice(0, 2)).d
    const arrowBase = (() => {
      // TODO: limit arrow length to first segment if necessary
      const C1 = line(center.slice(0, 2)).point((dw/ds) * 0.38)

      // project C to first segment of envelope
      const strut = line([
        projectedPoint(envelope[0][0], envelope[1][0], C1),
        projectedPoint(envelope[0][1], envelope[1][1], C1)
      ])

      return [0, 0.25, 0.75, 1].map(strut.point)
    })()

    // Interpolate points for corridor width (half of arrow width)
    // TODO: remove/simplify shape when minimum width is below a certain limit
    const struts = envelope.map(line).slice(1)
    const C2 = line(center.slice(0, 2)).point((dw/ds) * 0.19)

    const points = [[
      ...struts.map(s => s.point(0.75)).reverse(),
      arrowBase[2], arrowBase[3],
      center[0],
      arrowBase[0], arrowBase[1],
      ...struts.map(s => s.point(0.25))
    ],
    [
      arrowBase[2],
      C2,
      arrowBase[1]
    ]]

    const closed = false
    path.setAttribute('d', L.SVG.pointsToPath(points, closed))
    outline.setAttribute('d', L.SVG.pointsToPath(points, closed))
  }

  const attached = () => {
    // shape group is now attached to parent element
  }

  return {
    group,
    updateFrame,
    attached
  }
}


/**
 *
 */
const MainAttack = L.Layer.extend({

  initialize (feature, options) {
    L.setOptions(this, options)

    const latlngs = GeoJSON.latlng(feature.geometry)
    const width = feature.geometry.width * 2
    this._corridor = corridor(latlngs, width)
  },

  beforeAdd (map) {
    this._map = map
    this._renderer = map.getRenderer(this)
  },

  onAdd (/* map */) {
    this._renderer._initGroup(this)
    this._shape = corridorShape(this._group)
    this._project()
    this._renderer._addGroup(this)
    this._shape.attached()
  },


  /**
   *
   */
  onRemove (/* map */) {
    this._renderer._removeGroup(this)
  },


  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    this._shape.updateFrame({
      center: this._corridor.latlngs.map(layerPoint),
      envelope: this._corridor.envelope().map(pair => pair.map(layerPoint))
    })
  },

  /**
   * Required by L.Renderer, but
   * NOOP since we handle shape state in layer.
   */
  _update () {
  }
})

L.Feature['G*G*OLAGM-'] = MainAttack
