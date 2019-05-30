import React from 'react'
import Map from './map/Map'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import L from 'leaflet'
import OSD from './OSD'
import Spotlight from './spotlight/Spotlight'
import Properties from './Properties'
import spotlightOptions from './App.spotlight'
import addBookmarkOptions from './App.bookmark'
import selection from './App.selection'
import './App.clipboard'

const center = L.latLng(48.65400545105681, 15.319061279296877)
const zoom = 13

const mapOptions = {
  center,
  zoom,
  zoomControl: false, // default: true
  minZoom: 3, // 1:70 million
  attributionControl: false
}

class App extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      center,
      zoom,
      panels: {}
    }
  }

  handleKeyDown (event) {
    switch (event.key) {
      case 'Escape': return this.closeSpotlight()
    }
  }

  closeSpotlight () {
    const panels = delete this.state.panels.spotlight
    this.setState({ ...this.state, panels })
    document.getElementById('map').focus()
  }

  openSpotlight (options) {
    selection.deselect()
    options.close = () => this.closeSpotlight()
    const panels = { ...this.state.panels, spotlight: options }
    this.setState({ ...this.state, panels })
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
        zoom: () => this.state.zoom
      }))
    })

    ipcRenderer.on('COMMAND_GOTO_PLACE', (_, args) => {
      this.openSpotlight(spotlightOptions({
        context: this,
        center: () => this.state.center
      }))
    })

    selection.on('selected', object => {
      const { properties } = object
      this.setState({ ...this.state, panels: { properties } })
    })

    selection.on('deselected', () => {
      const panels = delete this.state.panels.properties
      this.setState({ ...this.state, panels })
    })
  }

  render () {
    // Is spotlight currently visible?
    const rightSidebar = this.state.panels.spotlight
      ? (<Spotlight options={ this.state.panels.spotlight } />)
      : this.state.panels.properties
        ? (<Properties options={ this.state.panels.properties } />)
        : null

    return (
      <div
        onKeyDown={ event => this.handleKeyDown(event) }>
        <Map
          id='map'
          className='map'
          options={ mapOptions }
          center={ this.state.center }
          zoom={ this.state.zoom }
          onMoveend={ (latlng) => this.setCenter(latlng) }
          onZoomend={ zoom => this.setZoom(zoom) }
          onClick= { () => this.closeSpotlight() }
        />
        <div className={ this.props.classes.overlay }>
          <OSD
            osd={ this.state.osd }
          />
          <div className={ this.props.classes.contentPanel }>
            { rightSidebar }
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
