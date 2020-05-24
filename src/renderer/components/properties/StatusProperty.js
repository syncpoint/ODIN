import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { FormControlLabel, RadioGroup, Radio } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  firstColumn: { gridColumn: 1 }
}))


const StatusProperty = props => {
  const { value, onChange } = props
  const classes = useStyles()

  return (
    <>
      <RadioGroup onChange={onChange}>
        <FormControlLabel
          className={ classes.firstColumn }
          value="P"
          control={<Radio checked={ value !== 'A' } />}
          label="Present"
          checked={ value !== 'A' }
        />

        <FormControlLabel
          className={ classes.firstColumn }
          value="A"
          control={<Radio checked={ value === 'A' } />}
          label="Anticipated/Planned"
          checked={ value === 'A' }
        />
      </RadioGroup>
    </>
  )
}

StatusProperty.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default StatusProperty
