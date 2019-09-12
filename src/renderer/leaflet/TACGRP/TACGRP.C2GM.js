import L from 'leaflet'
import '../NamedArea'
import '../PolygonArea'
import './TACGRP.C2GM.GNL.LNE.BNDS'

const ColorSchemes = {
  dark: {
    red: 'RGB(200, 0, 0)',
    blue: 'RGB(0, 107, 140)',
    green: 'RGB(0, 160, 0)',
    yellow: 'RGB(225, 220, 0)',
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

const styles = feature => {
  const colorSchemes = ColorSchemes['dark']

  const { sidc, n } = feature.properties
  const stroke = () => {
    if (n === 'ENY') return colorSchemes.red

    switch (sidc[1]) {
      case 'F': return colorSchemes.blue
      case 'H': return colorSchemes.red
      case 'N': return colorSchemes.green
      default: return 'black'
    }
  }

  const strokeDashArray = () => {
    if (sidc[3] === 'A') return '10 5'
  }

  return {
    clipping: 'none',
    stroke: stroke(),
    patternStroke: stroke(),
    strokeWidth: 3,
    strokeDashArray: strokeDashArray(),
    fill: 'none' // TODO: supply from PolygonArea client
  }
}

L.Feature['G*G*GAA---'] = L.Feature.NamedArea.extend({ name: 'AA' })
L.Feature['G*G*GAE---'] = L.Feature.NamedArea.extend({ name: 'EA' })
L.Feature['G*G*GAD---'] = L.Feature.NamedArea.extend({ name: 'DZ' })
L.Feature['G*G*GAX---'] = L.Feature.NamedArea.extend({ name: 'EZ' })
L.Feature['G*G*GAP---'] = L.Feature.NamedArea.extend({ name: 'PZ' })
L.Feature['G*G*GAL---'] = L.Feature.NamedArea.extend({ name: 'LZ' })
L.Feature['G*G*OAK---'] = L.Feature.NamedArea.extend({ name: 'ATK' })
L.Feature['G*G*OAO---'] = L.Feature.NamedArea.extend({ name: 'OBJ' })
L.Feature['G*G*SAO---'] = L.Feature.NamedArea.extend({ name: 'AO' })
L.Feature['G*G*SAN---'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: ['<bold>NAI</bold>', feature.properties.t]
      }
    ]
  }
  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*SAT---'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: ['<bold>TAI</bold>', feature.properties.t]
      }
    ]
  }
  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*DAB---'] = L.Feature.Polygon // TODO: needs echelon
L.Feature['G*F*ATS---'] = L.Feature.NamedArea.extend({ name: 'SMOKE' }) // TODO: W/W1
L.Feature['G*S*AR----'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: ['<bold>FARP</bold>', feature.properties.t]
      }
    ]
  }
  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

// NOTE: No distinction: IRREGULAR/RECTANGULAR, but no CIRCULAR
L.Feature['G*F*ACFI--'] = L.Feature.NamedArea.extend({ name: 'FFA' }) // TODO: W/W1
L.Feature['G*F*ACFR--'] = L.Feature.NamedArea.extend({ name: 'FFA' }) // TODO: W/W1

// TODO: W/W1, fill pattern
L.Feature['G*F*ACNI--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: ['<bold>NFA</bold>', feature.properties.t]
      }
    ]
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACNR--'] = L.Feature.NamedArea.extend({ name: 'NFA' }) // TODO: W/W1, fill pattern
L.Feature['G*F*ACRI--'] = L.Feature.NamedArea.extend({ name: 'RFA' }) // TODO: W/W1
L.Feature['G*F*ACRR--'] = L.Feature.NamedArea.extend({ name: 'RFA' }) // TODO: W/W1

L.Feature['G*M*OFA---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: _ => ['north', 'south', 'east', 'west'].map(placement => ({
      placement,
      fontSize: 16,
      lines: ['M']
    }))
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*GAG---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'center',
          lines: [feature.properties.t]
        }
      ]

      if (feature.properties.n) {
        ['east', 'west'].map(placement => {
          labels.push({
            placement,
            fontSize: 16,
            lines: ['ENY']
          })
        })
      }

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*M*OU----'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'center',
          lines: [feature.properties.t]
        }
      ]

      ;['east', 'west'].map(placement => {
        labels.push({
          placement,
          fontSize: 16,
          lines: ['UXO']
        })
      })

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*S*AD----'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'center',
          lines: [
            '<bold>DETAINEE</bold>',
            '<bold>HOLDING</bold>',
            '<bold>AREA</bold>',
            feature.properties.t
          ]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}


