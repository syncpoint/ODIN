import * as R from 'ramda'
import * as style from 'ol/style'
import * as TS from '../ts'
import echelons from './echelons'
import { placements } from './polygon-labels'


export const geometries = {}

/**
 * STRONG POINT
 * TACGRP.MOBSU.SU.STRGPT
 */
geometries['G*M*SP----'] = ({ feature, styles, geometry, resolution }) => {
  const lineString = TS.lineString(TS.coordinates(TS.read(geometry)))
  const segments = TS.segments(lineString)
  const line = TS.lengthIndexedLine(lineString)

  const modifier = feature.get('sidc')[11]
  const border = ['-', '*'].includes(modifier)
    ? [styles.solidLine(geometry)]
    : (() => {
        const src = 'data:image/svg+xml;utf8,' + echelons[modifier]
        const image = new style.Icon({ src, scale: 0.4 })
        const size = image.getSize()
        const width = size && size[0] && size[0] * resolution / 4

        const anchor = placements(geometry).south()
        const point = TS.read(anchor)
        const index = line.indexOf(TS.coordinate(point))

        const B = index - width
        const C = index + width

        const segment = TS.segment(
          line.extractPoint(B),
          line.extractPoint(C)
        )

        image.setRotation(2 * Math.PI - segment.angle())

        return [
          new style.Style({ image, geometry: anchor }),
          styles.solidLine(TS.write(TS.union([
            line.extractLine(line.getStartIndex(), B),
            line.extractLine(C, line.getEndIndex())
          ])))
        ]
      })()

  const delta = resolution * 20
  return segments.flatMap(segment => {
    const angle = segment.angle()
    const [start] = line.indicesOf(TS.lineString(segment))
    const length = segment.getLength()
    const pointCount = Math.floor(length / delta)
    const offset = (length - pointCount * delta) / 2
    return R.range(0, pointCount + 1).map(i => {
      const P1 = line.extractPoint(start + offset + i * delta)
      const P2 = TS.projectCoordinate(P1)([angle - Math.PI / 2, resolution * 20])
      const lineString = TS.write(TS.lineString([P1, P2]))
      return styles.solidLine(lineString)
    })
  }).concat(...border)
}

