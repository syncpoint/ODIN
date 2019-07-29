import React from 'react'
import { InputBase } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'


const Tab = (event, props) => event.preventDefault()

const Escape = (event, { value, onChange }) => {
  if (value) {
    // Reset value, but prevent spotlight from closing:
    event.stopPropagation()
    onChange('')
  }
  /* let event bubble up to close spotlight. */
}

const ArrowUp = (event, { setSelectedItem, selectedItem }) => {
  setSelectedItem(selectedItem - 1)
  event.preventDefault()
}

const ArrowDown = (event, { invokeAction, selectedItem, setSelectedItem }) => {
  const modifier = event.ctrlKey || event.metaKey
  if (modifier) {
    invokeAction('action', selectedItem)
  } else setSelectedItem(selectedItem + 1)
  event.preventDefault()
}

const Enter = (event, { value, options, selectedItem, invokeAction }) => {
  const { accept, close } = options
  if (accept) {
    accept(value)
    close()
  } else if (selectedItem !== -1) {
    invokeAction('action', selectedItem)
    close()
  }
}

const Backspace = (event, { invokeAction, selectedItem }) => {
  const modifier = event.ctrlKey || event.metaKey
  if (modifier) {
    invokeAction('delete', selectedItem)
    event.preventDefault()
  }
}

const Delete = (event, props) => Backspace(event, props)

const keyDownHandlers = {
  Tab,
  Escape,
  ArrowUp,
  ArrowDown,
  Enter,
  Backspace,
  Delete
}

class SearchField extends React.Component {

  handleKeyDown (event) {
    keyDownHandlers[event.key] && keyDownHandlers[event.key](event, this.props)
  }

  componentDidUpdate () {
    this.input.focus()
  }

  render () {
    const { classes, value, options, onChange } = this.props

    return (
      <InputBase
        className={ classes.searchField }
        autoFocus
        placeholder={ options.placeholder }
        value={ value }
        onChange={ event => onChange(event.target.value) }
        inputRef={ input => (this.input = input) }
        onKeyDown={ event => this.handleKeyDown(event) }
      />
    )
  }
}

SearchField.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  setSelectedItem: PropTypes.func.isRequired,
  selectedItem: PropTypes.any.isRequired,
  invokeAction: PropTypes.func.isRequired
}

const styles = theme => ({
  searchField: {
    paddingLeft: '12px',
    paddingRight: '8px',
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    fontSize: '120%',
    gridArea: 'input'
  }
})

export default withStyles(styles)(SearchField)
