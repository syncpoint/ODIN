import React from 'react'
import Map from './Map'

const App = () => {
  const props = {
    id: 'map'
  }

  return <div><Map { ...props }/></div>
}

App.propTypes = {}
export default App
