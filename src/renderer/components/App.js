import React from 'react'
import Map from './map/Map'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import L from 'leaflet'
import * as R from 'ramda'
import OSD from './OSD'
import Spotlight from './spotlight/Spotlight'
import POIProperties from './POIProperties'
import spotlightOptions from './App.spotlight'
import addBookmarkOptions from './App.bookmark'
import selection from './App.selection'
import input from './App.input'

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
      panels: {
        right: R.always(null),
        left: R.always(null),
        bottom: R.always(null)
      }
    }
  }

  openSpotlight (options) {
    selection.deselect() // closes any properties panel
    input.push({
      escape: () => this.closeSpotlight(),
      click: () => this.closeSpotlight()
    })

    this.openPanel('right', () => <Spotlight options={ options } />)
  }

  closeSpotlight () {
    input.pop()
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

    ipcRenderer.on('COMMAND_GOTO_PLACE', (_, args) => {
      this.openSpotlight(spotlightOptions({
        context: this,
        center: () => this.state.center,
        close: () => this.closePanel('right')
      }))
    })

    selection.on('selected', object => {
      const { type, uuid } = object
      if (type !== 'poi') return

      // POI properties panel:
      const right = () => <POIProperties uuid={ uuid } />
      this.openPanel('right', right)
    })

    selection.on('deselected', () => {
      this.closePanel('right')
    })
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
        />
        <div className={ this.props.classes.overlay }>
          <OSD
            osd={ this.state.osd }
          />
          <div className={ this.props.classes.contentPanel }>
            { panels.right() }
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
