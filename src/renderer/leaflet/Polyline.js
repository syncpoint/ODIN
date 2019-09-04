import L from 'leaflet'
import './Polystar'

L.Feature.Polyline = L.Feature.Polystar.extend({

  createShape (options) {
    const group = L.SVG.create('g')
    const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'black', fill: 'none', 'opacity': 0.0 })
    const linePath = L.SVG.path({ 'stroke-width': 4, stroke: 'black', fill: 'none' })

    // TODO: check flag options.interactive
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')

    group.appendChild(outlinePath)
    group.appendChild(linePath)

    const update = latlngs => {
      const path = [latlngs]
      const [closed, smooth] = [false, false]
      const d = L.SVG.pointsToPath(options.layerPoints(path), closed, smooth)
      outlinePath.setAttribute('d', d)
      linePath.setAttribute('d', d)
    }

    return {
      element: group,
      update
    }
  }
})
