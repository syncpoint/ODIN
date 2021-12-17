import React from 'react'
import { IconButton, Paper, Tooltip } from '@material-ui/core'
import FastForwardIcon from '@material-ui/icons/FastForward'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import { useTranslation } from 'react-i18next'
import CoordinatesInput from './CoordinatesInput'
import evented from '../../evented'

const Traveller = () => {
  const { t } = useTranslation()
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
          <Tooltip title={t('travel.back')}>
            <IconButton onClick={handleGoBack}>
              <SkipPreviousIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('travel.forward')}>
            <IconButton onClick={handleGoForward}>
              <SkipNextIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('travel.goto')}>
            <IconButton
              onClick={handleTravel}
              disabled={!location}
              type='submit'>
              <FastForwardIcon />
            </IconButton>
          </Tooltip>
        </div>
      </form>
    </Paper>
  )
}

export default Traveller
