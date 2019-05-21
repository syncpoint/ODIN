import React from 'react'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import evented from '../../evented'
import 'leaflet/dist/leaflet.css'
import './leaflet-icons'
import { K } from '../../../shared/combinators'
import Leaflet from '../../leaflet'
import { zoomLevels } from './zoom-levels'
import { defaultValues, COMMAND_ADJUST, COMMAND_RESET_FILTERS } from './display-filters'
import { COMMAND_MAP_TILE_PROVIDER } from './tile-provider'
import { COMMAND_COPY_COORDS } from './clipboard'
import formatLatLng from '../../coord-format'
import mapSettings from './settings'

const defautTileProvider = {
  id: 'OpenStreetMap.Mapnik',
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`
}

const ipcHandlers = {
  COMMAND_ADJUST,
  COMMAND_RESET_FILTERS,
  COMMAND_MAP_TILE_PROVIDER,
  COMMAND_COPY_COORDS
}

const updateScaleDisplay = map => () => {
  const scale = zoomLevels[map.getZoom()].scale || ''
  evented.emit('OSD_MESSAGE', { slot: 'C2', message: scale })
}

const saveViewPort = map => () => {
  const { lat, lng } = map.getCenter()
  const zoom = map.getZoom()
  mapSettings.set('viewPort', { lat, lng, zoom })
}

const updateDisplayFilter = map => values => {
  const filter = Object.entries(values)
    .map(([name, { value, unit }]) => `${name}(${value}${unit})`)
    .join(' ')

  Leaflet
    .panes(layer => layer instanceof L.TileLayer)(map)
    .map(pane => pane.style)
    .forEach(style => (style.filter = filter))
}

const updateCoordinateDisplay = ({ latlng }) => {
  evented.emit('OSD_MESSAGE', { slot: 'C3', message: `${formatLatLng(latlng)}` })
}

class Map extends React.Component {
  componentDidMount () {
    const { id, options } = this.props
    const tileProvider = mapSettings.get('tileProvider') || defautTileProvider
    const viewPort = mapSettings.get('viewPort')

    // Override center/zoom options if available from settings:
    if (viewPort) {
      options.center = L.latLng(viewPort.lat, viewPort.lng)
      options.zoom = viewPort.zoom
    }

    this.map = K(L.map(id, options))(map => {
      L.tileLayer(tileProvider.url, tileProvider).addTo(map)
      map.on('click', () => this.props.onClick())
      map.on('moveend', saveViewPort(map))
      map.on('zoom', updateScaleDisplay(map))
      map.on('mousemove', updateCoordinateDisplay)
    })

    evented.on('OSD_MOUNTED', updateScaleDisplay(this.map))
    evented.on('MAP:DISPLAY_FILTER_CHANGED', updateDisplayFilter(this.map))
    evented.emit('MAP:DISPLAY_FILTER_CHANGED', mapSettings.get('displayFilters') || defaultValues())

    evented.on('SAVE_BOOKMARK', ({ id }) => {
      const { lat, lng } = this.map.getCenter()
      const zoom = this.map.getZoom()
      const currentBookmarks = mapSettings.get('bookmarks') || {}
      currentBookmarks[id] = { lat, lng, zoom }
      mapSettings.set('bookmarks', currentBookmarks)
    })

    evented.on('flyTo', ({ zoom, latlng }) => {
      this.map.setView(latlng, zoom)
    })

    evented.on('panTo', ({ latlng }) => {
      this.map.panTo(latlng)
    })

    // Bind command handlers after map was initialized:
    const context = { map: this.map }
    Object.entries(ipcHandlers).forEach(([channel, handler]) => {
      ipcRenderer.on(channel, (_, args) => handler(context)(args))
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
