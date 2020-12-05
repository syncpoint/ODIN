import { parameterized } from '../../components/SIDC'
import { labels } from './line-labels'
import { geometries } from './line-geometries'
import { styleFactory, defaultStyle } from './default-style'
import * as TS from '../ts'
import { format } from '../format'

export const lineStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)
  const line = read(geometry)
  const factory = styleFactory(mode, feature)(write)
  const options = { feature, resolution, line, styles: factory, write }

  return [
    geometries[sidc] ? geometries[sidc](options).flat() : defaultStyle(feature),
    factory.handles(TS.multiPoint(TS.linePoints(line))),
    factory.wireFrame(line),
    (labels[sidc] || []).flatMap(fn => fn(feature, resolution))
  ].flat()
}
