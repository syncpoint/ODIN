import * as R from 'ramda'
import Disposable from '../../../shared/disposable'
import Timed from '../../../shared/timed'
import { K, noop } from '../../../shared/combinators'
import evented from '../../evented'
import mapSettings from './settings'

export const descriptors = {
  brightness: { label: 'Brightness', value: 100, min: 0, max: 100, delta: 5, unit: '%', display: '%' },
  contrast: { label: 'Contrast', value: 100, min: 0, max: 200, delta: 5, unit: '%', display: '%' },
  grayscale: { label: 'Grayscale', value: 0, min: 0, max: 100, delta: 5, unit: '%', display: '%' },
  'hue-rotate': { label: 'Hue', value: 0, min: 0, max: 360, delta: 10, unit: 'deg', display: '°' },
  invert: { label: 'Invert', value: 0, min: 0, max: 100, delta: 5, unit: '%', display: '%' },
  sepia: { label: 'Sepia', value: 0, min: 0, max: 100, delta: 5, unit: '%', display: '%' }
}

export const defaultValues = () => Object.entries(descriptors)
  .reduce((acc, [name, { value, unit }]) => K(acc)(acc => (acc[name] = { value, unit })), {})

let state = null

export const COMMAND_ADJUST = _ => filter => {
  if (state) state.dispose()
  state = (() => {
    const disposable = Disposable.of({})
    const descriptor = descriptors[filter]
    const values = () => mapSettings.get('displayFilters') || defaultValues()
    const currentValues = values()
    const apply = () => mapSettings.set('displayFilters', currentValues)
    const cancel = () => evented.emit('MAP:DISPLAY_FILTER_CHANGED', values())
    const timer = Timed.of(3000, R.compose(disposable.dispose, apply))({})
    evented.emit('OSD_MESSAGE', { message: `${descriptor.label}: ${currentValues[filter].value}${descriptor.display}` })

    const refresh = value => {
      if (value < descriptor.min || value > descriptor.max) return
      currentValues[filter].value = value
      evented.emit('OSD_MESSAGE', { message: `${descriptor.label}: ${value}${descriptor.display}` })
      timer.refreshTimeout(2000)
      evented.emit('MAP:DISPLAY_FILTER_CHANGED', currentValues)
    }

    const decrease = () => refresh(currentValues[filter].value - descriptor.delta)
    const increase = () => refresh(currentValues[filter].value + descriptor.delta)
    const stopPropagation = event => K(event)(event => event.stopPropagation())

    const actions = {
      'ArrowLeft': R.compose(decrease, stopPropagation),
      'ArrowDown': R.compose(decrease, stopPropagation),
      'ArrowRight': R.compose(increase, stopPropagation),
      'ArrowUp': R.compose(increase, stopPropagation),
      'Escape': R.compose(disposable.dispose, cancel, stopPropagation),
      'Enter': R.compose(disposable.dispose, apply, stopPropagation)
    }

    // NOTE: To prevent panning, we capture keydown events so that they don't reach the map (while trickling down).
    const onkeydown = event => (actions[event.key] || noop)(event)
    const useCapture = true
    document.addEventListener('keydown', onkeydown, useCapture)

    disposable.addDisposable(timer.clearTimeout)
    disposable.addDisposable(() => document.removeEventListener('keydown', onkeydown, useCapture))
    disposable.addDisposable(() => evented.emit('OSD_MESSAGE', { message: '' }))
    disposable.addDisposable(() => evented.emit('MAP:FOCUS'))

    return disposable
  })()
}

export const COMMAND_RESET_FILTERS = context => () => {
  const values = defaultValues()
  mapSettings.set('displayFilters', values)
  evented.emit('MAP:DISPLAY_FILTER_CHANGED', values)
}
