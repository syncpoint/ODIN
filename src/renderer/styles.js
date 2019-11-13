/* eslint-disable */
import * as R from 'ramda'
import * as math from 'mathjs'
import { Style, Fill, Stroke, Circle, Text } from 'ol/style'
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

const segmentIntersect = (y, z) => segment => {
  const intersection = math.intersect(segment[0], segment[1], y, z)
  if (!intersection) return []
  const extent = new LineString(segment).getExtent()
  if (!containsXY(extent, intersection[0], intersection[1])) return []
  return [intersection]
}

const axisIntersect = (points, y, z) => R
  .aperture(2, points)
  .map(segment => segmentIntersect(y, z)(segment))
  .reduce((acc, intersections) => acc.concat(intersections), [])


const directionalPlacements = polygon => {
  if (!(polygon instanceof Polygon)) return

  const ring = polygon.getLinearRing(0)
  const box = ring.getExtent()
  const points = ring.getCoordinates()
  const C = polygon.getInteriorPoint().getCoordinates()

  const hIntersect = () => {
    const xs = axisIntersect(points, [box[0], C[1]], [box[2], C[1]])
    return xs.length !== 2 ? {} : {
      east: new Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1]),
      west: new Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
    }
  }

  const vIntersect = () => {
    const xs = axisIntersect(points, [C[0], box[1]], [C[0], box[3]])
    return xs.length !== 2 ? {} : {
      north: new Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0]),
      south: new Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
    }
  }

  return { ...hIntersect(), ...vIntersect() }
}

const styles = {}

const textStyle = ({ geometry, text }) => new Style({
  geometry,
  text: new Text({
    text,
    font: '16px sans-serif',
    stroke: new Stroke({ color: 'white', width: 3 })
  })
})


const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const atan2 = delta => -1 * Math.atan2(delta[0], delta[1])
const normalizeAngle = x => x < 0 ? 2 * Math.PI + x : x
const segmentAngle = R.compose(normalizeAngle, atan2, vector)

// G-M-OFA--- : MINDED AREA : TACGRP.MOBSU.OBST.MNEFLD.MNDARA
styles['G-M-OFA---'] = feature => {

  const labelStyles = feature => {
    const labels = text => xs => xs.map(placement => ({ text, placement }))
    const placements = directionalPlacements(feature.getGeometry())
    return labels('M')(['east', 'west', 'north', 'south'])
      .map(({ placement, text }) => ({ geometry: placements[placement], text }))
      .filter(({ geometry }) => geometry)
      .map(textStyle)
  }

  return [defaultGfxStyle, labelStyles].flatMap(fn => fn(feature))
}

// G-G-OLAGM- : MAIN ATTACK : TACGRP.C2GM.OFF.LNE.AXSADV.GRD.MANATK
styles['G-G-OLAGM-'] = feature => null

// G-G-GLL--- : LIGHT LINE : TACGRP.C2GM.GNL.LNE.LITLNE
styles['G-G-GLL---'] = feature => {
  const segments = R.aperture(2, feature.getGeometry().getCoordinates())


  const textStyle = ({ geometry, rotation, textAlign, text, offsetX }) => new Style({
    geometry,
    text: new Text({
      text,
      rotation,
      textAlign,
      offsetX,
      font: '16px sans-serif',
      stroke: new Stroke({ color: 'white', width: 3 })
    })
  })

  const α1 = segmentAngle(segments[0])
  const αn = segmentAngle(segments[segments.length - 1])
  const flip = α => (α > Math.PI / 2 && α < Math.PI * 3 / 2) ? true : false

  const labelStyles = () => [
    textStyle({
      geometry: new Point(segments[0][0]),
      rotation: flip(α1) ? α1 - Math.PI : α1,
      textAlign: flip(α1) ? 'end' : 'start',
      offsetX: flip(α1) ? 20 : -20,
      text: 'Cinderella'
    }),
    textStyle({
      geometry: new Point(segments[segments.length - 1][1]),
      rotation: flip(αn) ? αn - Math.PI : αn,
      textAlign: flip(αn) ? 'start' : 'end',
      offsetX: flip(αn) ? -20 : 20,
      text: 'Snow White and\nthe Seven Dwarfs'
    })
  ]

  return [defaultGfxStyle, labelStyles].flatMap(fn => fn(feature))
}

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
