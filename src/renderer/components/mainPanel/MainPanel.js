import React from 'react'
import Paper from '@material-ui/core/Paper'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import MapPaletteSearch from './MapPaletteSearch'
import FeatureSet from './FeatureSet'
import featureSet from '../../model/mapPalette-featureSet'
import Features from './Features'
import { featureList } from '../../model/mapPalette-feature'
import uuid from 'uuid-random'
import evented from '../../evented'
import ms from 'milsymbol'
import layerStore from '../../stores/layer-store'
import { findSpecificItem } from '../../stores/feature-store'
import { ResourceNames } from '../../model/resource-names'
import selection from '../App.selection'

const geometryType = (descriptor, sidc) => {
  const includes = type => descriptor.geometries.includes(type)
  const validSymbol = () => new ms.Symbol(sidc, {}).isValid()

  // Usually a point, but not always:
  if (!descriptor.geometries) return validSymbol() ? 'point' : null
  if (descriptor.geometries.length === 1) return descriptor.geometries[0]

  // Guess-work...
  if (includes('point') && validSymbol()) return 'point'

  return null
}

const geometry = (geometryType, latlngs, properties) => {
  if (geometryType === 'point') return { type: 'Point', coordinates: [latlngs.lng, latlngs.lat] }
  const lineString = () => latlngs.map(({ lat, lng }) => [lng, lat])
  const polygon = () => [[...lineString(), lineString()[0]]]
  switch (geometryType) {
    case 'polygon': return { type: 'Polygon', coordinates: polygon() }
    case 'line': return { type: 'LineString', coordinates: lineString() }
    case 'corridor': return { type: 'LineString', coordinates: lineString(), ...properties }
  }
}

class MainPanel extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showComponents: () => this.showFeatureSets(),
      featureSet: featureSet(),
      features: [],
      selectedSetIndex: -1,
      selectedFeatureIndex: -1,
      indexCache: -1
    }
    this.shouldUpdate = false
  }

  elementSelected (selectedSetIndex, selectedFeatureIndex, parentId) {
    this.shouldUpdate = true
    selectedSetIndex !== -1 ? this.elementSetSelected(selectedSetIndex) : this.elementFeatureSelected(selectedFeatureIndex, parentId)
  }

  elementSetSelected (selectedSetIndex) {
    const { featureSet } = this.state
    featureSet[selectedSetIndex].open = !featureSet[selectedSetIndex].open
    this.setState({ ...this.state, featureSet, selectedSetIndex, selectedFeatureIndex: -1 })
  }

  elementFeatureSelected (selectedFeatureIndex, parentId) {
    const { featureSet, indexCache, features } = this.state
    const setId = parentId === -1 ? indexCache : parentId
    const getFeatureFromSet = (selectedFeatureIndex, setId) => {
      const set = featureSet[setId]
      return set.features[selectedFeatureIndex]
    }
    const feature = this.type === 'features' ? features[selectedFeatureIndex] : getFeatureFromSet(selectedFeatureIndex, setId)
    const sidc = feature.sidc

    // TODO: move to GeoJSON/Feature/SIDC helper.
    const genericSIDC = sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4, 15)
    const featureDescriptor = findSpecificItem(genericSIDC)
    const type = geometryType(featureDescriptor, sidc)

    const geometryHint = () => evented.emit('OSD_MESSAGE', {
      message: `Sorry, the feature's geometry is not supported, yet.`,
      duration: 5000
    })

    this.setState({ ...this.state, featureSet, selectedSetIndex: -1, selectedFeatureIndex, indexCache: setId })
    if (!type) return geometryHint()

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
      case 'corridor': return evented.emit('tools.draw', {
        geometryType: type,
        prompt: `Draw a ${type}...`,
        done: latlngs => {
          const featureId = uuid()
          selection.preselect(ResourceNames.featureId('0', featureId))
          layerStore.addFeature(0)(featureId, {
            type: 'Feature',
            geometry: geometry(type, latlngs.reverse(), { width: 600 }),
            properties: { sidc }
          })
        }
      })
    }
  }

  selectNextElement (direction) {
    const { featureSet, selectedSetIndex, selectedFeatureIndex, indexCache, features } = this.state
    this.shouldUpdate = true
    if (this.type === 'features') {
      const index = selectedFeatureIndex + direction
      const featureIndex = index >= 0 ? (index === features.length ? 0 : index) : features.length - 1
      this.setState({ ...this.state, selectedFeatureIndex: featureIndex })
    } else if (selectedFeatureIndex === -1 && selectedSetIndex !== -1 && featureSet[selectedSetIndex].open && direction > 0) {
      this.setState({ ...this.state, selectedSetIndex: -1, selectedFeatureIndex: 0, indexCache: selectedSetIndex })
    } else if (selectedFeatureIndex !== -1) {
      const newIndex = selectedFeatureIndex + direction
      if (newIndex === -1) {
        this.setState({ ...this.state, selectedSetIndex: indexCache, selectedFeatureIndex: -1 })
      } else if (newIndex === featureSet[indexCache].features.length) {
        this.setState({ ...this.state, selectedSetIndex: indexCache + 1, selectedFeatureIndex: -1 })
      } else {
        this.setState({ ...this.state, selectedFeatureIndex: newIndex })
      }
    } else {
      const index = selectedSetIndex + direction
      const setIndex = index >= 0 ? (index === featureSet.length ? 0 : index) : featureSet.length - 1
      const set = featureSet[setIndex]
      if (setIndex === selectedSetIndex - 1 && set.open) {
        const featureIndex = set.features.length - 1
        this.setState({ ...this.state, selectedSetIndex: -1, selectedFeatureIndex: featureIndex, indexCache: setIndex })
      } else this.setState({ ...this.state, selectedSetIndex: setIndex })
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.shouldUpdate) {
      this.shouldUpdate = false
      return true
    }
    return false
  }

  showFeatureSets () {
    const { featureSet, selectedSetIndex, selectedFeatureIndex, indexCache } = this.state
    this.type = 'sets'
    const compontents = {
      'header':
        <MapPaletteSearch
          update={ resultList => this.updateResultList(resultList) }
          setSelectedIndex={ direction => this.selectNextElement(direction) }
          selectedSetIndex={ selectedSetIndex }
          elementSelected={(setIndex, featureIndex, parentId) => this.elementSelected(setIndex, featureIndex, parentId) }
          selectedFeatureIndex={ selectedFeatureIndex }
        />,
      'list':
        <FeatureSet
          featureSet={ featureSet }
          selectedSetIndex={ selectedSetIndex }
          selectedFeatureIndex={ selectedFeatureIndex }
          elementSelected={(setIndex, featureIndex, parentId) => this.elementSelected(setIndex, featureIndex, parentId) }
          indexCache={ indexCache }
        /> }
    return compontents
  }

  showSearchResults () {
    const { selectedSetIndex, selectedFeatureIndex, features } = this.state
    this.type = 'features'
    const compontents = {
      'header':
        <MapPaletteSearch
          update={ resultList => this.updateResultList(resultList) }
          setSelectedIndex={ direction => this.selectNextElement(direction) }
          selectedSetIndex={ selectedSetIndex }
          elementSelected={(setIndex, featureIndex, parentId) => this.elementSelected(setIndex, featureIndex, parentId) }
          selectedFeatureIndex={ selectedFeatureIndex }
        />,
      'list':
        <Features
          features={ features }
          styleClass={ 'features' }
          selectedFeatureIndex={ selectedFeatureIndex }
          parentId={ -1 }
          elementSelected={(setIndex, featureIndex, parentId) => this.elementSelected(setIndex, featureIndex, parentId) }
        /> }
    return compontents
  }

  updateResultList (resultList) {
    const showComponents = resultList.length === 0 ? () => this.showFeatureSets() : () => this.showSearchResults()
    const features = featureList(resultList)
    this.shouldUpdate = true
    this.setState({ ...this.state, showComponents, features, selectedFeatureIndex: -1 })
  }

  render () {
    const { classes } = this.props
    const { showComponents } = this.state
    const style = {
      height: 'auto'
    }
    const components = showComponents()
    return (
      <Paper
        className={ classes.paper }
        elevation={ 4 }
        style={ style }
      > { components.header }
        { components.list}
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    pointerEvents: 'auto',
    gridArea: 'L',

    // Layout:
    display: 'grid',
    gridTemplateRows: 'max-content auto',
    gridTemplateAreas: `
      "input"
      "content"
    `,
    borderRadius: '6px' // default: 4px
  }
})

MainPanel.propTypes = {
  classes: PropTypes.any.isRequired
}

export default withStyles(styles)(MainPanel)
