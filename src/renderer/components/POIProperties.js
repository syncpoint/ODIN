import React from 'react'
import { Paper, TextField, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import latlng from '../../renderer/coord-format'
import store from '../stores/poi-store'

class POIProperties extends React.Component {
  constructor (props) {
    super(props)
    this.state = { ...store.state()[props.uuid] }
  }

  handleNameChange (value) {
    this.setState({ ...this.state, name: value })
  }

  handleNameBlur (value) {
    store.rename(this.props.uuid, value)
    this.setState({ ...this.state, name: value })
  }

  handleCommentChange (value) {
    this.setState({ ...this.state, comment: value })
  }

  handleCommentBlur (value) {
    store.comment(this.props.uuid, value)
  }

  render () {
    const { name, lat, lng, comment } = this.state

    return (
      <Paper
        className={ this.props.classes.paper }
        elevation={ 4 }
      >
        <TextField
          className={ this.props.classes.name }
          label={ 'Name' }
          value={ name }
          onChange={ event => this.handleNameChange(event.target.value) }
          onBlur={ event => this.handleNameBlur(event.target.value) }
        />
        <TextField
          className={ this.props.classes.position }
          label={ 'Position' }
          value={ latlng({ lat, lng }) }
        />
        <Button
          className={ this.props.classes.pick }
          variant="outlined"
        >
          Pick
        </Button>
        <TextField
          className={ this.props.classes.comment }
          label={ 'Comment '}
          value={ comment }
          multiline
          onChange={ event => this.handleCommentChange(event.target.value) }
          onBlur={ event => this.handleCommentBlur(event.target.value) }
        >
        </TextField>
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
    gridTemplateRows: 'max-content max-content max-content',
    gridTemplatecolumns: 'auto auto',
    gridGap: '2em',
    gridTemplateAreas: `
      "name name"
      "position pick"
      "comment comment"
    `
  },
  name: {
    gridArea: 'name'
  },
  position: {
    gridArea: 'position'
  },
  pick: {
    gridArea: 'pick'
  },
  comment: {
    gridArea: 'comment',
    overflow: 'auto'
  }
})

POIProperties.propTypes = {
  classes: PropTypes.any.isRequired,
  uuid: PropTypes.any.isRequired
}

export default withStyles(styles)(POIProperties)
