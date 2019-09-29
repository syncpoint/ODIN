import L from 'leaflet'
import { projectedPoint, line } from './geo-helper'

// TODO: can we parameterize this with different arrows?
export const corridorShape = group => {
  const outline = L.SVG.path({
    stroke: 'black',
    'stroke-width': 7,
    fill: 'none',
    'stroke-linejoin': 'round'
  })

  const path = L.SVG.path({
    stroke: 'RGB(0, 168, 220)',
    // stroke: 'RGB(128, 224, 255)',
    'stroke-width': 3,
    fill: 'none',
    'stroke-linejoin': 'round'
  })

  group.appendChild(outline)
  group.appendChild(path)

  // NOTE: full width envelope
  const updateFrame = ({ center, envelope }) => {

    const dw = line(envelope[0]).d
    const ds = line(center.slice(0, 2)).d
    const arrowBase = (() => {
      // TODO: limit arrow length to first segment if necessary
      const C1 = line(center.slice(0, 2)).point((dw / ds) * 0.38)

      // project C to first segment (left/right) of envelope
      const strut = line([
        projectedPoint(envelope[0][0], envelope[1][0], C1),
        projectedPoint(envelope[0][1], envelope[1][1], C1)
      ])

      return [0, 0.25, 0.75, 1].map(strut.point)
    })()

    // Interpolate points for corridor width (half of arrow width)
    // TODO: remove/simplify shape when minimum width is below a certain limit
    const struts = envelope.map(line).slice(1)

    const points = [[
      ...struts.map(s => s.point(0.75)).reverse(),
      arrowBase[2], arrowBase[3],
      center[0],
      arrowBase[0], arrowBase[1],
      ...struts.map(s => s.point(0.25))
    ]]

    const closed = false
    path.setAttribute('d', L.SVG.pointsToPath(points, closed))
    outline.setAttribute('d', L.SVG.pointsToPath(points, closed))
  }

  const attached = () => {
    // shape group is now attached to parent element
  }

  return {
    group,
    updateFrame,
    attached
  }
}

