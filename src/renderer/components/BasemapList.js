import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'
import BasemapListItem from './basemap/BasemapListItem'

import { Paper } from '@material-ui/core'

import { listSourceDescriptors } from '../map/basemap'
import { ipcRenderer } from 'electron'

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

  const [sourceDescriptors, setSourceDescriptors] = React.useState([])

  React.useEffect(() => {
    const loadBasemaps = async () => {
      const descriptors = await listSourceDescriptors()
      setSourceDescriptors(descriptors)
    }
    loadBasemaps()
    const handleSourceDescriptorsChanged = (event, descriptors) => {
      setSourceDescriptors(descriptors)
    }
    ipcRenderer.on('IPC_SOURCE_DESCRIPTORS_CHANGED', handleSourceDescriptorsChanged)
    return () => ipcRenderer.removeListener('IPC_SOURCE_DESCRIPTORS_CHANGED', handleSourceDescriptorsChanged)
  }, [])

  const moveBasemapItem = React.useCallback((sourceIndex, hoverIndex) => {
    if (!sourceDescriptors) return
    const item = sourceDescriptors[sourceIndex]
    const shadow = [...sourceDescriptors]
    shadow.splice(sourceIndex, 1)
    shadow.splice(hoverIndex, 0, item)
    setSourceDescriptors(shadow)
  },
  [sourceDescriptors])

  return (

    <DndProvider backend={Backend}>
      <Paper className={classes.panel} elevation={6}>
        <div className={classes.listContainer}>

          <ul id="basemapItemList" style={{ listStyleType: 'none', padding: '4px' }}>
            {
              sourceDescriptors.map((descriptor, index) => (
                <BasemapListItem
                  key={descriptor.id}
                  index={index}
                  id={descriptor.id}
                  text={descriptor.name}
                  moveBasemapItem={moveBasemapItem}
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
