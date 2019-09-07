import React from 'react'
import { Paper, TextField, FormControlLabel, Checkbox } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import FeatureProperties from './FeatureProperties'

class PointProperties extends FeatureProperties {

  extractState (feature) {
    const { title, properties } = feature

    return {
      name: title || '',
      uniqueDesignation: properties.t || '',
      additionalInformation: properties.h || '',
      hostile: properties.n || ''
    }
  }

  feature () {
    const sidc =
      this.props.feature.properties.sidc[0] +
      (this.state.hostile ? 'H' : 'F') +
      this.props.feature.properties.sidc.substring(2)

    const properties = {
      ...this.props.feature.properties,
      sidc,
      h: this.state.additionalInformation,
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

        <TextField
          className={ this.props.classes.additionalInformation }
          label={'Additional Information'}
          value={ this.state.additionalInformation }
          onChange={ event => this.updateField('additionalInformation', event.target.value) }
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
    background: 'rgba(252, 252, 255, 0.9)',

    display: 'grid',
    gridGap: '0.5em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content'
  },
  name: { gridColumn: '1 / span 2' },
  uniqueDesignation: { gridColumn: '1 / span 2' },
  additionalInformation: { gridColumn: '1 / span 2' }
})

PointProperties.propTypes = {
  classes: PropTypes.any.isRequired
}

export default withStyles(styles)(PointProperties)
