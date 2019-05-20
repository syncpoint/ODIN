import { K } from '../../shared/combinators'

export const descriptors = {
  brightness: { label: 'Brightness', value: 100, min: 0, max: 100, delta: 5, unit: '%' },
  contrast: { label: 'Contrast', value: 100, min: 0, max: 200, delta: 5, unit: '%' },
  grayscale: { label: 'Grayscale', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
  'hue-rotate': { label: 'Hue', value: 0, min: 0, max: 360, delta: 10, unit: 'deg', display: '°' },
  invert: { label: 'Invert', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
  sepia: { label: 'Sepia', value: 0, min: 0, max: 100, delta: 5, unit: '%' }
}

export const defaultValues = () => Object.entries(descriptors)
  .reduce((acc, [name, { value, unit }]) => K(acc)(acc => (acc[name] = { value, unit })), {})
