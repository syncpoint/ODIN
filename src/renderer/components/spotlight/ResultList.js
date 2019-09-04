import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import { noop } from '../../../shared/combinators'

class ResultList extends React.Component {

  createClassName (index) {
    return 'spotlight:scrollto:' + index
  }

  handleDoubleClick (key) {
    this.prepareAction(key)
    ;(this.props.options.close || noop)()
  }

  handleClick (key) {
    const { setSelectionIndex } = this.props
    const rowPos = this.prepareAction(key)
    setSelectionIndex(rowPos)
  }

  prepareAction (key) {
    const { invokeAction, rows } = this.props
    const rowPos = rows.findIndex(row => row.key === key)
    invokeAction('action', rowPos)
    return rowPos
  }

  componentDidUpdate () {
    const item = document.getElementsByClassName(this.createClassName(this.props.selectionIndex))[0]
    if (item) item.scrollIntoViewIfNeeded()
  }

  render () {
    const { classes, rows, selectionIndex } = this.props
    const display = rows.length ? 'block' : 'none'

    const listItems = () => (rows || []).map((row, index) => (
      <ListItem
        className={ this.createClassName(index) }
        button={false}
        divider={ true }
        key={ row.key }
        onClick={ () => this.handleClick(row.key) }
        onDoubleClick={ () => this.handleDoubleClick(row.key) }
        selected={index === selectionIndex}
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
  setSelectionIndex: PropTypes.func.isRequired,
  selectionIndex: PropTypes.any.isRequired,
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
