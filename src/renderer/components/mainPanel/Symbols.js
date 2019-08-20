/* eslint-disable */

import React from 'react'
import L from 'leaflet'
import { List, ListItem } from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import ms from 'milsymbol'
import evented from '../../evented'

// TODO: rename to feature list
class Symbols extends React.Component {

  onClick (sidc) {
    evented.emit('tools.pick-point', {
      prompt: 'Pick a location...',
      picked: latlng => {
        const marker = L.marker(latlng)
        const icon = new ms.Symbol(sidc, { size: 34 })
        marker.setIcon(L.divIcon({
          className: '',
          html: icon.asSVG(),
          iconAnchor: new L.Point(icon.getAnchor().x, icon.getAnchor().y)
        }))
        evented.emit('map.marker', marker)
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
