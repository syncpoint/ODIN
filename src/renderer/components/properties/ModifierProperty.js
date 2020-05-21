import React from 'react'
import { makeStyles } from '@material-ui/core/styles'

import { InputLabel, FormControlLabel, Checkbox } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  twoColumns: { gridColumn: '1 / span 2' }
}))

const ModifierProperty = props => {
  const classes = useStyles()

  return (
    <>
      <InputLabel shrink>Modifer</InputLabel>
      <div className={classes.twoColumns}>
        <FormControlLabel
          control={ <Checkbox color="secondary" /> }
          label="HQ"
          labelPlacement="top"
          onChange={ event => this.updateField('modifierHQ', event.target.checked) }
        />
        <FormControlLabel
          control={ <Checkbox color="secondary" /> }
          label="Task Force"
          labelPlacement="top"
          onChange={ event => this.updateField('modifierTF', event.target.checked) }
        />
        <FormControlLabel
          control={ <Checkbox color="secondary" /> }
          label="Feint/Dummy"
          labelPlacement="top"
          onChange={ event => this.updateField('modifierFD', event.target.checked) }
        />
      </div>
    </>
  )
}

export default ModifierProperty
