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
      default:
        break
    }
  }

  render() {
    return (
      <TextField
        label={ this.props.options.label }
        type="search"
        autoFocus
        className={ this.props.classes.searchField }
        margin="normal"
        // variant="outlined"
        onKeyPress={ event => this.handleKeyPress(event) }
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