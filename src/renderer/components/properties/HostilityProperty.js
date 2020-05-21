import React from 'react'
import PropTypes from 'prop-types'
import { Select, MenuItem, FormControl, InputLabel } from '@material-ui/core'
import SIDC from './SIDC'

const HostilityProperty = props => {
  const { properties } = props
  const [value, setValue] = React.useState(properties.sidc[1])

  const handleChange = ({ target }) => {
    setValue(target.value)
    properties.sidc = SIDC.replace(1, target.value)(properties.sidc)
    props.onCommit(properties)
  }

  return (
    <FormControl>
      <InputLabel shrink id="label">
        Hostility
      </InputLabel>
      <Select
        labelId="label"
        value={value}
        onChange={handleChange}
      >
        <MenuItem value={'*'}>N/A</MenuItem>
        <MenuItem value={'F'}>Friend</MenuItem>
        <MenuItem value={'A'}>Assumed Friend</MenuItem>
        <MenuItem value={'H'}>Hostile</MenuItem>
        <MenuItem value={'N'}>Neutral</MenuItem>
        <MenuItem value={'U'}>Unknown</MenuItem>
        <MenuItem value={'J'}>Joker</MenuItem>
        <MenuItem value={'K'}>Faker</MenuItem>
        <MenuItem value={'S'}>Suspect</MenuItem>
        <MenuItem value={'P'}>Pending</MenuItem>
        <MenuItem value={'G'}>Exercise Pending</MenuItem>
        <MenuItem value={'W'}>Exercise Unknown</MenuItem>
        <MenuItem value={'M'}>Exercise Assumed Friend</MenuItem>
        <MenuItem value={'D'}>Exercise Friend</MenuItem>
        <MenuItem value={'L'}>Exercise Neutral</MenuItem>
      </Select>
    </FormControl>
  )
}

HostilityProperty.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default HostilityProperty
