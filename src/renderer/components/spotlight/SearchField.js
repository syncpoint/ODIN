import React from 'react'
import TextField from '@material-ui/core/TextField'
import { withStyles } from '@material-ui/core/styles'
import { noop } from '../../../shared/combinators'

class SearchField extends React.Component {

  constructor(props) {
    super(props)
  }

  handleKeyPress(event) {
    switch(event.key) {
      case 'Enter':
        const search = this.props.options.search || noop
        const onUpdate = result => (this.props.onUpdate || noop)(result)
        search(event.target.value).then(onUpdate)
        break
    }
  }

  handleKeyDown(event) {
    if(event.key !== 'Escape') return
    if(event.target.value) {
      const onUpdate = result => (this.props.onUpdate || noop)(result)
      event.stopPropagation()
      onUpdate([])
    }
  }

  componentDidUpdate() {
    if(!this.props.value) this.input.focus()
  }

  render() {
    const { classes, options, value, onChange } = this.props

    return (
      <TextField
        label={ options.label }
        type="search"
        value={ value }
        autoFocus
        className={ classes.searchField }
        margin="normal"
        onKeyPress={ event => this.handleKeyPress(event) }
        onKeyDown={ event => this.handleKeyDown(event) }
        onChange={ event => onChange(event.target.value) }
        inputRef={ input => (this.input = input) }
      />
    )
  }
}

const styles = theme => ({
  searchField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  }
})

export default withStyles(styles)(SearchField)