import React from 'react'
import { List, ListItem, Collapse } from '@material-ui/core'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Features from './Features'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'


class FeatureSet extends React.Component {

  onClick (key) {
    const { featureSet, elementSelected } = this.props
    const index = featureSet.findIndex(item => item.key === key)
    elementSelected(index, -1, -1)
  }

  componentDidUpdate () {
    const { selectedSetIndex } = this.props
    const item = document.getElementsByClassName(this.createClassName(selectedSetIndex))[0]
    if (item) item.scrollIntoViewIfNeeded()
  }

  createClassName (index) {
    return 'featureSet:scrollto:' + index
  }

  render () {
    const style = {
      height: 'auto'
    }
    const { classes, featureSet, selectedSetIndex, selectedFeatureIndex, indexCache, elementSelected } = this.props
    const listItems = () => (featureSet || []).map((item, index) => {
      const childIndex = index === indexCache ? selectedFeatureIndex : -1
      return (
        <React.Fragment key= {item.key}>
          <ListItem
            button = { false }
            divider={ true }
            selected={ index === selectedSetIndex }
            key={ item.key }
            onClick={ () => this.onClick(item.key) }
            className={ this.createClassName(index) }
          >
            {item.open ? <ExpandLess /> : <ExpandMore />}
            { item.text }
          </ListItem>
          <Collapse in={item.open} timeout={ 0 } unmountOnExit>
            <Features features={item.features} styleClass={'featureInSet'} selectedFeatureIndex={childIndex} parentId={index} elementSelected={elementSelected} />
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

FeatureSet.propTypes = {
  classes: PropTypes.any.isRequired,
  featureSet: PropTypes.any.isRequired,
  selectedSetIndex: PropTypes.any.isRequired,
  elementSelected: PropTypes.func.isRequired,
  selectedFeatureIndex: PropTypes.any.isRequired,
  indexCache: PropTypes.any.isRequired
}

export default withStyles(styles)(FeatureSet)
