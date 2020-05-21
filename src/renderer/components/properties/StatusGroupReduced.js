import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputLabel } from '@material-ui/core'
import StatusProperty from './StatusProperty'
import SIDC from './SIDC'

const useStyles = makeStyles(theme => ({
  twoColumns: { gridColumn: '1 / span 2' },
  firstColumn: { gridColumn: 1 },
  label: {
    gridColumn: '1 / span 2',
    marginBottom: 0
  }
}))

const StatusGroupReduced = props => {
  const classes = useStyles()
  const { properties } = props
  const [status, setStatus] = React.useState(properties.sidc[3])

  const handleChange = ({ target }) => {
    setStatus(target.value)
    properties.sidc = SIDC.replace(3, target.value)(properties.sidc)
    props.onCommit(properties)
  }

  return (
    <>
      <InputLabel className={classes.label} shrink>Status</InputLabel>
      <StatusProperty value={status} onChange={handleChange}/>
    </>
  )
}

StatusGroupReduced.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default StatusGroupReduced
