/* eslint-disable */
import * as R from 'ramda'
import React from 'react'
import {
  Paper, TextField, Select, MenuItem,
  FormLabel, FormControlLabel,
  Checkbox, RadioGroup, Radio
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import layerStore from '../../stores/layer-store'

const decodeModifier = sidc => {
  switch (sidc[10]) {
    case '-': return { modifierHQ: false, modifierTF: false, modifierFD: false } // 000
    case '*': return { modifierHQ: false, modifierTF: false, modifierFD: false } // 000
    case 'F': return { modifierHQ: false, modifierTF: false, modifierFD: true }  // 001
    case 'E': return { modifierHQ: false, modifierTF: true, modifierFD: false }  // 010
    case 'G': return { modifierHQ: false, modifierTF: true, modifierFD: true }   // 011
    case 'A': return { modifierHQ: true, modifierTF: false, modifierFD: false }  // 100
    case 'C': return { modifierHQ: true, modifierTF: false, modifierFD: true }   // 101
    case 'B': return { modifierHQ: true, modifierTF: true, modifierFD: false }   // 110
    case 'D': return { modifierHQ: true, modifierTF: true, modifierFD: true }    // 111
  }
}

const encodeModifier = state => {
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

class UnitProperties extends React.Component {
  constructor (props) {
    const { feature } = props
    const { title, properties } = feature
    const { sidc } = properties

    super(props)

    this.state = {
      name: title || '',
      reinforcedReduced: properties.f || '',
      staffComments: properties.g || '',
      higherFormation: properties.m || '',
      direction: properties.q || '',
      uniqueDesignation: properties.t || '',
      speed: properties.z || '',
      specialHeadquarters: properties.aa || '',
      hostility: sidc[1],
      echelon: sidc[11],
      status: sidc[3],
      ...decodeModifier(sidc)
    }
  }

  feature () {
    const sidc =
      this.props.feature.properties.sidc.substring(0, 1) + // 0
      this.state.hostility + // 1
      this.props.feature.properties.sidc.substring(2, 3) + // 2
      this.state.status + // 3
      this.props.feature.properties.sidc.substring(4, 10) + // 2-9
      encodeModifier(this.state) + // 10
      this.state.echelon + // 11
      this.props.feature.properties.sidc.substring(12) // 12-14

    const properties = {
      ...this.props.feature.properties,
      sidc,
      f: this.state.reinforcedReduced,
      g: this.state.staffComments,
      m: this.state.higherFormation,
      q: this.state.direction,
      t: this.state.uniqueDesignation,
      z: this.state.speed,
      aa: this.state.specialHeadquarters
    }

    return {
      title: this.state.name,
      properties,
      geometry: this.props.feature.geometry
    }
  }

  updateField (name, value) {
    const { layerId, featureId } = this.props
    const state = R.clone(this.state)
    state[name] = value
    this.setState(state, () => {
      layerStore.updateFeature(layerId)(featureId, this.feature())
    })
  }

  render () {
    const { status } = this.state
    const operationalStatusDisabled = status === 'A'
    const { modifierHQ, modifierTF, modifierFD } = this.state

    return (
      <Paper
        className={ this.props.classes.paper }
        elevation={ 4 }
      >
        <TextField
          className={ this.props.classes.name }
          label={'Name'}
          value={ this.state.name }
          onChange={ event => this.updateField('name', event.target.value) }
        />

        <TextField
          className={ this.props.classes.uniqueDesignation }
          label={'Unique Designation'}
          value={ this.state.uniqueDesignation }
          onChange={ event => this.updateField('uniqueDesignation', event.target.value) }
        />

        <TextField
          className={ this.props.classes.higherFormation }
          label={'Higher Formation'}
          value={ this.state.higherFormation }
          onChange={ event => this.updateField('higherFormation', event.target.value) }
        />

        <TextField
          label={'Speed'}
          value={ this.state.speed }
          onChange={ event => this.updateField('speed', event.target.value) }
        />

        <TextField
          label={'Direction'}
          className={ this.props.classes.higherFormation }
          value={ this.state.direction }
          onChange={ event => this.updateField('direction', event.target.value) }
        />

        <TextField
          label={'Staff Comments'}
          className={ this.props.classes.staffComments }
          value={ this.state.staffComments }
          onChange={ event => this.updateField('staffComments', event.target.value) }
        />

        <TextField
          label={'Special C2 HQ'}
          className={ this.props.classes.specialHeadquarters }
          value={ this.state.specialHeadquarters }
          onChange={ event => this.updateField('specialHeadquarters', event.target.value) }
        />

        <Select
          className={ this.props.classes.hostility }
          label={'Hostility'}
          value={ this.state.hostility }
          onChange={ event => this.updateField('hostility', event.target.value) }
        >
          <MenuItem value={'*'}>N/A</MenuItem>
          <MenuItem value={'F'}>Friend</MenuItem>
          <MenuItem value={'H'}>Hostile</MenuItem>
          <MenuItem value={'N'}>Neutral</MenuItem>
          <MenuItem value={'U'}>Unknown</MenuItem>
          <MenuItem value={'J'}>Joker</MenuItem>
          <MenuItem value={'K'}>Faker</MenuItem>
        </Select>

        <Select
          className={ this.props.classes.echelon }
          label={'Echelon'}
          value={ this.state.echelon }
          onChange={ event => this.updateField('echelon', event.target.value) }
        >
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

        <FormLabel component="legend" className={ this.props.classes.statusLabel }>Status</FormLabel>
        <RadioGroup
          value={ this.state.status }
          onChange={ event => this.updateField('status', event.target.value) }
        >
          <FormControlLabel
            className={ this.props.classes.present }
            value="P"
            control={<Radio checked={ status !== 'A' } />}
            label="Present"
            checked={ status !== 'A' }
          />

          <FormControlLabel
            className={ this.props.classes.anticipated }
            value="A"
            control={<Radio checked={ status === 'A' } />}
            label="Anticipated/Planned"
            checked={ status === 'A' }
          />
        </RadioGroup>

        <Select
          className={ this.props.classes.operationalStatus }
          label={'Status'}
          value={ this.state.status }
          disabled={ operationalStatusDisabled }
          onChange={ event => this.updateField('status', event.target.value) }
        >
          <MenuItem value={'P'}>N/A</MenuItem>
          <MenuItem value={'C'}>Fully Capable</MenuItem>
          <MenuItem value={'D'}>Damaged</MenuItem>
          <MenuItem value={'X'}>Destroyed</MenuItem>
          <MenuItem value={'F'}>Full to Capacity</MenuItem>
        </Select>

        <FormLabel component="legend" className={ this.props.classes.modifierLabel }>Modifier</FormLabel>
        <div className={ this.props.classes.specialType }>
          <FormControlLabel
            control={ <Checkbox color="secondary" checked={ this.state.modifierHQ } /> }
            label="Headquarter"
            labelPlacement="top"
            onChange={ event => this.updateField('modifierHQ', event.target.checked) }
            />
          <FormControlLabel
            control={ <Checkbox color="secondary" checked={ this.state.modifierTF } /> }
            label="Task Force"
            labelPlacement="top"
            onChange={ event => this.updateField('modifierTF', event.target.checked) }
          />
          <FormControlLabel
            control={ <Checkbox color="secondary" checked={ this.state.modifierFD } /> }
            label="Feint/Dummy"
            labelPlacement="top"
            onChange={ event => this.updateField('modifierFD', event.target.checked) }
          />
        </div>

        <FormLabel component="legend" className={ this.props.classes.reinforcedReducedLabel }>Reinforced/Reduced</FormLabel>
        <div className={ this.props.classes.reinforced }>
        <RadioGroup
          value={ this.state.reinforcedReduced }
          onChange={ event => this.updateField('reinforcedReduced', event.target.value) }
          className={ this.props.classes.reinforcedReducedGroup }
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
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 4,
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)',

    display: 'grid',
    gridGap: '1em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content'
  },
  name: { gridColumn: '1 / span 2' },
  uniqueDesignation: {},
  higherFormation: {},
  staffComments: { gridColumn: '1 / span 2' },
  specialHeadquarters: { gridColumn: '1 / span 2' },
  hostility: {},
  echelon: {},

  statusLabel: { gridColumn: '1 / span 2' },
  present: { gridColumn: 1 },
  operationalStatus: { gridColumn: 2, height: 'min-content' },
  anticipated: { gridColumn: 1 },

  modifierLabel: { gridColumn: '1 / span 2' },
  specialType: { gridColumn: '1 / span 2' },

  reinforcedReducedLabel: { gridColumn: '1 / span 2' },
  reinforcedReducedGroup: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto auto'
  },
  reinforced: { gridColumn: '1 / span 2' }

})

UnitProperties.propTypes = {
  classes: PropTypes.any.isRequired,
  feature: PropTypes.any.isRequired,
  layerId: PropTypes.string.isRequired,
  featureId: PropTypes.string.isRequired
}

export default withStyles(styles)(UnitProperties)
