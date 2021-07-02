import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

const Quality = props => {

  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }}>
    <TextField
      select
      label="Quality"
      value={props.quality}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'low'}>low</MenuItem>
      <MenuItem value={'medium'}>medium</MenuItem>
      <MenuItem value={'high'}>high</MenuItem>
    </TextField>
  </FormControl>
  )
}

Quality.propTypes = {
  quality: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default Quality
