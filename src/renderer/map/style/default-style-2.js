/* eslint-disable camelcase */
import * as ol_style from 'ol/style'
import * as SIDC from './sidc'
import { primaryColor, accentColor } from './color-schemes'

const style = options => new ol_style.Style(options)
const stroke = options => new ol_style.Stroke(options)
const circle = options => new ol_style.Circle(options)
const fill = options => new ol_style.Fill(options)
const text = options => new ol_style.Text(options)
const regularShape = options => new ol_style.RegularShape(options)

const scheme = 'medium'
const styleOptions = feature => {
  const sidc = feature.get('sidc')

  return {
    primaryColor: primaryColor(scheme)(SIDC.identity(sidc)),
    accentColor: accentColor(SIDC.identity(sidc)),
    dashPattern: SIDC.status(sidc) === 'A' ? [20, 10] : null,
    thin: 2,
    thick: 3.5
  }
}

const styles = (mode, options) => write => ({
  solidLine: inGeometry => {
    const geometry = write(inGeometry)
    return [
      { width: options.thick, color: options.accentColor, lineDash: options.dashPattern },
      { width: options.thin, color: options.primaryColor, lineDash: options.dashPattern }
    ].map(options => style({ stroke: stroke(options), geometry }))
  },

  dashedLine: inGeometry => {
    const geometry = write(inGeometry)
    return [
      { width: options.thick, color: options.accentColor, lineDash: [20, 10] },
      { width: options.thin, color: options.primaryColor, lineDash: [20, 10] }
    ].map(options => style({ stroke: stroke(options), geometry }))
  },

  wireFrame: inGeometry => {
    if (mode !== 'selected') return []
    const options = { color: 'red', lineDash: [20, 8, 2, 8], width: 1.5 }
    return style({ geometry: write(inGeometry), stroke: stroke(options) })
  },

  handles: inGeometry => {
    if (mode === 'selected') {
      return style({
        geometry: write(inGeometry),
        image: circle({
          fill: fill({ color: 'rgba(255,0,0,0.6)' }),
          stroke: stroke({ color: 'white', width: 3 }),
          radius: 7
        })
      })
    } else if (mode === 'multi') {
      return style({
        geometry: write(inGeometry),
        image: regularShape({
          fill: fill({ color: 'white' }),
          stroke: stroke({ color: 'black', width: 1 }),
          radius: 6,
          points: 4,
          angle: Math.PI / 4
        })
      })
    } else return []
  },

  // TODO: callbacks for text rotation/flipping/alignment
  text: (inGeometry, options) => {
    return style({
      geometry: write(inGeometry),
      text: text({
        font: '16px sans-serif',
        stroke: stroke({ color: 'white', width: 3 }),
        ...options
      })
    })
  },

  fill: (inGeometry, options) => style({
    geometry: write(inGeometry),
    fill: fill(options)
  })
})

export default (mode, feature) => styles(mode, styleOptions(feature))
