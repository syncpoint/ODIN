import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { InputLabel, FormControlLabel, RadioGroup, Radio } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  twoColumns: { gridColumn: '1 / span 2' },
  reinforcedReducedGroup: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto auto'
  },
  reinforcedReduced: { gridColumn: '1 / span 2' },
  label: { marginBottom: 8 }
}))


const ReinforcedReduced = props => {
  const classes = useStyles()

  return (
    <div className={ classes.twoColumns }>
      <InputLabel className={classes.label} shrink>Reinforced/Reduced</InputLabel>

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
  )
}

export default ReinforcedReduced
