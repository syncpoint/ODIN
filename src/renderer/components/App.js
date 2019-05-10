import React from 'react'
import Map from './Map'
import { withStyles } from '@material-ui/core/styles'
import OSD from './OSD'
import { currentDateTime } from '../../shared/datetime'

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
    background: 'rgba(100, 100, 0, 0.4)',
    gridRowStart: 2,
    gridColumnStart: 1
  }
}

const center = L.latLng(48.65400545105681, 15.319061279296877)
const mapOptions = {
  center,
  zoomControl: false, // default: true
  zoom: 13
}

const tileProvider = {
  "id": "OpenStreetMap.Mapnik",
  "name": "OpenStreetMap",
  "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "maxZoom": 19,
  "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      osd: {
        C1: currentDateTime()
      }
    }
  }

  componentDidMount(prevProps, prevState) {
    const osd = { ...this.state.osd, C1: currentDateTime() }
    this.clockInterval = setInterval(() => {
      this.setState({ ...this.state, osd })
    }, 1000)
  }

  render() {
    return (
      <div>
        <Map
          id='map'
          className='map'
          tileProvider={ tileProvider }
          options={ mapOptions }
        />
        <div className={ this.props.classes.overlay }>
          <OSD osd={ this.state.osd }/>
          <div className={ this.props.classes.contentPanel }></div>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(App)