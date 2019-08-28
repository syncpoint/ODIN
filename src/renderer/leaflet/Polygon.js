import L from 'leaflet'
import './Polystar'


L.Feature.Polygon = L.Feature.Polystar.extend({

  createShape (options) {
    const group = L.SVG.create('g')
    const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'black', fill: 'none', 'opacity': 0.0 })
    const linePath = L.SVG.path({ 'stroke-width': 2, stroke: 'black', fill: 'none' })

    // TODO: check flag options.interactive
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')

    group.appendChild(outlinePath)
    group.appendChild(linePath)

    const label = L.SVG.text({ 'font-size': 12 })
    group.appendChild(label)

    const update = latlngs => {
      const path = [[...latlngs, latlngs[0]]]
      const d = L.SVG.pointsToPath(options.layerPoints(path))
      outlinePath.setAttribute('d', d)
      linePath.setAttribute('d', d)

      // Update labels:
      // Polygon centroid algorithm; only uses the first ring if there are multiple.
      const center = L.Point.centroid(options.layerPoints([latlngs])[0])
      label.setAttribute('x', center.x)
      label.setAttribute('y', center.y)

      // Create tspans for label lines; clear out tspans first:
      while (label.lastChild) label.removeChild(label.lastChild)

      options.labels().forEach(line => {
        const tspan = L.SVG.tspan({
          dy: '1.2em',
          'text-anchor': 'middle',
          'alignment-baseline': 'central'
        })

        const match = line.match(/<bold>(.*)<\/bold>/)
        const bold = (match && !!match[1]) || false
        tspan.textContent = bold ? match[1] : line
        tspan.setAttribute('x', center.x)
        tspan.setAttribute('font-weight', bold ? 'bold' : 'normal')
        label.appendChild(tspan)
      })
      label.setAttribute('transform', `translate(0 ${label.getBBox().height / -1.5})`)
    }

    return {
      element: group,
      update
    }
  }
})
