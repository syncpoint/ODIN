import React from 'react'
import { Paper, TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import store from '../stores/poi-store'
import selection from './App.selection'

class AOIProperties extends React.Component {
  constructor (props) {
    super(props)

    // FIXME: provide all properties to that we don't have to query store
    // Must set name if undefined in order for name TextField to be controlled.
    const aoi = store.state()[props.uuid]
    if (!aoi.name) aoi.name = ''
    this.state = { ...aoi }
  }

  handleNameChange (value) {
    store.rename(this.props.uuid, value)
    this.setState({ ...this.state, name: value })
  }

  handleKeyDown (event) {
    switch (event.key) {
      case 'Escape': return selection.deselect()
      case 'Enter':
        if (event.target.tagName !== 'TEXTAREA') selection.deselect()
        break
    }
  }

  handleCommentChange (value) {
    this.setState({ ...this.state, comment: value })
  }

  handleCommentBlur (value) {
    store.comment(this.props.uuid, value)
  }

  render () {
    const { name, comment, hidden } = this.state
    const style = {
      display: hidden ? 'none' : 'grid'
    }

    return (
      <Paper
        className={ this.props.classes.paper }
        style={ style }
        elevation={ 4 }
        onKeyDown={ event => this.handleKeyDown(event) }
      >
        <TextField
          className={ this.props.classes.name }
          label={ 'Name' }
          value={ name }
          onChange={ event => this.handleNameChange(event.target.value) }
        />
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
      "comment comment"
    `
  },
  name: {
    gridArea: 'name'
  },
  comment: {
    gridArea: 'comment',
    overflow: 'auto'
  }
})

AOIProperties.propTypes = {
  classes: PropTypes.any.isRequired,
  uuid: PropTypes.any.isRequired
}

export default withStyles(styles)(AOIProperties)
