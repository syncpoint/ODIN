import React from 'react'
import { List, ListItem } from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

// TODO: rename to feature list
class Symbols extends React.Component {


  createClassName (parentId, index) {
    return 'symbols:scrollto:' + parentId + '-' + index
  }

  componentDidUpdate () {
    const { selectedSymbolIndex, parentId } = this.props
    const item = document.getElementsByClassName(this.createClassName(parentId, selectedSymbolIndex))[0]
    if (item) item.scrollIntoViewIfNeeded()
  }

  render () {
    const style = {
      height: 'auto'
    }
    const { symbols, classes, styleClass, selectedSymbolIndex, parentId, elementSelected } = this.props
    const listItems = () => (symbols || []).map((item, index) => (
      <ListItem
        selected={ index === selectedSymbolIndex }
        divider={ true }
        key={ index }
        onClick={ () => elementSelected(-1, index, parentId) }
        className={ this.createClassName(parentId, index) }
      >
        { item.avatar }
        { item.text }
      </ListItem>
    ))

    return (
      <List
        elevation={ 4 }
        style={ style }
        className={ classes[styleClass] }
      > { listItems()}
      </List>
    )
  }
}

const styles = theme => ({
  symbolInSet: {
    maxHeight: 'auto',
    gridArea: 'content'
  },
  symbols: {
    maxHeight: 'fill-available',
    gridArea: 'content',
    overflow: 'auto'
  }
})

Symbols.propTypes = {
  symbols: PropTypes.any.isRequired,
  classes: PropTypes.any.isRequired,
  styleClass: PropTypes.any.isRequired,
  selectedSymbolIndex: PropTypes.any.isRequired,
  parentId: PropTypes.any.isRequired,
  elementSelected: PropTypes.func.isRequired
}

export default withStyles(styles)(Symbols)
