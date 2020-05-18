import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { FormLabel, FormControlLabel, RadioGroup, Radio } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  reinforcedReducedLabel: { gridColumn: '1 / span 2' },
  reinforcedReducedGroup: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto auto'
  },
  reinforcedReduced: { gridColumn: '1 / span 2' }
}))


const ReinforcedReduced = props => {
  const classes = useStyles()

  return (
    <>
      <FormLabel component="legend" className={ classes.reinforcedReducedLabel }>Reinforced/Reduced</FormLabel>
      <div className={ classes.reinforcedReduced }>
        <RadioGroup
          onChange={ event => this.updateField('reinforcedReduced', event.target.value) }
          className={ classes.reinforcedReducedGroup }
        >
          <FormControlLabel
            value=""
            control={ <Radio color="secondary" /> }
            label="None"
            labelPlacement="top"
          />
          <FormControlLabel
            value="(+)"
            control={ <Radio color="secondary" /> }
            label="(+)"
            labelPlacement="top"
          />
          <FormControlLabel
            value="(—)"
            control={ <Radio color="secondary" /> }
            label="(—)"
            labelPlacement="top"
          />
          <FormControlLabel
            value="(±)"
            control={ <Radio color="secondary" /> }
            label="(±)"
            labelPlacement="top"
          />
        </RadioGroup>
      </div>
    </>
  )
}

export default ReinforcedReduced
