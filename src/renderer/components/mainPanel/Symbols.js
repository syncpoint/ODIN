import React from 'react'
import { List, ListItem } from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import uuid from 'uuid-random'
import L from 'leaflet'
import evented from '../../evented'
import store from '../../stores/layer-store'

// TODO: rename to feature list
class Symbols extends React.Component {

  onClick (sidc) {

    const genericSIDC = sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4)
    if (L.Feature[genericSIDC]) {
      // TODO: find way to draw the feature
      return
    }

    evented.emit('tools.pick-point', {
      prompt: 'Pick a location...',
      picked: latlng => {
        store.addFeature(0)(uuid(), {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [latlng.lng, latlng.lat] },
          properties: { sidc }
        })
      }
    })
  }

  render () {
    const style = {
      height: 'auto'
    }
    const { symbols, classes, styleClass } = this.props
    const listItems = () => (symbols || []).map((item, index) => (
      <ListItem
        button
        divider={ true }
        key={ index}
        onClick={ () => this.onClick(item.sidc) }
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
  styleClass: PropTypes.any.isRequired
}

export default withStyles(styles)(Symbols)
