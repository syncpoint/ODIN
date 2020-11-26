import { defaultStyle } from './default-style'
import { parameterized } from '../../components/SIDC'
import { labels } from './line-labels'
import { geometries } from './line-geometries'
import styles from './default-style-2'
import * as TS from '../ts'
import { format } from '../format'

export const lineStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const geometry = feature.getGeometry()
  const reference = geometry.getFirstCoordinate()
  const { read, write } = format(reference)
  const line = read(geometry)
  const styleFactory = styles(mode, feature)(write)
  const options = { feature, resolution, line, styles: styleFactory }

  return [
    geometries[sidc] ? geometries[sidc](options) : defaultStyle(feature),
    styleFactory.handles(TS.multiPoint(TS.linePoints(line))),
    styleFactory.wireFrame(line),
    (labels[sidc] || []).map(fn => fn(feature, resolution))
  ].flat()
}
