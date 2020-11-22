import * as TS from '../ts'
import { format } from '../format'
import G_G_OLAA from './G_G_OLAA'
import G_G_OLAGM from './G_G_OLAGM'
import G_G_OLAGS from './G_G_OLAGS'
import G_G_OLAR from './G_G_OLAR'
import G_G_PA from './G_G_PA'
import G_T_K from './G_T_K'
import G_T_KF from './G_T_KF'

export const style = fn => options => {
  const { feature, styles } = options
  const geometry = feature.getGeometry()
  const reference = geometry.getGeometries()[0].getFirstCoordinate()
  const { read, write } = format(reference)
  const [line, point] = TS.geometries(read(geometry))

  // Calculate corridor width:
  const width = 2 * TS.lineSegment([
    TS.startPoint(line),
    point
  ].map(TS.coordinate)).getLength()

  return fn({
    ...options,
    width,
    line,
    point,
    styles: styles(write)
  }).flat()
}

export default {
  'G*G*OLAA--': style(G_G_OLAA),
  'G*G*OLAGM-': style(G_G_OLAGM),
  'G*G*OLAGS-': style(G_G_OLAGS),
  'G*G*OLAR--': style(G_G_OLAR),
  'G*G*PA----': style(G_G_PA),
  'G*T*K-----': style(G_T_K),
  'G*T*KF----': style(G_T_KF)
}
