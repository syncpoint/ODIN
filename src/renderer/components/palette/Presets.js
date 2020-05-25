import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'

const useStyles = makeStyles((theme) => ({
  toggleContainer: {
    margin: theme.spacing(0, 0),
    marginRight: '16px'
  }
}))

const Presets = props => {
  const classes = useStyles()

  const handleChange = property => (_, value) => {
    if (!value && property !== 'installation') return
    const preset = { ...props.value }
    preset[property] = value
    props.onChange(preset)
  }

  return (
    <span>
      <ToggleButtonGroup
        size="small"
        exclusive
        className={classes.toggleContainer}
        value={props.value.installation}
        onChange={handleChange('installation')}
      >
        <ToggleButton value="H">I</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        size="small"
        exclusive
        className={classes.toggleContainer}
        value={props.value.hostility}
        onChange={handleChange('hostility')}
      >
        <ToggleButton value="F">F</ToggleButton>
        <ToggleButton value="H">H</ToggleButton>
        <ToggleButton value="N">N</ToggleButton>
        <ToggleButton value="U">U</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        size="small"
        exclusive
        className={classes.toggleContainer}
        value={props.value.status}
        onChange={handleChange('status')}
      >
        <ToggleButton value="P">P</ToggleButton>
        <ToggleButton value="A">A</ToggleButton>
      </ToggleButtonGroup>
    </span>
  )
}

Presets.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired
}

export default Presets
