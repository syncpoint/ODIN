import * as R from 'ramda'
import Feature from 'ol/Feature'
import * as TS from '../ts'
import { format } from '../format'
import disposable from '../../../shared/disposable'
import { setCoordinates } from './helper'

export default feature => {
  const disposables = disposable.of({})
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)

  const [center, ...points] = (() => {
    return geometry.getPoints().map(point => new Feature({ geometry: point }))
  })()

  const params = geometry => {
    var [center, ...points] = TS.geometries(read(geometry))
    const vectors = points
      .map(point => TS.segment(TS.coordinates([center, point])))
      .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))
    return { center, vectors }
  }

  let frame = (function create (params) {
    const { center, vectors } = params
    const points = vectors
      .map(({ angle, length }) => TS.projectCoordinate(TS.coordinate(center))([angle, length]))
      .map(TS.point)

    const copy = properties => create({ ...params, ...properties })
    const geometry = TS.multiPoint([center, ...points])
    return { center, points, copy, geometry }
  })(params(geometry))

  var changing = false
  ;(() => {
    const centerChanged = ({ target: geometry }) => {
      if (changing) return
      frame = frame.copy({ center: read(geometry) })
      setCoordinates(feature, write(frame.geometry))
    }

    const pointChanged = R.range(0, points.length).map(index => ({ target: geometry }) => {
      if (changing) return
      const points = frame.points
      points[index] = read(geometry)
      const vectors = points
        .map(point => TS.segment(TS.coordinates([frame.center, point])))
        .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))

      frame = frame.copy({ vectors })
      setCoordinates(feature, write(frame.geometry))
    })

    const centerGeometry = center.getGeometry()
    centerGeometry.on('change', centerChanged)

    points
      .map(feature => feature.getGeometry())
      .forEach((geometry, index) => geometry.on('change', pointChanged[index]))

    disposables.addDisposable(() => {
      centerGeometry.un('change', centerChanged)
      points
        .map(feature => feature.getGeometry())
        .forEach((geometry, index) => geometry.un('change', pointChanged[index]))
    })
  })()

  const updateFeatures = () => {
    frame.points.forEach((point, index) => {
      setCoordinates(points[index], write(point))
    })
  }

  const updateGeometry = geometry => {
    frame = frame.copy(params(geometry))

    changing = true
    const [head, ...tail] = geometry.getPoints()
    setCoordinates(center, head)
    tail.forEach((geometry, index) => setCoordinates(points[index], geometry))
    changing = false
  }

  return {
    feature,
    updateFeatures,
    updateGeometry,
    dispose: () => disposables.dispose(),
    controlFeatures: [center, ...points]
  }
}
