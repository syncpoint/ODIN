import React from 'react'
import Map from './map/Map'
import './ipc'

const App = () => {
  const props = {
    id: 'map'
  }

  return <div><Map { ...props }/></div>
}

App.propTypes = {}
export default App
