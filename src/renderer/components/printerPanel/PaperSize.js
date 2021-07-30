import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'
import { useTranslation } from 'react-i18next'

import sizes from '../../map/print/paperSizes.json'

const PaperFormat = props => {
  const { t } = useTranslation()
  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }}>
    <TextField
      select
      label={t('print.paperSize.label')}
      value={props.paperSize}
      onChange={handleChange}
      disabled={props.disabled}
    >
      {
        Object.keys(sizes).map(size => (<MenuItem key={size} value={size}>{size.toUpperCase()}</MenuItem>))
      }
    </TextField>
  </FormControl>
  )
}

PaperFormat.propTypes = {
  paperSize: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default PaperFormat
