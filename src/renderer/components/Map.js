import React from 'react'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer, clipboard } from 'electron'
import EventEmitter from 'events'
import 'leaflet/dist/leaflet.css'
import * as R from 'ramda'
import { K, noop } from '../../shared/combinators'
import Timed from '../../shared/timed'
import Disposable from '../../shared/disposable'
import Leaflet from '../leaflet'
import { descriptors, defaultValues } from './Map.display-filters'
import { zoomLevels } from './Map.zoom-levels'
import './Map.leaflet-icons'
import settings from './Map.settings'

const defautTileProvider = {
  id: 'OpenStreetMap.Mapnik',
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`
}

const commandHandlers = eventBus => ({

  // DEPENDENCIES:
  // * this.map (state change: layer)
  // * settings (R/O)
  //
  COMMAND_MAP_TILE_PROVIDER: function (options) {
    Leaflet.layers(this.map)
      .filter(layer => layer instanceof L.TileLayer)
      .forEach(layer => this.map.removeLayer(layer))
    L.tileLayer(options.url, options).addTo(this.map)
    settings.set('tileProvider', options)
  },

  // DEPENDENCIES:
  // this.map (QUERY: layerPointToLatLng())
  // eventBus (OSD_MESSAGE)
  //
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

  // DEPENDENCIES:
  // * defaultValues()
  // * this.updateDisplayFilters [eventBus: message -> map]
  // * settings (W/O)
  COMMAND_RESET_FILTERS: function () {
    const values = defaultValues()
    settings.set('displayFilters', values)
    this.updateDisplayFilters(values)
  },

  // DEPENDENCIES:
  //
  // * settings [R/W: current, apply / cancel]
  // * eventBus (OSD_MESSAGE)
  // * descriptors / defaultValues()
  // * filter (descriptor key)
  // * this.filterControl (singleton module state?)
  // * this.updateDisplayFilters() [eventBus: message -> map]
  // * this.map (focus) [eventBus: message -> map]
  //
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

/**
 * this.map:
 * - property: _container
 *
 * - query: Leaflet.panes()
 * - query: Leaflet.layers()
 * - query: getZoom()
 * - query: getCenter()
 * - query: layerPointToLatLng()
 *
 * - command: removeLayer()
 * - command: panTo()
 *
 * - event: click
 * - event: moveend
 * - event: zoom
 */
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
    const tileProvider = settings.get('tileProvider') || defautTileProvider
    const viewPort = settings.get('viewPort')

    // Override center/zoom options if available from settings:
    if (viewPort) {
      options.center = L.latLng(viewPort.lat, viewPort.lng)
      options.zoom = viewPort.zoom
    }

    this.map = K(L.map(id, options))(map => {
      L.tileLayer(tileProvider.url, tileProvider).addTo(map)
    })

    const displayFilters = settings.get('displayFilters') || defaultValues()
    this.updateDisplayFilters(displayFilters)

    const updateScale = () => {
      const scale = zoomLevels[this.map.getZoom()].scale || ''
      eventBus.emit('OSD_MESSAGE', { slot: 'C2', message: scale })
    }

    eventBus.on('OSD_MOUNTED', updateScale)

    this.map.on('click', () => this.props.onClick())

    this.map.on('moveend', () => {
      const { lat, lng } = this.map.getCenter()
      const zoom = this.map.getZoom()
      settings.set('viewPort', { lat, lng, zoom })
    })

    this.map.on('zoom', updateScale)

    // Bind command handlers after map was initialized:
    Object.entries(commandHandlers(eventBus)).map(([channel, handler]) => {
      ipcRenderer.on(channel, (_, args) => handler.bind(this)(args))
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
