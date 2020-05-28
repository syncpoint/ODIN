import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useDrop } from 'react-dnd'
import ItemTypes from './DnDItemTypes'

import BasemapListItem from './BasemapListItem'
import Opacity from './Opacity'

import { register, deregister, toggleVisibility, setZIndices, setOpacity } from '../../map/basemap/group'

import { Paper } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  panel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
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
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    width: '90%',
    paddingInlineStart: '0px',
    margin: theme.spacing(1.5)
  },
  control: {
    listStyleType: 'none', padding: '4px', margin: '4px', paddingInlineStart: 0
  }
}))


const BasemapList = props => {
  const classes = useStyles()

  const [basemapLayers, setBasemapLayers] = React.useState([])
  const [selectedBasemap, setSelectedBasemap] = React.useState(null)

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

  const handleTuneClicked = id => {
    if (isSelected(id)) {
      setSelectedBasemap(null)
    } else {
      setSelectedBasemap(basemapLayers.find(layer => layer.id === id))
    }
  }

  const handleOpacityChanged = (event, value) => {
    if (!selectedBasemap) return
    setOpacity(selectedBasemap.id, value)
  }

  const isSelected = id => selectedBasemap && selectedBasemap.id === id
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
                selected={isSelected(layer.id)}
                moveBasemapItem={moveBasemapItem}
                visibilityClicked={handleVisibilityClicked}
                tuneClicked={handleTuneClicked}
                onDrop={handleItemDropped}
              />
            )).reverse()
          }
        </ul>
        { selectedBasemap
          ? <ul className={classes.controls}>
            <Opacity key={selectedBasemap.id} onChange={handleOpacityChanged} defaultValue={selectedBasemap.opacity}/>
          </ul>
          : null
        }
      </div>
    </Paper>
  )
}

export default BasemapList
