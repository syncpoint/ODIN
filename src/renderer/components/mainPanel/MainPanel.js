import React from 'react'
import Paper from '@material-ui/core/Paper'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import MapPaletteSearch from './MapPaletteSearch'
import SymbolSet from './SymbolSet'
import symbolSet from '../../model/mapPalette-symbolSet'
import Symbols from './Symbols'
import { symbolList } from '../../model/mapPalette-symbol'
import uuid from 'uuid-random'
import L from 'leaflet'
import evented from '../../evented'
import store from '../../stores/layer-store'


class MainPanel extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showComponents: () => this.showSymbolsets(),
      symbolSet: symbolSet(),
      symbols: [],
      selectedSetIndex: -1,
      selectedSymbolIndex: -1,
      indexCache: 0
    }
    this.shouldUpdate = false
  }

  elementSelected (selectedSetIndex, selectedSymbolIndex, parentId) {
    selectedSetIndex !== -1 ? this.elementSetSelected(selectedSetIndex) : this.elementSymbolSelected(selectedSymbolIndex, parentId)
  }

  elementSetSelected (selectedSetIndex) {
    const { symbolSet } = this.state
    this.shouldUpdate = true
    symbolSet[selectedSetIndex].open = !symbolSet[selectedSetIndex].open
    this.setState({ ...this.state, symbolSet, selectedSetIndex, selectedSymbolIndex: -1 })
  }

  elementSymbolSelected (selectedSymbolIndex, parentId) {
    const { symbolSet, indexCache } = this.state
    const setId = parentId === -1 ? indexCache : parentId
    const set = symbolSet[setId]
    const symbol = set.symbols[selectedSymbolIndex]
    const sidc = symbol.sidc

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

    this.setState({ ...this.state, symbolSet, selectedSetIndex: -1, selectedSymbolIndex: -1 })
  }

  selectNextElement (direction) {
    const { symbolSet, selectedSetIndex, selectedSymbolIndex, indexCache } = this.state
    this.shouldUpdate = true
    if (selectedSymbolIndex === -1 && selectedSetIndex !== -1 && symbolSet[selectedSetIndex].open && direction > 0) {
      this.setState({ ...this.state, selectedSetIndex: -1, selectedSymbolIndex: 0, indexCache: selectedSetIndex })
    } else if (selectedSymbolIndex !== -1) {
      const newIndex = selectedSymbolIndex + direction
      if (newIndex === -1) {
        this.setState({ ...this.state, selectedSetIndex: indexCache, selectedSymbolIndex: -1 })
      } else if (newIndex === symbolSet[indexCache].symbols.length) {
        this.setState({ ...this.state, selectedSetIndex: indexCache + 1, selectedSymbolIndex: -1 })
      } else {
        this.setState({ ...this.state, selectedSymbolIndex: newIndex })
      }
    } else {
      const index = selectedSetIndex + direction
      const setIndex = index >= 0 ? (index === symbolSet.length ? 0 : index) : symbolSet.length - 1
      const set = symbolSet[setIndex]
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
    const { symbolSet, selectedSetIndex, selectedSymbolIndex, indexCache } = this.state
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
        <SymbolSet
          symbolSet={ symbolSet }
          selectedSetIndex={ selectedSetIndex }
          selectedSymbolIndex={ selectedSymbolIndex }
          elementSelected={(setIndex, symbolIndex, parentId) => this.elementSelected(setIndex, symbolIndex, parentId) }
          indexCache={ indexCache }
        /> }
    return compontents
  }

  showSearchResults () {
    const { symbols, selectedIndex } = this.state
    const compontents = {
      'header':
        <MapPaletteSearch
          update={ resultList => this.updateResultList(resultList) }
          setSelectedIndex={ direction => this.selectNextElement(direction) }
          selectedIndex={ selectedIndex }
        />,
      'list':
        <Symbols
          symbols={ symbols }
          styleClass={ 'symbols' }
          selectedIndex={ selectedIndex }
        /> }
    return compontents
  }

  updateResultList (resultList) {
    const showComponents = resultList.length === 0 ? () => this.showSymbolsets() : () => this.showSearchResults()
    const symbols = symbolList(resultList)
    this.setState({ ...this.state, showComponents, symbols })
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
