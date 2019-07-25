import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { noop } from '../../../shared/combinators'

class ResultList extends React.Component {

  handleDoubleClick (key) {
    this.prepareAction(key)
    ;(this.props.options.close || noop)()
  }

  handleClick (key) {
    const { setSelectedItem } = this.props
    const rowPos = this.prepareAction(key)
    setSelectedItem(rowPos)
  }

  prepareAction (key) {
    const { invokeAction, rows } = this.props
    const rowPos = rows.findIndex(row => row.key === key)
    invokeAction('action', rowPos)
    return rowPos
  }

  componentDidUpdate () {
    const item = document.getElementsByClassName('scrollto' + this.props.selectedItem)[0]
    if (item) item.scrollIntoView()
  }

  render () {
    const { classes, rows, selectedItem } = this.props
    const display = rows.length ? 'block' : 'none'
    const listItems = () => (rows || []).map((row, index, arr) => (
      <ListItem
        className={'scrollto' + index}
        button={false}
        divider={ true }
        key={ row.key }
        onClick={ () => this.handleClick(row.key) }
        onDoubleClick={ () => this.handleDoubleClick(row.key) }
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
  selectedItem: PropTypes.any.isRequired,
  invokeAction: PropTypes.func.isRequired
}

const styles = theme => ({
  list: {
    maxHeight: 'fill-available',
    gridArea: 'content',
    overflow: 'auto'
  }
})

export default withStyles(styles)(ResultList)
