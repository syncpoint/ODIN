import { K } from '../../../shared/combinators'

const modifier = modifier => ({
  value: feature => feature.properties[modifier],
  update: feature => value => {
    const properties = { ...feature.properties }
    properties[modifier] = value
    return { ...feature, properties }
  }
})

const replaceCharacter = (s, index, c) => {
  if (index > s.length - 1) return s
  return s.substring(0, index) + c + s.substring(index + 1)
}

const sidcPosition = position => ({
  value: feature => {
    const c = feature.properties.sidc[position]
    return c === '*' ? '' : c
  },
  update: state => value => {
    value = value ? value.substring(0, 1) : '*'
    const { properties } = state
    const sidc = replaceCharacter(properties.sidc, position, value)
    return { ...state, properties: { ...properties, sidc } }
  }
})

export const featureFields = ({
  _: {
    label: 'Name',
    // applies to all classes,
    value: feature => feature.title,
    update: feature => value => K(feature)(feature => (feature.title = value))
  },
  T: {
    label: 'Unique Designation',
    classes: { U: 21, E: 21, I: 21, SI: 21, SO: 21, EU: 21, EE: 21, EI: 21, P: 15, L: 15, A: 15, BL: 35, N: 15, 'B/C': 15 },
    ...modifier('t')
  },
  M: {
    label: 'Higher Formation',
    classes: { U: 21, SI: 21 },
    ...modifier('m')
  },
  B: {
    label: 'Echelon',
    classes: { U: true, SO: true, L: true, A: true, BL: true },
    ...sidcPosition(11)
  },
  C: {
    label: 'Quantity',
    classes: { E: 9, EE: 9, N: 6 },
    ...modifier('c')
  },
  D: {
    label: 'Task Force',
    classes: { U: true, SO: true },
    ...modifier('d')
  },
  F: {
    label: 'Reinforced/Reduced',
    classes: { U: 3, SO: 3 },
    ...modifier('f')
  },
  G: {
    label: 'Staff Comment',
    classes: { U: 20, E: 20, I: 20, SI: 20, SO: 20 },
    ...modifier('g')
  },
  Q: {
    label: 'Direction',
    classes: { U: 4, E: 4, SO: 4, EU: 4, EE: 4 },
    ...modifier('q')
  },
  Z: {
    label: 'Speed',
    classes: { U: 8, E: 8, SO: 8, EU: 8, EE: 8 },
    ...modifier('z')
  }
})
