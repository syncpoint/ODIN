import * as geom from 'ol/geom'
import GeometryType from 'ol/geom/GeometryType'
import * as G from '../style/geodesy'

export const drawOptions = [
  {
    match: descriptor => descriptor.geometry === GeometryType.POINT,
    options: () => ({ type: GeometryType.POINT })
  },
  {
    match: descriptor => descriptor.geometry === GeometryType.POLYGON,
    options: () => ({ type: GeometryType.POLYGON })
  },
  {
    match: descriptor => descriptor.geometry === GeometryType.LINE_STRING,
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.maxPoints })
  },
  {
    match: descriptor => descriptor.layout === 'orbit',
    options: () => ({ type: GeometryType.LINE_STRING, maxPoints: 2 }),
    complete: (map, feature) => {
      const line = feature.getGeometry()
      const linePoints = G.coordinates(line).map(G.toLatLon)
      const [bearing, distance] = G.bearingLine(linePoints)
      const C = linePoints[0].destinationPoint(distance / 2, bearing + 90)
      const point = new geom.Point(G.fromLatLon(C))
      feature.setGeometry(new geom.GeometryCollection([line, point]))
    }
  },
  {
    match: descriptor => descriptor.layout === 'fan' && Number.parseInt(descriptor.maxPoints) === 3,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const point = feature.getGeometry()
      const C = G.toLatLon(G.coordinates(point))
      const A = C.destinationPoint(resolution * 50, 0)
      const B = C.destinationPoint(resolution * 50, 90)
      feature.setGeometry(new geom.MultiPoint([G.fromLatLon(C), G.fromLatLon(A), G.fromLatLon(B)]))
    }
  },
  {
    match: descriptor => descriptor.layout === 'fan' && Number.parseInt(descriptor.maxPoints) === 2,
    options: () => ({ type: GeometryType.POINT }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const point = feature.getGeometry()
      const C = G.toLatLon(G.coordinates(point))
      const A = C.destinationPoint(resolution * 50, 0)
      feature.setGeometry(new geom.MultiPoint([G.fromLatLon(C), G.fromLatLon(A)]))
    }
  },
  {
    match: descriptor => descriptor.layout === 'corridor',
    options: descriptor => ({ type: GeometryType.LINE_STRING, maxPoints: descriptor.maxPoints }),
    complete: (map, feature) => {
      const resolution = map.getView().getResolution()
      const line = feature.getGeometry()
      const linePoints = G.coordinates(line).map(G.toLatLon)
      const bearing = G.initialBearing(linePoints)
      const point = linePoints[0].destinationPoint(resolution * 50, bearing + 90)
      feature.setGeometry(new geom.GeometryCollection([
        new geom.LineString(linePoints.map(G.fromLatLon)),
        new geom.Point(G.fromLatLon(point))
      ]))
    }
  }

]
