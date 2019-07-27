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
      selectedItem: -1,
      setSelectedItem: selectedItem => {
        if (selectedItem < 0 || selectedItem >= this.state.rows.length) return
        this.setState({ ...this.state, selectedItem })
      },
      invokeAction: (action, rowPos) => {
        const fun = this.state.rows[rowPos][action]
        if (typeof fun === 'function') fun()
      }
    }
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
      if (this.state.selectedItem !== -1) this.state.setSelectedItem(0)
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
    const { value, rows, setSelectedItem, invokeAction } = this.state
    let selectedItem = this.state.selectedItem
    if (selectedItem >= rows.length) selectedItem = rows.length - 1
    const style = {
      height: rows.length ? 'auto' : 'max-content'
    }

    const list = () => searchItems
      ? <ResultList
        rows={ rows }
        options={ options }
        onChange={ value => this.handleChange(value) }
        selectedItem={ selectedItem }
        setSelectedItem={ setSelectedItem }
        invokeAction={ invokeAction }
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
          setSelectedItem={ setSelectedItem }
          selectedItem={ selectedItem }
          invokeAction={ invokeAction }
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
