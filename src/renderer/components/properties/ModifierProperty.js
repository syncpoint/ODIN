import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputLabel, FormControlLabel, Checkbox } from '@material-ui/core'
import { modifierPart } from '../SIDC'


const useStyles = makeStyles(() => ({
  twoColumns: { gridColumn: '1 / span 2' },
  label: { marginBottom: 8 }
}))

const decode = sidc => {
  switch (modifierPart.value(sidc)) {
    case '-': return { modifierHQ: false, modifierTF: false, modifierFD: false }
    case '*': return { modifierHQ: false, modifierTF: false, modifierFD: false }
    case 'F': return { modifierHQ: false, modifierTF: false, modifierFD: true }
    case 'E': return { modifierHQ: false, modifierTF: true, modifierFD: false }
    case 'G': return { modifierHQ: false, modifierTF: true, modifierFD: true }
    case 'A': return { modifierHQ: true, modifierTF: false, modifierFD: false }
    case 'C': return { modifierHQ: true, modifierTF: false, modifierFD: true }
    case 'B': return { modifierHQ: true, modifierTF: true, modifierFD: false }
    case 'D': return { modifierHQ: true, modifierTF: true, modifierFD: true }
  }
}

const encode = state => {
  const { modifierHQ, modifierTF, modifierFD } = state
  if (!modifierHQ && !modifierTF && !modifierFD) return '*'
  else if (!modifierHQ && !modifierTF && modifierFD) return 'F'
  else if (!modifierHQ && modifierTF && !modifierFD) return 'E'
  else if (!modifierHQ && modifierTF && modifierFD) return 'G'
  else if (modifierHQ && !modifierTF && !modifierFD) return 'A'
  else if (modifierHQ && !modifierTF && modifierFD) return 'C'
  else if (modifierHQ && modifierTF && !modifierFD) return 'B'
  else if (modifierHQ && modifierTF && modifierFD) return 'D'
}

const ModifierProperty = props => {
  const classes = useStyles()
  const { properties, onCommit } = props
  const [state, setState] = React.useState(decode(properties.sidc))

  const handleChange = property => ({ target }) => {
    const nextState = { ...state }
    nextState[property] = target.checked
    setState(nextState)
    properties.sidc = modifierPart.replace(properties.sidc)((encode(nextState)))
    onCommit(properties)
  }

  return (
    <div className={classes.twoColumns}>
      <InputLabel className={classes.label} shrink>Modifer</InputLabel>
      <FormControlLabel
        control={<Checkbox color="secondary" checked={state.modifierHQ}/>}
        label="HQ"
        labelPlacement="top"
        onChange={handleChange('modifierHQ')}
      />
      <FormControlLabel
        control={<Checkbox color="secondary" checked={state.modifierTF}/>}
        label="Task Force"
        labelPlacement="top"
        onChange={handleChange('modifierTF')}
      />
      <FormControlLabel
        control={<Checkbox color="secondary" checked={state.modifierFD}/>}
        label="Feint/Dummy"
        labelPlacement="top"
        onChange={handleChange('modifierFD')}
      />
    </div>
  )
}

ModifierProperty.propTypes = {
  properties: PropTypes.object.isRequired,
  onCommit: PropTypes.func.isRequired
}

export default ModifierProperty
