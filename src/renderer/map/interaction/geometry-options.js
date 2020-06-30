import * as geom from 'ol/geom'
import * as G from '../style/geodesy'

/**
 * Geometry-specific options for Modify interaction.
 *
 * Each options object provides two properties:
 *    frame :: (ol/Feature, string ~> string) -> Frame - construct initial frame from feature's geometry
 *    handledrag :: [(Frame, ol/MapBrowserEvent) -> Frame] - update frame from drag event
 *
 * A frame basically encapulates the geometry's state (immutable).
 * Beside other properties accessible by `handledrag`, a frame must provide
 * the following properties:
 *    points :: [geodesy/latlon-spherical] - current handle coordinates
 *    copy :: (string ~> any) -> Frame - copy constructor for updated frame
 *    geometry :: () -> ol/geom/Geometry - construct feature geometry from frame
 *
 * Note: Number and order of `points` and drag handlers must coincide,
 * i.e. coordinate of `points` define current handle position, `handledrag`
 * its handler when handle is dragged.
 */


/**
 * Corridor frame (currently only 2-point).
 */
const corridorFrame = current => {
  const { A, B, width, orientation } = current
  const bearing = G.initialBearing(([A, B]))
  const C = A.destinationPoint(width, bearing + (orientation * 90))

  return {
    points: [C, A, B],
    A,
    B,
    copy: properties => corridorFrame({ ...current, ...properties }),

    /**
     * LineString: center line
     * Point: distance to first center line point define corridor width
     */
    geometry: () => new geom.GeometryCollection([
      new geom.LineString([G.fromLatLon(A), G.fromLatLon(B)]),
      new geom.Point(G.fromLatLon(C))
    ])
  }
}


/**
 * 2-point fan area frame.
 */
const fanFrame2point = current => {
  const { C, angleA, rangeA, angleB } = current
  const normA = G.wrap360(Number.parseFloat(angleA))
  const A = C.destinationPoint(rangeA, normA)
  const points = [C, A]

  return {
    points,
    angleA: normA,
    rangeA,
    angleB,
    bearingLine: X => G.bearingLine([C, X]),
    copy: properties => fanFrame2point({ ...current, ...properties }),

    /**
     * Point: center point
     * Point: bearing line defines orientation/radius
     */
    geometry: () => new geom.MultiPoint(points.map(G.fromLatLon))
  }
}


/**
 * 3-point fan area frame.
 */
const fanFrame3point = current => {
  const { C, angleA, rangeA, angleB, rangeB } = current
  const normA = G.wrap360(Number.parseFloat(angleA))
  const normB = G.wrap360(Number.parseFloat(angleB))
  const A = C.destinationPoint(rangeA, normA)
  const B = C.destinationPoint(rangeB, normB)
  const points = [C, A, B]

  return {
    points,
    angleA: normA,
    rangeA,
    angleB: normB,
    rangeB,
    bearingLine: X => G.bearingLine([C, X]),
    copy: properties => fanFrame3point({ ...current, ...properties }),

    /**
     * Point: center point
     * Point: bearing line defines orientation/radius (1st leg)
     * Point: bearing line defines orientation/radius (2nd leg)
     */
    geometry: () => new geom.MultiPoint(points.map(G.fromLatLon))
  }
}


/**
 * Orbit area frame.
 */
const orbitFrame = current => {
  const { A, B, width, orientation } = current
  const bearing = G.initialBearing(([A, B]))
  const C = A.destinationPoint(width, bearing + (orientation * 90))

  return {
    points: [C, A, B],
    A,
    B,
    copy: properties => orbitFrame({ ...current, ...properties }),

    /**
     * LineString: 2-point center line
     * Point: distance to first center line point defines width
     */
    geometry: () => new geom.GeometryCollection([
      new geom.LineString([G.fromLatLon(A), G.fromLatLon(B)]),
      new geom.Point(G.fromLatLon(C))
    ])
  }
}

export const geometryOptions = []

geometryOptions.corridor = {

  /**
   * frame :: ol/Feature -> Frame
   */
  frame: feature => {
    const [line, point] = feature.getGeometry().getGeometries()
    const [A, B] = G.coordinates(line).map(G.toLatLon)
    const C = G.toLatLon(G.coordinates(point))
    const width = A.distanceTo(C)
    const orientation = Math.sign(C.crossTrackDistanceTo(A, B))
    return corridorFrame({ A, B, width, orientation })
  },

  handledrag: [
    (frame, { coordinate }) => {
      const C = G.toLatLon(coordinate)
      const orientation = Math.sign(C.crossTrackDistanceTo(frame.A, frame.B))
      return frame.copy({ width: frame.A.distanceTo(C), orientation })
    },
    (frame, { coordinate }) => frame.copy({ A: G.toLatLon(coordinate) }),
    (frame, { coordinate }) => frame.copy({ B: G.toLatLon(coordinate) })
  ]
}

geometryOptions.fan = {

  /**
   * frame :: ol/Feature -> Frame
   */
  frame: (feature, options) => {
    if (Number.parseInt(options.maxPoints) === 3) {
      const [C, A, B] = G.coordinates(feature).map(G.toLatLon)
      const [angleA, rangeA] = G.bearingLine([C, A])
      const [angleB, rangeB] = G.bearingLine([C, B])
      return fanFrame3point({ C, angleA, rangeA, angleB, rangeB })
    } else {
      const [C, A] = G.coordinates(feature).map(G.toLatLon)
      const [angleA, rangeA] = G.bearingLine([C, A])
      const angleB = Number.parseInt(options.arc)
      return fanFrame2point({ C, angleA, rangeA, angleB })
    }
  },

  handledrag: [
    (frame, { coordinate }) => {
      return frame.copy({ C: G.toLatLon(coordinate) })
    },
    (frame, { originalEvent, coordinate }) => {
      const [angleA, rangeA] = frame.bearingLine(G.toLatLon(coordinate))
      const rangeB = originalEvent.ctrlKey ? rangeA : frame.rangeB
      return frame.copy({ angleA, rangeA, rangeB })
    },
    (frame, { originalEvent, coordinate }) => {
      const [angleB, rangeB] = frame.bearingLine(G.toLatLon(coordinate))
      const rangeA = originalEvent.ctrlKey ? rangeB : frame.rangeA
      return frame.copy({ rangeA, angleB, rangeB })
    }
  ]
}

geometryOptions.orbit = {

  /**
   * frame :: ol/Feature -> Frame
   */
  frame: feature => {
    const [line, point] = feature.getGeometry().getGeometries()
    const [A, B] = G.coordinates(line).map(G.toLatLon)
    const C = G.toLatLon(G.coordinates(point))
    const width = A.distanceTo(C)
    const orientation = Math.sign(C.crossTrackDistanceTo(A, B))
    return orbitFrame({ A, B, width, orientation })
  },

  handledrag: [
    (frame, { _, coordinate }) => {
      const C = G.toLatLon(coordinate)
      const orientation = Math.sign(C.crossTrackDistanceTo(frame.A, frame.B))
      return frame.copy({ width: frame.A.distanceTo(C), orientation })
    },
    (frame, { coordinate }) => frame.copy({ A: G.toLatLon(coordinate) }),
    (frame, { coordinate }) => frame.copy({ B: G.toLatLon(coordinate) })
  ]
}
