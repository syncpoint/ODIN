import React from 'react'
import PropTypes from 'prop-types'
import { Select, MenuItem, InputLabel, FormControl } from '@material-ui/core'
import { echelonPart } from '../SIDC'


const EchelonProperty = props => {
  const { properties } = props
  const [value, setValue] = React.useState(echelonPart.value(properties.sidc))

  const handleChange = ({ target }) => {
    setValue(target.value)
    properties.sidc = echelonPart.replace(properties.sidc)(target.value)
    props.onCommit(properties)
  }

  return (
    <FormControl>
      <InputLabel shrink id="label">
        Echelon
      </InputLabel>
      <Select
        labelId="label"
        value={value}
        onChange={handleChange}
      >
        <MenuItem value={'-'}>N/A</MenuItem>
        <MenuItem value={'A'}>Team/Crew</MenuItem>
        <MenuItem value={'B'}>Squad</MenuItem>
        <MenuItem value={'C'}>Section</MenuItem>
        <MenuItem value={'D'}>Platoon</MenuItem>
        <MenuItem value={'E'}>Company</MenuItem>
        <MenuItem value={'F'}>Battalion</MenuItem>
        <MenuItem value={'G'}>Regiment/Group</MenuItem>
        <MenuItem value={'H'}>Brigade</MenuItem>
        <MenuItem value={'I'}>Division</MenuItem>
        <MenuItem value={'J'}>Corps</MenuItem>
        <MenuItem value={'K'}>Army</MenuItem>
      </Select>
    </FormControl>
  )
}

EchelonProperty.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default EchelonProperty
