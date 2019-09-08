import React from 'react'
import {
  Paper, TextField, Select, MenuItem,
  FormLabel, FormControlLabel, RadioGroup, Radio
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import FeatureProperties from './FeatureProperties'

class EquipmentProperties extends FeatureProperties {
  extractState (feature) {
    const { title, properties } = feature
    const { sidc } = properties

    return {
      name: title || '',
      staffComments: properties.g || '',
      direction: properties.q || '',
      uniqueDesignation: properties.t || '',
      speed: properties.z || '',
      hostility: sidc[1],
      status: sidc[3],
      additionalInformation: properties.h || '',
      hostile: properties.n || '',
      modifier: sidc.substring(10, 12),
      quantity: properties.c || '',
      type: properties.v || ''
    }
  }

  feature () {
    const sidc =
      this.props.feature.properties.sidc.substring(0, 1) +
      this.state.hostility +
      this.props.feature.properties.sidc.substring(2, 3) +
      this.state.status +
      this.props.feature.properties.sidc.substring(4, 10) +
      this.state.modifier +
      this.props.feature.properties.sidc.substring(11)

    const properties = {
      ...this.props.feature.properties,
      sidc,
      c: this.state.quantity,
      g: this.state.staffComments,
      h: this.state.additionalInformation,
      n: this.state.hostile,
      q: this.state.direction,
      t: this.state.uniqueDesignation,
      v: this.state.type,
      z: this.state.speed
    }

    return {
      title: this.state.name,
      properties
    }
  }

  render () {
    const { status } = this.state
    const operationalStatusDisabled = status === 'A'

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
          className={ this.props.classes.quantity }
          label={'Quantity'}
          value={ this.state.quantity }
          onChange={ event => this.updateField('quantity', event.target.value) }
        />

        <TextField
          label={'Speed'}
          value={ this.state.speed }
          onChange={ event => this.updateField('speed', event.target.value) }
        />

        <TextField
          label={'Direction'}
          className={ this.props.classes.direction }
          value={ this.state.direction }
          onChange={ event => this.updateField('direction', event.target.value) }
        />

        <TextField
          label={'Type'}
          className={ this.props.classes.type }
          value={ this.state.type }
          onChange={ event => this.updateField('type', event.target.value) }
        />

        <TextField
          label={'Staff Comments'}
          className={ this.props.classes.staffComments }
          value={ this.state.staffComments }
          onChange={ event => this.updateField('staffComments', event.target.value) }
        />

        <TextField
          className={ this.props.classes.additionalInformation }
          label={'Additional Information'}
          value={ this.state.additionalInformation }
          onChange={ event => this.updateField('additionalInformation', event.target.value) }
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
          className={ this.props.classes.modifier }
          label={'Mobility'}
          value={ this.state.modifier }
          onChange={ event => this.updateField('modifier', event.target.value) }
        >
          <MenuItem value={'**'}>N/A</MenuItem>
          <MenuItem value={'MO'}>Wheeled</MenuItem>
          <MenuItem value={'MP'}>Cross Country</MenuItem>
          <MenuItem value={'MQ'}>Tracked</MenuItem>
          <MenuItem value={'MR'}>Wheeled/Tracked</MenuItem>
          <MenuItem value={'MS'}>Towed</MenuItem>
          <MenuItem value={'MT'}>Rail</MenuItem>
          <MenuItem value={'MU'}>Over the Snow</MenuItem>
          <MenuItem value={'MV'}>Sled</MenuItem>
          <MenuItem value={'MW'}>Pack Animals</MenuItem>

          {/*
            Possibly wrong in milsymbol (Barge: MX, Amphibious: MY)
            see https://github.com/spatialillusions/milsymbol/issues/224
          */}

          <MenuItem value={'MY'}>Barge</MenuItem>
          <MenuItem value={'MZ'}>Amphibious</MenuItem>
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
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    padding: theme.spacing(4),
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)',

    display: 'grid',
    gridGap: '0.5em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content'
  },
  name: { gridColumn: '1 / span 2' },
  uniqueDesignation: {},
  direction: {},
  type: { gridColumn: '1 / span 2' },
  staffComments: { gridColumn: '1 / span 2' },
  additionalInformation: { gridColumn: '1 / span 2' },
  hostility: {},

  statusLabel: { gridColumn: '1 / span 2' },
  present: { gridColumn: 1 },
  operationalStatus: { gridColumn: 2, height: 'min-content' },
  anticipated: { gridColumn: 1 },

  modifierLabel: { gridColumn: '1 / span 2' },
  specialType: { gridColumn: '1 / span 2' }
})

EquipmentProperties.propTypes = {
  classes: PropTypes.any.isRequired
}

export default withStyles(styles)(EquipmentProperties)
