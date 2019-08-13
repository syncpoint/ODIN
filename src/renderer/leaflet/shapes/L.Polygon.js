import L from 'leaflet'
import * as R from 'ramda'
import './L.Polystar'


L.Shape.Polygon = L.Shape.Polystar.extend({

  createShape (options) {
    const group = L.SVG.create('g')
    const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'black', 'opacity': 0.0 })
    const linePath = L.SVG.path({ 'stroke-width': 2, stroke: 'black', fill: 'none' })

    // TODO: check flag options.interactive
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')

    group.appendChild(outlinePath)
    group.appendChild(linePath)

    const label = L.SVG.text({ 'font-size': 12 })
    group.appendChild(label)

    // Create tspans for label lines, but don't add them just yet.
    const tspans = R.range(0, options.labels().length).map(() => L.SVG.tspan({
      dy: '1.2em',
      'text-anchor': 'middle',
      'alignment-baseline': 'central'
    }))

    const update = latlngs => {
      const path = [[...latlngs, latlngs[0]]]
      const d = L.SVG.pointsToPath(options.layerPoints(path))
      outlinePath.setAttribute('d', d)
      linePath.setAttribute('d', d)

      // Update labels:
      // polygon centroid algorithm; only uses the first ring if there are multiple
      const center = L.Point.centroid(options.layerPoints([latlngs])[0])
      label.setAttribute('x', center.x)
      label.setAttribute('y', center.y)

      options.labels().forEach((line, index) => {
        const match = line.match(/<bold>(.*)<\/bold>/)
        const bold = (match && !!match[1]) || false
        tspans[index].textContent = bold ? match[1] : line
        tspans[index].setAttribute('x', center.x)
        tspans[index].setAttribute('font-weight', bold ? 'bold' : 'normal')
        label.appendChild(tspans[index])
      })

      label.setAttribute('transform', `translate(0 ${label.getBBox().height / -1.5})`)
    }

    return {
      element: group,
      update
    }
  }
})
