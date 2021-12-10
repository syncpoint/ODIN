import React from 'react'
import { Button, ButtonGroup, Paper } from '@material-ui/core'
import FastForwardIcon from '@material-ui/icons/FastForward'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import CoordinatesInput from './CoordinatesInput'

import evented from '../../evented'

const Traveller = () => {
  const [location, setLocation] = React.useState(undefined)
  const [previousLocation, setPreviousLocation] = React.useState(undefined)

  React.useEffect(() => {
    const handleLeaving = previousCenter => {
      setPreviousLocation(previousCenter)
    }
    evented.on('LEAVING', handleLeaving)
    return () => evented.off('LEAVING', handleLeaving)
  }, [])

  const handleChange = candidateLocation => {
    setLocation(candidateLocation)
  }

  const handleTravel = () => {
    evented.emit('TRAVEL', location)
  }

  const handleGoBack = () => {
    evented.emit('TRAVEL', previousLocation)
  }

  return (
    <Paper variant='outlined' style={{ padding: '1em', marginBottom: '0.5em' }}>
      <CoordinatesInput onChange={handleChange}/>
      <ButtonGroup
        variant='outlined' fullWidth={true}
        style={{ marginTop: '0.5em' }}
      >
        <Button
          startIcon={<SkipPreviousIcon />}
          onClick={handleGoBack}
          disabled={!previousLocation}
        >Go Back</Button>
        <Button
          endIcon={<FastForwardIcon />}
          onClick={handleTravel}
          disabled={!location}
        >Travel</Button>
      </ButtonGroup>
    </Paper>
  )
}

export default Traveller
