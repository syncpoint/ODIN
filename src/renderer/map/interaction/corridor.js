import * as R from 'ramda'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import * as TS from '../ts'
import { format } from '../format'
import disposable from '../../../shared/disposable'
import { setGeometry, setCoordinates } from './helper'

export default feature => {
  const disposables = disposable.of({})
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


  // Register control feature geometry change listeners:
  var changing = false
  ;(() => {
    const centerChanged = ({ target: geometry }) => {
      if (changing) return
      frame = frame.copy({ line: read(geometry) })
      setGeometry(feature, write(frame.geometry))
    }

    const pointChanged = ({ target: geometry }) => {
      if (changing) return
      const point = read(geometry)
      const segment = TS.segment(R.take(2, TS.coordinates([frame.line])))
      const orientation = segment.orientationIndex(TS.coordinate(point))
      const coords = [TS.startPoint(frame.line), point].map(TS.coordinate)
      const width = TS.segment(coords).getLength()
      frame = frame.copy({ orientation, width })
      setGeometry(feature, write(frame.geometry))
    }

    const centerGeometry = center.getGeometry()
    const pointGeometry = point.getGeometry()

    centerGeometry.on('change', centerChanged)
    pointGeometry.on('change', pointChanged)

    disposables.addDisposable(() => {
      centerGeometry.un('change', centerChanged)
      pointGeometry.un('change', pointChanged)
    })
  })()

  const updateFeatures = () => {
    setCoordinates(point, write(frame.point))
  }

  const updateGeometry = geometry => {
    frame = frame.copy(params(geometry))

    changing = true
    const geometries = geometry.getGeometries()
    setCoordinates(center, geometries[0])
    setCoordinates(point, geometries[1])
    changing = false
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
    dispose: () => disposables.dispose()
  }
}
