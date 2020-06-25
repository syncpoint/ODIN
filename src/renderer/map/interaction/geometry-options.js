import * as geom from 'ol/geom'
import * as G from '../style/geodesy'

const corridorFrame = current => {
  const { A, B, width, orientation } = current
  const bearing = G.initialBearing(([A, B]))
  const C = A.destinationPoint(width, bearing + (orientation * 90))

  return {
    points: [C, A, B],
    A,
    B,
    copy: properties => corridorFrame({ ...current, ...properties }),
    geometry: () => new geom.GeometryCollection([
      new geom.LineString([G.fromLatLon(A), G.fromLatLon(B)]),
      new geom.Point(G.fromLatLon(C))
    ])
  }
}

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
    geometry: () => new geom.MultiPoint(points.map(G.fromLatLon))
  }
}

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
    geometry: () => new geom.MultiPoint(points.map(G.fromLatLon))
  }
}

const orbitFrame = current => {
  const { A, B, width, orientation } = current
  const bearing = G.initialBearing(([A, B]))
  const C = A.destinationPoint(width, bearing + (orientation * 90))

  return {
    points: [C, A, B],
    A,
    B,
    copy: properties => orbitFrame({ ...current, ...properties }),
    geometry: () => new geom.GeometryCollection([
      new geom.LineString([G.fromLatLon(A), G.fromLatLon(B)]),
      new geom.Point(G.fromLatLon(C))
    ])
  }
}

export const geometryOptions = []

geometryOptions.corridor = {
  frame: feature => {
    const [line, point] = feature.getGeometry().getGeometries()
    const [A, B] = G.coordinates(line).map(G.toLatLon)
    const C = G.toLatLon(G.coordinates(point))
    const width = A.distanceTo(C)
    const orientation = Math.sign(C.crossTrackDistanceTo(A, B))
    return corridorFrame({ A, B, width, orientation })
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

geometryOptions.fan = {

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
