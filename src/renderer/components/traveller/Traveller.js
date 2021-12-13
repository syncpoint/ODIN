import React from 'react'
import { IconButton, Paper } from '@material-ui/core'
import FastForwardIcon from '@material-ui/icons/FastForward'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import CoordinatesInput from './CoordinatesInput'

import evented from '../../evented'

const Traveller = () => {
  const [location, setLocation] = React.useState(undefined)

  const setTravellingLocation = candidateLocation => {
    setLocation(candidateLocation)
  }

  const handleTravel = e => {
    // this may be triggered by ENTER/Submit
    e.preventDefault()
    evented.emit('TRAVEL', location)
  }

  const handleGoBack = () => {
    evented.emit('TRAVEL_BACK')
  }

  const handleGoForward = () => {
    evented.emit('TRAVEL_FORWARD')
  }

  return (
    <Paper variant='outlined' style={{ padding: '0.5em', marginBottom: '0.5em' }}>
      <form>
      <CoordinatesInput onChange={setTravellingLocation} />
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <IconButton
          onClick={handleGoBack}
        ><SkipPreviousIcon /></IconButton>
        <IconButton
          onClick={handleGoForward}
        ><SkipNextIcon /></IconButton>
        <IconButton
          onClick={handleTravel}
          disabled={!location}
          type='submit'
        ><FastForwardIcon /></IconButton>
      </div>
      </form>
    </Paper>
  )
}

export default Traveller
