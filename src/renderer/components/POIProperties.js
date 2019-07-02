import React from 'react'
import { Paper, TextField, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import coord from '../../renderer/coord-format'
import store from '../stores/poi-store'
import selection from './App.selection'
import mouseInput from './map/mouse-input'

class POIProperties extends React.Component {
  constructor (props) {
    super(props)

    // FIXME: provide all properties to that we don't have to query store
    // Must set name if undefined in order for name TextField to be controlled.
    const poi = store.state()[props.uuid]
    if (!poi.name) poi.name = ''
    this.state = { ...poi }
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

  handleClick () {
    const callback = () => mouseInput.pickPoint({
      prompt: 'Pick a new location...',
      picked: ({ lat, lng }) => {
        store.move(this.props.uuid)({ lat, lng })
        this.setState({ ...this.state, lat, lng, hidden: false })
      }
    })

    this.setState({ ...this.state, hidden: true }, callback)
  }

  handleCommentChange (value) {
    this.setState({ ...this.state, comment: value })
  }

  handleCommentBlur (value) {
    store.comment(this.props.uuid, value)
  }

  componentDidMount () {
    const moved = function ({ uuid, lat, lng }) {
      if (uuid !== this.props.uuid) return
      if (this.state.lat === lat && this.state.lng === lng) return
      this.setState({ ...this.state, lat, lng })
    }

    this.movedHandler = moved.bind(this)
    store.on('moved', this.movedHandler)
  }

  componentWillUnmount () {
    store.off('moved', this.movedHandler)
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
          label={ 'Name' }
          value={ name }
          onChange={ event => this.handleNameChange(event.target.value) }
        />
        <TextField
          className={ this.props.classes.position }
          label={ 'Position' }
          value={ coord.format({ lat, lng }) }
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
