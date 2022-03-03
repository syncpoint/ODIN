import { Jexl } from 'jexl'
import * as R from 'ramda'
import { parameterized } from '../../components/SIDC'
import { format } from '../format'
import { styleFactory, defaultStyle, biggerFont } from './default-style'
import * as TS from '../ts'
import { hatchFill } from './fill'

const jexl = new Jexl()
const quads = 64
const deg2rad = Math.PI / 180
const geometries = {}

const HALO = { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }
const C = (text, options) => [{ id: 'style:default-text', 'text-field': text, 'text-clipping': 'none', ...options }]
const B = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 5, 'text-clipping': 'line' }]
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]

const circleLabels = {}
circleLabels['G*F*ATC---'] = C(ALL_LINES())
circleLabels['G*F*ACSC--'] = C(ALL_LINES('FSA'))
circleLabels['G*F*ACAC--'] = C(ALL_LINES('ACA'))
circleLabels['G*F*ACFC--'] = C(ALL_LINES('FFA'))
circleLabels['G*F*ACNC--'] = C(ALL_LINES('NFA'), HALO)
circleLabels['G*F*ACRC--'] = C(ALL_LINES('RFA'))
circleLabels['G*F*ACPC--'] = B('"PAA"')
circleLabels['G*F*ACEC--'] = C(ALL_LINES('SENSOR ZONE'))
circleLabels['G*F*ACDC--'] = C(ALL_LINES('DA'))
circleLabels['G*F*ACZC--'] = C(ALL_LINES('ZOR'))
circleLabels['G*F*ACBC--'] = C(ALL_LINES('TBA'))
circleLabels['G*F*ACVC--'] = C(ALL_LINES('TVAR'))
circleLabels['G*F*AKBC--'] = C(ALL_LINES('BKB'), HALO)
circleLabels['G*F*AKPC--'] = C(ALL_LINES('PKB'), HALO)


const arcText = styles => (anchor, angle, text) => styles.text(anchor, {
  text,
  font: biggerFont(),
  flip: true,
  textAlign: () => 'center',
  rotation: Math.PI - angle + 330 / 2 * deg2rad
})

const lazy = function (fn) {
  let evaluated = false
  let value

  return function () {
    if (evaluated) return value
    value = fn.apply(this, arguments)
    evaluated = true
    return value
  }
}

const labelGeometry = geometry => {
  const ring = geometry.getExteriorRing()
  const envelope = ring.getEnvelopeInternal()
  const centroid = TS.centroid(ring)
  const [minX, maxX] = [envelope.getMinX(), envelope.getMaxX()]
  const [minY, maxY] = [envelope.getMinY(), envelope.getMaxY()]

  const xIntersection = lazy(() => {
    const coord = x => TS.coordinate(x, centroid.y)
    const axis = TS.lineString([minX, maxX].map(coord))
    return geometry.intersection(axis).getCoordinates()
  })

  const yIntersection = lazy(() => {
    const coord = y => TS.coordinate(centroid.x, y)
    const axis = TS.lineString([minY, maxY].map(coord))
    return geometry.intersection(axis).getCoordinates()
  })

  const fraction = anchor => {
    const lengthIndexedLine = TS.lengthIndexedLine(ring)
    const length = lengthIndexedLine.getEndIndex()
    const coord = lengthIndexedLine.extractPoint(anchor * length)
    return TS.point(coord)
  }

  const positions = {
    center: lazy(() => TS.point(centroid)),
    bottom: lazy(() => TS.point(yIntersection()[0])),
    top: lazy(() => TS.point(yIntersection()[1])),
    left: lazy(() => TS.point(xIntersection()[0])),
    right: lazy(() => TS.point(xIntersection()[1]))
  }

  return label => {
    const anchor = label['text-anchor']
    return Number.isFinite(anchor)
      ? fraction(anchor)
      : positions[anchor || 'center']()
  }
}

const circle = fill => ({ styles, points, resolution, feature, sidc }) => {
  const [C, A] = TS.coordinates(points)
  const segment = TS.segment([C, A])
  const geometry = TS.pointBuffer(TS.point(C))(segment.getLength())
  const options = fill ? { fill: fill({ styles }) } : {}

  const properties = feature.getProperties()
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, properties)

  const texts = (() => {
    if (!styles.showLabels()) return []
    return (circleLabels[sidc] || []).map(label => {
      const inGeometry = labelGeometry(geometry)(label)
      return styles.text(inGeometry, {
        text: evalSync(label['text-field'])
      })
    })
  })()

  return [
    styles.solidLine(geometry, options),
    ...texts
  ]
}

geometries['G*F*ATC---'] = circle() // CIRCULAR TARGET
geometries['G*F*ACSC--'] = circle() // FIRE SUPPORT AREA (FSA)
geometries['G*F*ACAC--'] = circle() // AIRSPACE COORDINATION AREA (ACA)
geometries['G*F*ACFC--'] = circle() // FREE FIRE AREA (FFA)
geometries['G*F*ACNC--'] = circle(hatchFill) // NO-FIRE AREA (NFA)
geometries['G*F*ACRC--'] = circle() // RESTRICTIVE FIRE AREA (RFA)
geometries['G*F*ACPC--'] = circle() // POSITION AREA FOR ARTILLERY (PAA)
geometries['G*F*ACEC--'] = circle() // SENSOR ZONE
geometries['G*F*ACDC--'] = circle() // DEAD SPACE AREA (DA)
geometries['G*F*ACZC--'] = circle() // ZONE OF RESPONSIBILITY (ZOR)
geometries['G*F*ACBC--'] = circle() // TARGET BUILD-UP AREA (TBA)
geometries['G*F*ACVC--'] = circle() // TARGET VALUE AREA (TVAR)
geometries['G*F*AKBC--'] = circle(hatchFill) // KILL BOX/BLUE
geometries['G*F*AKPC--'] = circle(hatchFill) // KILL BOX/PURPLE


/**
 * TACGRP.TSK.ISL
 * TASKS / ISOLATE
 */
geometries['G*T*E-----'] = ({ styles, points, resolution }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const teeth = R.range(1, arcs[0].length)
    .filter(i => i % 5 === 0)
    .map(i => [arcs[0][i - 1], arcs[1][i], arcs[0][i + 1]])
    .map(coords => TS.lineString(coords))

  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arcs[0]))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arcs[0][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...teeth, TS.lineString(arcs[0])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs)])),
    arcText(styles)(textAnchor, angle, 'I')
  ]
}

/**
 * TACGRP.TSK.OCC
 * TASKS / OCCUPY
 */
geometries['G*T*O-----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)

  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2]
  ])

  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([
      geometry,
      TS.lineString([xs[0], xs[1]]),
      TS.lineString([xs[2], xs[3]])
    ])),
    arcText(styles)(textAnchor, angle, 'O')
  ]
}

/**
 * TACGRP.TSK.RTN
 * TASKS / RETAIN
 */
geometries['G*T*Q-----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const spikes = R.range(1, arcs[0].length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [arcs[0][i], arcs[1][i]])
    .map(coords => TS.lineString(coords))

  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arcs[1]))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arcs[1][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...spikes, TS.lineString(arcs[1])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs)])),
    arcText(styles)(textAnchor, angle, 'R')
  ]
}

/**
 * TACGRP.TSK.SCE
 * TASKS / SECURE
 */
geometries['G*T*S-----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs)])),
    arcText(styles)(textAnchor, angle, 'S')
  ]
}

const fanLike = label => options => {
  const { resolution, styles, points } = options
  const [C, A, B] = TS.coordinates(points)
  const segmentA = TS.segment([C, A])
  const segmentB = TS.segment([C, B])
  const angleA = segmentA.angle()
  const angleB = segmentB.angle()

  const distance = resolution * 4
  const [A1, A2, B1, B2] = [
    TS.projectCoordinates(distance, angleA, segmentA.pointAlong(0.55))([[0, -2]]),
    TS.projectCoordinates(distance, angleA, segmentA.pointAlong(0.45))([[0, +2]]),
    TS.projectCoordinates(distance, angleB, segmentB.pointAlong(0.55))([[0, +2]]),
    TS.projectCoordinates(distance, angleB, segmentB.pointAlong(0.45))([[0, -2]])
  ].flat()

  const arrowOffsets = [[-0.08, -0.08], [0, 0], [-0.08, 0.08]]
  const arrows = [
    TS.projectCoordinates(segmentA.getLength(), angleA, A)(arrowOffsets),
    TS.projectCoordinates(segmentB.getLength(), angleB, B)(arrowOffsets)
  ]

  const text = segment => styles.text(TS.point(segment.pointAlong(0.3)), {
    rotation: Math.PI - segment.angle(),
    text: label,
    flip: true
  })

  return [
    styles.solidLine(TS.collect([
      TS.lineString([C, A1, A2, A]),
      TS.lineString([C, B1, B2, B]),
      ...arrows.map(coords => TS.lineString(coords))
    ])),
    ...(label ? [TS.segment([C, A1]), TS.segment([C, B1])].map(text) : [])
  ]
}

/**
 * TACGRP.TSK.SEC.SCN
 * TASKS / SCREEN
 */
geometries['G*T*US----'] = fanLike('S')

/**
 * TACGRP.TSK.SEC.GUD
 * TASKS / GUARD
 */
geometries['G*T*UG----'] = fanLike('G')

/**
 * TACGRP.TSK.SEC.COV
 * TASKS / COVER
 */
geometries['G*T*UC----'] = fanLike('C')

/**
 * TACGRP.C2GM.GNL.ARS.SRHARA
 * SEARCH AREA/RECONNAISSANCE AREA
 */
geometries['G*G*GAS---'] = ({ resolution, styles, points }) => {
  const [C, A, B] = TS.coordinates(points)
  const segmentA = TS.segment([C, A])
  const segmentB = TS.segment([C, B])
  const angleA = segmentA.angle()
  const angleB = segmentB.angle()

  const distance = resolution * 4
  const [A1, A2, B1, B2] = [
    TS.projectCoordinates(distance, angleA, segmentA.pointAlong(0.55))([[0, -2]]),
    TS.projectCoordinates(distance, angleA, segmentA.pointAlong(0.45))([[0, +2]]),
    TS.projectCoordinates(distance, angleB, segmentB.pointAlong(0.55))([[0, +2]]),
    TS.projectCoordinates(distance, angleB, segmentB.pointAlong(0.45))([[0, -2]])
  ].flat()

  const arrowOffsets = [[-0.06, -0.03], [0, 0], [-0.06, 0.03], [-0.06, 0], [-0.06, -0.03]]
  const arrows = [
    TS.projectCoordinates(segmentA.getLength(), angleA, A)(arrowOffsets),
    TS.projectCoordinates(segmentB.getLength(), angleB, B)(arrowOffsets)
  ]

  return [
    styles.solidLine(TS.collect([
      TS.lineString([C, A1, A2, arrows[0][3]]),
      TS.lineString([C, B1, B2, arrows[1][3]])
    ])),
    styles.filledPolygon(TS.union(arrows.map(TS.polygon)))
  ]
}

/**
 * TACGRP.MOBSU.CBRN.MSDZ
 * MINIMUM SAFE DISTANCE ZONES
 */
geometries['G*M*NM----'] = ({ feature, styles, points }) => {
  const [C, A] = TS.coordinates(points)
  const segment = TS.segment([C, A])

  const label = feature.get('t')
    ? styles.text(TS.point(A), { text: feature.get('t'), flip: false })
    : []

  return [
    styles.solidLine(TS.pointBuffer(TS.point(C))(segment.getLength())),
    label
  ]
}

/**
 * TACGRP.TSK.SZE
 * TASKS / SEIZE
 */
geometries['G*T*Z-----'] = ({ styles, points, resolution }) => {
  const [C, O, S] = TS.coordinates(points)
  const segmentO = TS.segment([C, O])
  const segmentS = TS.segment([C, S])
  const radius = segmentO.getLength() - segmentS.getLength()

  const [X] = TS.projectCoordinates(radius, segmentO.angle(), O)([[-1, -1]])
  const arcCoords = TS.arc(C, segmentS.getLength(), segmentO.angle(), Math.PI / 2, 32)
  const textAnchor = TS.point(arcCoords[Math.floor(arcCoords.length / 2)])

  const arc = TS.difference([
    TS.lineString(arcCoords),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  const xs = TS.projectCoordinates(segmentS.getLength(), segmentS.angle() + Math.PI / 2, R.last(arcCoords))([
    [0.1, -0.1], [0, 0], [0.1, 0.1]
  ])

  return [
    styles.solidLine(TS.collect([
      arc,
      TS.pointBuffer(TS.point(X))(radius),
      TS.lineString(xs)
    ])),
    styles.wireFrame(TS.union([
      TS.lineString(segmentO),
      TS.lineString(segmentS)
    ])),
    styles.text(textAnchor, {
      text: 'S',
      flip: false
    })
  ]
}

/**
 * TACGRP.MOBSU.OBST.OBSEFT.TUR
 * OBSTACLE EFFECT / TURN
 */
geometries['G*M*OET---'] = ({ styles, points }) => {
  const [C, O] = TS.coordinates(points)
  const segmentO = TS.segment([C, O])

  const arcCoords = TS.arc(C, segmentO.getLength(), segmentO.angle(), Math.PI / 2, 32)

  const arrow = TS.polygon(TS.projectCoordinates(segmentO.getLength(), segmentO.angle(), R.last(arcCoords))([
    [0.2, -0.1], [0, 0], [0.2, 0.1], [0.2, -0.1]
  ]))

  const arc = TS.difference([TS.lineString(arcCoords), arrow])

  return [
    styles.solidLine(
      TS.union([arc, arrow]),
      { fill: styles.fill(options => options.primaryColor) }
    ),
    styles.wireFrame(TS.lineString(segmentO))
  ]
}

/**
 * TACGRP.TSK.TRN
 * TASKS / TURN
 */
geometries['G*T*VAT---'] = ({ styles, points, resolution }) => {
  const [C, O] = TS.coordinates(points)
  const segmentO = TS.segment([C, O])

  const arcCoords = TS.arc(C, segmentO.getLength(), segmentO.angle(), Math.PI / 2, 32)
  const textAnchor = TS.point(arcCoords[Math.floor(arcCoords.length / 2)])

  const arrow = TS.polygon(TS.projectCoordinates(segmentO.getLength(), segmentO.angle(), R.last(arcCoords))([
    [0.2, -0.1], [0, 0], [0.2, 0.1], [0.2, -0.1]
  ]))

  const arc = TS.difference([TS.lineString(arcCoords), arrow])

  return [
    styles.solidLine(
      TS.union([arc, arrow]),
      { fill: styles.fill(options => options.primaryColor) }
    ),
    styles.wireFrame(TS.lineString(segmentO)),
    styles.text(textAnchor, {
      text: 'T',
      flip: false
    })
  ]
}

/* TACGRP.TSK.DNY
 * TASKS / DENY
 */
geometries['G*T*SY----'] = ({ styles, points, resolution }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const teeth = R.range(1, arcs[0].length)
    .filter(i => i % 5 === 0)
    .map(i => [arcs[1][i - 1], arcs[0][i], arcs[1][i + 1]])
    .map(coords => TS.lineString(coords))

  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arcs[1]))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arcs[1][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...teeth, TS.lineString(arcs[1])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs)])),
    arcText(styles)(textAnchor, angle, 'D')
  ]
}

export const multipointStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)
  const points = read(geometry)
  const factory = styleFactory({ mode, feature, resolution })(write)
  const options = { feature, resolution, points, styles: factory, sidc }

  return [
    geometries[sidc] ? geometries[sidc](options).flat() : defaultStyle(feature),
    ...factory.handles(points)
  ].flat()
}

/**
 * TACTICAL PLANNING TOOLS
 * HUB / BLACK
 */
geometries['P*-*DS----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const geometry = TS.difference([
    TS.lineString(arc)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs)]), { color: 'black', accent: 'white' })
  ]
}

/**
 * TACTICAL PLANNING TOOLS
 * HUB / PURPLE
 */
geometries['P*-*DV----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const geometry = TS.difference([
    TS.lineString(arc)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs)]), { color: 'purple', accent: 'white' })
  ]
}

/**
 * TACGRP.TSK.LOC
 * LOCATE
 */
geometries['G*T*SL----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])
  const xt = TS.projectCoordinates(radius, angle - delta - Math.PI / 2, R.last(arc))([
    [0.9, 0.13], [0.59, 0.13], [0.64, 0.43]
  ])
  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs), TS.lineString(xt)])),
    arcText(styles)(textAnchor, angle, 'LOC')
  ]
}

/**
 * TACGRP.TSK.CTR
 * CONTROL
 */
geometries['G*T*SC----'] = ({ points, resolution, styles }) => {
  const delta = 330 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])
  const xt = TS.projectCoordinates(radius, angle - delta - Math.PI / 2, R.last(arc))([
    [0.9, 0.13], [0.59, 0.13], [0.64, 0.43]
  ])
  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs), TS.lineString(xt)])),
    arcText(styles)(textAnchor, angle, 'C')
  ]
}

/**
 * TACGRP.TSK.CSU
 * TASKS / CONDUCT SURVEILLANCE (AUT ONLY)
 */
geometries['G*T*VAC---'] = ({ points, resolution, styles }) => {
  const delta = 180 * deg2rad
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + Math.PI / 2, R.last(arc))([
    [0.24, -0.22], [0, 0], [0.25, 0.17]
  ])
  const xt = TS.projectCoordinates(radius, angle - delta - Math.PI / 2, R.last(arc))([
    [-0.2, 1.78], [0.05, 2], [-0.2, 2.18]
  ])
  const xv = TS.projectCoordinates(radius, angle - delta - Math.PI / 2, R.last(arc))([
    [-0.80, 1.18], [-1.13, 1], [-0.80, 0.80]
  ])
  const geometry = TS.difference([
    TS.lineString(arc)
  ])

  return [
    styles.solidLine(TS.union([geometry, TS.lineString(xs), TS.lineString(xt)])),
    styles.filledPolygon(TS.polygon(R.props([0, 1, 2, 0], xv)))
  ]
}
