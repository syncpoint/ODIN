import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

const OutputFormat = props => {
  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }} >
    <TextField
      select
      label="Output format"
      value={props.targetOutputFormat}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'PDF'}>PDF (image with annotations)</MenuItem>
      <MenuItem value={'JPEG'}>JPEG (image only)</MenuItem>
    </TextField>
  </FormControl>
  )
}

OutputFormat.propTypes = {
  targetOutputFormat: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default OutputFormat
