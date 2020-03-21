import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { IconButton, List, ListItem, ListItemText, TextField, Typography, Tooltip } from '@material-ui/core'
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'

import { ipcRenderer } from 'electron'
import projects from '../../shared/projects'


const Projects = props => {
  const { currentProjects, onProjectFocus, onProjectSelected } = props
  return currentProjects.map(project => (
    <ListItem alignItems="flex-start" key={project.path} button>
      <ListItemText primary={project.metadata.name} secondary="some other text" onClick={ event => onProjectFocus(event, project) }/>
      <Tooltip title="change project" arrow>
        <IconButton color="primary" size="medium" onClick={ event => onProjectSelected(event, project)}>
          <PlayCircleOutlineIcon />
        </IconButton>
      </Tooltip>
    </ListItem>
  ))
}

const Details = props => {
  const { project } = props
  if (!project) return null
  return (
    <React.Fragment>
      <Preview project={project} />
    </React.Fragment>
  )
}

const Preview = props => {
  const { project } = props
  if (!project) return null
  return (
    <div>
      <Typography variant="h5">{project.metadata.name}</Typography>
      <img src='' style={{ width: '100%', objectFit: 'contain' }} />
    </div>
  )
}

const Management = props => {
  const { classes } = props

  const [focusedProject, setFocusedProject] = React.useState(undefined)
  /* holds an array of all projects metadata */
  const [currentProjects, setCurrentProjects] = React.useState([])
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

  const handleProjectSelected = (event, project) => {
    ipcRenderer.send('IPC_COMMAND_OPEN_PROJECT', project.path)
  }

  const handleProjectFocus = (event, project) => {
    setFocusedProject(project)
    /* TODO: lazy load last screenshot (if exists) */
  }

  const handleNewProject = () => {
    projects.createProject().then((_) => {
      setReloadProjects(true)
    })
  }

  return (
    <div className={classes.management}>
      <div className={classes.projects}>
        <div>
          <TextField variant="outlined" fullWidth={false}/>
          <IconButton color="primary" size="medium" align="right" onClick={ event => handleNewProject(event) }>
            <AddCircleOutlineIcon />
          </IconButton>
        </div>
        <List><Projects currentProjects={currentProjects} onProjectFocus={handleProjectFocus} onProjectSelected={handleProjectSelected}/></List>
      </div>
      <div className={classes.details}><Details project={focusedProject} /></div>
    </div>
  )
}

/* validating component property types */
Management.propTypes = {
  classes: PropTypes.object
}

Details.propTypes = {
  project: PropTypes.object
}

Preview.propTypes = {
  project: PropTypes.object
}

const styles = {
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
  }
}

export default withStyles(styles)(Management)
