import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { noop } from '../../../shared/combinators'

class ResultList extends React.Component {

  handleListKeyDown (event) {
    const { onChange } = this.props

    switch (event.key) {
      case 'Escape': {
        event.stopPropagation()
        onChange('')
        break
      }
    }
  }

  handleClick (key) {
    this.props.rows
      .filter(row => row.key === key)
      .forEach(row => row.action())
  }

  handleDoubleClick (key) {
    this.handleClick(key)
    ;(this.props.options.close || noop)()
  }

  handleItemKeyDown (key) {
    switch (event.key) {
      case 'Enter': {
        this.handleClick(key)
        return (this.props.options.close || noop)()
      }
    }
  }

  render () {
    const { classes, rows } = this.props
    const display = rows.length ? 'inline' : 'none'

    const listItems = () => (rows || []).map(row => (
      <ListItem
        button
        divider={ true }
        key={ row.key }
        onClick={ () => this.handleClick(row.key) }
        onDoubleClick={ () => this.handleDoubleClick(row.key) }
        onKeyDown={ () => this.handleItemKeyDown(row.key) }
      >
        { row.text }
      </ListItem>
    ))

    return (
      <List
        // dense={ true }
        className={ classes.list }
        style={ { display } }
        onKeyDown={ event => this.handleListKeyDown(event) }
      >
        { listItems() }
      </List>
    )
  }
}

ResultList.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired,
  rows: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

const styles = theme => ({
  list: {
    gridArea: 'content',
    overflow: 'auto'
  }
})

export default withStyles(styles)(ResultList)
