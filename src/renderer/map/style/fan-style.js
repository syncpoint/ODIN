import * as geom from 'ol/geom'
import LatLon from 'geodesy/latlon-spherical.js'
import defaultStyle from './default-style'
import { K } from '../../../shared/combinators'
import { parameterized } from '../../components/SIDC'

import {
  bearings,
  coordinates,
  toLatLon,
  fromLatLon
} from './geodesy'

const multiLineString = lines =>
  new geom.MultiLineString(lines.map(line => line.map(fromLatLon)))

const lineStyle = (feature, lines) => {
  const styles = defaultStyle(feature)

  // It is quite possible that feature's extent is too small
  // to construct a valid geometry. Use default style in this case.

  try {
    const geometry = multiLineString(lines)
    return K(styles)(xs => xs.forEach(s => s.setGeometry(geometry)))
  } catch (err) {
    return styles
  }
}

const closedArrowEnd = (line, resolution, widthFactor = 10, bearing = 145) => {
  const [finalBearing] = bearings(line).reverse()
  const arrowWidth = resolution * widthFactor
  const PA = line[1].destinationPoint(arrowWidth, finalBearing - bearing)
  const PB = line[1].destinationPoint(arrowWidth, finalBearing + bearing)
  const I = LatLon.intersection(line[0], finalBearing, PA, finalBearing + 90)
  return [PA, line[1], PB, I, PA]
}

const geometries = {}
geometries['G*G*GAS---'] = (feature, resolution) => {
  const [C, O, S] = coordinates(feature).map(toLatLon)
  const arrowO = closedArrowEnd([C, O], resolution)
  const arrowS = closedArrowEnd([C, S], resolution)
  const lines = [[C, arrowO[3]], [C, arrowS[3]], arrowO, arrowS]
  return lineStyle(feature, lines)
}

const labels = {}

export const fanStyle = (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const labelFns = labels[sidc] || []
  const geometryFns = geometries[sidc] || defaultStyle
  return [geometryFns, ...labelFns].flatMap(fn => fn(feature, resolution))
}
