/*
  Dependencies:
  map :: L.Map (global)
*/

const map = require('./map')

const {ipcRenderer} = require('electron')
const R = require('ramda')
const { K, noop } = require('../../shared/predef')
const Disposable = require('../common/disposable')
const Timed = require('../common/timed')
const { displayFilter } = require('./user-settings')

// Available settings options (defaults):
const descriptors = {
  brightness: { label: 'Brightness', value: 100, min: 0, max: 100, delta: 5, unit: '%' },
  contrast: { label: 'Contrast', value: 100, min: 0, max: 200, delta: 5, unit: '%' },
  grayscale: { label: 'Grayscale', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
  // TODO: remove when no longer needed.
  "hue-rotate": { label: 'Hue', value: 0, min: 0, max: 360, delta: 10, unit: 'deg', display: '°' },
  invert: { label: 'Invert', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
  sepia: { label: 'Sepia', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
}

const defaultValues = () => Object.entries(descriptors)
  .reduce((acc, [name, {value, unit}]) => K(acc)(acc => acc[name] = {value, unit}), {})

const displayFilterControl = options => {
  if(!options.key) return
  const {key, descriptor, currentValue, update, apply, cancel} = options

  const disposable = Disposable.of({})
  const timer = Timed.of(3000, R.compose(disposable.dispose, apply))({})
  const osdLabel = document.getElementsByClassName('odin-osd-temporary')[0]

  const refresh = value => {
    if(value < descriptor.min || value > descriptor.max) return
    update(value)
    osdLabel.innerHTML = `${descriptor.label}: ${value}${descriptor.unit}`
    timer.refreshTimeout(2000)
  }

  const decrease = () => refresh(currentValue() - descriptor.delta)
  const increase = () => refresh(currentValue() + descriptor.delta)

  // Make HTML event API somewhat more composable (i.e. functions with side-effects).
  const Events = {
    stopPropagation: event => K(event)(event => event.stopPropagation()),
    preventDefault: event => K(event)(event => event.preventDefault())
  }

  // Only mark those events as handled which are actually handled.
  const {stopPropagation, preventDefault} = Events
  const markHandled = R.compose(stopPropagation, preventDefault)

  const actions = {
    'ArrowLeft': R.compose(decrease, markHandled),
    'ArrowDown': R.compose(decrease, markHandled),
    'ArrowRight': R.compose(increase, markHandled),
    'ArrowUp': R.compose(increase, markHandled),
    'Escape': R.compose(disposable.dispose, cancel, markHandled), // TODO: restore to initial value
    'Enter': R.compose(disposable.dispose, apply, markHandled)
  }

  const onkeydown = event => (actions[event.key] || noop)(event)

  refresh(currentValue())
  osdLabel.style.display = 'block' // make element visible
  osdLabel.focus()

  // NOTE: removing the listener must use the same set of options.
  // FIXME: find a way to tightly couple listener addition and removal.
  // TODO: adding a listener could automatically register a dispose function on a disposable object.
  osdLabel.addEventListener('keydown', onkeydown)

  disposable.addDisposable(timer.clearTimeout)
  disposable.addDisposable(() => osdLabel.removeEventListener('keydown', onkeydown))
  disposable.addDisposable(() => osdLabel.style.display = 'none')
  disposable.addDisposable(() => map.focus())

  return Object.assign({}, disposable, {
    key: key
  })
}

let osd = null

const toggle = key => {
  displayFilter.read(defaultValues()).then(values => {
    const initialValue = values[key].value

    const options = {
      key,
      descriptor: descriptors[key],
      currentValue: () => values[key].value,
      update: value => map.applyDisplayFilters(K(values)(values => (values[key].value = value))),
      apply: () => displayFilter.write(values),
      cancel: () => map.applyDisplayFilters(K(values)(values => (values[key].value = initialValue)))
    }

    if(osd && !osd.disposed()) {
      osd.dispose()
      if(osd.key === key) osd = null
      else osd = displayFilterControl(options)
    } else osd = displayFilterControl(options)
  })
}

// TODO: probably needs to be wrapped in higher level component (i.e. OSD)

ipcRenderer.on('COMMAND_ADJUST_BRIGHTNESS', () => toggle('brightness'))
ipcRenderer.on('COMMAND_ADJUST_CONTRAST', () => toggle('contrast'))
ipcRenderer.on('COMMAND_ADJUST_GRAYSCALE', () => toggle('grayscale'))
ipcRenderer.on('COMMAND_ADJUST_HUE_ROTATE', () => toggle('hue-rotate'))
ipcRenderer.on('COMMAND_ADJUST_INVERT', () => toggle('invert'))
ipcRenderer.on('COMMAND_ADJUST_SEPIA', () => toggle('sepia'))
