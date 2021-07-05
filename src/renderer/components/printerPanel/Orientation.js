import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

const Orientation = props => {
  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }} >
    <TextField
      select
      label="Orientation"
      value={props.orientation}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'landscape'}>Landscape</MenuItem>
      <MenuItem value={'portrait'}>Portrait</MenuItem>
    </TextField>
  </FormControl>
  )
}

Orientation.propTypes = {
  orientation: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default Orientation
