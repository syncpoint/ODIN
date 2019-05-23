import React from 'react'
import { InputBase } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'

class SearchField extends React.Component {

  handleKeyDown (event) {
    const { value, onChange } = this.props

    switch (event.key) {
      case 'Escape': {
        if (value) {
          // Reset value, but prevent spotlight from closing:
          event.stopPropagation()
          onChange('')
        }
        /* let event bubble up to close spotlight. */
        break
      }
    }
  }

  componentDidUpdate () {
    if (!this.props.value) this.input.focus()
  }

  render () {
    const { classes, value, onChange } = this.props

    return (
      <InputBase
        className={ classes.searchField }
        autoFocus
        placeholder={ 'Spotlight Search'}
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
  onChange: PropTypes.func.isRequired
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
