import { calcStruts, line } from './geo-helper'
import { svgBuilder } from './svg-builder'

export const corridorShape = (group, options) => {
  const state = { options }

  const points = ({ center, envelope }) => {
    const s = calcStruts(center, envelope)([ 0.38, 0.19 ])

    // Interpolate points for corridor width (half of arrow width)
    const struts = envelope.map(line).slice(1)
    return [[
      ...struts.map(s => s.point(0.75)).reverse(),
      s[0].point(0.75), s[0].point(1),
      center[0],
      s[0].point(0), s[0].point(0.25),
      ...struts.map(s => s.point(0.25))
    ],
    [
      s[0].point(0.75),
      s[1].point(0.5),
      s[0].point(0.25)
    ]]
  }

  const builder = svgBuilder(options, {
    points,
    style: name => state.options.stylesX[name]
  })

  return {
    attached: () => builder.attach(group),
    updateFrame: builder.updateFrame,
    updateOptions: options => {
      state.options = options
      builder.refresh()
    }
  }
}
