import React from 'react'
import PropTypes from 'prop-types'
import { Select, MenuItem, FormControl, InputLabel } from '@material-ui/core'
import { hostilityPart } from '../SIDC'

const HostilityProperty = props => {
  const { properties } = props
  const [value, setValue] = React.useState(hostilityPart.value(properties.sidc))

  const handleChange = ({ target }) => {
    setValue(target.value)
    properties.sidc = hostilityPart.replace(target.value)(properties.sidc)
    if (target.value === 'H') properties.n = 'ENY'
    else delete properties.n
    props.onCommit(properties)
  }

  return (
    <FormControl className={props.className}>
      <InputLabel shrink id="label">
        Hostility
      </InputLabel>
      <Select
        labelId="label"
        value={value}
        onChange={handleChange}
      >
        <MenuItem value={'-'}>N/A</MenuItem>
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
  onCommit: PropTypes.func.isRequired,
  className: PropTypes.string // optional, used when provided.
}

export default HostilityProperty
