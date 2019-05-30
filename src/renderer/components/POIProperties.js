import React from 'react'
import { Paper, TextField, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import latlng from '../../renderer/coord-format'
import store from '../stores/poi-store'

class POIProperties extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: props.options.id,
      oldId: props.options.id,
      ...store.model()[props.options.id]
    }
  }

  handleNameChange (value) {
    this.setState({ ...this.state, id: value })
  }

  handleNameBlur (value) {
    console.log(this.state.oldId, value)
    if (this.state.oldId === value) return
    store.rename(this.state.oldId, value)
    this.setState({ ...this.state, oldId: value })
  }

  handlePositionChange (value) {
    this.setState({ ...this.state, id: value })
  }

  handleCommentChange (value) {
    this.setState({ ...this.state, comment: value })
  }

  handleCommentBlur (value) {
    store.comment(this.state.id, value)
  }

  render () {
    const { id, lat, lng, comment } = this.state

    return (
      <Paper
        className={ this.props.classes.paper }
        elevation={ 4 }
      >
        <TextField
          className={ this.props.classes.id }
          label={ 'Name' }
          value={ id }
          onChange={ event => this.handleNameChange(event.target.value) }
          onBlur={ event => this.handleNameBlur(event.target.value) }
        />
        <TextField
          className={ this.props.classes.position }
          label={ 'Position' }
          value={ latlng({ lat, lng }) }
          onChange={ event => this.handlePositionChange(event.target.value) }
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
      "id id"
      "position pick"
      "comment comment"
    `
  },
  id: {
    gridArea: 'id'
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
  options: PropTypes.any.isRequired
}

export default withStyles(styles)(POIProperties)
