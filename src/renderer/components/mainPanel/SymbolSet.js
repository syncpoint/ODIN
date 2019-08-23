import React from 'react'
import { List, ListItem, Collapse } from '@material-ui/core'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Symbols from './Symbols'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'


class SymbolSet extends React.Component {

  onClick (key) {
    const { symbolSet, onClick } = this.props
    const index = symbolSet.findIndex(item => item.key === key)
    onClick(index)
  }

  render () {
    const style = {
      height: 'auto'
    }
    const { classes, symbolSet, selectedSetIndex, selectedSymbolIndex, indexCache } = this.props
    const listItems = () => (symbolSet || []).map((item, index) => {
      const childIndex = index === indexCache ? selectedSymbolIndex : -1
      return (
        <React.Fragment key= {item.key}>
          <ListItem
            button = { false }
            divider={ true }
            selected={ index === selectedSetIndex }
            key={ item.key }
            onClick={ () => this.onClick(item.key) }
          >
            {item.open ? <ExpandLess /> : <ExpandMore />}
            { item.text }
          </ListItem>
          <Collapse in={item.open} timeout={ 0 } unmountOnExit>
            <Symbols symbols={item.symbols} styleClass={'symbolInSet'} selectedSymbolIndex={childIndex} parentId={index}/>
          </Collapse>
        </React.Fragment>
      )
    })
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
  symbolSet: PropTypes.any.isRequired,
  selectedSetIndex: PropTypes.any.isRequired,
  onClick: PropTypes.func.isRequired,
  selectedSymbolIndex: PropTypes.any.isRequired,
  indexCache: PropTypes.any.isRequired
}

export default withStyles(styles)(SymbolSet)
