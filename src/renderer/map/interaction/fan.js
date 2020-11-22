import * as R from 'ramda'
import Feature from 'ol/Feature'
import * as TS from '../ts'
import { format } from '../format'

export default feature => {
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)

  const [center, ...points] = (() => {
    return geometry.getPoints().map(point => new Feature({ geometry: point }))
  })()

  const params = geometry => {
    var [center, ...points] = TS.geometries(read(geometry))
    const vectors = points
      .map(point => TS.lineSegment(TS.coordinates([center, point])))
      .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))
    return { center, vectors }
  }

  let frame = (function create (params) {
    const { center, vectors } = params
    const points = vectors
      .map(({ angle, length }) => TS.projectCoordinate(angle, length)(TS.coordinate(center)))
      .map(TS.point)

    const copy = properties => create({ ...params, ...properties })
    const geometry = TS.multiPoint([center, ...points])
    return { center, points, copy, geometry }
  })(params(geometry))

  const centerChanged = ({ target: control }) => {
    const center = read(control.getGeometry())
    frame = frame.copy({ center })
    feature.setGeometry(write(frame.geometry))
  }

  const pointChanged = R.range(0, points.length).map(index => ({ target: control }) => {
    const points = frame.points
    points[index] = read(control.getGeometry())
    const vectors = points
      .map(point => TS.lineSegment(TS.coordinates([frame.center, point])))
      .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))

    frame = frame.copy({ vectors })
    feature.setGeometry(write(frame.geometry))
  })

  const listeners = R.zip([center, ...points], [centerChanged, ...pointChanged])
  const register = ([feature, handler]) => feature.on('change', handler)
  const deregister = ([feature, handler]) => feature.un('change', handler)
  listeners.forEach(register)

  const updateFeatures = () => {
    frame.points.forEach((point, index) => {
      points[index].setGeometry(write(point))
    })
  }

  const updateGeometry = geometry => {
    frame = frame.copy(params(geometry))
    listeners.forEach(deregister)
    const [head, ...tail] = geometry.getPoints()
    center.setGeometry(head)
    tail.forEach((geometry, index) => points[index].setGeometry(geometry))
    listeners.forEach(register)
  }

  return {
    feature,
    updateFeatures,
    updateGeometry,
    dispose: () => listeners.forEach(deregister),
    controlFeatures: [center, ...points]
  }
}
