import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'
import { useTranslation } from 'react-i18next'

const Orientation = props => {
  const { t } = useTranslation()
  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }} >
    <TextField
      select
      label={t('print.orientation.label')}
      value={props.orientation}
      onChange={handleChange}
      disabled={props.disabled}
    >
      <MenuItem value={'landscape'}>{t('print.orientation.landscape')}</MenuItem>
      <MenuItem value={'portrait'}>{t('print.orientation.portrait')}</MenuItem>
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
