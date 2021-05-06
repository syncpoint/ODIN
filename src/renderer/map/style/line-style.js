import { parameterized } from '../../components/SIDC'
import { labels as lineLabels } from './line-labels'
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
  const factory = styleFactory({ mode, feature, resolution })(write)
  const options = { feature, resolution, line, styles: factory, write }

  const labels = () => {
    if (!factory.showLabels()) return []
    return (lineLabels[sidc] || []).flatMap(fn => fn(feature, resolution))
  }

  return [
    geometries[sidc] ? geometries[sidc](options).flat() : defaultStyle(feature),
    ...factory.handles(TS.multiPoint(TS.linePoints(line))),
    factory.wireFrame(line),
    labels()
  ].flat()
}
