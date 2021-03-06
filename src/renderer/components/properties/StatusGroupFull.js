import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputLabel } from '@material-ui/core'
import StatusProperty from './StatusProperty'
import OperationalStatusProperty from './OperationalStatusProperty'
import { statusPart } from '../SIDC'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' },
  firstColumn: { gridColumn: 1 },
  label: {
    gridColumn: '1 / span 2',
    marginBottom: 0
  }
}))

const StatusGroupFull = props => {
  const classes = useStyles()
  const { properties } = props
  const [status, setStatus] = React.useState(statusPart.value(properties.sidc))

  const handleChange = ({ target }) => {
    setStatus(target.value)
    props.onCommit(featureProperties => ({ sidc: statusPart.replace(target.value)(featureProperties.sidc) }))
  }

  return (
    <>
      <InputLabel className={classes.label} shrink>Status</InputLabel>
      <StatusProperty value={status} onChange={handleChange}/>
      <OperationalStatusProperty value={status} onChange={handleChange}/>
    </>
  )
}

StatusGroupFull.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default StatusGroupFull
