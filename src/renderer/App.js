import { ipcRenderer, remote } from 'electron'
import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Category from '@material-ui/icons/Category'
import PermDataSettingIcon from '@material-ui/icons/PermDataSetting'
import MapIcon from '@material-ui/icons/Map'
import { LayersTriple, Undo, Redo, ContentCut, ContentCopy, ContentPaste } from 'mdi-material-ui'

import evented from './evented'
import i18n from './i18n'
import OSD from './components/OSD'
import Map from './map/Map'
import Management from './components/Management'
import ActivityBar from './components/ActivityBar'
import LayerList from './components/LayerList'

const DEFAULT_I18N_NAMESPACE = 'web'

const useStyles = makeStyles((/* theme */) => ({
  overlay: {
    pointerEvents: 'none',
    position: 'fixed',
    top: '0.5em',
    left: '0.5em',
    bottom: '5em',
    right: '0.5em',
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

    // Activity Bar width: 40px = 24px icon + 2 x 8px padding
    gridTemplateColumns: '48px 20em auto 20em',
    gridGap: '0.5em',

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
// TODO: see what icons MDI has to offer
const initialActivities = classes => [
  {
    id: 'map',
    type: 'activity',
    icon: <MapIcon/>,
    tooltip: 'Show Map/Pictures',
    panel: () => <Paper className={classes.toolsPanel} elevation={6}>Map/Pictures</Paper>
  },
  {
    id: 'layers',
    type: 'activity',
    icon: <LayersTriple/>,
    panel: () => <LayerList/>,
    tooltip: 'Show Layers',
    selected: true
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
    action: () => console.log('UNDO')
  },
  {
    id: 'redo',
    type: 'action',
    icon: <Redo/>,
    tooltip: 'Redo',
    action: () => console.log('REDO')
  },
  {
    type: 'divider'
  },
  {
    id: 'cut',
    type: 'action',
    icon: <ContentCut/>,
    tooltip: 'Cut',
    action: () => console.log('CUT')
  },
  {
    id: 'copy',
    type: 'action',
    icon: <ContentCopy/>,
    tooltip: 'Copy',
    action: () => console.log('COPY')
  },
  {
    id: 'paste',
    type: 'action',
    icon: <ContentPaste/>,
    tooltip: 'Paste',
    action: () => console.log('PASTE')
  }
]


const App = (props) => {
  const classes = useStyles()
  const mapProps = { ...props, id: 'map' }

  const [showManagement, setManagement] = React.useState(false)
  const [currentProjectPath, setCurrentProjectPath] = React.useState(undefined)
  const [activities, setActivities] = React.useState(initialActivities(classes))
  const [activeTool, setActiveTool] = React.useState(activities[1]) // layers

  // FIXME: strictly speaking, this does not have to be an react effect
  // TODO: maybe move to i18n.js?
  React.useEffect(() => {
    i18n.init({ defaultNS: DEFAULT_I18N_NAMESPACE }).then((/* t */) => {

      /*  Changes the i18n settings whenever the user switches between supported languages */
      const handleLanguageChanged = (_, i18nInfo) => {
        if (!i18n.hasResourceBundle(i18nInfo.lng, DEFAULT_I18N_NAMESPACE)) {
          i18n.addResourceBundle(i18nInfo.lng, DEFAULT_I18N_NAMESPACE, i18nInfo.resourceBundle)
        }
        i18n.changeLanguage(i18nInfo.lng)
      }

      ipcRenderer.on('IPC_LANGUAGE_CHANGED', handleLanguageChanged)
      // FIXME: is clean-up necessary in one-shot effects?
      return () => ipcRenderer.removeListener('IPC_LANGUAGE_CHANGED', handleLanguageChanged)
    })
  }, [])

  React.useEffect(() => {
    setCurrentProjectPath(remote.getCurrentWindow().path)

    /*  Tell the main process that React has finished rendering of the App */
    setTimeout(() => ipcRenderer.send('IPC_APP_RENDERING_COMPLETED'), 0)
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
