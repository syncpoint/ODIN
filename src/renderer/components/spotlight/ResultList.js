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

  invokeAction (action, key) {
    this.props.rows
      .filter(row => row.key === key)
      .forEach(row => row[action]())
  }

  handleDoubleClick (key) {
    this.invokeAction('action', key)
    ;(this.props.options.close || noop)()
  }

  handleItemKeyDown (key) {
    switch (event.key) {
      case 'Delete': return this.invokeAction('delete', key)
      case 'Backspace': if (event.metaKey) return this.invokeAction('delete', key)
    }
  }

  render () {
    const { classes, rows } = this.props
    const display = rows.length ? 'block' : 'none'

    const listItems = () => (rows || []).map(row => (
      <ListItem
        button
        divider={ true }
        key={ row.key }
        onClick={ () => this.invokeAction('action', row.key) }
        onDoubleClick={ () => this.handleDoubleClick(row.key) }
        onKeyDown={ () => this.handleItemKeyDown(row.key) }
      >
        { row.avatar }
        { row.text }
      </ListItem>
    ))

    return (
      <List
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
    maxHeight: 'fill-available',
    gridArea: 'content',
    overflow: 'auto'
  }
})

export default withStyles(styles)(ResultList)
