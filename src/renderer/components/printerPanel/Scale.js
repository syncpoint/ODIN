import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'

import scales from '../../map/print/scale.json'

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
      {
        scales.map(scale => (<MenuItem key={scale} value={scale}>{`1:${scale * 1000}`}</MenuItem>))
      }
    </TextField>
  </FormControl>
  )
}

Scale.propTypes = {
  scale: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default Scale
