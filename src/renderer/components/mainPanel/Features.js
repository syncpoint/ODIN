import React from 'react'
import { List, ListItem } from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

class Features extends React.Component {

  createClassName (parentId, index) {
    return 'features:scrollto:' + parentId + '-' + index
  }

  componentDidUpdate () {
    const { selectedFeatureIndex, parentId } = this.props
    const item = document.getElementsByClassName(this.createClassName(parentId, selectedFeatureIndex))[0]
    if (item) item.scrollIntoViewIfNeeded()
  }

  render () {
    const style = {
      height: 'auto'
    }
    const { features, classes, styleClass, selectedFeatureIndex, parentId, elementSelected } = this.props
    const listItems = () => (features || []).map((item, index) => (
      <ListItem
        selected={ index === selectedFeatureIndex }
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
  featureInSet: {
    maxHeight: 'auto',
    gridArea: 'content'
  },
  features: {
    maxHeight: 'fill-available',
    gridArea: 'content',
    overflow: 'auto'
  }
})

Features.propTypes = {
  features: PropTypes.any.isRequired,
  classes: PropTypes.any.isRequired,
  styleClass: PropTypes.any.isRequired,
  selectedFeatureIndex: PropTypes.any.isRequired,
  parentId: PropTypes.any.isRequired,
  elementSelected: PropTypes.func.isRequired
}

export default withStyles(styles)(Features)
