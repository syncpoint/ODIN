import React from 'react'
import Map from './Map'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import EventEmitter from 'events'
import L from 'leaflet'
import OSD from './OSD'
import Spotlight from './spotlight/Spotlight'
import search from './nominatim'

const center = L.latLng(48.65400545105681, 15.319061279296877)
const mapOptions = {
  center,
  zoomControl: false, // default: true
  zoom: 13,
  minZoom: 3 // 1:70 million
}

class App extends React.Component {
  constructor (props) {
    super(props)

    this.eventBus = new EventEmitter()
    this.state = {
      center,
      panels: {}
    }
  }

  handleKeyDown (event) {
    switch (event.key) {
      case 'Escape': return this.closeSpotlight()
    }
  }

  closeSpotlight () {
    // TODO: set focus to map
    const panels = delete this.state.panels.spotlight
    this.setState({ ...this.state, panels })
  }

  setCenter (latlng) {
    this.setState({ ...this.state, center: latlng })
  }

  componentDidMount () {
    ipcRenderer.on('COMMAND_ADD_BOOKMARK', (_, args) => {
      // TODO: implement
    })

    ipcRenderer.on('COMMAND_GOTO_BOOKMARK', (_, args) => {
      // TODO: implement
    })

    ipcRenderer.on('COMMAND_GOTO_PLACE', (_, args) => {
      const searchOptions = {
        // limit: 7,
        addressdetails: 1,
        namedetails: 0
      }

      const { lat, lng } = this.state.center

      // Prepare spotlight options:
      const spotlight = {
        search: search(searchOptions),
        sort: (a, b) => {
          const da = Math.sqrt(
            Math.pow((lat - Number.parseFloat(a.lat)), 2) +
            Math.pow((lng - Number.parseFloat(a.lon)), 2)
          )

          const db = Math.sqrt(
            Math.pow((lat - Number.parseFloat(b.lat)), 2) +
            Math.pow((lng - Number.parseFloat(b.lon)), 2)
          )

          return da - db
        },
        label: 'Place or address',
        mapRow: row => ({
          key: row.place_id, // mandatory
          name: row.display_name,
          type: row.type,
          box: row.boundingbox,
          lat: row.lat,
          lon: row.lon
        }),
        listItemText: row => <ListItemText primary={ row.name } />,
        onSelect: row => this.setCenter(L.latLng(row.lat, row.lon)),
        onClose: () => this.closeSpotlight()
      }

      const panels = { ...this.state.panels, spotlight }
      this.setState({ ...this.state, panels })
    })
  }

  render () {
    // Is spotlight currently visible?
    const spotlight = this.state.panels.spotlight
      ? (<Spotlight options={ this.state.panels.spotlight } />)
      : null

    return (
      <div
        onKeyDown={ event => this.handleKeyDown(event) }>
        <Map
          id='map'
          className='map'
          options={ mapOptions }
          center={ this.state.center }
          eventBus={ this.eventBus }
          onClick= { () => this.closeSpotlight() }
        />
        <div className={ this.props.classes.overlay }>
          <OSD
            eventBus={ this.eventBus}
            osd={ this.state.osd }
          />
          <div className={ this.props.classes.contentPanel }>
            { spotlight }
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
    gridTemplateColumns: '20em 2fr 20em',
    gridTemplateRows: '1fr 3fr',
    gridGap: '1em',
    gridTemplateAreas: `
      "L . R"
      "L B R"
    `
  }
}

export default withStyles(styles)(App)
