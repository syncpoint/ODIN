import React from 'react'
import { Select, MenuItem } from '@material-ui/core'

export const SelectEchelon = props => (
  <Select {...props} >
    <MenuItem value={'*'}>N/A</MenuItem>
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
