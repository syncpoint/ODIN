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

  handleUpdate (rows) {
    this.setState({
      ...this.state,
      rows
    })
  }

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

  handleChange (value) {
    const { items } = this.props.options
    if (items) items(value).then(items => this.handleUpdate(items))

    this.setState({
      ...this.state,
      value
    })
  }

  componentDidMount () {
    // Populate with initials list:
    this.props.options.items('').then(rows => this.handleUpdate(rows))
  }

  render () {
    const { classes, options } = this.props
    const { value, rows } = this.state
    const height = rows.length ? 'auto' : 'max-content'

    return (
      <Paper
        className={ classes.paper }
        elevation={ 4 }
        style={{ height }}
      >
        <SearchField
          options={ this.props.options }
          onChange={ value => this.handleChange(value) }
          value={ value }
        />
        <ResultList
          rows={ rows }
          options={ options }
          onChange={ value => this.handleChange(value) }
          onDelete={ key => this.handleDelete(key) }
        />
        {/* <Preview></Preview> */}
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    // Padding:
    // ...theme.mixins.gutters(), // padding-left/right: 16px
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
