import React from 'react'
import { List, ListItem } from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import uuid from 'uuid-random'
import ms from 'milsymbol'
import evented from '../../evented'
import layerStore from '../../stores/layer-store'
import { findSpecificItem } from '../../stores/feature-store'
import { ResourceNames } from '../../model/resource-names'
import selection from '../App.selection'

const geometryType = descriptor => {
  if (!descriptor.geometries) return 'point'
  if (descriptor.geometries.length === 1) return descriptor.geometries[0]
  return null
}

const geometry = (geometryType, latlngs) => {
  if (geometryType === 'point') return { type: 'Point', coordinates: [latlngs.lng, latlngs.lat] }
  const lineString = () => latlngs.map(({ lat, lng }) => [lng, lat])
  const polygon = () => [[...lineString(), lineString()[0]]]
  switch (geometryType) {
    case 'polygon': return { type: 'Polygon', coordinates: polygon() }
    case 'line': return { type: 'LineString', coordinates: lineString() }
  }
}

// TODO: rename to feature list
class Symbols extends React.Component {

  onClick (sidc) {

    // TODO: move to GeoJSON/Feature/SIDC helper.
    const genericSIDC = sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4, 15)
    const featureDescriptor = findSpecificItem(genericSIDC)
    const type = geometryType(featureDescriptor)

    const geometryHint = () => evented.emit('OSD_MESSAGE', {
      message: `Sorry, the feature's geometry is not supported, yet.`,
      duration: 5000
    })

    if (!type) return geometryHint()
    if (type === 'point' && !(new ms.Symbol(sidc, {}).isValid())) return geometryHint()

    switch (type) {
      case 'point': return evented.emit('tools.pick-point', {
        prompt: 'Pick a location...',
        picked: latlng => {
          const featureId = uuid()
          selection.preselect(ResourceNames.featureId('0', featureId))
          layerStore.addFeature(0)(featureId, {
            type: 'Feature',
            geometry: geometry(type, latlng),
            properties: { sidc }
          })
        }
      })
      case 'line':
      case 'polygon': return evented.emit('tools.draw', {
        geometryType: type,
        prompt: `Draw a ${type}...`,
        done: latlngs => {
          const featureId = uuid()
          selection.preselect(ResourceNames.featureId('0', featureId))
          layerStore.addFeature(0)(featureId, {
            type: 'Feature',
            geometry: geometry(type, latlngs),
            properties: { sidc }
          })
        }
      })
    }
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
