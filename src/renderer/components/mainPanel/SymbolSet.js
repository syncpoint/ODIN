import React from 'react'
import { List, ListItem, Collapse } from '@material-ui/core'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Symbols from './Symbols'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'


class SymbolSet extends React.Component {

  onClick (key) {
    const symbolSet = this.props.symbolSet
    const index = symbolSet.findIndex(item => item.key === key)
    symbolSet[index].open = !symbolSet[index].open
    this.setState({ ...this.state, symbolSet })
  }

  render () {
    const style = {
      height: 'auto'
    }
    const { classes, symbolSet } = this.props
    const listItems = () => (symbolSet || []).map(item => (
      <React.Fragment key= {item.key}>
        <ListItem
          button
          divider={ true }
          key={ item.key }
          onClick={ () => this.onClick(item.key) }
        >
          {item.open ? <ExpandLess /> : <ExpandMore />}
          { item.text }
        </ListItem>
        <Collapse in={item.open} timeout="auto" unmountOnExit>
          <Symbols symbols={item.symbols} styleClass={'symbolInSet'} />
        </Collapse>
      </React.Fragment>

    ))
    return (
      <List
        elevation={ 4 }
        style={ style }
        className={ classes.list }
      > { listItems()}
      </List>
    )
  }
}

const styles = theme => ({
  list: {
    maxHeight: 'fill-available',
    gridArea: 'content',
    overflow: 'auto'
  }
})

SymbolSet.propTypes = {
  classes: PropTypes.any.isRequired,
  symbolSet: PropTypes.any.isRequired
}

export default withStyles(styles)(SymbolSet)
