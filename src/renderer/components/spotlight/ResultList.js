import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { noop } from '../../../shared/combinators'

class ResultList extends React.Component {

  handleListKeyDown (event) {
    const { onChange, selectedItem, setSelectedItem } = this.props

    switch (event.key) {
      case 'Escape': {
        event.stopPropagation()
        onChange('')
        break
      }
      case 'ArrowUp': {
        setSelectedItem(selectedItem - 1)
        break
      }
      case 'ArrowDown': {
        setSelectedItem(selectedItem + 1)
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
    const { classes, rows, selectedItem, setSelectedItem } = this.props
    console.log(selectedItem)
    const display = rows.length ? 'block' : 'none'
    const listItems = () => (rows || []).map((row, index, arr) => (
      <ListItem
        button
        divider={ true }
        key={ row.key }
        onClick={ () => {
          this.invokeAction('action', row.key)
          setSelectedItem(index)
        }
        }
        onDoubleClick={ () => this.handleDoubleClick(row.key) }
        onKeyDown={ () => this.handleItemKeyDown(row.key) }
        selected={index === selectedItem}
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
  onChange: PropTypes.func.isRequired,
  setSelectedItem: PropTypes.func.isRequired,
  selectedItem: PropTypes.any.isRequired
}

const styles = theme => ({
  list: {
    maxHeight: 'fill-available',
    gridArea: 'content',
    overflow: 'auto'
  }
})

export default withStyles(styles)(ResultList)
