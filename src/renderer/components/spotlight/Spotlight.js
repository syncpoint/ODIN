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
      rows: [],
      value: '',
      selectionIndex: -1
    }
  }

  setSelectionIndex (selectionIndex) {
    // Update selection index on next tick to make sure that row update doesn't get lost:
    setImmediate(() => {
      if (selectionIndex < 0 || selectionIndex >= this.state.rows.length) return
      this.setState({ ...this.state, selectionIndex })
    })
  }

  invokeAction (action, rowPos) {
    const fun = this.state.rows[rowPos][action] || (() => {})
    fun()
  }

  handleKeyDown (event) {
    const close = this.props.options.close || (() => {})
    switch (event.key) {
      case 'Escape': return close()
    }
  }

  handleChange (value) {
    const updateFilter = () => {
      const { searchItems } = this.props.options
      if (!searchItems) return
      searchItems.updateFilter(value)
      if (this.state.rows.length < 0) {
        const selectionIndex = -1
        this.setState({ ...this.state, selectionIndex })
      } else if (this.state.selectionIndex !== -1) {
        this.setSelectionIndex(0)
      }
    }

    this.setState({ ...this.state, value }, updateFilter)
  }

  componentDidMount () {
    const { options } = this.props
    this.updateListener = rows => {
      this.setState({ ...this.state, rows })
    }
    if (options.searchItems) options.searchItems.on('updated', this.updateListener)
  }

  componentWillUnmount () {
    const { options } = this.props
    if (options.searchItems) options.searchItems.off('updated', this.updateListener)
  }

  render () {
    const { classes, options } = this.props
    const { searchItems } = options
    const { value, rows, selectionIndex } = this.state

    const style = {
      height: rows.length ? 'auto' : 'max-content'
    }

    const list = () => searchItems
      ? <ResultList
        rows={ rows }
        options={ options }
        onChange={ value => this.handleChange(value) }
        selectionIndex={ selectionIndex }
        setSelectionIndex={ selectionIndex => this.setSelectionIndex(selectionIndex) }
        invokeAction={ (action, rowPos) => this.invokeAction(action, rowPos) }
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
          setSelectionIndex={ selectionIndex => this.setSelectionIndex(selectionIndex) }
          invokeAction={ (action, rowPos) => this.invokeAction(action, rowPos) }
          selectionIndex={ selectionIndex }
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
