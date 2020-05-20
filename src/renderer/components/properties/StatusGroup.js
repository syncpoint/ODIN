import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { FormLabel, FormControlLabel, RadioGroup, Radio } from '@material-ui/core'
import OperationalStatusProperty from './OperationalStatusProperty'
import SIDC from './SIDC'

const useStyles = makeStyles(theme => ({
  statusLabel: { gridColumn: '1 / span 2' },
  firstColumn: { gridColumn: 1 }
}))

const StatusGroup = props => {
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
      <RadioGroup
        onChange={handleChange}
      >
        <FormControlLabel
          className={ classes.firstColumn }
          value="P"
          control={<Radio checked={ status !== 'A' } />}
          label="Present"
          checked={ status !== 'A' }
        />

        <FormControlLabel
          className={ classes.firstColumn }
          value="A"
          control={<Radio checked={ status === 'A' } />}
          label="Anticipated/Planned"
          checked={ status === 'A' }
        />
      </RadioGroup>

      <OperationalStatusProperty status={status} onChange={handleChange}/>
    </>
  )
}

StatusGroup.propTypes = {
  feature: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default StatusGroup
