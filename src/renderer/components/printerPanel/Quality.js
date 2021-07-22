import React from 'react'
import PropTypes from 'prop-types'
import { FormControl, MenuItem, TextField } from '@material-ui/core'
import { useTranslation } from 'react-i18next'

import qualities from '../../map/print/quality.json'

const Quality = props => {
  const { t } = useTranslation()
  const handleChange = event => props.onChange(event.target.value)

  return (
  <FormControl style={{ margin: '1em' }}>
    <TextField
      select
      label={t('print.quality.label')}
      value={props.quality}
      onChange={handleChange}
      disabled={props.disabled}
    >
      {
        Object.keys(qualities).map(quality => (<MenuItem key={quality} value={quality}>{t(`print.quality.${quality}`)}</MenuItem>))
      }
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
