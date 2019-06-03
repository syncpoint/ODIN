import React from 'react'
import { Paper, TextField, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import latlng from '../../renderer/coord-format'
import store from '../stores/poi-store'
import selection from './App.selection'

class POIProperties extends React.Component {
  constructor (props) {
    super(props)
    this.state = { ...store.state()[props.uuid] }
  }

  handleNameChange (value) {
    store.rename(this.props.uuid, value)
    this.setState({ ...this.state, name: value })
  }

  handleKeyDown (event) {
    switch (event.key) {
      case 'Escape': return selection.deselect()
    }
  }

  handleClick () {
    // FIXME: needs stackable map behaviour (keyboard, mouse)
    // const callback = () => mouseInput.pickPoint({
    //   prompt: 'Pick a new location...',
    //   picked: latlng => {
    //     store.move(this.props.uuid, latlng)
    //     this.setState({ ...this.state, hidden: false })
    //   }
    // })

    // // callback()
    // this.setState({ ...this.state, hidden: true }, callback)
  }

  handleCommentChange (value) {
    this.setState({ ...this.state, comment: value })
  }

  handleCommentBlur (value) {
    store.comment(this.props.uuid, value)
  }

  render () {
    const { name, lat, lng, comment, hidden } = this.state
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
          autoFocus
          label={ 'Name' }
          value={ name }
          onChange={ event => this.handleNameChange(event.target.value) }
        />
        <TextField
          className={ this.props.classes.position }
          label={ 'Position' }
          value={ latlng({ lat, lng }) }
        />
        <Button
          className={ this.props.classes.pick }
          variant="outlined"
          onClick={ event => this.handleClick(event) }
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
