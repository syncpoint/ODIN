import React from 'react'
import { IconButton, Paper } from '@material-ui/core'
import FastForwardIcon from '@material-ui/icons/FastForward'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import CoordinatesInput from './CoordinatesInput'

import evented from '../../evented'

const Traveller = () => {
  const [location, setLocation] = React.useState(undefined)

  React.useEffect(() => {
    const historyHandler = ({ state: previousLocation }) => {
      if (!previousLocation) return
      evented.emit('TRAVEL', previousLocation)
    }

    window.addEventListener('popstate', historyHandler)
    return () => window.removeEventListener('popstate', historyHandler)
  }, [])

  const setTravellingLocation = candidateLocation => {
    setLocation(candidateLocation)
  }

  const handleTravel = () => {
    window.history.pushState(location, '')
    evented.emit('TRAVEL', location)
  }

  const handleGoBack = () => {
    window.history.back()
  }

  const handleGoForward = () => {
    window.history.forward()
  }

  return (
    <Paper variant='outlined' style={{ padding: '0.5em', marginBottom: '0.5em' }}>
      <CoordinatesInput onChange={setTravellingLocation}/>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <IconButton
          onClick={handleGoBack}
          disabled={(window.history.length === 1)}
        ><SkipPreviousIcon /></IconButton>
        <IconButton
          onClick={handleGoForward}
          disabled={(window.history.length === 1)}
        ><SkipNextIcon /></IconButton>
        <IconButton
          onClick={handleTravel}
          disabled={!location}
        ><FastForwardIcon /></IconButton>
      </div>
    </Paper>
  )
}

export default Traveller
