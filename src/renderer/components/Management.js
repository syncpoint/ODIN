import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { IconButton, List, ListItem, ListItemText, TextField, Typography } from '@material-ui/core'
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'

import projects from '../../shared/projects'


const Projects = props => {
  const { currentProjects, onProjectFocus, onProjectSelected } = props
  return currentProjects.map(projectName => (
    <ListItem alignItems="flex-start" key={projectName} button>
      <ListItemText primary={projectName} secondary="some other text" onClick={ event => onProjectFocus(event, projectName) }/>
      <IconButton color="primary" size="medium" onClick={ event => onProjectSelected(event, projectName)}>
        <PlayCircleOutlineIcon />
      </IconButton>
    </ListItem>
  ))
}

const Preview = props => {
  const { project } = props
  return (
    <div>
      <Typography variant="h5">{project}</Typography>
      <img src='' style={{ width: '100%', objectFit: 'contain' }} />
    </div>
  )
}

const Management = props => {
  const { classes } = props

  const [focusedProject, setFocusedProject] = React.useState(undefined)
  const [currentProjects, setCurrentProjects] = React.useState([])

  React.useEffect(() => {
    projects.enumerateProjects().then(allProjects => {
      setCurrentProjects(allProjects)
    })
  }, [currentProjects])

  const handleProjectSelected = (event, project) => {
    console.log(`selected project ${project}`)
  }

  const handleProjectFocus = (event, project) => {
    console.log(`focused project ${project}`)
    setFocusedProject(project)
  }

  const handleNewProject = event => {
    console.dir(event)
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
      <div className={classes.preview}><Preview project={focusedProject} /></div>
    </div>
  )
}

/* validating component property types */
Management.propTypes = {
  classes: PropTypes.object
}

Preview.propTypes = {
  project: PropTypes.string
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
    gridTemplateAreas: '"projects preview"'
  },

  projects: {
    gridArea: 'projects',
    width: '100%'
  },

  preview: {
    gridArea: 'preview'
  }
}

export default withStyles(styles)(Management)
