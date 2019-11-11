/* eslint-disable */
import * as R from 'ramda'
import * as math from 'mathjs'
import { Style, Fill, Stroke, Circle } from 'ol/style'
import Icon from 'ol/style/Icon'
import { containsXY } from 'ol/extent'
import { Polygon, LineString, Point } from 'ol/geom'
import ms from 'milsymbol'

const ColorSchemes = {
  dark: {
    red: 'RGB(200, 0, 0)',
    blue: 'RGB(0, 107, 140)',
    green: 'RGB(0, 160, 0)',
    // recommended: 'RGB(225, 220, 0)'
    // more orange than yellow: 'RGB(225, 127, 0)'
    yellow: 'RGB(225, 127, 0)',
    purple: 'RGB(80, 0, 80)'
  },
  medium: {
    red: 'RGB(255, 48, 49)',
    blue: 'RGB(0, 168, 220)',
    green: 'RGB(0, 226, 0)',
    yellow: 'RGB(255, 255, 0)',
    purple: 'RGB(128, 0, 128)'
  }
}

/**
 * symbolStyle :: Feature -> Style
 *
 * NOTE: Style function is called frequently for all visible features.
 */
const symbolStyle = symbolOptions => {
  const anchor = symbol => [symbol.getAnchor().x, symbol.getAnchor().y]
  const imgSize = size => [Math.floor(size.width), Math.floor(size.height)]
  const options = icon => ({ image: icon })
  const style = options => new Style(options)
  const properties = feature => feature.getProperties()

  const icon = symbol => new Icon({
    scale: 0.4,
    anchor: anchor(symbol),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    imgSize: imgSize(symbol.getSize()),
    img: symbol.asCanvas()
  })

  // TODO: cache style per feature (ol_uid/revision).
  // featureStyle :: Feature -> resolution -> Style
  const symbol = infoFields => ({ sidc, t }) => new ms.Symbol(sidc, {
    uniqueDesignation: t,
    infoFields,
    ...symbolOptions
  })

  return (feature, resolution) => {
    const infoFields = resolution < 100
    const fn = resolution > 2000
      ? () => null
      : R.compose(style, options, icon, symbol(infoFields), properties)
    return fn(feature)
  }
}

const strokeColor = (sidc, n) => {
  const colorScheme = ColorSchemes['medium']
  if (n === 'ENY') return colorScheme.red
  const identity = sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
  switch (identity) {
    case 'F': return colorScheme.blue
    case 'H': return colorScheme.red
    case 'N': return colorScheme.green
    case 'U': return colorScheme.yellow
    default: return 'black'
  }
}

const strokeOutlineColor = sidc => {
  const identity = sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
  return identity === '*' ? 'white' : 'black'
}

/**
 * normSidc :: string -> string
 */
const normSidc = sidc => `${sidc[0]}-${sidc[2]}-${sidc.substring(4, 10)}`

const defaultGfxStyle = feature => {
  const { sidc, n } = feature.getProperties()
  return [
    new Style({ stroke: new Stroke({ color: strokeOutlineColor(sidc), width: 3 }) }),
    new Style({ stroke: new Stroke({ color: strokeColor(sidc, n), width: 2 }) })
  ]
}

const axisIntersect = (points, y, z) => {
  return R.aperture(2, points).reduce((acc, segment) => {
    const w = segment[0]
    const x = segment[1]
    const intersection = math.intersect(w, x, y, z)
    if (!intersection) return acc

    const lineExtent = new LineString(segment).getExtent()
    if (containsXY(lineExtent, intersection[0], intersection[1])) {
      acc.push(intersection)
    }

    return acc
  }, [])
}

const placements = geometry => {
  if (!(geometry instanceof Polygon)) return

  const ring = geometry.getLinearRing(0)
  const extent = ring.getExtent()
  const interiorPoint = geometry.getInteriorPoint().getCoordinates()

  const hIntersect = () => {
    const points = axisIntersect(ring.getCoordinates(), [extent[0], interiorPoint[1]], [extent[2], interiorPoint[1]])
    if (points.length !== 2) return {}
    return {
      east: new Point(points[0][0] > points[1][0] ? points[0] : points[1]),
      west: new Point(points[0][0] > points[1][0] ? points[1] : points[0])
    }
  }

  const vIntersect = () => {
    const points = axisIntersect(ring.getCoordinates(), [interiorPoint[0], extent[1]], [interiorPoint[0], extent[3]])
    if (points.length !== 2) return {}
    return {
      north: new Point(points[0][1] > points[1][1] ? points[1] : points[0]),
      south: new Point(points[0][1] > points[1][1] ? points[0] : points[1])
    }
  }

  const width = 3
  const pointStyle = point => new Style({
    image: new Circle({
      radius: width * 2,
      stroke: new Stroke({
        color: 'red',
        width: width / 2
      })
    }),
    geometry: point
  })

  const intersections = { ...hIntersect(), ...vIntersect() }
  return Object.values(intersections)
    .reduce((acc, point) => {
      acc.push(point)
      return acc
    }, [geometry.getInteriorPoint()])
    .map(pointStyle)
}

const styles = {}

// G-M-OFA--- : MINDED AREA : TACGRP.MOBSU.OBST.MNEFLD.MNDARA
styles['G-M-OFA---'] = feature => {
  placements(feature.getGeometry())
  const style = defaultGfxStyle(feature)
  return [...style, ...placements(feature.getGeometry())]
}

// G-G-OLAGM- : MAIN ATTACK : TACGRP.C2GM.OFF.LNE.AXSADV.GRD.MANATK
styles['G-G-OLAGM-'] = feature => null

// G-G-GLL--- : LIGHT LINE : TACGRP.C2GM.GNL.LNE.LITLNE
styles['G-G-GLL---'] = feature => null

const gfxStyle = modeOptions => (feature, resolution) => {
  const { sidc } = feature.getProperties()
  return (styles[normSidc(sidc)] || defaultGfxStyle)(feature)
}

const featureStyle = modeOptions => (feature, resolution) => {
  if (!feature.getGeometry()) return null
  const fn = feature.getGeometry().getType() === 'Point'
    ? symbolStyle
    : gfxStyle

  return fn(modeOptions)(feature, resolution)
}

export const defaultStyle = featureStyle({
  mode: 'default',
  outlineWidth: 3,
  outlineColor: 'white'
})

export const highlightStyle = featureStyle({
  mode: 'highlighted',
  outlineWidth: 6,
  outlineColor: 'black',
  monoColor: 'white'
})
