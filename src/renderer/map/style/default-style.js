import { ipcRenderer } from 'electron'
import * as styles from 'ol/style'
import * as SIDC from './sidc'
import { primaryColor, accentColor } from './color-schemes'
import preferences from '../../project/preferences'
import { noop } from '../../../shared/combinators'

let labels = true
let lineWidth = 3
let symbolSize = 40
let scheme = 'medium'
let simpleStatusModifier = false
let symbolSizeByEchelon = true
let symbolTextSize = 40

const capitalize = value => {
  if (!value) return
  const objective = Array.from(value)
  objective[0] = objective[0].toUpperCase()
  return objective.join('')
}

const handlers = {
  preferences: ({ preferences }) => {
    labels = preferences.labels === false
      ? false
      : preferences.labels || true
    ipcRenderer.send('IPC_LABELS_TOGGLED', labels)

    ;({ lineWidth, symbolSize, scheme, simpleStatusModifier, symbolTextSize } = preferences)
  },
  set: ({ key, value }) => {
    if (key === 'labels') {
      labels = value
      ipcRenderer.send('IPC_LABELS_TOGGLED', labels)
    } else if (key === 'lineWidth') {
      lineWidth = value
    } else if (key === 'symbolSize') {
      symbolSize = value
    } else if (key === 'scheme') {
      scheme = value
    } else if (key === 'simpleStatusModifier') {
      simpleStatusModifier = value
    } else if (key === 'symbolSizeByEchelon') {
      symbolSizeByEchelon = value
    } else if (key === 'symbolTextSize') {
      symbolTextSize = value
    }
  },
  unset: ({ key }) => {
    if (key !== 'labels') return
    labels = false
    ipcRenderer.send('IPC_LABELS_TOGGLED', false)
  }
}

preferences.register(event => (handlers[event.type] || noop)(event))

ipcRenderer.on('IPC_TOGGLE_LABELS', () => {
  preferences.set('labels', !labels)
  ipcRenderer.send('IPC_LABELS_TOGGLED', false)
})

const style = options => new styles.Style(options)
const stroke = options => new styles.Stroke(options)
const circle = options => new styles.Circle(options)
const fill = options => new styles.Fill(options)
const text = options => new styles.Text(options)
const regularShape = options => new styles.RegularShape(options)


export const styleOptions = ({ feature }) => {
  const sidc = feature.get('sidc')

  return {
    primaryColor: primaryColor(scheme)(SIDC.identity(sidc)),
    accentColor: accentColor(SIDC.identity(sidc)),
    dashPattern: SIDC.status(sidc) === 'A' ? [20, 10] : null,
    thin: lineWidth,
    thick: 1.75 * lineWidth,
    symbolSize,
    scheme: capitalize(scheme),
    simpleStatusModifier,
    symbolSizeByEchelon,
    symbolTextSize
  }
}

export const defaultFont = () => `${lineWidth * 7 + 2}px sans-serif`
export const biggerFont = () => `${lineWidth * 7 + 4}px sans-serif`

const factory = options => write => {
  const { mode, resolution } = options

  return {
    solidLine: (inGeometry, opts = {}) => {
      const primaryColor = opts.color || options.primaryColor
      const accentColor = opts.accent || options.accentColor
      const fill = opts.fill
      const geometry = write(inGeometry)
      return [
        { width: options.thick, color: accentColor, lineDash: options.dashPattern, lineCap: 'butt' },
        { width: options.thin, color: primaryColor, lineDash: options.dashPattern, lineCap: 'butt' }
      ].map(options => style({ stroke: stroke(options), geometry, fill }))
    },

    singleLine: (inGeometry, opts = {}) => {
      const width = opts.width || lineWidth
      const color = opts.color || options.primaryColor
      const fill = opts.fill
      const geometry = write(inGeometry)
      return [
        { width, color, lineCap: 'butt' }
      ].map(options => style({ stroke: stroke(options), geometry, fill }))
    },

    filledPolygon: (inGeometry, opts = {}) => {
      const primaryColor = opts.color || options.primaryColor
      const geometry = write(inGeometry)
      return [
        { width: options.thick, color: options.accentColor, lineDash: options.dashPattern },
        { width: options.thin, color: primaryColor, lineDash: options.dashPattern }
      ].map(options => style({ stroke: stroke(options), geometry, fill: fill({ color: primaryColor }) }))
    },

    dashedLine: (inGeometry, opts = {}) => {
      const lineDash = opts.lineDash || [20, 10]
      const geometry = write(inGeometry)
      return [
        { width: options.thick, color: options.accentColor, lineDash },
        { width: options.thin, color: options.primaryColor, lineDash }
      ].map(options => style({ stroke: stroke(options), geometry }))
    },

    waspLine: inGeometry => {
      const geometry = write(inGeometry)
      return [
        { width: options.thick, color: 'black' },
        { width: options.thin, color: 'yellow', lineDash: [10, 10] }
      ].map(options => style({ stroke: stroke(options), geometry }))
    },

    wireFrame: inGeometry => {
      if (mode !== 'selected') return []
      const options = { color: 'red', lineDash: [20, 8, 2, 8], width: 1.5 }
      return style({ geometry: write(inGeometry), stroke: stroke(options) })
    },

    handles: (inGeometry, options = {}) => {
      if (mode === 'selected') {
        return [style({
          geometry: write(inGeometry),
          image: circle({
            fill: fill({ color: options.color || 'rgba(255,0,0,0.6)' }),
            stroke: stroke({ color: 'white', width: 3 }),
            radius: 7
          })
        })]
      } else if (mode === 'multi') {
        return [style({
          geometry: write(inGeometry),
          image: regularShape({
            fill: fill({ color: 'white' }),
            stroke: stroke({ color: 'black', width: 1 }),
            radius: 6,
            points: 4,
            angle: Math.PI / 4
          })
        })]
      } else return []
    },

    text: (inGeometry, options) => {
      const flipped = α => α > Math.PI / 2 && α < 3 * Math.PI / 2
      const textAlign = options.flip
        ? options.textAlign && options.textAlign(flipped(options.rotation))
        : options.textAlign

      const rotation = options.flip
        ? flipped(options.rotation) ? options.rotation - Math.PI : options.rotation
        : options.rotation

      const offsetX = options.flip
        ? options.offsetX && options.offsetX(flipped(options.rotation))
        : options.offsetX

      const fillColor = options.color ? options.color : 'black'
      return style({
        geometry: write(inGeometry),
        text: text({
          font: biggerFont(),
          stroke: stroke({ color: 'white', width: 3 }),
          fill: fill({ color: fillColor }),
          ...options,
          rotation,
          textAlign,
          offsetX
        })
      })
    },

    fill: color => fill({ color: color(options) }),

    // roughly 1:150,000
    showLabels: () => labels && resolution < 62
  }
}


const defaultImage = circle({
  radius: 6,
  fill: fill({ color: [0, 153, 255, 1] }),
  stroke: stroke({ color: 'white', width: 1.5 })
})


export const defaultStyle = feature => {
  const options = styleOptions({ feature })
  const geometry = feature.getGeometry()

  return [
    { width: options.thick, color: options.accentColor, lineDash: options.dashPattern, image: defaultImage },
    { width: options.thin, color: options.primaryColor, lineDash: options.dashPattern }
  ].map(options => style({ stroke: stroke(options), geometry }))
}

export const styleFactory = options => factory({ ...options, ...styleOptions(options) })
