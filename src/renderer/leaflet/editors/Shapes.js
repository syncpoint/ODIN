import L from 'leaflet'
import '../SVG'

const genericPath = renderer => {
  const path = L.SVG.path({ 'stroke-width': 0.8, fill: 'none', stroke: 'red', 'stroke-dasharray': '15 4 2 4' })
  renderer._rootGroup.appendChild(path)
  const dispose = () => renderer._rootGroup.removeChild(path)
  return { path, dispose }
}

/**
 * NOOP shape.
 */
export const noShape = () => ({
  dispose: () => {},
  update: () => {}
})

/**
 * Bounding box for orbit area.
 */
export const orbitShape = (map, renderer, geometry) => {
  const { path, dispose } = genericPath(renderer)
  const update = ({ A, A1, B, B1 }) => {
    const layerPoints = rings => rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    const polygon = [[A, A1, B1, B, A]]
    const d = L.SVG.pointsToPath(layerPoints(polygon))
    path.setAttribute('d', d)
    return { dispose, update }
  }

  return update(geometry)
}

/**
 * Range circles.
 */
export const fanShape = (map, renderer, geometry) => {
  const { path, dispose } = genericPath(renderer)
  const update = ({ C, minRange, maxRange }) => {
    const layerPoints = rings => rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    const arcs = [[], []]
    for (let angle = 0; angle <= 360; angle += (360 / 32)) {
      arcs[0].push(C.destinationPoint(minRange, angle))
      arcs[1].push(C.destinationPoint(maxRange, angle))
    }

    const d = L.SVG.pointsToPath(layerPoints([arcs[0], arcs[1]]))
    path.setAttribute('d', d)
    return { dispose, update }
  }

  return update(geometry)
}

export const arcShape = (map, renderer, geometry) => {
  const { path, dispose } = genericPath(renderer)
  const update = ({ C, O, S }) => {
    const layerPoints = rings => rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    const points = [[O, C, S]]
    const d = L.SVG.pointsToPath(layerPoints(points))
    path.setAttribute('d', d)
    return { dispose, update }
  }

  return update(geometry)
}

/**
 * Bounding box for two-point corridors.
 */
export const corridor2PointShape = (map, renderer, geometry) => {
  const { path, dispose } = genericPath(renderer)
  const update = ({ A1, A2, B1, B2 }) => {
    const layerPoints = rings => rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    const polygon = [[A1, A2, B2, B1, A1]]
    const d = L.SVG.pointsToPath(layerPoints(polygon))
    path.setAttribute('d', d)
    return { dispose, update }
  }

  return update(geometry)
}

export const corridorNPointShape = (map, renderer, geometry) => {
  const { path, dispose } = genericPath(renderer)
  const update = ({ latlngs, A, A1, A2 }) => {
    const layerPoints = rings => rings.map(ring => ring.map(latlng => map.latLngToLayerPoint(latlng)))
    const d = L.SVG.pointsToPath(layerPoints([[A, A1], [A, A2], [...latlngs]]))
    path.setAttribute('d', d)
    return { dispose, update }
  }

  return update(geometry)
}
