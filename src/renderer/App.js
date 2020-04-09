import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import OSD from './components/OSD'
import Map from './map/Map'
import Management from './components/Management'

import { ipcRenderer, remote } from 'electron'
import evented from './evented'
import './i18n'

const useStyles = makeStyles((/* theme */) => ({
  overlay: {
    position: 'fixed',
    top: '1em',
    left: '1em',
    bottom: '1.5em',
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
    gridTemplateColumns: '25em auto 25em',
    gridTemplateRows: '1fr 3fr',
    gridGap: '1em',
    gridTemplateAreas: `
      "L . R"
      "L B R"
    `
  }
}))

const App = (props) => {
  const classes = useStyles()
  const mapProps = { ...props, id: 'map' }

  const [showManagement, setManagement] = React.useState(false)
  const [currentProjectPath, setCurrentProjectPath] = React.useState(undefined)

  React.useEffect(() => {
    setCurrentProjectPath(remote.getCurrentWindow().path)

    /*  Tell the main process that React has finished rendering of the App */
    setTimeout(() => ipcRenderer.send('IPC_APP_RENDERING_COMPLETED'), 0)
    ipcRenderer.on('IPC_SHOW_PROJECT_MANAGEMENT', () => setManagement(true))

    /*
      Normally we need to return a cleanup function in order to remove listeners. Since
      this is the root of our react app, the only way to unload the component is to
      close the window - which destroys the ipcRenderer instance. Thus we omit this good
      practice and do not return any clean up functionality.
    */
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
    </div>
  </>

  // Either show project management or map:
  return showManagement ? management() : map()
}

export default App
