import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as style from 'ol/style'
import * as TS from '../ts'
import echelons from './echelons'
import { placements } from './polygon-labels'


export const geometries = {}

// OBSTACLES / GENERAL / BELT
geometries['G*M*OGB---'] = ({ styles, resolution, geometry }) => {
  const coordinates = geometry.getCoordinates(true)

  // Note: We are still (and remain) in Web Mercator (not UTM).
  const lineString = TS.read(new geom.LineString(coordinates[0]))
  const delta = resolution * 60

  const points = TS.segments(lineString)
    .map(segment => [segment, segment.getLength(), Math.floor(segment.getLength() / delta)])
    .map(([segment, length, n]) => [segment, length, n, (length - n * delta) / 2])
    .flatMap(([segment, length, n, offset]) => {
      const xs = R.range(0, n)
        .map(i => offset + i * delta)
        .flatMap(start => [start + delta / 4, start + delta / 2, start + delta * 3 / 4])
        .map(offset => offset / length)
        .map(fraction => segment.pointAlong(fraction))

      return [
        segment.getCoordinate(0),
        ...R.splitEvery(3, xs).flatMap(([a, b, c]) => [
          a,
          TS.projectCoordinate(b)([segment.angle() - Math.PI / 2, delta / 3]),
          c
        ]),
        segment.getCoordinate(1)
      ]
    })

  points.push(points[0])
  return styles.solidLine(TS.write(TS.lineString(points)))
}

// OBSTACLES / GENERAL / ZONE is identical to OBSTACLES / GENERAL / BELT
geometries['G*M*OGZ---'] = geometries['G*M*OGB---']

// OBSTACLE FREE AREA
geometries['G*M*OGF---'] = ({ styles, resolution, geometry }) => {
  const coordinates = geometry.getCoordinates(true)

  // Note: We are still (and remain) in Web Mercator (not UTM).
  const lineString = TS.read(new geom.LineString(coordinates[0]))
  const delta = resolution * 60

  const points = TS.segments(lineString)
    .map(segment => [segment, segment.getLength(), Math.floor(segment.getLength() / delta)])
    .map(([segment, length, n]) => [segment, length, n, (length - n * delta) / 2])
    .flatMap(([segment, length, n, offset]) => {
      const xs = R.range(0, n)
        .map(i => offset + i * delta)
        .flatMap(start => [start + delta / 4, start + delta / 2, start + delta * 3 / 4])
        .map(offset => offset / length)
        .map(fraction => segment.pointAlong(fraction))

      return [
        segment.getCoordinate(0),
        ...R.splitEvery(3, xs).flatMap(([a, b, c]) => [
          a,
          TS.projectCoordinate(b)([segment.angle() + Math.PI / 2, delta / 3]),
          c
        ]),
        segment.getCoordinate(1)
      ]
    })

  points.push(points[0])
  return styles.solidLine(TS.write(TS.lineString(points)))
}

// OBSTACLE RESTRICTED AREA
geometries['G*M*OGR---'] = ({ styles, resolution, geometry, fill }) => {
  const coordinates = geometry.getCoordinates(true)

  // Note: We are still (and remain) in Web Mercator (not UTM).
  const lineString = TS.read(new geom.LineString(coordinates[0]))
  const delta = resolution * 60

  const points = TS.segments(lineString)
    .map(segment => [segment, segment.getLength(), Math.floor(segment.getLength() / delta)])
    .map(([segment, length, n]) => [segment, length, n, (length - n * delta) / 2])
    .flatMap(([segment, length, n, offset]) => {
      const xs = R.range(0, n)
        .map(i => offset + i * delta)
        .flatMap(start => [start + delta / 4, start + delta / 2, start + delta * 3 / 4])
        .map(offset => offset / length)
        .map(fraction => segment.pointAlong(fraction))

      return [
        segment.getCoordinate(0),
        ...R.splitEvery(3, xs).flatMap(([a, b, c]) => [
          a,
          TS.projectCoordinate(b)([segment.angle() + Math.PI / 2, delta / 3]),
          c
        ]),
        segment.getCoordinate(1)
      ]
    })

  points.push(points[0])
  // const fillPattern = { pattern: 'hatch', angle: 45, size: 2, spacing: 12 }
  // console.dir(styles)
  return styles.solidLine(TS.write(TS.polygon(points)), { fill })
}


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

