import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Button, FormControl, InputLabel, Input, List, ListItem, ListItemText, Typography } from '@material-ui/core'
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'
import SaveIcon from '@material-ui/icons/Save'

import { ipcRenderer } from 'electron'
import projects from '../../shared/projects'


const useStyles = makeStyles(theme => ({
  management: {
    paddingTop: '1em',
    paddingLeft: '3em',
    bottom: '1.5em',
    paddingRight: '3em',
    zIndex: 20,
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gridTemplateRows: 'auto',
    gridGap: '1em',
    gridTemplateAreas: '"projects details"'
  },

  projects: {
    gridArea: 'projects',
    width: '100%'
  },

  details: {
    gridArea: 'details'
  },

  actions: {
    marginTop: '1.5em',
    marginBottom: '1.5em'
  },

  settigs: {
    marginTop: '1.5em',
    marginBottom: '1.5em'
  },

  dangerZone: {
    borderColor: 'red',
    borderWidth: '1px',
    borderRadius: '1px',
    borderStyle: 'solid',
    padding: '1em'
  },

  dangerActionList: {
    listStyleType: 'none',
    paddingLeft: 0,
    margin: '5px'
  },

  preview: {
    margin: '1.5em',
    objectFit: 'contain',
    boxShadow: '0 1px 0 rgba(255,255,255,.6), 0 11px 35px 2px rgba(0,0,0,0.56), 0 0 0 1px rgba(0, 0, 0, 0.0)'
  }

}))

const Management = props => {
  const { currentProjectPath } = props
  const classes = useStyles()

  const [focusedProject, setFocusedProject] = React.useState(undefined)
  const [editingMetadata, setEditingMetadata] = React.useState(undefined)
  const [previewImageData, setPreviewImageData] = React.useState(undefined)

  /* currentProjects holds an array of all projects metadata */
  const [currentProjects, setCurrentProjects] = React.useState([])

  /* reloadProject forces the enumerateProjects to re-run */
  const [reloadProjects, setReloadProjects] = React.useState(true)


  React.useEffect(() => {
    projects.enumerateProjects().then(allProjects => {
      /* read all metadata */
      Promise.all(
        allProjects.map(projectPath => projects.readMetadata(projectPath)))
        .then(augmentedProjects => {
          setReloadProjects(false)
          setCurrentProjects(augmentedProjects)
        })
    })
  }, [reloadProjects])

  const handleProjectSelected = project => {
    ipcRenderer.send('IPC_COMMAND_OPEN_PROJECT', project.path)
  }

  const handleProjectFocus = project => {
    setFocusedProject(project)
    setEditingMetadata({ ...project.metadata })
    /* the default readPreview options are { encoding: 'base64' } */
    projects.readPreview(project.path).then(encodedPreview => {
      setPreviewImageData(encodedPreview)
    })
  }

  const handleNewProject = () => {
    projects.createProject().then((_) => {
      setReloadProjects(true)
    })
  }

  const handleDeleteProject = project => {
    projects.deleteProject(project.path).then(() => {
      setReloadProjects(true)
      setFocusedProject(undefined)
      setEditingMetadata(undefined)
    })
  }

  const handleNameChanged = name => {
    const metadata = { ...editingMetadata, ...{ name: name } }
    setEditingMetadata(metadata)
  }

  const handleSaveProject = () => {
    projects.writeMetadata(focusedProject.path, editingMetadata).then(setReloadProjects(true))
  }

  /* sub components */

  const Details = () => {
    if (!focusedProject) return null
    return (
      <React.Fragment>
        <Typography variant="h4">{focusedProject.metadata.name}</Typography>
        <Settings />
        <Preview className={classes.preview} />
        <DangerousActions />
      </React.Fragment>
    )
  }

  const Settings = () => {
    if (!focusedProject) return null

    const formHasError = editingMetadata.name.length === 0

    return (
      <div className={classes.settings}>
        <FormControl error={formHasError}>
          <InputLabel htmlFor="projectName"></InputLabel>
          <Input id="projectName" value={editingMetadata.name} autoFocus={true}
            onChange={ event => handleNameChanged(event.target.value)}/>
        </FormControl>
        <Button aria-label="save" variant="outlined" color="primary"
          style={{ float: 'right' }} disabled={formHasError}
          onClick={() => handleSaveProject(editingMetadata)} startIcon={<SaveIcon />}>
          Save
        </Button>
      </div>
    )
  }

  const Preview = () => {
    if (!focusedProject || !previewImageData) return null
    return (
      <div className={classes.preview}>
        <img src={`data:image/jpeg;base64,${previewImageData}`} style={{ width: '100%', objectFit: 'contain' }} />
      </div>
    )
  }

  const DangerousActions = () => {
    if (!focusedProject) return null
    if (currentProjectPath === focusedProject.path) return null
    return (
      <div>
        <Typography variant="h5">Danger Zone</Typography>
        <div className={classes.dangerZone}>
          <ul className={classes.dangerActionList}>
            <li>
              <Button aria-label="delete" variant="outlined" color="secondary" style={{ float: 'right' }}
                onClick={() => handleDeleteProject(focusedProject)} startIcon={<DeleteForeverIcon />}>
                Delete
              </Button>
              <Typography variant="h6">Delete this project</Typography>
              <Typography variant="body1">Once a project is deleted, there is no going back!</Typography>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  const Projects = () => {
    return currentProjects.map(project => (
      <ListItem alignItems="flex-start" key={project.path} button>
        <ListItemText primary={project.metadata.name} onClick={ () => handleProjectFocus(project) }/>
        <Button color="primary" variant="outlined" disabled={currentProjectPath === project.path}
          onClick={ () => handleProjectSelected(project)} startIcon={<PlayCircleOutlineIcon />} >
          Switch to
        </Button>
      </ListItem>
    ))
  }


  /* main screen */
  return (
    <div className={classes.management}>
      <div className={classes.projects}>
        <div>
          <Input id="searchProjects" variant="outlined" fullWidth={false}/>
          <Button variant="outlined" color="primary" style={{ float: 'right', marginRight: '1em' }}
            startIcon={<AddCircleOutlineIcon />}
            onClick={ event => handleNewProject(event) }>
            New
          </Button>
        </div>
        <List><Projects /></List>
      </div>
      <div className={classes.details}><Details /></div>
    </div>
  )
}

/* validating component property types */
Management.propTypes = {
  classes: PropTypes.object,
  currentProjectPath: PropTypes.string.isRequired
}

export default Management
