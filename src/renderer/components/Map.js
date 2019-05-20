import React from 'react'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import evented from '../evented'
import 'leaflet/dist/leaflet.css'
import './Map.leaflet-icons'
import { K } from '../../shared/combinators'
import Leaflet from '../leaflet'
import { zoomLevels } from './Map.zoom-levels'
import { defaultValues, COMMAND_ADJUST, COMMAND_RESET_FILTERS } from './Map.display-filters'
import { COMMAND_MAP_TILE_PROVIDER } from './Map.tile-provider'
import { COMMAND_COPY_COORDS } from './Map.clipboard'
import mapSettings from './Map.settings'

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
  }

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
    })

    const updateScale = () => {
      const scale = zoomLevels[this.map.getZoom()].scale || ''
      evented.emit('OSD_MESSAGE', { slot: 'C2', message: scale })
    }

    evented.on('OSD_MOUNTED', updateScale)
    evented.on('MAP:DISPLAY_FILTER_CHANGED', values => {
      const styles = Leaflet
        .panes(layer => layer instanceof L.TileLayer)(this.map)
        .map(pane => pane.style)

      const filter = Object.entries(values)
        .map(([name, { value, unit }]) => `${name}(${value}${unit})`)
        .join(' ')

      styles.forEach(style => (style.filter = filter))
    })

    evented.emit('MAP:DISPLAY_FILTER_CHANGED', mapSettings.get('displayFilters') || defaultValues())

    this.map.on('click', () => this.props.onClick())

    this.map.on('moveend', () => {
      const { lat, lng } = this.map.getCenter()
      const zoom = this.map.getZoom()
      mapSettings.set('viewPort', { lat, lng, zoom })
    })

    this.map.on('zoom', updateScale)

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
