import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import {
  Select, MenuItem,
  FormLabel, FormControlLabel,
  RadioGroup, Radio
} from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  statusLabel: { gridColumn: '1 / span 2' },
  present: { gridColumn: 1 },
  operationalStatus: { gridColumn: 2, height: 'min-content' },
  anticipated: { gridColumn: 1 }
}))

const Status = props => {
  const classes = useStyles()

  return (
    <>
      <FormLabel component="legend" className={ classes.statusLabel }>Status</FormLabel>
      <RadioGroup
        onChange={ event => this.updateField('status', event.target.value) }
      >
        <FormControlLabel
          className={ classes.present }
          value="P"
          control={<Radio checked={ status !== 'A' } />}
          label="Present"
          checked={ status !== 'A' }
        />

        <FormControlLabel
          className={ classes.anticipated }
          value="A"
          control={<Radio checked={ status === 'A' } />}
          label="Anticipated/Planned"
          checked={ status === 'A' }
        />
      </RadioGroup>

      <Select
        className={ classes.operationalStatus }
        label={'Status'}
        onChange={ event => this.updateField('status', event.target.value) }
      >
        <MenuItem value={'P'}>N/A</MenuItem>
        <MenuItem value={'C'}>Fully Capable</MenuItem>
        <MenuItem value={'D'}>Damaged</MenuItem>
        <MenuItem value={'X'}>Destroyed</MenuItem>
        <MenuItem value={'F'}>Full to Capacity</MenuItem>
      </Select>
    </>
  )
}

export default Status
