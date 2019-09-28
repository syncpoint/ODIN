import L from 'leaflet'
import '../PolygonArea'
import './TACGRP.C2GM.GNL.ARS.SRHARA'
import './TACGRP.C2GM.GNL.LNE.BNDS'
import './TACGRP.C2GM.OFF.LNE.AXSADV.GRD.MANATK'

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
    purple: '128, 0, 128'
  }
}

// STYLES
// * clipping: none | mask | backdrop
// * stroke: path stroke color
// * patternStroke: fill pattern stroke color
// * strokeWidth: path stroke with
// * strokeDashArray: path stroke dash pattern
// * fill: none | diagonal

const styles = feature => {
  const colorSchemes = ColorSchemes['dark']

  const { sidc, n } = feature.properties
  const stroke = () => {
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

  const strokeDashArray = () => {
    const status = sidc ? sidc[3] : 'P' // status or P - PRESENT
    if (status === 'A') return '15 5'
  }

  return {
    clipping: 'none',
    stroke: stroke(),
    patternStroke: stroke(),
    strokeWidth: 3,
    strokeDashArray: strokeDashArray(),
    fill: 'none'
  }
}

const effectiveLine = properties => {
  if (!properties.w && !properties.w1) return null
  if (properties.w && properties.w1) return `${properties.w}-${properties.w1}`
  if (properties.w) return `${properties.w}`
  if (properties.w1) return `${properties.w1}`
}

const centerLabel = lines => [{ placement: 'center', alignment: 'center', lines }]
const centerLabelLeft = lines => [{ placement: 'center', alignment: 'left', lines }]

const axisLabelsNSEW = line => ['north', 'south', 'east', 'west'].map(placement => ({
  placement,
  lines: [line]
}))

const axisLabelsEW = line => ['east', 'west'].map(placement => ({
  placement,
  lines: [line]
}))

const namedArea = name => {
  return (feature, options) => {
    const renderOptions = {
      styles,
      labels: feature => centerLabel([`<bold>${name}</bold>`, feature.properties.t])
    }
    return new L.Feature.PolygonArea(feature, renderOptions, options)
  }
}

const titledArea = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => centerLabel([feature.properties.t])
  }
  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

// Generic/default area:
L.Feature.PolygonAreaTitled = titledArea

L.Feature['G*G*GAA---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = centerLabel([`<bold>AA</bold>`, feature.properties.t])
      if (feature.properties.n) return labels.concat(axisLabelsEW('ENY'))
      else return labels
    }
  }
  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*GAE---'] = namedArea('EA')
L.Feature['G*G*GAD---'] = namedArea('DZ')
L.Feature['G*G*GAX---'] = namedArea('EZ')
L.Feature['G*G*GAP---'] = namedArea('PZ')
L.Feature['G*G*GAL---'] = namedArea('LZ')
L.Feature['G*G*OAK---'] = namedArea('ATK')
L.Feature['G*G*OAO---'] = namedArea('OBJ')
L.Feature['G*G*SAO---'] = namedArea('AO')
L.Feature['G*G*SAN---'] = namedArea('NAI')
L.Feature['G*G*SAT---'] = namedArea('TAI')

// TODO: needs echelon
L.Feature['G*G*DAB---'] = titledArea
L.Feature['G*G*DABP--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = centerLabel([
        feature.properties.t ? `(P) ${feature.properties.t}` : '(P)',
        effectiveLine(feature.properties)
      ])
      if (feature.properties.n) return labels.concat(axisLabelsEW('ENY'))
      else return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ATS---'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => centerLabel([
      '<bold>SMOKE</bold>',
      effectiveLine(feature.properties)
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*S*AR----'] = namedArea('FARP')

// NOTE: No distinction: IRREGULAR/RECTANGULAR, but no CIRCULAR
L.Feature['G*F*ACFI--'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => centerLabel([
      '<bold>FFA</bold>',
      feature.properties.t,
      effectiveLine(feature.properties)
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACFR--'] = L.Feature['G*F*ACFI--']

L.Feature['G*F*ACNI--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => centerLabel([
      '<bold>NFA</bold>',
      feature.properties.t,
      effectiveLine(feature.properties)
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACNR--'] = L.Feature['G*F*ACNI--']
L.Feature['G*F*ACRI--'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => centerLabel([
      '<bold>RFA</bold>',
      feature.properties.t,
      effectiveLine(feature.properties)
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACRR--'] = L.Feature['G*F*ACRI--']

L.Feature['G*M*OFA---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: _ => axisLabelsNSEW('M')
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

// GENERAL AREA
L.Feature['G*G*GAG---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = centerLabel([feature.properties.t])
      if (feature.properties.n) labels.concat(axisLabelsEW('ENY'))
      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*M*OU----'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabel([feature.properties.t]).concat(axisLabelsEW('UXO'))
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*S*AD----'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabel([
      '<bold>DETAINEE</bold>',
      '<bold>HOLDING</bold>',
      '<bold>AREA</bold>',
      feature.properties.t
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

// AIRSPACE COORDINATION AREA, IRREGULAR
L.Feature['G*F*ACAI--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'backdrop' }),
    labels: feature => centerLabelLeft([
      '<bold>ACA</bold>',
      feature.properties.t,
      feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
      feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
      feature.properties.h ? `GRIDS: ${feature.properties.h}` : null,
      feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
      feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

// Limited Access Area
L.Feature['G*G*GAY---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => centerLabel([feature.properties.h])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

const missleEnganementZone = name => (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabelLeft([
      `<bold>${name}</bold>`,
      feature.properties.t,
      feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
      feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
      feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
      feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}


L.Feature['G*G*AAM---'] = missleEnganementZone('MEZ')
L.Feature['G*G*AAML--'] = missleEnganementZone('LOMEZ')
L.Feature['G*G*AAMH--'] = missleEnganementZone('HIMEZ')

// Weapons Free Zone
L.Feature['G*G*AAW---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => centerLabelLeft([
      '<bold>WFZ</bold>',
      feature.properties.t,
      feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
      feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*AAR---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabelLeft([
      '<bold>ROZ</bold>',
      feature.properties.t,
      feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
      feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
      feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
      feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*AAF---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabelLeft([
      '<bold>SHORADEZ</bold>',
      feature.properties.t,
      feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
      feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
      feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
      feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*S*AE----'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabel([
      '<bold>EPW</bold>',
      '<bold>HOLDING</bold>',
      '<bold>AREA</bold>',
      feature.properties.t
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*S*AH----'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => centerLabel([
      '<bold>REFUGEE</bold>',
      '<bold>HOLDING</bold>',
      '<bold>AREA</bold>',
      feature.properties.t
    ])
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}
