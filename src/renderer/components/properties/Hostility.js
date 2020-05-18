import React from 'react'
import { Select, MenuItem } from '@material-ui/core'


const Hostility = props => {

  return (
    <Select label={'Hostility'}>
      <MenuItem value={'*'}>N/A</MenuItem>
      <MenuItem value={'F'}>Friend</MenuItem>
      <MenuItem value={'H'}>Hostile</MenuItem>
      <MenuItem value={'N'}>Neutral</MenuItem>
      <MenuItem value={'U'}>Unknown</MenuItem>
      <MenuItem value={'J'}>Joker</MenuItem>
      <MenuItem value={'K'}>Faker</MenuItem>
    </Select>
  )
}

export default Hostility
