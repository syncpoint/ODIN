import L from 'leaflet'
import './Polystar'

L.Feature.Polyline = L.Feature.Polystar.extend({

  createShape (options) {
    const group = L.SVG.create('g')

    // FIXME: duplicate code: polyline, polygon and TACGRP.C2GM.GNL.LNE.BNDS
    const outlinePath = L.SVG.path({ 'stroke-width': 10, stroke: 'black', fill: 'none', 'opacity': 0.0 })
    const linePath = L.SVG.path({ 'stroke-width': 3, stroke: 'black', fill: 'none' })

    // TODO: check flag options.interactive
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')

    group.appendChild(outlinePath)
    group.appendChild(linePath)

    const update = latlngs => {
      const path = [latlngs]
      const d = L.SVG.pointsToPath(
        options.layerPoints(path),
        false,
        this.options.lineSmoothing
      )
      outlinePath.setAttribute('d', d)
      linePath.setAttribute('d', d)
    }

    return {
      element: group,
      update
    }
  }
})
