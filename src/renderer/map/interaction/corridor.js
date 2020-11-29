import * as R from 'ramda'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import * as TS from '../ts'
import { format } from '../format'

export default feature => {
  const geometry = feature.getGeometry()
  const geometries = geometry.getGeometries()
  const reference = geometries[0].getFirstCoordinate()
  const { read, write } = format(reference)

  // Split feature geometry into separate/independent feature:
  const [center, point] = (() => {
    return geometries.map(geometry => new Feature({ geometry }))
  })()

  const params = geometry => {
    var [line, point] = TS.geometries(read(geometry))
    const coords = [TS.startPoint(line), point].map(TS.coordinate)
    const [A, B] = R.take(2, TS.coordinates([line]))
    const segment = TS.segment(A, B)
    const orientation = segment.orientationIndex(TS.coordinate(point))
    const width = TS.segment(coords).getLength()
    return { line, orientation, width }
  }

  let frame = (function create (params) {
    const { line, orientation, width } = params
    const [A, B] = R.take(2, TS.coordinates([line]))
    const bearing = TS.segment([A, B]).angle()
    const point = TS.point(TS.projectCoordinate(A)([bearing + orientation * Math.PI / 2, width]))
    const copy = properties => create({ ...params, ...properties })
    const geometry = TS.geometryCollection([line, point])
    return { line, point, copy, geometry }
  })(params((geometry)))

  const centerChanged = ({ target: control }) => {
    const line = read(control.getGeometry())
    frame = frame.copy({ line })
    feature.setGeometry(write(frame.geometry))
  }

  const pointChanged = ({ target: control }) => {
    const point = read(control.getGeometry())
    const segment = TS.segment(R.take(2, TS.coordinates([frame.line])))
    const orientation = segment.orientationIndex(TS.coordinate(point))
    const coords = [TS.startPoint(frame.line), point].map(TS.coordinate)
    const width = TS.segment(coords).getLength()
    frame = frame.copy({ orientation, width })
    feature.setGeometry(write(frame.geometry))
  }

  const listeners = R.zip([center, point], [centerChanged, pointChanged])
  const register = ([feature, handler]) => feature.on('change', handler)
  const deregister = ([feature, handler]) => feature.un('change', handler)
  listeners.forEach(register)

  const updateFeatures = () => {
    point.setGeometry(write(frame.point))
  }

  const updateGeometry = geometry => {
    frame = frame.copy(params(geometry))
    listeners.forEach(deregister)
    const geometries = geometry.getGeometries()
    center.setGeometry(geometries[0])
    point.setGeometry(geometries[1])
    listeners.forEach(register)
  }

  const enforceConstraints = (segments, coordinate) => {
    const feature = R.head(segments).feature
    if (feature === point) {

      // Project point onto normal vector of first segment:
      const [A, B] = R.take(2, TS.coordinates([frame.line]))
      const P = new TS.Coordinate(A.x - (B.y - A.y), A.y + (B.x - A.x))
      const segmentAP = TS.segment([A, P])
      const projected = segmentAP.project(TS.coordinate(read(new Point(coordinate))))
      return write(TS.point(projected)).getFirstCoordinate()
    } else if (feature === center) {
      return coordinate
    } return coordinate
  }

  return {
    feature,
    updateFeatures,
    updateGeometry,
    enforceConstraints,
    controlFeatures: [center, point],
    dispose: () => listeners.forEach(deregister)
  }
}
