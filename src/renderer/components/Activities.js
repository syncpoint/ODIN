import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Category from '@material-ui/icons/Category'
import PermDataSettingIcon from '@material-ui/icons/PermDataSetting'
import MapIcon from '@material-ui/icons/Map'
import ShareIcon from '@material-ui/icons/Share'
import { LayersTriple, Undo, Redo, ContentCut, ContentCopy, ContentPaste } from 'mdi-material-ui'

import ActivityBar from './ActivityBar'
import BasemapPanel from './basemapPanel/BasemapPanel'
import LayerList from './layerlist/LayerList'
import FeaturePalette from './palette/FeaturePalette'
import undo from '../undo'
import evented from '../evented'

import { useTranslation } from 'react-i18next'

const useStyles = makeStyles((/* theme */) => ({
  toolsPanel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    padding: 20
  }
}))

// Activities for activity bar.
const initialActivities = (classes, t) => [
  {
    id: 'map',
    type: 'activity',
    icon: <MapIcon/>,
    tooltip: t('activities.tooltips.map'),
    panel: () => <BasemapPanel />
  },
  {
    id: 'layers',
    type: 'activity',
    icon: <LayersTriple/>,
    panel: () => <LayerList/>,
    tooltip: t('activities.tooltips.layers')
  },
  {
    id: 'palette',
    type: 'activity',
    icon: <Category/>,
    tooltip: t('activities.tooltips.symbols'),
    panel: () => <FeaturePalette/>
  },
  {
    id: 'tools',
    type: 'activity',
    icon: <PermDataSettingIcon/>,
    tooltip: t('activities.tooltips.tools'),
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>{t('activities.tooltips.tools')}</Paper>
  },
  {
    type: 'divider'
  },
  {
    id: 'undo',
    type: 'action',
    icon: <Undo/>,
    tooltip: t('activities.tooltips.undo'),
    action: undo.undo
  },
  {
    id: 'redo',
    type: 'action',
    icon: <Redo/>,
    tooltip: t('activities.tooltips.redo'),
    action: undo.redo
  },
  {
    type: 'divider'
  },
  {
    id: 'cut',
    type: 'action',
    icon: <ContentCut/>,
    tooltip: t('activities.tooltips.cut'),
    action: () => evented.emit('EDIT_CUT')
  },
  {
    id: 'copy',
    type: 'action',
    icon: <ContentCopy/>,
    tooltip: t('activities.tooltips.copy'),
    action: () => evented.emit('EDIT_COPY')
  },
  {
    id: 'paste',
    type: 'action',
    icon: <ContentPaste/>,
    tooltip: t('activities.tooltips.paste'),
    action: () => evented.emit('EDIT_PASTE')
  },
  {
    type: 'divider'
  },
  {
    id: 'sharePng',
    type: 'action',
    icon: <ShareIcon/>,
    tooltip: t('activities.tooltips.share'),
    action: () => evented.emit('SHARE_PNG')
  }
]

const Activities = (/* props */) => {
  const classes = useStyles()
  const { t } = useTranslation()
  const activities = initialActivities(classes, t)
  const [activeTool, setActiveTool] = React.useState(null)

  const handleActivitySelected = activity => {
    if (!activeTool) {
      setActiveTool(activity)
    } else {
      setActiveTool(activeTool.id !== activity.id ? activity : null)
    }
  }

  const toolPanel = () => activeTool ? activeTool.panel() : null

  return (
    <>
      <ActivityBar activities={activities} activeTool={activeTool} onActivitySelected={handleActivitySelected}/>
      { toolPanel() }
    </>
  )
}

export default Activities
