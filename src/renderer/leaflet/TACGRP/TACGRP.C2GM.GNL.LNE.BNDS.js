import L from 'leaflet'
import * as R from 'ramda'
import uuid from 'uuid-random'
import '../Polyline'
import echelons from './echelon'

const transformLabel = (centerPoint, angle) => `
  translate(${centerPoint.x} ${centerPoint.y})
  rotate(${angle})
  scale(0.5 0.5),
  translate(-100 -178)`

const transformMask = (centerPoint, angle, bbox) => `
  translate(${centerPoint.x} ${centerPoint.y})
  rotate(${angle})
  translate(${bbox.width / -4} ${bbox.height / -4})`

L.Feature['G*G*GLB---'] = L.Feature.Polyline.extend({

  createShape (options) {
    const id = uuid()
    const group = L.SVG.create('g')
    // clickable margin around the line
    const marginPath = L.SVG.path({ 'stroke-width': 10, stroke: 'yellow', fill: 'none', 'opacity': 0.0 })
    const outlinePath = L.SVG.path({ 'stroke-width': 5, stroke: 'white', fill: 'none', 'opacity': 1.0, mask: `url(#mask-${id})` })
    const linePath = L.SVG.path({ 'stroke-width': 3, stroke: 'black', fill: 'none', mask: `url(#mask-${id})` })

    // TODO: check flag options.interactive
    L.DomUtil.addClass(marginPath, 'leaflet-interactive')
    L.DomUtil.addClass(outlinePath, 'leaflet-interactive')
    L.DomUtil.addClass(linePath, 'leaflet-interactive')

    group.appendChild(marginPath)
    group.appendChild(outlinePath)
    group.appendChild(linePath)

    // Dynamic set of echelon labels:
    const labels = []

    // Path/label clipping.
    const defs = L.SVG.create('defs')
    group.appendChild(defs)
    const clip = L.SVG.mask({ id: `mask-${id}` })
    defs.appendChild(clip)
    const whiteMask = L.SVG.rect({ fill: 'white' })
    clip.appendChild(whiteMask)
    const blackMasks = [] // holds backdrop rectangles for each echelon label

    const drawLabels = (latlngs, description) => {
      if (description.length === 0) return

      R.aperture(2, latlngs)
        .map(L.LatLng.line)
        .filter(line => line) // edge case: line is undefined when points are equal.
        .forEach(segment => {
          const label = L.SVG.g({
            'stroke-width': 4,
            'stroke': 'black',
            'fill': 'none'
          })

          // Derive SVG from label description and add to label group:
          description.forEach(description => {
            const element = L.SVG.create(description.type)
            L.SVG.setAttributes(element)(description)
            label.appendChild(element)
          })

          const centerPoint = options.layerPoint(segment.midpoint())
          label.setAttribute('transform', transformLabel(centerPoint, segment.initialBearing + 90))
          labels.push(label)
          group.appendChild(label)

          // Create black mask for clipping:
          /*
          The color of the masking shape defines the opacity of the shape that uses the mask. The closer the color of the masking shape is to #ffffff (white), the more opaque the shape using the mask will be. The closer the color of the masking shape is to #000000 (black), the more transparent the shape using the mask will be
          */
          const bbox = L.SVG.inflate(label.getBBox(), 8)
          const blackMask = L.SVG.rect({
            fill: 'black',
            width: bbox.width / 2,
            height: bbox.height / 2,
            transform: transformMask(centerPoint, segment.initialBearing + 90, bbox)
          })

          clip.appendChild(blackMask)
          blackMasks.push(blackMask)
        })
    }

    const update = latlngs => {
      const path = [latlngs]

      const d = L.SVG.pointsToPath(
        options.layerPoints(path),
        false,
        this.options.lineSmoothing
      )

      marginPath.setAttribute('d', d)
      outlinePath.setAttribute('d', d)
      linePath.setAttribute('d', d)

      // Remove all labels/masks before re-adding them:
      labels.forEach(label => group.removeChild(label))
      labels.length = 0
      blackMasks.forEach(mask => clip.removeChild(mask))
      blackMasks.length = 0

      // Consists of different basic SVG shape types:
      const labelDescription = echelons[this.feature.properties.sidc[11]] || []
      drawLabels(latlngs, labelDescription)

      const groupBBox = group.getBBox()
      L.SVG.setAttributes(whiteMask)({ ...L.SVG.inflate(groupBBox, 10) })
    }

    return {
      element: group,
      update
    }
  }
})
