import * as geom from 'ol/geom'
import { getTransform } from 'ol/proj'
import { K } from '../../../shared/combinators'
import { Line } from './geodesy'

import defaultStyle from './default-style'

const toEPSG4326 = getTransform('EPSG:3857', 'EPSG:4326')
const toEPSG3857 = getTransform('EPSG:4326', 'EPSG:3857')
const toLonLat = p => toEPSG4326(p)
const fromLonLat = p => toEPSG3857(p)

const linearTarget = (feature, resolution) => {
  const coordinates = feature.getGeometry().getCoordinates()
  const centerLine = Line.of(coordinates.map(toLonLat))
  const width = resolution * 10
  const [PA1, PA2] = Line.points(Line.translate(width, 90)(centerLine))
  const [PB1, PB2] = Line.points(Line.translate(width, -90)(centerLine))

  const lines = [
    Line.points(centerLine),
    [PA1, PB1],
    [PA2, PB2]
  ]

  const geometry = new geom.MultiLineString(lines.map(ring => ring.map(fromLonLat)))
  return K(defaultStyle(feature))(xs => xs.forEach(s => s.setGeometry(geometry)))
}

export const geometries = {
  'G*F*LT----': [linearTarget],
  'G*F*LTS---': [linearTarget],
  'G*F*LTF---': [linearTarget]
}
