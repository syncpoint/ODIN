import React from 'react'
import PropTypes from 'prop-types'
import { Select, MenuItem } from '@material-ui/core'
import SIDC from './SIDC'

const HostilityProperty = props => {
  const { feature } = props
  const [value, setValue] = React.useState(feature.sidc[1])

  const handleChange = ({ target }) => {
    setValue(target.value)
    feature.sidc = SIDC.replace(1, target.value)(feature.sidc)
    props.onCommit(feature)
  }

  return (
    <Select
      label={'Hostility'}
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
  )
}

HostilityProperty.propTypes = {
  feature: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default HostilityProperty
