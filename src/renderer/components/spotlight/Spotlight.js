import React from 'react'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import SearchField from './SearchField'
import ResultList from './ResultList'

class Spotlight extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      value: '',
      rows: []
    }
  }

  handleKeyDown (event) {
    const close = this.props.options.close || (() => {})
    switch (event.key) {
      case 'Escape': return close()
    }
  }

  handleUpdate (rows) {
    this.setState({
      ...this.state,
      rows
    })
  }

  /*
   * TODO:
   * props.options.item() should return a 'hot list', i.e. EventEmitter
   * item in list should know how to delete itself indirectly:
   * item --(delete)--> store --(deleted)--> list --(updated)--> Spotlight
   * list should update itself when filter term is changed
   */
  handleDelete (key) {
    const index = this.state.rows.findIndex(row => row.key === key && row.delete)
    if (index !== -1) {
      this.state.rows[index].delete()
      this.state.rows.splice(index, 1)
      this.setState({
        ...this.state,
        rows: this.state.rows
      })
    }
  }

  // TODO: delegate filter term change to hot item list
  handleChange (value) {
    const { items, searchItems } = this.props.options
    if (items) items(value).then(items => this.handleUpdate(items))

    this.setState({
      ...this.state,
      value
    })

    if (!searchItems) return
    searchItems.updateFilter(value)
  }

  componentDidMount () {
    const { options } = this.props

    // TODO: supply optional items in ctor -> props
    // Populate with initials list:
    if (options) {
      const { items } = options
      if (items) items('').then(rows => this.handleUpdate(rows))
    }
  }

  render () {
    const { classes, options } = this.props
    const { searchItems } = options
    const { value, rows } = this.state
    const style = {
      height: rows.length ? 'auto' : 'max-content'
    }

    const list = () => searchItems
      ? <ResultList
        rows={ rows }
        options={ options }
        onChange={ value => this.handleChange(value) }
        onDelete={ key => this.handleDelete(key) }
      />
      : null

    return (
      <Paper
        className={ classes.paper }
        elevation={ 4 }
        style={ style }
        onKeyDown={ event => this.handleKeyDown(event) }
      >
        <SearchField
          options={ this.props.options }
          onChange={ value => this.handleChange(value) }
          value={ value }
        />
        { list() }
        {/* <Preview></Preview> */}
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)',

    // Layout:
    display: 'grid',
    gridTemplateRows: 'max-content auto',
    gridTemplateAreas: `
      "input"
      "content"
    `,

    borderRadius: '6px' // default: 4px
  }
})

Spotlight.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired
}

export default withStyles(styles)(Spotlight)
