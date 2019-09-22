import React from 'react'
import { Paper, TextField, Select, MenuItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import FeatureProperties from './FeatureProperties'

class PointProperties extends FeatureProperties {

  extractState (feature) {
    const { title, properties } = feature
    const { sidc } = properties

    return {
      name: title || '',
      hostility: sidc[1],
      direction: properties.q || '',
      uniqueDesignation: properties.t || '',
      speed: properties.z || '',
      additionalInformation: properties.h || '',
      quantity: properties.c || '',
      type: properties.v || ''
    }
  }

  feature () {
    const sidc =
      this.props.feature.properties.sidc[0] +
      this.state.hostility +
      this.props.feature.properties.sidc.substring(2)

    const properties = {
      ...this.props.feature.properties,
      sidc,
      c: this.state.quantity,
      h: this.state.additionalInformation,
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

    display: 'grid',
    gridGap: '0.5em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content'
  },
  name: { gridColumn: '1 / span 2' },
  uniqueDesignation: {},
  additionalInformation: { gridColumn: '1 / span 2' },
  type: { gridColumn: '1 / span 2' }
})

PointProperties.propTypes = {
  classes: PropTypes.any.isRequired
}

export default withStyles(styles)(PointProperties)
