import React from 'react'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import EventEmitter from 'events'
import settings from 'electron-settings'
import path from 'path'
import * as R from 'ramda'
import { K, noop } from '../../shared/combinators'
import Timed from '../../shared/timed'
import Disposable from '../../shared/disposable'
import 'leaflet/dist/leaflet.css'
import Leaflet from '../leaflet'

// https://github.com/PaulLeCam/react-leaflet/issues/255
// ==> Stupid hack so that leaflet's images work after going through webpack.
import marker from 'leaflet/dist/images/marker-icon.png'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow
})

// <== Stupid hack: end.

// Dedicated file for map settings:
settings.setPath(path.format({
  dir: path.dirname(settings.file()),
  base: 'MapSettings'
}))

const defautTileProvider = {
  id: 'OpenStreetMap.Mapnik',
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`
}

const descriptors = {
  brightness: { label: 'Brightness', value: 100, min: 0, max: 100, delta: 5, unit: '%' },
  contrast: { label: 'Contrast', value: 100, min: 0, max: 200, delta: 5, unit: '%' },
  grayscale: { label: 'Grayscale', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
  'hue-rotate': { label: 'Hue', value: 0, min: 0, max: 360, delta: 10, unit: 'deg', display: '°' },
  invert: { label: 'Invert', value: 0, min: 0, max: 100, delta: 5, unit: '%' },
  sepia: { label: 'Sepia', value: 0, min: 0, max: 100, delta: 5, unit: '%' }
}

const defaultValues = () => Object.entries(descriptors)
  .reduce((acc, [name, { value, unit }]) => K(acc)(acc => (acc[name] = { value, unit })), {})

class Map extends React.Component {
  updateDisplayFilters (filterValues) {
    const styles = Leaflet
      .panes(layer => layer instanceof L.TileLayer)(this.map)
      .map(pane => pane.style)

    const filter = Object.entries(filterValues)
      .map(([name, { value, unit }]) => `${name}(${value}${unit})`)
      .join(' ')

    styles.forEach(style => (style.filter = filter))
  }

  componentDidMount () {
    const { id, options } = this.props
    const tileProvider = settings.get('tileProvider') || defautTileProvider
    const displayFilters = settings.get('displayFilters') || defaultValues()
    const viewPort = settings.get('viewPort')

    // Override center/zoom if available from settings:
    if (viewPort) {
      options.center = L.latLng(viewPort.lat, viewPort.lng)
      options.zoom = viewPort.zoom
    }

    this.map = K(L.map(id, options))(map => {
      L.tileLayer(tileProvider.url, tileProvider).addTo(map)
    })

    this.updateDisplayFilters(displayFilters)

    ipcRenderer.on('COMMAND_MAP_TILE_PROVIDER', (_, options) => {
      Leaflet.layers(this.map)
        .filter(layer => layer instanceof L.TileLayer)
        .forEach(layer => this.map.removeLayer(layer))
      L.tileLayer(options.url, options).addTo(this.map)
      settings.set('tileProvider', options)
    })

    ipcRenderer.on('COMMAND_RESET_FILTERS', (_, args) => {
      const values = defaultValues()
      settings.set('displayFilters', values)
      this.updateDisplayFilters(values)
    })

    ipcRenderer.on('COMMAND_ADJUST', (_, filter) => {
      const { eventBus } = this.props
      if (this.filterControl) this.filterControl.dispose()

      this.filterControl = (() => {
        const descriptor = descriptors[filter]
        const currentValues = settings.get('displayFilters') || defaultValues()
        const apply = () => settings.set('displayFilters', currentValues)
        const cancel = () => this.updateDisplayFilters(settings.get('displayFilters') || defaultValues())
        const disposable = Disposable.of({})
        const timer = Timed.of(3000, R.compose(disposable.dispose, apply))({})

        eventBus.emit('OSD_MESSAGE', { message: `${descriptor.label}: ${currentValues[filter].value}${descriptor.unit}` })

        const refresh = value => {
          if (value < descriptor.min || value > descriptor.max) return
          currentValues[filter].value = value
          eventBus.emit('OSD_MESSAGE', { message: `${descriptor.label}: ${value}${descriptor.unit}` })
          timer.refreshTimeout(2000)
          this.updateDisplayFilters(currentValues)
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
        disposable.addDisposable(() => eventBus.emit('OSD_MESSAGE', { message: '' }))
        disposable.addDisposable(() => this.map._container.focus())

        return disposable
      })()
    })

    this.map.on('moveend', () => {
      const { lat, lng } = this.map.getCenter()
      const zoom = this.map.getZoom()
      settings.set('viewPort', { lat, lng, zoom })
    })
  }

  componentDidUpdate (prevProps) {
    const { center } = this.props
    if (center && !center.equals(prevProps.center)) this.map.panTo(center)
  }

  render () {
    const { classes, id } = this.props
    return (
      <div
        id={ id }
        className={ classes.root }
      >
      </div>
    )
  }
}

Map.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  center: PropTypes.any.isRequired,
  eventBus: PropTypes.instanceOf(EventEmitter).isRequired
}

const styles = {
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10
  }
}

export default withStyles(styles)(Map)
