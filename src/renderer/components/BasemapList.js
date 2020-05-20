import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useDrop } from 'react-dnd'
import ItemTypes from './basemap/DnDItemTypes'

import BasemapListItem from './basemap/BasemapListItem'

import { register, deregister, toggleVisibility, setZIndices } from '../map/basemapLayers'

import { Paper } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  listContainer: {
    height: '100%',
    overflow: 'auto'
  },
  itemList: {
    listStyleType: 'none', padding: '4px', backgroundColor: theme.palette.background.paper
  },
  itemListActive: {
    listStyleType: 'none', padding: '4px', backgroundColor: theme.palette.action.hover
  }
}))


const BasemapList = props => {
  const classes = useStyles()

  const [basemapLayers, setBasemapLayers] = React.useState([])

  React.useEffect(() => {
    const handleBasemapLayersChanged = ({ type, value }) => {
      if (!type === 'basemapLayersChanged') return
      if (!value) return
      setBasemapLayers(value)
    }
    register(handleBasemapLayersChanged)
    return () => deregister(handleBasemapLayersChanged)
  }, [])

  /*
    In order tho give the user a visual feedback where one can drop
    the list item we change the css class accordingly.
  */
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.ODIN_BASEMAP_LISTITEM,
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  })

  const moveBasemapItem = React.useCallback((fromIndex, toIndex) => {
    if (!basemapLayers) return
    const item = basemapLayers[fromIndex]
    const shadow = [...basemapLayers]
    shadow.splice(fromIndex, 1)
    shadow.splice(toIndex, 0, item)
    setBasemapLayers(shadow)
  }, [basemapLayers])

  const handleItemDropped = event => {
    setZIndices(basemapLayers.map(layer => layer.id))
  }

  const handleVisibilityClicked = id => {
    if (id) toggleVisibility(id)
  }

  const cssClass = isOver ? classes.itemListActive : classes.itemList

  return (
    <Paper className={classes.panel} elevation={6}>
      <div className={classes.listContainer}>

        <ul id="basemapItemList" className={cssClass} ref={drop}>
          {
            basemapLayers.map((layer, index) => (
              <BasemapListItem
                key={layer.id}
                index={index}
                id={layer.id}
                text={layer.name}
                visible={layer.visible}
                moveBasemapItem={moveBasemapItem}
                visibilityClicked={handleVisibilityClicked}
                onDrop={handleItemDropped}
              />
            )).reverse()
          }
        </ul>
      </div>
    </Paper>

  )
}

export default BasemapList
