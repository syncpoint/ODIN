import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Category from '@material-ui/icons/Category'
import PermDataSettingIcon from '@material-ui/icons/PermDataSetting'
import MapIcon from '@material-ui/icons/Map'
import { LayersTriple, Undo, Redo, ContentCut, ContentCopy, ContentPaste } from 'mdi-material-ui'

import ActivityBar from './ActivityBar'
import BasemapList from './BasemapList'
import LayerList from './layerlist/LayerList'
import undo from '../undo'
import evented from '../evented'

const useStyles = makeStyles((/* theme */) => ({
  toolsPanel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    padding: 20
  }
}))

// Activities for activity bar.
// TODO: use dedicated components/panels for individual tools
// TODO: see what icons MDI has to offer
const initialActivities = classes => [
  {
    id: 'map',
    type: 'activity',
    icon: <MapIcon/>,
    tooltip: 'Show Map/Pictures',
    panel: () => <BasemapList />
  },
  {
    id: 'layers',
    type: 'activity',
    icon: <LayersTriple/>,
    panel: () => <LayerList/>,
    tooltip: 'Show Layers'
  },
  {
    id: 'palette',
    type: 'activity',
    icon: <Category/>,
    tooltip: 'Show Symbol Palette',
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Palette</Paper>
  },
  {
    id: 'tools',
    type: 'activity',
    icon: <PermDataSettingIcon/>,
    tooltip: 'Show Tools',
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Measurement Tools</Paper>
  },
  {
    type: 'divider'
  },
  {
    id: 'undo',
    type: 'action',
    icon: <Undo/>,
    tooltip: 'Undo',
    action: undo.undo
  },
  {
    id: 'redo',
    type: 'action',
    icon: <Redo/>,
    tooltip: 'Redo',
    action: undo.redo
  },
  {
    type: 'divider'
  },
  {
    id: 'cut',
    type: 'action',
    icon: <ContentCut/>,
    tooltip: 'Cut',
    action: () => evented.emit('EDIT_CUT')
  },
  {
    id: 'copy',
    type: 'action',
    icon: <ContentCopy/>,
    tooltip: 'Copy',
    action: () => evented.emit('EDIT_COPY')
  },
  {
    id: 'paste',
    type: 'action',
    icon: <ContentPaste/>,
    tooltip: 'Paste',
    action: () => evented.emit('EDIT_PASTE')
  }
]

const Activities = (/* props */) => {
  const classes = useStyles()
  const [activities, setActivities] = React.useState(initialActivities(classes))
  const [activeTool, setActiveTool] = React.useState(null)

  const handleActivitySelected = id => {
    // TODO: immutable.js?
    const [...shadows] = activities
    shadows.forEach(activity => {
      if (activity.id !== id) activity.selected = false
      else {
        if (activity.selected && !activeTool) setActiveTool(activity)
        else if (activity.selected && activeTool) {
          setActiveTool(null)
          activity.selected = false
        } else {
          setActiveTool(activity)
          activity.selected = true
        }
      }
    })

    setActivities(shadows)
  }

  const toolPanel = () => activeTool ? activeTool.panel() : null

  return (
    <>
      <ActivityBar activities={activities} onActivitySelected={handleActivitySelected}/>
      { toolPanel() }
    </>
  )
}

export default Activities
