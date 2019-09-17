import React from 'react'
import Map from './map/Map'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import L from 'leaflet'
import * as R from 'ramda'
import OSD from './OSD'
import Spotlight from './spotlight/Spotlight'
import MainPanel from './mainPanel/MainPanel'
import { spotlightOptions } from './App.spotlight'
import addBookmarkOptions from './App.bookmark'
import selection from './App.selection'
import './App.clipboard'
import settings from '../model/settings'
import editors from './properties/'

const center = L.latLng(48.65400545105681, 15.319061279296877)
const zoom = 13

const mapOptions = {
  center,
  zoom,
  zoomControl: false, // default: true
  minZoom: 3, // 1:70 million
  attributionControl: false,
  doubleClickZoom: false // disable for now
}

class App extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      center,
      zoom,
      panels: {
        right: R.always(null),
        left: R.always(null),
        bottom: R.always(null)
      }
    }
  }

  openSpotlight (options) {
    selection.deselect() // closes any properties panel
    this.openPanel('right', () => <Spotlight options={ options } />)
  }

  closeSpotlight () {
    this.closePanel('right')
  }

  openPanel (which, fn) {
    const panels = { ...this.state.panels }
    panels[which] = fn
    this.setState({ ...this.state, panels })
  }

  closePanel (which) {
    const panels = { ...this.state.panels }
    panels[which] = R.always(null)
    this.setState({ ...this.state, panels })
    document.getElementById('map').focus()
  }

  setCenter (latlng) {
    this.setState({ ...this.state, center: latlng })
  }

  setZoom (zoom) {
    this.setState({ ...this.state, zoom })
  }

  setViewPort (center, zoom) {
    this.setState({ ...this.state, center, zoom })
  }

  componentDidMount () {
    ipcRenderer.on('COMMAND_ADD_BOOKMARK', (_, args) => {
      this.openSpotlight(addBookmarkOptions({
        context: this,
        center: () => this.state.center,
        zoom: () => this.state.zoom,
        close: () => this.closePanel('right')
      }))
    })

    // FIXME: should now be called COMMAND_FIND
    ipcRenderer.on('COMMAND_GOTO_PLACE', (_, args) => {
      this.openSpotlight(spotlightOptions({
        context: this,
        center: () => this.state.center,
        close: () => this.closePanel('right')
      }))
    })

    ipcRenderer.on('COMMAND_TOGGLE_PALETTE', (_, visible) => {
      if (visible) {
        this.openPanel('left', () => <MainPanel/>)
        settings.palette.show()
      } else {
        this.closePanel('left')
        settings.palette.hide()
      }
    })

    selection.on('selected', urn => {
      const paneFactory = editors.propertiesPane(urn)
      if (paneFactory) this.openPanel('right', paneFactory)
    })

    selection.on('deselected', () => {
      this.closePanel('right')
    })

    if (settings.palette.visible()) this.openPanel('left', () => <MainPanel/>)
  }

  render () {
    const { panels } = this.state
    return (
      <div>
        <Map
          id='map'
          className='map'
          options={ mapOptions }
          center={ this.state.center }
          zoom={ this.state.zoom }
          onMoveend={ (latlng) => this.setCenter(latlng) }
          onZoomend={ zoom => this.setZoom(zoom) }
          onClick={ () => this.closePanel('right') }
        />
        <div className={ this.props.classes.overlay }>
          <OSD
            osd={ this.state.osd }
          />
          <div className={ this.props.classes.contentPanel }>
            { panels.right() }
          </div>
          <div className={ this.props.classes.contentPanel }>
            { panels.left() }
          </div>
        </div>
      </div>
    )
  }
}

App.propTypes = {
  classes: PropTypes.any.isRequired
}

const styles = {
  overlay: {
    position: 'fixed',
    top: '1em',
    left: '1em',
    bottom: '1.5em',
    right: '1em',
    zIndex: 20,
    display: 'grid',
    gridTemplateColumns: 'auto',
    gridTemplateRows: '5em auto',
    gridGap: '1em',
    pointerEvents: 'none'
  },

  contentPanel: {
    gridRowStart: 2,
    gridColumnStart: 1,
    display: 'grid',
    gridTemplateColumns: '25em auto 25em',
    gridTemplateRows: '1fr 3fr',
    gridGap: '1em',
    gridTemplateAreas: `
      "L . R"
      "L B R"
    `
  }
}

export default withStyles(styles)(App)
