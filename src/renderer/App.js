import { ipcRenderer, remote } from 'electron'
import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'

import OSD from './components/OSD'
import Map from './map/Map'
import Management from './components/Management'
import evented from './evented'

const useStyles = makeStyles((theme) => ({
  overlay: {
    position: 'fixed',
    top: '1em',
    left: '1em',
    bottom: '5em',
    right: '1em',
    zIndex: 20,
    display: 'grid',
    gridTemplateColumns: 'auto',
    gridTemplateRows: '5em auto',
    gridGap: '1em',
    pointerEvents: 'none'
  },

  contentPanel: {
    gridRowStart: 2,
    gridColumnStart: 1,
    display: 'grid',
    gridTemplateColumns: '3em 20em auto 24em',
    gridTemplateRows: '1fr 3fr',
    gridGap: '1em',

    // B: buttons bar,
    // L: left panel (tools, palette, layers, ORBAT, etc.)
    // R: right panel (properties)
    gridTemplateAreas: `
      "B L . R"
      "B L . R"
    `
  },

  buttonsPanel: {
    gridArea: 'B'
  },

  toolsPanel: {
    gridArea: 'L'
  },

  propertiesPanel: {
    gridArea: 'R'
  }
}))

const App = (props) => {
  const classes = useStyles()
  const mapProps = { ...props, id: 'map' }

  const [showManagement, setManagement] = React.useState(false)
  const [currentProjectPath, setCurrentProjectPath] = React.useState(undefined)

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

  const management = () => <Management
    currentProjectPath={currentProjectPath}
    onCloseClicked={() => setManagement(false)}
  />

  const map = () => <>
    <Map { ...mapProps }/>
    <div className={classes.overlay}>
      <OSD />
      <div className={classes.contentPanel}>
        <Paper className={classes.buttonsPanel} elevation={6}/>
        <Paper className={classes.toolsPanel} elevation={6}/>
        <Paper className={classes.propertiesPanel} elevation={6}/>
      </div>
    </div>
  </>

  // Either show project management or map:
  return showManagement ? management() : map()
}

export default App
