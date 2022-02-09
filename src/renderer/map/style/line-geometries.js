import * as R from 'ramda'
import * as style from 'ol/style'
import * as TS from '../ts'
import echelons from './echelons'
import * as fences from './fences'

const linearTarget = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.1], [0, -0.1], [1, 0.1], [1, -0.1]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1], xs)),
    TS.lineString(R.props([2, 3], xs))
  ]))
}

const teeth = direction => (lineString, resolution) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  return R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [
      line.extractPoint(a),
      line.extractPoint(a + width / 2),
      line.extractPoint(b - width / 2),
      line.extractPoint(b)
    ])
    .map(([a, b, c, d]) => [a, b, c, d, TS.segment([b, c]).angle()])
    .map(([a, b, c, d, angle]) => [a, b, c, d, TS.projectCoordinate(b)([angle + direction * Math.PI / 3, width])])
    .map(([a, b, c, d, x]) => TS.lineString([a, b, x, c, d]))
}

const corridor = title => (params) => {
  const { styles, line: lineString, resolution, feature } = params
  const width = resolution * 10
  const coords = TS.coordinates(lineString)
  const options = {
    joinStyle: TS.BufferParameters.JOIN_ROUND,
    endCapStyle: TS.BufferParameters.CAP_ROUND
  }

  const segments = R.aperture(2, coords)
    .map(points => TS.lineString(points))
    .map(line => TS.buffer(options)(line)(width))

  const texts = (() => {
    if (!feature.get('t')) return []
    else {
      const text = `${title} ${feature.get('t')}`
      return R.aperture(2, coords)
        .map(TS.segment)
        .map(segment => [segment.midPoint(), segment.angle()])
        .map(([point, angle]) => styles.text(TS.point(point), {
          text,
          flip: true,
          textAlign: () => 'center',
          rotation: Math.PI - angle
        }))
    }
  })()

  // NOTE: cut start/end cap
  // const corridor = TS.collect([
  //   TS.difference([R.head(segments).getBoundary(), TS.pointBuffer(TS.startPoint(lineString))(width * 1.01)]),
  //   ...R.take(segments.length - 2, R.drop(1, segments)),
  //   TS.difference([R.last(segments).getBoundary(), TS.pointBuffer(TS.endPoint(lineString))(width * 1.01)])
  // ])

  return [
    styles.solidLine(TS.collect(segments)),
    ...texts
  ]
}

const attackArrow = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = R.last(TS.segments(line))
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.86, -0.1], [1, 0], [0.86, 0.1]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1, 2], xs))
  ]))
}

export const geometries = {

  /**
   * TACGRP.FSUPP.LNE.LNRTGT
   * LINEAR TARGET
   */
  'G*F*LT----': linearTarget,

  /**
   * TACGRP.FSUPP.LNE.LNRTGT.LSTGT
   * LINEAR SMOKE TARGET
   */
  'G*F*LTS---': linearTarget,

  /**
   * TACGRP.FSUPP.LNE.LNRTGT.FPF
   * FINAL PROTECTIVE FIRE (FPF)
   */
  'G*F*LTF---': linearTarget,

  /**
   * TACGRP.C2GM.OFF.LNE.DIRATK.GRD.SUPATK
   * DIRECTION OF ATTACK / SUPPORTING ATTACK
   */
  'G*G*OLKGS-': attackArrow,

  /**
   * TACGRP.TSK.EXF
   * EXFILTRATE
   */
  'G*T*VLE---': attackArrow,

  /**
   * TACGRP.TSK.INF
   * INFILTRATE
   */
  'G*T*VLI---': attackArrow
}

/**
 * DIRECTION OF ATTACK / AVIATION
 * TACGRP.C2GM.OFF.LNE.DIRATK.AVN
 */
geometries['G*G*OLKA--'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = R.last(TS.segments(line))
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.25, 0], [0.4, 0], [0.25, -0.04], [0.4, 0.04], [0.4, -0.04], [0.25, 0.04],
    [0.95, -0.05], [1, 0], [0.95, 0.05]
  ])

  if (coords.length > 2) {
    return styles.solidLine(TS.collect([
      TS.lineString(R.dropLast(1, coords)),
      TS.lineString([coords[coords.length - 2], xs[0]]),
      TS.lineString([xs[1], coords[coords.length - 1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ]))
  } else {
    return styles.solidLine(TS.collect([
      TS.lineString([coords[coords.length - 2], xs[0]]),
      TS.lineString([xs[1], coords[coords.length - 1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ]))
  }
}

/**
 * TACGRP.C2GM.OFF.LNE.DIRATK.GRD.MANATK
 * DIRECTION OF ATTACK / MAIN ATTACK
 */
geometries['G*G*OLKGM-'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = R.last(TS.segments(line))
  const angle = segment.angle()
  const length = segment.getLength()

  const arrow = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.86, -0.1], [1, 0], [0.86, 0.1], [0.86, 0.07], [0.965, 0], [0.86, -0.07]
  ])

  return styles.solidLine(TS.collect([
    TS.lineString(coords),
    TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], arrow))
  ]))
}

/**
 * TACGRP.C2GM.DCPN.DAFF
 * DIRECTION OF ATTACK FOR FEINT
 */
geometries['G*G*PF----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = R.last(TS.segments(line))
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.8, 0.2], [1, 0], [0.8, -0.2],
    [0.8, -0.136], [0.94, 0], [0.8, 0.136]
  ])

  if (coords.length > 2) {
    return [
      styles.solidLine(TS.collect([
        TS.lineString(R.dropLast(1, coords)),
        TS.lineString([coords[coords.length - 2], xs[4]]),
        TS.lineString(R.props([3, 4, 5], xs))
      ])),
      styles.dashedLine(TS.lineString(R.props([0, 1, 2], xs)), { lineDash: [8, 8] })
    ]
  } else {
    return [
      styles.solidLine(TS.collect([
        TS.lineString([coords[coords.length - 2], xs[4]]),
        TS.lineString(R.props([3, 4, 5], xs))
      ])),
      styles.dashedLine(TS.lineString(R.props([0, 1, 2], xs)), { lineDash: [8, 8] })
    ]
  }
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.FRY
 * CROSSING SITE / FERRY
 */
geometries['G*M*BCF---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const length = segment.getLength()
  const angle = segment.angle()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0], [0.08, -0.06], [0.08, 0], [0.08, 0.06],
    [1, 0], [0.92, -0.06], [0.92, 0], [0.92, 0.06]
  ])

  return [
    styles.solidLine(TS.lineString([xs[2], xs[6]])),
    styles.filledPolygon(TS.polygon(R.props([0, 1, 2, 3, 0], xs))),
    styles.filledPolygon(TS.polygon(R.props([4, 5, 6, 7, 4], xs)))
  ]
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.LANE
 * CROSSING SITE / LANE
 */
geometries['G*M*BCL---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [-0.09, -0.08], [0, 0], [-0.09, 0.08],
    [1.09, -0.08], [1, 0], [1.09, 0.08]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1, 2], xs)),
    TS.lineString(R.props([3, 4, 5], xs))
  ]))
}

/**
 * TACGRP.MOBSU.OBSTBP.CSGSTE.RFT
 * CROSSING SITE / RAFT
 */
geometries['G*M*BCR---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [-0.09, -0.2], [0, 0], [-0.09, 0.2],
    [1.09, -0.2], [1, 0], [1.09, 0.2]
  ])

  return styles.solidLine(TS.collect([
    line,
    TS.lineString(R.props([0, 1, 2], xs)),
    TS.lineString(R.props([3, 4, 5], xs))
  ]))
}

/**
 * TACGRP.MOBSU.OBST.OBSEFT.FIX
 * OBSTACLE EFFECT / FIX
 */
geometries['G*M*OEF---'] = ({ line, styles, resolution }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [1, 0], [0.9, -0.04], [0.9, 0], [0.9, 0.04], [1, 0]
  ])

  const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
    ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
  ]

  const n = Math.floor(length / (resolution * 10))
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  return [
    styles.solidLine(TS.collect([
      TS.lineString([coords[0], p0]),
      TS.lineString([p0, ...x, p1]),
      TS.lineString([p1, xs[2]])
    ])),
    styles.filledPolygon(TS.polygon(xs))
  ]
}

/**
 * TACGRP.TSK.FIX
 * TASKS / FIX
 */
geometries['G*T*F-----'] = ({ line, styles, resolution }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.95, -0.04], [1, 0], [0.95, 0.04]
  ])

  const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
    ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
  ]

  const n = Math.floor(length / (resolution * 10))
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  return styles.solidLine(TS.collect([
    TS.lineString([coords[0], p0]),
    TS.lineString([p0, ...x, p1]),
    TS.lineString([p1, coords[1]]),
    TS.lineString(xs)
  ]))
}

/**
 * TACGRP.MOBSU.SU.FEWS
 * FOXHOLE, EMPLACEMENT OR WEAPON SITE
 */
geometries['G*M*SW----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.18], [0, 0], [1, 0], [1, 0.18]
  ])

  return styles.solidLine(TS.lineString(R.props([0, 1, 2, 3], xs)))
}

/**
 * TACGRP.OTH.HAZ.NVGL
 * HAZARD / NAVIGATIONAL
 */
geometries['G*O*HN----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.18, -0.2], [0, 0], [1, 0], [0.82, 0.2]
  ])

  return styles.solidLine(TS.lineString(R.props([0, 1, 2, 3], xs)))
}

/**
 * TACGRP.TSK.FLWASS
 * TASKS / FOLLOW AND ASSUME
 */
geometries['G*T*A-----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.08], [0, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08],
    [0.8, 0.2], [1, 0], [0.8, -0.2], [0.8, -0.16], [0.96, 0], [0.8, 0.16],
    [0, 0.2]
  ])

  return styles.solidLine(TS.collect([
    TS.lineString(R.props([3, 9], xs)),
    TS.polygon(R.props([0, 1, 2, 3, 4, 0], xs)),
    TS.polygon(R.props([5, 6, 7, 8, 9, 10, 5], xs))
  ]))
}

/**
 * TACGRP.TSK.FLWASS.FLWSUP
 * TASKS / FOLLOW AND SUPPORT
 */
geometries['G*T*AS----'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, 0], [-0.08, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08], [-0.08, 0.08],
    [0.82, -0.08], [1, 0], [0.82, 0.08], [0.82, 0]
  ])

  return [
    styles.solidLine(TS.collect([
      TS.lineString(R.props([3, 9], xs)),
      TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
    ])),
    styles.filledPolygon(TS.polygon(R.props([6, 7, 8, 6], xs)))
  ]
}

/**
 * TACGRP.CSS.LNE.CNY.HCNY
 * HALTED CONVOY
 */
geometries['G*S*LCH---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, -0.1], [1, -0.1], [1, 0.1], [0, 0.1],
    [1, 0], [1.16, -0.15], [1.16, 0.15]
  ])

  return styles.solidLine(TS.collect([
    TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
    TS.polygon(R.props([4, 5, 6, 4], xs))
  ]))
}

/**
 * TACGRP.CSS.LNE.CNY.MCNY
 * MOVING CONVOY
 */
geometries['G*S*LCM---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, -0.1], [0.8, -0.1], [0.8, -0.16], [1, 0], [0.8, 0.16], [0.8, 0.1], [0, 0.1]
  ])

  return styles.solidLine(TS.lineString(R.props([0, 1, 2, 3, 4, 5, 6, 0], xs)))
}

const numberProperty = feature => (key, value) => {
  const raw = feature.get(key)
  return typeof raw === 'number'
    ? raw
    : value
}

geometries['G*G*GLB---'] = options => {
  const { feature, resolution, styles, line: geometry, write } = options
  const echelonOffset = numberProperty(feature)('echelonOffset', 0.5)
  const modifier = feature.get('sidc')[11]
  const src = 'data:image/svg+xml;utf8,' + echelons[modifier]
  const image = new style.Icon({ src, scale: 0.4 })
  const size = image.getSize()
  const width = size && size[0] && size[0] * resolution / 2

  const line = TS.lengthIndexedLine(geometry)
  const A = line.getStartIndex()
  const D = line.getEndIndex()
  const offset = (D - A) * echelonOffset
  const B = offset - width / 2
  const C = offset + width / 2

  const icon = () => {
    if (width > D - A) return [] // don't show icon
    const segment = TS.segment(
      line.extractPoint(offset - resolution),
      line.extractPoint(offset + resolution)
    )

    const iconAnchor = TS.point(segment.pointAlong(0.5))
    image.setRotation(2 * Math.PI - segment.angle())
    return new style.Style({ image, geometry: write(iconAnchor) })
  }

  return [
    icon(),
    styles.solidLine(TS.union([
      line.extractLine(A, B),
      line.extractLine(C, D)
    ]))
  ]
}

/**
 * TACGRP.C2GM.GNL.LNE.LOC
 * LINE OF CONTACT
 */
geometries['G*G*GLC---'] = options => {
  const { resolution, styles, line: geometry } = options
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * 20
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2

  const point = index => line.extractPoint(index)
  const segmentsA = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α + Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  const segmentsB = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α - Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α + Math.PI, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  return [
    styles.solidLine(TS.collect(segmentsA)),
    styles.solidLine(TS.collect(segmentsB))
  ]
}

/**
 * TACGRP.C2GM.GNL.LNE.FLOT
 * FORWARD LINE OF OWN TROOPS (FLOT)
 */
geometries['G*G*GLF---'] = options => {
  const { resolution, styles, line: geometry } = options
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * 20
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2

  const point = index => line.extractPoint(index)
  const segments = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α + Math.PI / 2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α, Math.PI, 16))
    .map(coords => TS.lineString(coords))

  return [
    styles.solidLine(TS.collect(segments))
  ]
}

const ditchTeeth = (geometry, resolution) => {
  const segments = TS.segments(geometry)
  const toothLength = resolution * 10

  return segments.flatMap(segment => {
    const segmentLength = segment.getLength()
    const n = Math.floor(segmentLength / toothLength)
    const offset = (segmentLength - n * toothLength) / 2
    const line = TS.lengthIndexedLine(TS.lineString(segment))
    const angle = segment.angle()

    return R.range(0, n).map(i => {
      const a = line.extractPoint(offset + i * toothLength)
      const b = line.extractPoint(offset + (i + 1) * toothLength)
      const c = TS.projectCoordinate(a)([angle + Math.PI / 3, toothLength])
      return TS.polygon([a, b, c, a])
    })
  })
}

/**
 * TACGRP.MOBSU.OBST.ATO.ATD.ATDUC
 * ANTITANK DITCH / UNDER CONSTRUCTION
 */
geometries['G*M*OADU--'] = options => {
  const { resolution, styles, line: geometry } = options
  const teeth = ditchTeeth(geometry, resolution)

  return [
    styles.solidLine(geometry),
    ...teeth.map(polygon => styles.solidLine(polygon))
  ]
}

/**
 * TACGRP.MOBSU.OBST.ATO.ATD.ATDUC
 * ANTITANK DITCH / COMPLETE
 */
geometries['G*M*OADC--'] = options => {
  const { resolution, styles, line: geometry } = options
  const teeth = ditchTeeth(geometry, resolution)

  return [
    styles.solidLine(geometry),
    ...teeth.map(polygon => styles.filledPolygon(polygon))
  ]
}

// ABATIS
geometries['G*M*OS----'] = ({ styles, resolution, line: lineString }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const firstSegment = line.extractLine(0, width)
  const coords = TS.coordinates(firstSegment)
  const angle = TS.segment(TS.coordinates(firstSegment)).angle()
  const lastSegment = line.extractLine(width, line.getEndIndex())
  const a = R.head(coords)
  const b = TS.projectCoordinate(a)([angle + Math.PI / 3, width])
  const c = R.last(coords)
  const geometry = TS.lineString([a, b, c, ...TS.coordinates(lastSegment)])
  return styles.solidLine(geometry)
}

// MINE CLUSTER
geometries['G*M*OMC---'] = ({ styles, resolution, line: lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const center = segment.midPoint()
  const radius = segment.getLength() / 2

  const points = R.range(0, 17)
    .map(i => Math.PI / 16 * i + angle)
    .map(angle => TS.projectCoordinate(center)([angle, radius]))

  const geometry = TS.collect([lineString, TS.lineString(points)])
  return styles.dashedLine(geometry, { lineDash: [20, 14] })
}

// ANTITANK DITCH REINFORCED WITH ANTITANK MINES
geometries['G*M*OAR---'] = ({ styles, resolution, line: lineString }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  const segmentPoints = R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [a, a + width / 2, b - width / 2, b])

  const geometry = TS.collect(segmentPoints
    .map(([a, b, c, d]) => [
      line.extractPoint(a),
      TS.coordinates(line.extractLine(b, c)),
      line.extractPoint(d)
    ])
    .map(([a, coords, d]) => [a, coords, d, TS.segment([a, d]).angle()])
    .map(([a, coords, d, angle]) => [
      a,
      coords,
      d,
      TS.projectCoordinate(R.head(coords))([angle - Math.PI / 3, width]),
      TS.projectCoordinate(d)([angle - Math.PI / 2, width / 2])
    ])
    .flatMap(([a, coords, d, x, c]) => {
      return [
        TS.polygon([x, R.head(coords), R.last(coords), x]),
        TS.lineString([a, R.head(coords)]),
        TS.lineString([R.last(coords), d]),
        TS.pointBuffer(TS.point(c))(width / 3.5)
      ]
    })
  )

  return styles.solidLine(geometry, { fillDefault: true })
}

// OBSTACLES / GENERAL / LINE
geometries['G*M*OGL---'] = ({ styles, resolution, line: lineString }) => {
  return styles.solidLine(TS.collect(teeth(1)(lineString, resolution)))
}

// ANTITANK WALL
geometries['G*M*OAW---'] = ({ styles, resolution, line: lineString }) => {
  return styles.solidLine(TS.collect(teeth(-1)(lineString, resolution)))
}


// FORTIFIED LINE
geometries['G*M*SL----'] = ({ styles, resolution, line: lineString }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(lineString)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  const teeth = R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [
      line.extractPoint(a),
      line.extractPoint(a + width / 2),
      line.extractPoint(b - width / 2),
      line.extractPoint(b)
    ])
    .map(([a, b, c, d]) => [a, b, c, d, TS.segment([b, c]).angle()])
    .map(([a, b, c, d, angle]) => [
      a, b, c, d,
      TS.projectCoordinate(b)([angle + Math.PI / 2, width]),
      TS.projectCoordinate(c)([angle + Math.PI / 2, width])
    ])
    .map(([a, b, c, d, x, y]) => TS.lineString([a, b, x, y, c, d]))

  return styles.solidLine(TS.collect(teeth))
}

geometries['G*G*ALC---'] = corridor('AC') // AIR CORRIDOR
geometries['G*G*ALM---'] = corridor('MRR') // MINIMUM RISK ROUTE (MRR)
geometries['G*G*ALS---'] = corridor('SAAFR') // STANDARD-USE ARMY AIRCRAFT FLIGHT ROUTE (SAAFR)
geometries['G*G*ALU---'] = corridor('UA') // UNMANNED AIRCRAFT (UA) ROUTE
geometries['G*G*ALL---'] = corridor('LLTR') // LOW LEVEL TRANSIT ROUTE (LLTR)


// UNSPECIFIED FENCE
geometries['G*M*OWU---'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle()]
  }

  return R.range(1, n)
    .map(pointOptions)
    .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
    .map(fences.fenceX)
}

// SINGLE FENCE
geometries['G*M*OWS---'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 32)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle()]
  }

  return [
    fences.fenceLine(write(lineString)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceX)
  ]
}

// DOUBLE FENCE
geometries['G*M*OWD---'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 50)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle()]
  }

  return [
    fences.fenceLine(write(lineString)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle]) => [write(TS.point(tsPoint)), angle])
      .map(fences.fenceDoubleX)
  ]
}

// LOW WIRE FENCE
geometries['G*M*OWL---'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle(), [0, -8]]
  }

  return [
    fences.fenceLine(write(lineString)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceX)
  ]
}

// HIGH WIRE FENCE
geometries['G*M*OWH---'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const width = resolution * 15
  const segments = TS.segments(lineString)
  const startSegment = R.head(segments)
  const endSegment = R.last(segments)

  const startPoint = TS.projectCoordinate(
    TS.coordinate(TS.startPoint(lineString))
  )([startSegment.angle() + Math.PI / 2, width / 2])

  const endPoint = TS.projectCoordinate(
    TS.coordinate(TS.endPoint(lineString))
  )([endSegment.angle() + Math.PI / 2, width / 2])

  const buffer = TS.singleSidedLineBuffer(lineString)(width)
  const geometry = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(TS.point(startPoint))(width / 2),
    TS.pointBuffer(TS.point(endPoint))(width / 2)
  ])

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle(), [0, -8]]
  }

  return [
    fences.fenceLine(write(geometry)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceX)
  ]
}

// DOUBLE APRON FENCE
geometries['G*M*OWA---'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle()]
  }

  return [
    fences.fenceLine(write(lineString)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceX)
  ]
}

// SINGLE CONCERTINA
geometries['G*M*OWCS--'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle(), [0, -8]]
  }

  return [
    fences.fenceLine(write(lineString)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceO)
  ]
}

// DOUBLE STRAND CONCERTINA
geometries['G*M*OWCD--'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const width = resolution * 7
  const segments = TS.segments(lineString)
  const startSegment = R.head(segments)
  const endSegment = R.last(segments)

  const startPoint = TS.projectCoordinate(
    TS.coordinate(TS.startPoint(lineString))
  )([startSegment.angle() + Math.PI / 2, width / 2])

  const endPoint = TS.projectCoordinate(
    TS.coordinate(TS.endPoint(lineString))
  )([endSegment.angle() + Math.PI / 2, width / 2])

  const buffer = TS.singleSidedLineBuffer(lineString)(width)
  const geometry = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(TS.point(startPoint))(width / 2),
    TS.pointBuffer(TS.point(endPoint))(width / 2)
  ])

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle(), [0, -8]]
  }

  return [
    fences.fenceLine(write(geometry)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceO)
  ]
}

// TRIPLE STRAND CONCERTINA
geometries['G*M*OWCT--'] = ({ resolution, line: lineString, write }) => {
  const lil = TS.lengthIndexedLine(lineString)
  const length = lil.getEndIndex()
  const n = length / (resolution * 16)
  const delta = Math.floor(length / n)
  const offset = (length - delta * n) / 2

  const width = resolution * 15
  const segments = TS.segments(lineString)
  const startSegment = R.head(segments)
  const endSegment = R.last(segments)

  const startPoint = TS.projectCoordinate(
    TS.coordinate(TS.startPoint(lineString))
  )([startSegment.angle() + Math.PI / 2, width / 2])

  const endPoint = TS.projectCoordinate(
    TS.coordinate(TS.endPoint(lineString))
  )([endSegment.angle() + Math.PI / 2, width / 2])

  const buffer = TS.singleSidedLineBuffer(lineString)(width)
  const geometry = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(TS.point(startPoint))(width / 2),
    TS.pointBuffer(TS.point(endPoint))(width / 2)
  ])

  const pointOptions = i => {
    const A = lil.extractPoint(offset + i * delta - offset)
    const B = lil.extractPoint(offset + i * delta + offset)
    const segment = TS.segment([A, B])
    return [lil.extractPoint(offset + i * delta), segment.angle(), [0, -8]]
  }

  return [
    fences.fenceLine(write(geometry)),
    ...R.range(1, n)
      .map(pointOptions)
      .map(([tsPoint, angle, displacement]) => [write(TS.point(tsPoint)), angle, displacement])
      .map(fences.fenceO)
  ]
}

/**
 * TACGRP.TSK.REC
 * TASKS / RECONNAISSANCE (AUT ONLY)
 */
geometries['G*T*VLR---'] = ({ line, styles, resolution }) => {

  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.95, -0.04], [1, 0], [0.95, 0.04]
  ])

  const distance = resolution * 4
  const [p0, p1] = [
    TS.projectCoordinates(distance, angle, segment.pointAlong(0.55))([[0, -2]]),
    TS.projectCoordinates(distance, angle, segment.pointAlong(0.45))([[0, +2]])
  ].flat()

  return styles.solidLine((TS.collect([
    TS.lineString([coords[0], p0]),
    TS.lineString([p0, p1]),
    TS.lineString([p1, coords[1]]),
    TS.lineString(xs)
  ])))
}

/* TACGRP.TSK.EXP
 * TASKS / EXPLOIT
*/
geometries['G*T*VAE---'] = ({ styles, line }) => {
  const coords = TS.coordinates(line)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, -0.14], [0.2, 0], [0, 0.14],
    [0.8, -0.08], [1, 0], [0.8, 0.08]
  ])

  return [
    styles.solidLine(TS.collect([
      TS.lineString(R.props([1, 4], xs)),
      TS.lineString(R.props([3, 4, 5], xs))
    ])),
    styles.dashedLine(TS.lineString(R.props([0, 1, 2], xs)))
  ]
}
