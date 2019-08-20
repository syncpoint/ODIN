import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { InputBase } from '@material-ui/core'
import { search } from '../../stores/feature-store'

class MapPaletteSearch extends React.Component {

  constructor (props) {
    super(props)
    this.timer = ''
  }

  prepareSearchTerm (raw) {
    const list = raw.split(' ')
    const termlist = list.map(item => {
      if (item === '') return item
      else return item + '* ' + item
    })
    return termlist.join(' ')
  }

  onChange (value) {
    value = value === '' ? value : this.prepareSearchTerm(value)
    const update = this.props.update
    clearTimeout(this.timer)
    this.timer = setTimeout(() => update(search(value)), 0)
  }

  render () {
    const { classes } = this.props

    return (
      <InputBase
        className={ classes.searchField }
        placeholder={ 'Search...' }
        onChange={ event => this.onChange(event.target.value) }
        autoFocus
      />
    )
  }
}

MapPaletteSearch.propTypes = {
  classes: PropTypes.any.isRequired
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

MapPaletteSearch.propTypes = {
  update: PropTypes.func.isRequired
}

export default withStyles(styles)(MapPaletteSearch)
