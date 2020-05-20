import React from 'react'
import PropTypes from 'prop-types'
import { Select, MenuItem } from '@material-ui/core'
import SIDC from './SIDC'

const EchelonProperty = props => {
  const { feature } = props
  const [value, setValue] = React.useState(feature.sidc[11])

  const handleChange = ({ target }) => {
    setValue(target.value)
    feature.sidc = SIDC.replace(11, target.value)(feature.sidc)
    console.log(feature.sidc)
    props.onCommit(feature)
  }

  return (
    <Select
      label={'Echelon'}
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
  )
}

EchelonProperty.propTypes = {
  feature: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default EchelonProperty
