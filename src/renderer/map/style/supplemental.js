import * as R from 'ramda'
import * as geom from 'ol/geom'
import { Fill, Stroke } from 'ol/style'
import { parameterized } from '../../components/SIDC'
import { styleFactory } from './default-style'

const styleFn = {
  'X*-*T-----': ({ feature, styles }) => {
    const text = feature.get('text')
    const rotation = parseInt(feature.get('rotation') || 0) / 180 * Math.PI
    const color = feature.get('textColor') || 'black'
    const outlineColor = feature.get('outlineColor') || '#fefefe'
    const outlineWidth = parseInt(feature.get('outlineWidth') || '3')
    const backgroundColor = feature.get('backgroundColor') || '#fefefe'
    const borderColor = feature.get('borderColor')
    const borderWidth = parseInt(feature.get('borderWidth') || '1')
    const fontSize = parseInt(feature.get('fontSize') || '18')

    const stroke = feature.get('outline')
      ? new Stroke({ color: outlineColor, width: outlineWidth })
      : null

    const backgroundFill = feature.get('background')
      ? new Fill({ color: backgroundColor })
      : null

    const backgroundStroke = feature.get('border')
      ? new Stroke({ color: borderColor, width: borderWidth })
      : null

    const padding = (() => {
      const padding = parseInt(feature.get('padding') || '6')
      return [padding, padding, padding, padding]
    })()

    const font = `${fontSize}px sans-serif`

    const geometry = feature.getGeometry()

    return [
      styles.text(geometry, {
        text,
        textAlign: 'left',
        color,
        rotation,
        backgroundFill,
        backgroundStroke,
        stroke,
        padding,
        font
      }),
      ...styles.handles(geometry)
    ].flat()
  },
  'X*-*L-----': ({ feature, styles }) => {
    const geometry = feature.getGeometry()
    const points = geometry.getCoordinates().map(point => new geom.Point(point))
    const color = feature.get('color') || 'black'
    return [
      styles.singleLine(geometry, { color }),
      ...styles.handles(new geom.GeometryCollection(points))
    ].flat()
  },
  'X*-*P-----': ({ feature, styles }) => {
    const geometry = feature.getGeometry()
    const points = geometry.getCoordinates().map(point => new geom.Point(point))
    const color = feature.get('color') || 'black'
    const backgroundColor = feature.get('backgroundColor') || '#fefefe'
    const fill = feature.get('background')
      ? new Fill({ color: backgroundColor })
      : null


    return [
      styles.singleLine(geometry, { color, fill }),
      ...styles.handles(new geom.GeometryCollection(points))
    ].flat()
  }
}

export const supplementalStyle = mode => (feature, resolution) => {
  const sidc = parameterized(feature.getProperties().sidc)
  const fn = styleFn[sidc]
  if (!fn) return []

  const factory = styleFactory({ mode, feature, resolution })(R.identity)
  const options = { feature, resolution, styles: factory }
  const styles = fn(options)
  return styles
}
