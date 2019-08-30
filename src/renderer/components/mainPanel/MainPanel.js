import React from 'react'
import Paper from '@material-ui/core/Paper'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import MapPaletteSearch from './MapPaletteSearch'
import FeatureSet from './FeatureSet'
import featureSet from '../../model/mapPalette-featureSet'
import Symbols from './Symbols'
import { symbolList } from '../../model/mapPalette-symbol'
import uuid from 'uuid-random'
import evented from '../../evented'
import ms from 'milsymbol'
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

class MainPanel extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showComponents: () => this.showSymbolsets(),
      featureSet: featureSet(),
      symbols: [],
      selectedSetIndex: -1,
      selectedSymbolIndex: -1,
      indexCache: -1
    }
    this.shouldUpdate = false
  }

  elementSelected (selectedSetIndex, selectedSymbolIndex, parentId) {
    this.shouldUpdate = true
    selectedSetIndex !== -1 ? this.elementSetSelected(selectedSetIndex) : this.elementSymbolSelected(selectedSymbolIndex, parentId)
  }

  elementSetSelected (selectedSetIndex) {
    const { featureSet } = this.state
    featureSet[selectedSetIndex].open = !featureSet[selectedSetIndex].open
    this.setState({ ...this.state, featureSet, selectedSetIndex, selectedSymbolIndex: -1 })
  }

  elementSymbolSelected (selectedSymbolIndex, parentId) {
    const { featureSet, indexCache, symbols } = this.state
    const setId = parentId === -1 ? indexCache : parentId
    const getSymbolFromSet = (selectedSymbolIndex, setId) => {
      const set = featureSet[setId]
      return set.symbols[selectedSymbolIndex]
    }
    const symbol = this.type === 'symbols' ? symbols[selectedSymbolIndex] : getSymbolFromSet(selectedSymbolIndex, setId)
    const sidc = symbol.sidc

    // TODO: move to GeoJSON/Feature/SIDC helper.
    const genericSIDC = sidc[0] + '*' + sidc[2] + '*' + sidc.substring(4, 15)
    const featureDescriptor = findSpecificItem(genericSIDC)
    const type = geometryType(featureDescriptor)

    const geometryHint = () => evented.emit('OSD_MESSAGE', {
      message: `Sorry, the feature's geometry is not supported, yet.`,
      duration: 5000
    })
    this.setState({ ...this.state, featureSet, selectedSetIndex: -1, selectedSymbolIndex, indexCache: setId })
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

  selectNextElement (direction) {
    const { featureSet, selectedSetIndex, selectedSymbolIndex, indexCache, symbols } = this.state
    this.shouldUpdate = true
    if (this.type === 'symbols') {
      const index = selectedSymbolIndex + direction
      const symbolIndex = index >= 0 ? (index === symbols.length ? 0 : index) : symbols.length - 1
      this.setState({ ...this.state, selectedSymbolIndex: symbolIndex })
    } else if (selectedSymbolIndex === -1 && selectedSetIndex !== -1 && featureSet[selectedSetIndex].open && direction > 0) {
      this.setState({ ...this.state, selectedSetIndex: -1, selectedSymbolIndex: 0, indexCache: selectedSetIndex })
    } else if (selectedSymbolIndex !== -1) {
      const newIndex = selectedSymbolIndex + direction
      if (newIndex === -1) {
        this.setState({ ...this.state, selectedSetIndex: indexCache, selectedSymbolIndex: -1 })
      } else if (newIndex === featureSet[indexCache].symbols.length) {
        this.setState({ ...this.state, selectedSetIndex: indexCache + 1, selectedSymbolIndex: -1 })
      } else {
        this.setState({ ...this.state, selectedSymbolIndex: newIndex })
      }
    } else {
      const index = selectedSetIndex + direction
      const setIndex = index >= 0 ? (index === featureSet.length ? 0 : index) : featureSet.length - 1
      const set = featureSet[setIndex]
      if (setIndex === selectedSetIndex - 1 && set.open) {
        const symbolIndex = set.symbols.length - 1
        this.setState({ ...this.state, selectedSetIndex: -1, selectedSymbolIndex: symbolIndex, indexCache: setIndex })
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

  showSymbolsets () {
    const { featureSet, selectedSetIndex, selectedSymbolIndex, indexCache } = this.state
    this.type = 'sets'
    const compontents = {
      'header':
        <MapPaletteSearch
          update={ resultList => this.updateResultList(resultList) }
          setSelectedIndex={ direction => this.selectNextElement(direction) }
          selectedSetIndex={ selectedSetIndex }
          elementSelected={(setIndex, symbolIndex, parentId) => this.elementSelected(setIndex, symbolIndex, parentId) }
          selectedSymbolIndex={ selectedSymbolIndex }
        />,
      'list':
        <FeatureSet
          featureSet={ featureSet }
          selectedSetIndex={ selectedSetIndex }
          selectedSymbolIndex={ selectedSymbolIndex }
          elementSelected={(setIndex, symbolIndex, parentId) => this.elementSelected(setIndex, symbolIndex, parentId) }
          indexCache={ indexCache }
        /> }
    return compontents
  }

  showSearchResults () {
    const { selectedSetIndex, selectedSymbolIndex, symbols } = this.state
    this.type = 'symbols'
    const compontents = {
      'header':
        <MapPaletteSearch
          update={ resultList => this.updateResultList(resultList) }
          setSelectedIndex={ direction => this.selectNextElement(direction) }
          selectedSetIndex={ selectedSetIndex }
          elementSelected={(setIndex, symbolIndex, parentId) => this.elementSelected(setIndex, symbolIndex, parentId) }
          selectedSymbolIndex={ selectedSymbolIndex }
        />,
      'list':
        <Symbols
          symbols={ symbols }
          styleClass={ 'symbols' }
          selectedSymbolIndex={ selectedSymbolIndex }
          parentId={ -1 }
          elementSelected={(setIndex, symbolIndex, parentId) => this.elementSelected(setIndex, symbolIndex, parentId) }
        /> }
    return compontents
  }

  updateResultList (resultList) {
    const showComponents = resultList.length === 0 ? () => this.showSymbolsets() : () => this.showSearchResults()
    const symbols = symbolList(resultList)
    this.shouldUpdate = true
    this.setState({ ...this.state, showComponents, symbols, selectedSymbolIndex: -1 })
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
    background: 'rgba(252, 252, 255, 0.9)',

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
