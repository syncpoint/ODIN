import React from 'react'
import PropTypes from 'prop-types'
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
  const { properties, onCommit } = props
  const classes = useStyles()
  const [value, setValue] = React.useState(properties.f || '')

  const handleChange = ({ target }) => {
    properties.f = target.value
    setValue(properties.f)
    onCommit(properties)
  }

  return (
    <div className={classes.twoColumns}>
      <InputLabel className={classes.label} shrink>Reinforced/Reduced</InputLabel>

      <RadioGroup
        value={value}
        onChange={handleChange}
        className={classes.reinforcedReducedGroup}
      >
        <FormControlLabel
          value=""
          control={<Radio color="secondary"/>}
          label="None"
          labelPlacement="top"
        />
        <FormControlLabel
          value="(+)"
          control={<Radio color="secondary"/>}
          label="(+)"
          labelPlacement="top"
        />
        <FormControlLabel
          value="(-)"
          control={<Radio color="secondary"/>}
          label="(-)"
          labelPlacement="top"
        />
        <FormControlLabel
          value="(±)"
          control={<Radio color="secondary"/>}
          label="(±)"
          labelPlacement="top"
        />
      </RadioGroup>
    </div>
  )
}

ReinforcedReduced.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default ReinforcedReduced
