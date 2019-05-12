import React from 'react'
import Map from './Map'
import { withStyles } from '@material-ui/core/styles'
import OSD from './OSD'
import Spotlight from './Spotlight'

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
    gridTemplateColumns: '1fr 2fr 1fr',
    gridTemplateRows: '1fr 3fr',
    gridGap: '1em',
    gridTemplateAreas: `
      "L . R"
      "L B R"
    `
  }
}

const center = L.latLng(48.65400545105681, 15.319061279296877)
const mapOptions = {
  center,
  zoomControl: false, // default: true
  zoom: 13
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      center
    }
  }

  handleMoveTo(latlng) {
    this.setState({ ...this.state, center: latlng })
  }

  render() {
    return (
      <div>
        <Map
          id='map'
          className='map'
          options={ mapOptions }
          center = { this.state.center }
        />
        <div className={ this.props.classes.overlay }>
          <OSD osd={ this.state.osd }/>
          <div className={ this.props.classes.contentPanel }>
            <Spotlight
              onMoveTo={ latLng => this.handleMoveTo(latLng) }
            />
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(App)