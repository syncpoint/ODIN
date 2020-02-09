import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import Map from './Map'
import settings from './preferences'

const viewportPrefs = settings.viewport()

const App = () => {
  const [viewport, setViewport] = useState(null)
  const viewportChanged = viewportPrefs.set
  const loadViewport = () => viewportPrefs.get().then(setViewport)
  const effect = R.compose(R.always(undefined), loadViewport)

  useEffect(effect, [])

  const props = {
    viewport,
    viewportChanged,
    id: 'map'
  }

  const map = viewport ? <Map { ...props }/> : null
  return <div>{ map }</div>
}

App.propTypes = {}
export default App
