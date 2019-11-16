import * as R from 'ramda'
import { getTransform } from 'ol/proj'
import { K } from '../../shared/combinators'
import tacgrp from './tacgrp'
import { MultiLineString } from './predef'
import { Line } from './geodesy'

const toEPSG4326 = getTransform('EPSG:3857', 'EPSG:4326')
const toEPSG3857 = getTransform('EPSG:4326', 'EPSG:3857')
const toLonLat = p => toEPSG4326(p)
const fromLonLat = p => toEPSG3857(p)

// MAIN ATTACK (AXIS OF ADVANCE): TACGRP.C2GM.OFF.LNE.AXSADV.GRD.MANATK
const geometry = feature => {

  // MAIN ATTACK is a corridor with a line string as a center line
  // and a given width. Orientation of center line is defined to be
  // from end (last point) to beginning (first point) of the corridor with
  // an optional arrow at the beginning.
  // Corridor width is meassured at the corridor's 'body' and not at
  // the arrow.
  // For MAIN ATTACK, and others, the arrow width is twice the corridor width.

  // At this point feature geometry coordinates are projected to Web Mercator,
  // i.e. EPSG:3857. This projection cannot be used to meassure distances.
  // We create a suitable corridor representation in WGS84, which then can be
  // used to derive the actual feature geometry, most notably the arrow.

  // From here on EPSG:4326.

  /* eslint-disable camelcase */
  const { geometry_width } = feature.getProperties()
  const centerLine = feature.getGeometry().getCoordinates().reverse().map(toLonLat)
  const halfWidth = geometry_width / 2
  const segments = R.aperture(2, centerLine).map(Line.of)

  // To construct a buffer for center line, we translate each line
  // segment 90° to the left and right by half the corridor width in
  // respect to segment bearing.
  // Then we intersect translated segments on each side.
  // Finally, the last point of the last buffer segments are added
  // to the intersections on both sides. We leave out the first
  // segment for it contains the arrow.

  const buffer = segments.reduce((acc, segment) => K(acc)(acc => {
    acc[0].push(Line.translate(halfWidth, -90)(segment))
    acc[1].push(Line.translate(halfWidth, +90)(segment))
  }), [[], []])

  const last = xs => xs[xs.length - 1]
  const lastPoints = buffer.map(side => Line.points(last(side))[1])
  const [left, right] = buffer
    .map(Line.intersections)
    .map((side, index) => side.concat([lastPoints[index]]))

  // Now for the funny part: arrow construction.
  // The first two points (left/right) of first buffer segment
  // form a 'strut' `s`, which is then moved away from the arrow tip
  // as necessary for the respective arrow form. Each position allows
  // for additional points to be inserted to the path.
  // The positions are expressed as percentages respective to the
  // corridor width.

  // Struts explained:
  // For MAIN ATTACK arrow we need two struts `si[0]` @ 38% and `si[1]` @ 76%
  // of corridor width away from the arrow tip. `si[0]` is only used for a
  // center point. With `si[1]` four points are interpolated.
  //
  //      |----------------  2 * width  ------------------|
  //                  |--------  width  ------|
  //                 LEFT                   RIGHT
  //      |           |           |           |           |
  // s[i] +===========+===========+===========+===========+
  //      |           |           |           |           |
  //    -0.5         0.0         0.5         1.0         1.5  *  width
  //     p1D         p1B         p0          p1A         P1C

  const s = Line.of(buffer.map(side => Line.points(side[0])[0]))
  const si = [0.38, 0.76].map(f => Line.translate(f * geometry_width, -90)(s))
  const p0 = Line.point(0.5)(si[0])
  const p1A = Line.point(1)(si[1])
  const p1B = Line.point(0)(si[1])
  const p1C = Line.point(1.5)(si[1])
  const p1D = Line.point(-0.5)(si[1])

  const lineStrings = [
    [
      ...right.reverse(), p1A, p1C,
      centerLine[0],
      p1D, p1B, ...left
    ],
    [p1A, p0, p1B]
  ]

  // Back to EPSG:3857.

  return MultiLineString.of(lineStrings.map(ring => ring.map(fromLonLat)))
}

tacgrp['G-G-OLAGM-'] = { geometry }
