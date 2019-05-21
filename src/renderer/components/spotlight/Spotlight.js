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
      rows: this.props.options.rows || []
    }
  }

  handleUpdate (rows) {
    const value = rows.length ? this.state.value : ''
    this.setState({
      ...this.state,
      value,
      rows: rows.map(this.props.options.mapRow)
    })
  }

  handleChange (value) {
    this.setState({
      ...this.state,
      value
    })
  }

  render () {
    const { options } = this.props
    return (
      <Paper
        className={ options.paperCSS}
        elevation={ 4 }
      >
        <SearchField
          options={ this.props.options }
          onUpdate={ rows => this.handleUpdate(rows) }
          onChange={ value => this.handleChange(value) }
          value={ this.state.value }
        />
        <ResultList
          rows={ this.state.rows }
          options={ this.props.options }
          onUpdate={ rows => this.handleUpdate(rows) }
        />
        {/* <Preview></Preview> */}
      </Paper>
    )
  }
}

const styles = theme => ({
})

Spotlight.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired
}

export default withStyles(styles)(Spotlight)
