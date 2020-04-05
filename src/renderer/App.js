import { ipcRenderer, remote } from 'electron'
import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import LayersIcon from '@material-ui/icons/Layers'
import Category from '@material-ui/icons/Category'
import PermDataSettingIcon from '@material-ui/icons/PermDataSetting'
import UndoIcon from '@material-ui/icons/Undo'
import RedoIcon from '@material-ui/icons/Redo'
import MapIcon from '@material-ui/icons/Map'

import evented from './evented'
import OSD from './components/OSD'
import Map from './map/Map'
import Management from './components/Management'
import ActivityBar from './components/ActivityBar'

const useStyles = makeStyles((theme) => ({
  overlay: {
    pointerEvents: 'none',
    position: 'fixed',
    top: '1em',
    left: '1em',
    bottom: '5em',
    right: '1em',
    zIndex: 20,
    display: 'grid',
    gridTemplateColumns: 'auto',
    gridTemplateRows: '5em auto',
    gridGap: '1em'
  },

  contentPanel: {
    gridRowStart: 2,
    gridColumnStart: 1,
    display: 'grid',

    // Activity Bar width: 56px = 24px icon + 2 x 16px padding
    gridTemplateColumns: '56px 20em auto 24em',
    gridGap: '1em',

    // A: activity bar (buttons to show specific tool panel),
    // L: left/tools panel (tools, palette, layers, ORBAT, etc.)
    // R: right/properties panel (properties)
    gridTemplateAreas: `
      "A L . R"
    `
  },

  toolsPanel: {
    gridArea: 'L',
    pointerEvents: 'auto',
    padding: 20
  },

  propertiesPanel: {
    gridArea: 'R',
    pointerEvents: 'auto'
  }
}))


// Activities for activity bar.
// TODO: use dedicated components/panels for individual tools
const initialActivities = classes => [
  {
    id: 'map',
    type: 'activity',
    icon: <MapIcon/>,
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Map/Pictures</Paper>
  },
  {
    id: 'layers',
    type: 'activity',
    icon: <LayersIcon/>,
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Layers</Paper>,
    selected: true
  },
  {
    id: 'palette',
    type: 'activity',
    icon: <Category/>,
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Palette</Paper>
  },
  {
    id: 'tools',
    type: 'activity',
    icon: <PermDataSettingIcon/>,
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Measurement Tools</Paper>
  },
  {
    type: 'divider'
  },
  {
    id: 'undo',
    type: 'action',
    icon: <UndoIcon/>,
    action: () => console.log('UNDO')
  },
  {
    id: 'redo',
    type: 'action',
    icon: <RedoIcon/>,
    action: () => console.log('REDO')
  }
]


const App = (props) => {
  const classes = useStyles()
  const mapProps = { ...props, id: 'map' }

  const [showManagement, setManagement] = React.useState(false)
  const [currentProjectPath, setCurrentProjectPath] = React.useState(undefined)
  const [activities, setActivities] = React.useState(initialActivities(classes))
  const [activeTool, setActiveTool] = React.useState(activities[1]) // layers

  React.useEffect(() => {
    const currentProjectPath = remote.getCurrentWindow().path
    setCurrentProjectPath(currentProjectPath)
    ipcRenderer.on('IPC_SHOW_PROJECT_MANAGEMENT', () => setManagement(true))
  }, [])

  React.useEffect(() => {
    if (showManagement) return
    if (!currentProjectPath) return

    /*
      When a project gets renamed the window title is set accordingly.
      Since we use the current window for reading the project path
      we can also do so for the project name.
    */
    const projectName = remote.getCurrentWindow().getTitle()
    evented.emit('OSD_MESSAGE', { message: projectName, slot: 'A1' })

    /*
      loading map tiles and features takes some time, so we
      create the preview of the map after 1s
    */
    const appLoadedTimer = setTimeout(() => {
      ipcRenderer.send('IPC_CREATE_PREVIEW', currentProjectPath)
    }, 1000)

    return () => clearTimeout(appLoadedTimer)
  }, [showManagement, currentProjectPath])

  const handleActivitySelected = id => {
    // TODO: immutable.js?
    const [...shadows] = activities
    shadows.forEach(activity => {
      if (activity.id !== id) activity.selected = false
      else {
        if (activity.selected && !activeTool) setActiveTool(activity)
        else if (activity.selected && activeTool) setActiveTool(null)
        else {
          setActiveTool(activity)
          activity.selected = true
        }
      }
    })

    setActivities(shadows)
  }

  const management = () => <Management
    currentProjectPath={currentProjectPath}
    onCloseClicked={() => setManagement(false)}
  />

  const toolPanel = () => activeTool ? activeTool.panel() : null

  const map = () => <>
    <Map { ...mapProps }/>
    <div className={classes.overlay}>
      <OSD />
      <div className={classes.contentPanel}>
        <ActivityBar activities={activities} onActivitySelected={handleActivitySelected}/>
        { toolPanel() }
        {/* <Paper className={classes.propertiesPanel} elevation={6}/> */}
      </div>
    </div>
  </>

  // Either show project management or map:
  return showManagement ? management() : map()
}

export default App
