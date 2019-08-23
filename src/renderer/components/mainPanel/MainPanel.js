import React from 'react'
import Paper from '@material-ui/core/Paper'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import MapPaletteSearch from './MapPaletteSearch'
import SymbolSet from './SymbolSet'
import symbolSet from '../../model/mapPalette-symbolSet'
import Symbols from './Symbols'
import { symbolList } from '../../model/mapPalette-symbol'


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

  onClick (selectedSetIndex) {
    const { symbolSet } = this.state
    symbolSet[selectedSetIndex].open = !symbolSet[selectedSetIndex].open
    this.shouldUpdate = true
    this.setState({ ...this.state, symbolSet, selectedSetIndex })
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
      this.setState({ ...this.state, selectedSetIndex: setIndex })
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
          onClick={index => this.onClick(index) }
        />,
      'list':
        <SymbolSet
          symbolSet={ symbolSet }
          selectedSetIndex={ selectedSetIndex }
          selectedSymbolIndex={ selectedSymbolIndex }
          onClick={index => this.onClick(index) }
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
