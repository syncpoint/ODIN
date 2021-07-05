import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

const PaperFormat = props => {

  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }}>
    <TextField
      select
      label="Paper size"
      value={props.paperFormat}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'a4'}>A4</MenuItem>
      <MenuItem value={'a3'}>A3</MenuItem>
      <MenuItem value={'a2'}>A2</MenuItem>
    </TextField>
  </FormControl>
  )
}

PaperFormat.propTypes = {
  paperFormat: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default PaperFormat
