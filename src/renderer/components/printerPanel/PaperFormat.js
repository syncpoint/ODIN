import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

import formats from '../../map/print/paperSizes.json'

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
      {
        Object.keys(formats).map(format => (<MenuItem key={format} value={format}>{format.toUpperCase()}</MenuItem>))
      }
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
