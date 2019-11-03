export const ColorSchemes = {
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
    purple: '128, 0, 128'
  }
}

export const strokeDashArray = () => '20 5'

// STYLES
// * clipping: none | mask | backdrop
// * stroke: path stroke color
// * patternStroke: fill pattern stroke color
// * strokeWidth: path stroke with
// * strokeDashArray: path stroke dash pattern
// * fill: none | diagonal

export const styles = feature => {
  const colorSchemes = ColorSchemes['medium']

  const { sidc, n } = feature.properties
  const _stroke = () => {
    if (n === 'ENY') return colorSchemes.red

    const identity = sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
    switch (identity) {
      case 'F': return colorSchemes.blue
      case 'H': return colorSchemes.red
      case 'N': return colorSchemes.green
      case 'U': return colorSchemes.yellow
      default: return 'black'
    }
  }

  const _outlineStroke = () => {
    const identity = sidc ? sidc[1] : 'U' // identity or U - UNKNOWN
    return identity === '*' ? 'white' : 'black'
  }

  const _strokeDashArray = () => {
    const status = sidc ? sidc[3] : 'P' // status or P - PRESENT
    if (status === 'A') return strokeDashArray()
  }

  return {
    clipping: 'none',

    // Colored path outline to increase contrast.
    contrast: {
      stroke: _outlineStroke(),
      strokeWidth: 3,
      strokeLinejoin: 'round',
      strokeDasharray: _strokeDashArray(),
      fill: 'none'
    },

    // Principal path style.
    path: {
      stroke: _stroke(),
      strokeWidth: 2,
      strokeLinejoin: 'round',
      strokeDasharray: _strokeDashArray(),
      fill: 'none'
    },

    // Transparent path to ease selection.
    outline: {
      stroke: 'yellow',
      strokeWidth: 12,
      fill: 'none',
      opacity: 0.0
    }
  }
}
