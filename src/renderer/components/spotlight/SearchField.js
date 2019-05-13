import React from 'react'
import TextField from '@material-ui/core/TextField'
import { withStyles } from '@material-ui/core/styles'
import search from './nominatim'

class SearchField extends React.Component {

  constructor(props) {
    super(props)
  }

  // <TextField/>
  handleKeyPress(event) {
    const searchOptions = {
      // limit: 7,
      addressdetails: 1,
      namedetails: 0
      // TODO: supply filter
      // TODO: supply sorter
    }

    switch(event.key) {
      case 'Enter': {
        search(searchOptions)(event.target.value)
          .then(searchResult => this.props.onUpdate(searchResult))
        break
      }
      default:
        break
    }
  }

  render() {
    return (
      <TextField
        label="Place or address"
        type="search"
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