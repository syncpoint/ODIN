import L from 'leaflet'
import { calcStruts, line, svgFactory } from './geo-helper'

export const corridorShape = (group, options) => {
  const f = svgFactory(options)
  const outline = f.outline()
  const path = f.path()
  group.appendChild(outline)
  group.appendChild(path)

  // NOTE: full width envelope
  const updateFrame = ({ center, envelope }) => {
    const s = calcStruts(center, envelope)([ 0.38 ])

    // Interpolate points for corridor width (half of arrow width)
    // TODO: remove/simplify shape when minimum width is below a certain limit
    const struts = envelope.map(line).slice(1)

    const points = [[
      ...struts.map(s => s.point(0.75)).reverse(),
      s[0].point(0.75), s[0].point(1),
      center[0],
      s[0].point(0), s[0].point(0.25),
      ...struts.map(s => s.point(0.25))
    ]]

    const closed = false
    path.setAttribute('d', L.SVG.pointsToPath(points, closed))
    outline.setAttribute('d', L.SVG.pointsToPath(points, closed))
  }

  return { updateFrame }
}
