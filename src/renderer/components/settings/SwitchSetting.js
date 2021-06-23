import React from 'react'
import PropTypes from 'prop-types'
import { Switch, FormControlLabel } from '@material-ui/core'

const SwitchSetting = props => {

  const [isChecked, setIsChecked] = React.useState(props.defaultValue)
  const handleChange = event => {
    setIsChecked(event.target.checked)
    props.onChange(event.target.checked)
  }

  return (
    <FormControlLabel
        control={
          <Switch
            checked={isChecked}
            onChange={handleChange}
            color='primary'
          />
        }
        label={props.label}
      />
  )
}

SwitchSetting.propTypes = {
  defaultValue: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default SwitchSetting
