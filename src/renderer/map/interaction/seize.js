import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import * as TS from '../ts'
import { format } from '../format'
import disposable from '../../../shared/disposable'
import { setCoordinates } from './helper'

export default feature => {
  const disposables = disposable.of({})
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)

  const [center, orientation, size] = (() => {
    return geometry.getPoints().map(point => new Feature({ geometry: point }))
  })()

  const params = geometry => {
    const [center, orientation, size] = TS.geometries(read(geometry))
    // FIXME: conversion to coordinates should not be necessary
    const segmentO = TS.segment(TS.coordinates([center, orientation]))
    const segmentS = TS.segment(TS.coordinates([center, size]))
    const angle = segmentO.angle()
    const maxRange = segmentO.getLength()
    const minRange = segmentS.getLength()
    return { center, angle, maxRange, minRange }
  }

  let frame = (function create (params) {
    const { center, angle, maxRange, minRange } = params
    const C = TS.coordinate(center)
    const points = [
      TS.coordinate(center),
      ...TS.projectCoordinates(maxRange, angle, C)([[1, 0]]),
      ...TS.projectCoordinates(minRange, angle - Math.PI / 2, C)([[1, 0]])
    ].map(TS.point)

    const copy = properties => create({ ...params, ...properties })
    const geometry = TS.multiPoint(points)
    return { center, angle, size, maxRange, minRange, copy, geometry }
  })(params(geometry))

  var changing = false
  ;(() => {
    const centerChanged = ({ target: geometry }) => {
      if (changing) return
      frame = frame.copy({ center: read(geometry) })
      setCoordinates(feature, write(frame.geometry))
    }

    const orientationChanged = ({ target: geometry }) => {
      if (changing) return
      // FIXME: conversion to coordinates should not be necessary
      const segment = TS.segment(TS.coordinates([frame.center, read(geometry)]))
      frame = frame.copy({ angle: segment.angle(), maxRange: segment.getLength() })
      setCoordinates(feature, write(frame.geometry))
    }

    const sizeChanged = ({ target: geometry }) => {
      if (changing) return
      const segment = TS.segment(frame.center, read(geometry))
      frame = frame.copy({ minRange: segment.getLength() })
      setCoordinates(feature, write(frame.geometry))
    }

    const centerGeometry = center.getGeometry()
    const orientationGeometry = orientation.getGeometry()
    const sizeGeometry = size.getGeometry()

    centerGeometry.on('change', centerChanged)
    orientationGeometry.on('change', orientationChanged)
    sizeGeometry.on('change', sizeChanged)

    disposables.addDisposable(() => {
      centerGeometry.un('change', centerChanged)
      orientationGeometry.un('change', orientationChanged)
      sizeGeometry.un('change', sizeChanged)
    })
  })()

  const updateFeatures = () => {
    const [C, O, S] = write(frame.geometry).getPoints()
    setCoordinates(center, C)
    setCoordinates(orientation, O)
    setCoordinates(size, S)
  }

  const updateGeometry = geometry => {
    frame = frame.copy(params(geometry))

    changing = true
    const [C, O, S] = geometry.getPoints()
    setCoordinates(center, C)
    setCoordinates(orientation, O)
    setCoordinates(size, S)
    changing = false
  }

  const enforceConstraints = (segments, coordinate) => {
    const feature = segments[0].feature

    if (feature === orientation) {
      // maxRange must not be less than minRange:
      const O = read(new Point(coordinate))
      const segmentO = TS.segment(TS.coordinates([frame.center, O]))
      if (segmentO.getLength() <= frame.minRange) {
        const { geometry } = frame.copy({ maxRange: frame.minRange })
        return write(TS.geometryN(1)(geometry)).getFirstCoordinate()
      } else return coordinate
    } else if (feature === size) {
      // minRange must not exceed maxRange:
      const S = read(new Point(coordinate))
      const segmentS = TS.segment(TS.coordinates([frame.center, S]))
      if (segmentS.getLength() >= frame.maxRange) {
        const { geometry } = frame.copy({ minRange: frame.maxRange })
        return write(TS.geometryN(2)(geometry)).getFirstCoordinate()
      }

      // Project onto orientation normal vector:
      const C = TS.coordinate(frame.center)
      const [O] = TS.projectCoordinates(frame.maxRange, frame.angle, C)([[1, 0]])
      const P = new TS.Coordinate(C.x - (O.y - C.y), C.y + (O.x - C.x))
      const segmentCP = TS.segment([C, P])
      const projected = segmentCP.project(TS.coordinate(S))
      return write(TS.point(projected)).getFirstCoordinate()

    } else return coordinate
  }


  return {
    feature,
    updateFeatures,
    updateGeometry,
    enforceConstraints,
    dispose: () => disposables.dispose(),
    controlFeatures: [center, orientation, size]
  }
}
