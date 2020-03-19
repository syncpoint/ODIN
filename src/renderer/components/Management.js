import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { IconButton, List, ListItem, ListItemText, TextField, Typography } from '@material-ui/core'
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'

import oans from '../img/oans.jpg'
import zwoa from '../img/zwoa.jpg'
import drei from '../img/drei.jpg'

const images = {
  oans: oans,
  zwoa: zwoa,
  drei: drei
}

const Projects = props => {
  const { onProjectFocus, onProjectSelected } = props
  return ['oans', 'zwoa', 'drei'].map(projectName => (
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
      <img src={images[project]} style={{ width: '100%', objectFit: 'contain' }} />
    </div>
  )
}

const Management = props => {
  const { classes } = props

  const [focusedProject, setFocusedProject] = useState(undefined)

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
        <List><Projects onProjectFocus={handleProjectFocus} onProjectSelected={handleProjectSelected}/></List>
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
