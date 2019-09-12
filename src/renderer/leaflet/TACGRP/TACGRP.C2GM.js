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

const effectiveLine = properties => {
  if (!properties.w && !properties.w1) return null
  if (properties.w && properties.w1) return `${properties.w}-${properties.w1}`
  if (properties.w) return `${properties.w}`
  if (properties.w1) return `${properties.w1}`
}

const namedArea = name => {
  return (feature, options) => {
    const renderOptions = {
      styles,
      labels: feature => [
        {
          placement: 'center',
          alignment: 'center',
          lines: [`<bold>${name}</bold>`, feature.properties.t]
        }
      ]
    }
    return new L.Feature.PolygonArea(feature, renderOptions, options)
  }
}

const titleOnlyArea = () => {
  return (feature, options) => {
    const renderOptions = {
      styles,
      labels: feature => [
        {
          placement: 'center',
          alignment: 'center',
          lines: [feature.properties.t]
        }
      ]
    }
    return new L.Feature.PolygonArea(feature, renderOptions, options)
  }
}

L.Feature['G*G*GAA---'] = namedArea('AA')
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
L.Feature['G*G*DAB---'] = titleOnlyArea()
L.Feature['G*G*DABP--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'mask' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'center',
          lines: [
            `(P) ${feature.properties.t}`,
            effectiveLine(feature.properties)
          ]
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

L.Feature['G*F*ATS---'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: [
          '<bold>SMOKE</bold>',
          effectiveLine(feature.properties)
        ]
      }
    ]
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*S*AR----'] = namedArea('FARP')

// NOTE: No distinction: IRREGULAR/RECTANGULAR, but no CIRCULAR
L.Feature['G*F*ACFI--'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: [
          '<bold>FFA</bold>',
          feature.properties.t,
          effectiveLine(feature.properties)
        ]
      }
    ]
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACFR--'] = L.Feature['G*F*ACFI--']

L.Feature['G*F*ACNI--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: [
          '<bold>NFA</bold>',
          feature.properties.t,
          effectiveLine(feature.properties)
        ]
      }
    ]
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACNR--'] = L.Feature['G*F*ACNI--']
L.Feature['G*F*ACRI--'] = (feature, options) => {
  const renderOptions = {
    styles,
    labels: feature => [
      {
        placement: 'center',
        alignment: 'center',
        lines: [
          '<bold>RFA</bold>',
          feature.properties.t,
          effectiveLine(feature.properties)
        ]
      }
    ]
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*F*ACRR--'] = L.Feature['G*F*ACRI--']

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

L.Feature['G*F*ACAI--'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'backdrop' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'left',
          lines: [
            '<bold>ACA</bold>',
            feature.properties.t,
            feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
            feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
            feature.properties.h ? `GRIDS: ${feature.properties.h}` : null,
            feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
            feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
          ]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

// Limited Access Area
L.Feature['G*G*GAY---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          lines: [feature.properties.h]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

const missleEnganementZone = name => (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'backdrop' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'left',
          lines: [
            `<bold>${name}</bold>`,
            feature.properties.t,
            feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
            feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
            feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
            feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
          ]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}


L.Feature['G*G*AAM---'] = missleEnganementZone('MEZ')
L.Feature['G*G*AAML--'] = missleEnganementZone('LOMEZ')
L.Feature['G*G*AAMH--'] = missleEnganementZone('HIMEZ')

// WeaponS Free Zone
L.Feature['G*G*AAW---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), fill: 'diagonal', clipping: 'backdrop' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'left',
          lines: [
            '<bold>WFZ</bold>',
            feature.properties.t,
            feature.properties.w ? `EFF. FROM: ${feature.properties.w}` : null,
            feature.properties.w1 ? `EFF. TO: ${feature.properties.w1}` : null
          ]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*AAR---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'backdrop' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'left',
          lines: [
            '<bold>ROZ</bold>',
            feature.properties.t,
            feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
            feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
            feature.properties.w ? `TIME FROM: ${feature.properties.w}` : null,
            feature.properties.w1 ? `TIME TO: ${feature.properties.w1}` : null
          ]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}

L.Feature['G*G*AAF---'] = (feature, options) => {
  const renderOptions = {
    styles: feature => ({ ...styles(feature), clipping: 'backdrop' }),
    labels: feature => {
      const labels = [
        {
          placement: 'center',
          alignment: 'left',
          lines: [
            '<bold>SHORADEZ</bold>',
            feature.properties.t,
            feature.properties.x ? `MIN ALT: ${feature.properties.x}` : null,
            feature.properties.x1 ? `MAX ALT: ${feature.properties.x1}` : null,
            feature.properties.w ? `TIME FROM: ${feature.properties.w}` : null,
            feature.properties.w1 ? `TIME TO: ${feature.properties.w1}` : null
          ]
        }
      ]

      return labels
    }
  }

  return new L.Feature.PolygonArea(feature, renderOptions, options)
}
