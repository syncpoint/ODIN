import React from 'react'
import { Paper, TextField, FormControlLabel, Checkbox } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { SelectEchelon } from './SelectEchelon'
import FeatureProperties from './FeatureProperties'

class BoundaryLineProperties extends FeatureProperties {

  extractState (feature) {
    const { title, properties } = feature
    const { sidc } = properties

    return {
      name: title || '',
      uniqueDesignation: properties.t || '',
      echelon: sidc[11],
      hostile: properties.n || ''
    }
  }

  feature () {
    const sidc =
      this.props.feature.properties.sidc.substring(0, 11) +
      this.state.echelon +
      this.props.feature.properties.sidc.substring(12)

    const properties = {
      ...this.props.feature.properties,
      sidc,
      n: this.state.hostile,
      t: this.state.uniqueDesignation
    }

    return {
      title: this.state.name,
      properties
    }
  }

  render () {
    const hostile = event => event.target.checked ? 'ENY' : ''

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

        <SelectEchelon
          className={ this.props.classes.echelon }
          label={'Echelon'}
          value={ this.state.echelon }
          onChange={ event => this.updateField('echelon', event.target.value) }
        />

        <FormControlLabel
          control={ <Checkbox color="secondary" checked={ this.state.hostile } /> }
          label="Hostile (Enemy)"
          labelPlacement="end"
          onChange={ event => this.updateField('hostile', hostile(event)) }
        />
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
  echelon: {}
})

BoundaryLineProperties.propTypes = {
  classes: PropTypes.any.isRequired
}

export default withStyles(styles)(BoundaryLineProperties)
