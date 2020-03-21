import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Fab, IconButton, List, ListItem, ListItemText, Paper, TextField, Tooltip, Typography } from '@material-ui/core'
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'

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
    display: 'flex',
    width: '100%',
    objectFit: 'contain'
  },

  input: {
    flex: 1
  }
}))

const Management = props => {
  const { currentProjectPath } = props
  const classes = useStyles()

  const [focusedProject, setFocusedProject] = React.useState(undefined)
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
    /* TODO: lazy load last screenshot (if exists) */
  }

  const handleNewProject = () => {
    projects.createProject().then((_) => {
      setReloadProjects(true)
    })
  }

  const handleDeleteProject = (project) => {
    projects.deleteProject(project.path).then(() => {
      setReloadProjects(true)
      setFocusedProject(undefined)
    })
  }

  /* sub components */

  const Details = () => {
    if (!focusedProject) return null
    const classes = useStyles()
    return (
      <React.Fragment>
        <Typography variant="h4">{focusedProject.metadata.name}</Typography>
        <Paper elevation={0} component="form" className={classes.actions}>
          <TextField id="editProjectName" value={focusedProject.metadata.name} />
          <IconButton aria-label="delete" color="secondary" align="right"
            onClick={() => handleDeleteProject(focusedProject)}
            disabled={currentProjectPath === focusedProject.path}
          >
            <DeleteForeverIcon />
          </IconButton>
        </Paper>
        <Preview project={focusedProject} />
      </React.Fragment>
    )
  }

  const Preview = () => {
    if (!focusedProject) return null
    return (<img src='' style={{ width: '100%', objectFit: 'contain' }} />)
  }

  const Projects = () => {

    return currentProjects.map(project => (
      <ListItem alignItems="flex-start" key={project.path} button>
        <ListItemText primary={project.metadata.name} secondary="some other text" onClick={ () => handleProjectFocus(project) }/>
        <Tooltip title="change project" arrow>
          <IconButton color="primary" onClick={ () => handleProjectSelected(project)}>
            <PlayCircleOutlineIcon />
          </IconButton>
        </Tooltip>
      </ListItem>
    ))
  }

  return (
    <div className={classes.management}>
      <div className={classes.projects}>
        <div>
          <TextField id="searchProjects" variant="outlined" fullWidth={true}/>
          <Fab color="primary" size="medium" align="right" onClick={ event => handleNewProject(event) }>
            <AddCircleOutlineIcon />
          </Fab>
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
