import React, { useEffect, useState } from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import * as R from 'ramda'
// import Map from './Map-leaflet'
import Map from './Map-openlayers'
import { map as mapSettings } from './settings'

const App = () => {
  const [ viewport, setViewport ] = useState(null)
  const viewportChanged = mapSettings.setViewport
  const loadViewport = () => mapSettings.getViewport().then(setViewport)

  useEffect(() => {
    loadViewport()
    /* eslint-disable no-useless-return */
    return R.always(undefined)()
  }, [])

  if (!viewport) return null

  return (
    <div>
      <Map
        id='map'
        className='map'
        viewport={viewport}
        options={{ minZoom: 3 }}
        viewportChanged={ viewportChanged }
      />
    </div>
  )
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
