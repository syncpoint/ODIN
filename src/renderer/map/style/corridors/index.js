import * as R from 'ramda'
import * as TS from '../../ts'
import { format } from '../../format'
import G_G_OAF from './G_G_OAF'
import G_G_OLAA from './G_G_OLAA'
import G_G_OLAGM from './G_G_OLAGM'
import G_G_OLAGS from './G_G_OLAGS'
import G_G_OLAR from './G_G_OLAR'
import G_G_OLAV from './G_G_OLAV'
import G_G_PA from './G_G_PA'
import G_M_BCA from './G_M_BCA'
import G_M_BCB from './G_M_BCB'
import G_M_BCD from './G_M_BCD'
import G_M_BCE from './G_M_BCE'
import G_M_BDD from './G_M_BDD'
import G_M_BDE from './G_M_BDE'
import G_M_BDI from './G_M_BDI'
import G_M_OEB from './G_M_OEB'
import G_M_OFG from './G_M_OFG'
import G_M_ORA from './G_M_ORA'
import G_M_ORC from './G_M_ORC'
import G_M_ORS from './G_M_ORS'
import G_T_B from './G_T_B'
import G_T_C from './G_T_C'
import G_T_H from './G_T_H'
import G_T_J from './G_T_J'
import G_T_K from './G_T_K'
import G_T_KF from './G_T_KF'
import G_T_L from './G_T_L'
import G_T_M from './G_T_M'
import G_T_P from './G_T_P'
import G_T_R from './G_T_R'
import G_T_T from './G_T_T'
import G_T_W from './G_T_W'
import G_T_WP from './G_T_WP'
import G_T_X from './G_T_X'
import G_T_Y from './G_T_Y'

export const style = fn => options => {
  const geometry = options.feature.getGeometry()
  const reference = geometry.getGeometries()[0].getFirstCoordinate()
  const { read, write } = format(reference)
  const [line, point] = TS.geometries(read(geometry))

  // Calculate corridor width:
  const width = 2 * TS.segment([
    TS.startPoint(line),
    point
  ].map(TS.coordinate)).getLength()

  const styleFactory = options.styleFactory(write)
  const tryer = () => fn({ ...options, width, line, point, styles: styleFactory })
  const catcher = err => {
    const segments = TS.segments(line).sort((a, b) => b.getLength() - a.getLength())
    return [
      styleFactory.waspLine(TS.lineBuffer(line)(width / 2)),
      styleFactory.text(TS.point(segments[0].midPoint()), {
        text: `invalid geometry\n${err.message}`,
        color: 'red',
        flip: true,
        textAlign: () => 'center',
        rotation: Math.PI - segments[0].angle()
      })
    ]
  }

  return [
    R.tryCatch(tryer, catcher)(),
    styleFactory.wireFrame(line),
    styleFactory.handles(TS.multiPoint([point, ...TS.linePoints(line)]))
  ].flat()
}

export default {
  'G*G*OAF---': style(G_G_OAF),
  'G*G*OLAA--': style(G_G_OLAA),
  'G*G*OLAGM-': style(G_G_OLAGM),
  'G*G*OLAGS-': style(G_G_OLAGS),
  'G*G*OLAR--': style(G_G_OLAR),
  'G*G*OLAV--': style(G_G_OLAV),
  'G*G*PA----': style(G_G_PA),
  'G*M*BCA---': style(G_M_BCA),
  'G*M*BCB---': style(G_M_BCB),
  'G*M*BCD---': style(G_M_BCD),
  'G*M*BCE---': style(G_M_BCE),
  'G*M*BDD---': style(G_M_BDD),
  'G*M*BDE---': style(G_M_BDE),
  'G*M*BDI---': style(G_M_BDI),
  'G*M*OEB---': style(G_M_OEB),
  'G*M*OFG---': style(G_M_OFG),
  'G*M*ORA---': style(G_M_ORA),
  'G*M*ORC---': style(G_M_ORC),
  'G*M*ORS---': style(G_M_ORS),
  'G*T*B-----': style(G_T_B),
  'G*T*C-----': style(G_T_C),
  'G*T*H-----': style(G_T_H),
  'G*T*J-----': style(G_T_J),
  'G*T*K-----': style(G_T_K),
  'G*T*KF----': style(G_T_KF),
  'G*T*L-----': style(G_T_L),
  'G*T*M-----': style(G_T_M),
  'G*T*P-----': style(G_T_P),
  'G*T*R-----': style(G_T_R),
  'G*T*T-----': style(G_T_T),
  'G*T*W-----': style(G_T_W),
  'G*T*WP----': style(G_T_WP),
  'G*T*X-----': style(G_T_X),
  'G*T*Y-----': style(G_T_Y)
}
