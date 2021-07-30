import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'
import { useTranslation } from 'react-i18next'

const OutputFormat = props => {
  const { t } = useTranslation()
  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }} >
    <TextField
      select
      label={t('print.output.label')}
      value={props.targetOutputFormat}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'PDF'}>{t('print.output.pdf')}</MenuItem>
      <MenuItem value={'JPEG'}>{t('print.output.jpeg')}</MenuItem>
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
