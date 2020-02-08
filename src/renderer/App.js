import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import Map from './Map'
import { map as mapSettings } from './settings'

const App = () => {
  const [viewport, setViewport] = useState(null)
  const viewportChanged = mapSettings.setViewport
  const loadViewport = () => mapSettings.getViewport().then(setViewport)
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
