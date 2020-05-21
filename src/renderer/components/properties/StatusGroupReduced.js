import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { FormLabel } from '@material-ui/core'
import StatusProperty from './StatusProperty'
import SIDC from './SIDC'

const useStyles = makeStyles(theme => ({
  statusLabel: { gridColumn: '1 / span 2' },
  firstColumn: { gridColumn: 1 }
}))

const StatusGroupReduced = props => {
  const classes = useStyles()
  const { feature } = props
  const [status, setStatus] = React.useState(feature.sidc[3])

  const handleChange = ({ target }) => {
    setStatus(target.value)
    feature.sidc = SIDC.replace(3, target.value)(feature.sidc)
    props.onCommit(feature)
  }

  return (
    <>
      <FormLabel component="legend" className={ classes.statusLabel }>Status</FormLabel>
      <StatusProperty value={status} onChange={handleChange}/>
    </>
  )
}

StatusGroupReduced.propTypes = {
  feature: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default StatusGroupReduced
