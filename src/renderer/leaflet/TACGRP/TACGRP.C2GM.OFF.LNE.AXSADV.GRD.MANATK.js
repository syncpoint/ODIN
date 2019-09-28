import L from 'leaflet'
import * as R from 'ramda'
import GeoJSON from '../GeoJSON'

const intersect = lines => lines[0].intersection(lines[1])
const unzip = n => xs => xs.reduce((acc, x) => {
  R.range(0, n).forEach(i => acc[i].push(x[i]))
  return acc
}, R.range(0, n).map(_ => []))

const corridor = (latlngs, width) => {
  const median = R.aperture(2, latlngs).map(L.LatLng.line)
  const m1 = median[0]
  const mn = median[median.length - 1]

  // MIL-STD-2525C: P0 is at arrow's tip.
  // MIL-STD-2525C: Width is defined through arrow (not corridor) width

  const envelope = (factor = 1) => {
    const w = width * factor
    const [right, left] = median.reduce((acc, line) => {
      acc[0].push(line.translate(w, 90))
      acc[1].push(line.translate(w, -90))
      return acc
    }, [[], []])

    return R.zip([
      m1.points[0].destinationPoint(w, m1.initialBearing + 90),
      ...R.aperture(2, right).map(intersect),
      mn.points[1].destinationPoint(w, mn.finalBearing + 90)
    ], [
      m1.points[0].destinationPoint(w, m1.initialBearing - 90),
      ...R.aperture(2, left).map(intersect),
      mn.points[1].destinationPoint(w, mn.finalBearing - 90)
    ])
  }

  return {
    latlngs,
    width,
    envelope
  }
}


const MainAttack = L.Layer.extend({

  initialize (feature, options) {
    L.setOptions(this, options)

    const latlngs = GeoJSON.latlng(feature.geometry)
    const width = feature.geometry.width
    this._corridor = corridor(latlngs, width)
  },

  beforeAdd (map) {
    this._map = map
    this._renderer = map.getRenderer(this)
  },

  onAdd (/* map */) {
    this._renderer._initGroup(this)

    // TODO: encapulate
    this._path = L.SVG.path({
      stroke: 'red',
      'stroke-width': 2,
      'stroke-dasharray': '20 10',
      fill: 'none'
    })

    this._group.appendChild(this._path)

    this._reset()
    this._renderer._addGroup(this)

    // TODO: group is live: update relevant elements
  },


  /**
   *
   */
  onRemove (/* map */) {
    this._renderer._removeGroup(this)
  },


  /**
   *
   */
  _reset () {
    this._project()
    this._update() // TODO: probably not necessary; remove
  },


  /**
   * Project WGS84 geometry to pixel/layer coordinates.
   */
  _project () {
    console.log('[MainAttack]', '_project()', new Error())
    const layerPoint = this._map.latLngToLayerPoint.bind(this._map)
    const envelope = unzip(2)(this._corridor.envelope().map(pair => pair.map(layerPoint)))
    // TODO: update SVG group's pixel coordinates
    const points = [[
      ...envelope[0], ...envelope[1].reverse()
    ]]

    const closed = true
    this._path.setAttribute('d', L.SVG.pointsToPath(points, closed))
  },


  /**
   * TODO: remove
   */
  _update () {
    if (!this._map) return
    console.log('[MainAttack]', '_update()')

    // TODO: option to clip points; see L.Polyline._clipPoints
    // TODO: option to simplify points: L.Polyline._simplifyPoints
    // TODO: option to update SVG group in renderer
  }
})

L.Feature['G*G*OLAGM-'] = MainAttack
