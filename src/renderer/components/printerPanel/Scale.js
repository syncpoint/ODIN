import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

const Scale = props => {

  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }} >
    <TextField
      select
      label="Scale"
      value={props.scale}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'5'}>1:5000</MenuItem>
      <MenuItem value={'10'}>1:10000</MenuItem>
      <MenuItem value={'25'}>1:25000</MenuItem>
      <MenuItem value={'50'}>1:50000</MenuItem>
      <MenuItem value={'100'}>1:100000</MenuItem>
    </TextField>
  </FormControl>
  )
}

Scale.propTypes = {
  scale: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default Scale
