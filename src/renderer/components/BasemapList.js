import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'
import BasemapListItem from './basemap/BasemapListItem'

import { register, deregister, toggleVisibility } from '../map/basemapLayers'

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

  const moveBasemapItem = React.useCallback((fromIndex, toIndex) => {
    if (!basemapLayers) return
    const item = basemapLayers[fromIndex]
    const shadow = [...basemapLayers]
    shadow.splice(fromIndex, 1)
    shadow.splice(toIndex, 0, item)
    setBasemapLayers(shadow)
  },
  [basemapLayers])

  const handleVisibilityClicked = id => {
    if (id) toggleVisibility(id)
  }

  return (

    <DndProvider backend={Backend}>
      <Paper className={classes.panel} elevation={6}>
        <div className={classes.listContainer}>

          <ul id="basemapItemList" style={{ listStyleType: 'none', padding: '4px' }}>
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
                />
              ))
            }
          </ul>
        </div>
      </Paper>
    </DndProvider>
  )
}

export default BasemapList
