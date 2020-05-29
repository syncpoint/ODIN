import React from 'react'
import PropTypes from 'prop-types'
import { Select, MenuItem, FormControl, InputLabel } from '@material-ui/core'
import { mobilityPart } from '../SIDC'

const MobilityProperty = props => {
  const { properties } = props
  const [value, setValue] = React.useState(mobilityPart.value(properties.sidc))

  const handleChange = ({ target }) => {
    setValue(target.value)
    properties.sidc = mobilityPart.replace(target.value)(properties.sidc)
    props.onCommit(properties)
  }

  return (
    <FormControl>
      <InputLabel shrink id="label">
        Mobility
      </InputLabel>
      <Select
        labelId="label"
        value={value}
        onChange={handleChange}
      >
        <MenuItem value={'--'}>N/A</MenuItem>
        <MenuItem value={'MO'}>Wheeled</MenuItem>
        <MenuItem value={'MP'}>Cross Country</MenuItem>
        <MenuItem value={'MQ'}>Tracked</MenuItem>
        <MenuItem value={'MR'}>Wheeled/Tracked</MenuItem>
        <MenuItem value={'MS'}>Towed</MenuItem>
        <MenuItem value={'MT'}>Rail</MenuItem>
        <MenuItem value={'MU'}>Over the Snow</MenuItem>
        <MenuItem value={'MV'}>Sled</MenuItem>
        <MenuItem value={'MW'}>Pack Animals</MenuItem>

        {/*
          Possibly wrong in milsymbol (Barge: MX, Amphibious: MY)
          see https://github.com/spatialillusions/milsymbol/issues/224
        */}

        <MenuItem value={'MY'}>Barge</MenuItem>
        <MenuItem value={'MZ'}>Amphibious</MenuItem>
      </Select>
    </FormControl>
  )
}

MobilityProperty.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default MobilityProperty
