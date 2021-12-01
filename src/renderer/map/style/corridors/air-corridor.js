import * as R from 'ramda'
import * as TS from '../../ts'

export const airCorridor = title => options => {
  const { styles, width, line, feature } = options
  const coords = TS.coordinates(line)

  const segments = R.aperture(2, coords)
    .map(points => TS.lineString(points))
    .map(line => TS.buffer({
      joinStyle: TS.BufferParameters.JOIN_ROUND,
      endCapStyle: TS.BufferParameters.CAP_ROUND
    })(line)(width / 2))


  const texts = (() => {
    const text = feature.get('t')
      ? `${title} ${feature.get('t')}`
      : `${title}`

    return R.aperture(2, coords)
      .map(TS.segment)
      .map(segment => [segment.midPoint(), segment.angle()])
      .map(([point, angle]) => styles.text(TS.point(point), {
        text,
        flip: true,
        textAlign: () => 'center',
        rotation: Math.PI - angle
      }))
  })()

  return [
    styles.solidLine(TS.collect(segments)),
    ...texts
  ]
}
