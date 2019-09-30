import L from 'leaflet'
import { calcStruts, line } from './geo-helper'

// TODO: can we parameterize this with different arrows?
export const corridorShape = (group, options) => {

  const outline = L.SVG.path({
    stroke: 'black',
    'stroke-width': 7,
    fill: 'none',
    'stroke-linejoin': 'round'
  })

  const path = L.SVG.path({
    stroke: 'RGB(0, 168, 220)',
    'stroke-width': 3,
    fill: 'none',
    'stroke-linejoin': 'round'
  })

  if (options.interactive) {
    L.DomUtil.addClass(outline, 'leaflet-interactive')
    L.DomUtil.addClass(path, 'leaflet-interactive')
  }

  group.appendChild(outline)
  group.appendChild(path)

  // NOTE: full width envelope
  const updateFrame = ({ center, envelope }) => {
    const s = calcStruts(center, envelope)([ 0.38, 0.19 ])

    // Interpolate points for corridor width (half of arrow width)
    // TODO: remove/simplify shape when minimum width is below a certain limit
    const struts = envelope.map(line).slice(1)

    const points = [[
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

    const closed = false
    path.setAttribute('d', L.SVG.pointsToPath(points, closed))
    outline.setAttribute('d', L.SVG.pointsToPath(points, closed))
  }

  return { updateFrame }
}
