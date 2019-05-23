import React from 'react'
import { InputBase } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { noop } from '../../../shared/combinators'

class SearchField extends React.Component {
  handleKeyPress (event) {
    switch (event.key) {
      case 'Enter': {
        const search = this.props.options.search || noop
        const onUpdate = result => (this.props.onUpdate || noop)(result)
        search(event.target.value).then(onUpdate)
        break
      }
    }
  }

  handleKeyDown (event) {
    if (event.key !== 'Escape') return
    if (event.target.value) {
      const onUpdate = result => (this.props.onUpdate || noop)(result)
      event.stopPropagation()
      onUpdate([])
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
        onKeyPress={ event => this.handleKeyPress(event) }
        onKeyDown={ event => this.handleKeyDown(event) }
      />
    )
  }
}

SearchField.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired,
  value: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
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
