import React from 'react'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer, clipboard } from 'electron'
import EventEmitter from 'events'
import 'leaflet/dist/leaflet.css'
import path from 'path'
import * as R from 'ramda'
import { K, noop } from '../../shared/combinators'
import Timed from '../../shared/timed'
import Disposable from '../../shared/disposable'
import Leaflet from '../leaflet'
import settings from './Map.settings'

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

const defaultTileProvider = {
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

const zoomLevels = {
  0: { tiles: 1, tileWidth: 360, meterPerPixel: 156412, scale: '1:500 million', areas: 'whole world' },
  1: { tiles: 4, tileWidth: 180, meterPerPixel: 78206, scale: '1:250 million' },
  2: { tiles: 16, tileWidth: 90, meterPerPixel: 39103, scale: '1:150 million', areas: 'subcontinental area' },
  3: { tiles: 64, tileWidth: 45, meterPerPixel: 19551, scale: '1:70 million', areas: 'largest country' },
  4: { tiles: 256, tileWidth: 22.5, meterPerPixel: 9776, scale: '1:35 million', areas: 'largest country' },
  5: { tiles: 1024, tileWidth: 11.25, meterPerPixel: 4888, scale: '1:15 million', areas: 'large African country' },
  6: { tiles: 4096, tileWidth: 5.625, meterPerPixel: 2444, scale: '1:10 million', areas: 'large European country' },
  7: { tiles: 16384, tileWidth: 2.813, meterPerPixel: 1222, scale: '1:4 million', areas: 'small country, US state' },
  8: { tiles: 65536, tileWidth: 1.406, meterPerPixel: 610.984, scale: '1:2 million' },
  9: { tiles: 262144, tileWidth: 0.703, meterPerPixel: 305.492, scale: '1:1 million', areas: 'wide area, large metropolitan area' },
  10: { tiles: 1048576, tileWidth: 0.352, meterPerPixel: 152.746, scale: '1:500 thousand', areas: 'metropolitan area' },
  11: { tiles: 4194304, tileWidth: 0.176, meterPerPixel: 76.373, scale: '1:250 thousand', areas: 'city' },
  12: { tiles: 16777216, tileWidth: 0.088, meterPerPixel: 38.187, scale: '1:150 thousand', areas: 'town, or city district' },
  13: { tiles: 67108864, tileWidth: 0.044, meterPerPixel: 19.093, scale: '1:70 thousand', areas: 'village, or suburb' },
  14: { tiles: 268435456, tileWidth: 0.022, meterPerPixel: 9.547, scale: '1:35 thousand' },
  15: { tiles: 1073741824, tileWidth: 0.011, meterPerPixel: 4.773, scale: '1:15 thousand', areas: 'small road' },
  16: { tiles: 4294967296, tileWidth: 0.005, meterPerPixel: 2.387, scale: '1:8 thousand', areas: 'street' },
  17: { tiles: 17179869184, tileWidth: 0.003, meterPerPixel: 1.193, scale: '1:4 thousand', areas: 'block, park, addresses' },
  18: { tiles: 68719476736, tileWidth: 0.001, meterPerPixel: 0.596, scale: '1:2 thousand', areas: 'some buildings, trees' },
  19: { tiles: 274877906944, tileWidth: 0.0005, meterPerPixel: 0.298, scale: '1:1 thousand', areas: 'local highway and crossing details' }
}

const commandHandlers = eventBus => ({

  COMMAND_MAP_TILE_PROVIDER: function (options) {
    Leaflet.layers(this.map)
      .filter(layer => layer instanceof L.TileLayer)
      .forEach(layer => this.map.removeLayer(layer))
    L.tileLayer(options.url, options).addTo(this.map)
    settings.set('tileProvider', options)
  },

  COMMAND_COPY_COORDS: function () {
    const container = document.getElementById('map')
    const originalCursor = container.style.cursor

    const onClick = event => {
      container.style.cursor = originalCursor
      container.removeEventListener('click', onClick)

      const pointXY = L.point(event.layerX, event.layerY)
      const latlng = this.map.layerPointToLatLng(pointXY).wrap()

      // TODO: get coordinate format from user setting (once implemented)
      clipboard.writeText(`${latlng.lat} ${latlng.lng}`)
      const originalFilter = container.style.filter
      const reset = () => (container.style.filter = originalFilter)
      container.style.filter = 'invert(100%)'
      setTimeout(reset, 50)
      eventBus.emit('OSD_MESSAGE', { message: `Coordinates Copied`, duration: 1500 })
    }

    if (container.style.cursor === '') {
      container.style.cursor = 'crosshair'
      container.addEventListener('click', onClick)
    }
  },

  COMMAND_RESET_FILTERS: function () {
    const values = defaultValues()
    settings.set('displayFilters', values)
    this.updateDisplayFilters(values)
  },

  COMMAND_ADJUST: function (filter) {
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
  }
})

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
    const { id, options, eventBus } = this.props
    const tileProvider = settings.get('tileProvider') || defaultTileProvider
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

    const updateScale = () => {
      const scale = zoomLevels[this.map.getZoom()].scale || ''
      eventBus.emit('OSD_MESSAGE', { slot: 'C2', message: scale })
    }

    eventBus.on('OSD_MOUNTED', updateScale)
    this.map.on('click', () => this.props.onClick())

    Object.entries(commandHandlers(eventBus)).map(([channel, handler]) => {
      ipcRenderer.on(channel, (_, args) => handler.bind(this)(args))
    })

    this.map.on('moveend', () => {
      const { lat, lng } = this.map.getCenter()
      const zoom = this.map.getZoom()
      settings.set('viewPort', { lat, lng, zoom })
    })

    eventBus.on('SAVE_BOOKMARK', ({ id }) => {
      const { lat, lng } = this.map.getCenter()
      const zoom = this.map.getZoom()
      const currentBookmarks = settings.get('bookmarks') || {}
      currentBookmarks[id] = { lat, lng, zoom }
      console.log(Object.keys(currentBookmarks).length + ' lenght')
      settings.set('bookmarks', currentBookmarks)
    })
    this.map.on('zoom', updateScale)
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
  eventBus: PropTypes.instanceOf(EventEmitter).isRequired,
  onClick: PropTypes.func.isRequired
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
