import React from 'react'
import { makeStyles } from '@material-ui/core/styles'

import { FormLabel, FormControlLabel, Checkbox } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  modifierLabel: { gridColumn: '1 / span 2' },
  modifier: { gridColumn: '1 / span 2' }
}))

const Modifier = props => {
  const classes = useStyles()

  return (
    <>
      <FormLabel component="legend" className={ classes.modifierLabel }>Modifier</FormLabel>
      <div className={ classes.modifier }>
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

export default Modifier
