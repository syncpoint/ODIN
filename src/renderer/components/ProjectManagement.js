import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Button, FormControl, InputLabel, Input, List, ListItem, ListItemText, Typography } from '@material-ui/core'
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'
import SaveIcon from '@material-ui/icons/Save'
import ExportIcon from '@material-ui/icons/SaveAlt'
import ImportProjectIcon from '@material-ui/icons/LibraryAdd'
import BackToMapIcon from '@material-ui/icons/ExitToApp'

import { ipcRenderer, remote } from 'electron'
import projects from '../../shared/projects'
import { fromISO } from '../../shared/militaryTime'

import { useTranslation } from 'react-i18next'

const useStyles = makeStyles(theme => ({
  management: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    background: theme.palette.background.paper,
    padding: theme.spacing(1.5),
    zIndex: 200,
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gridTemplateRows: '3em auto',
    gridGap: theme.spacing(1.5),
    gridTemplateAreas: `
      "navigation navigation"
      "projects details"
    `,
    '@media (max-width:1024px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '3em auto auto',
      gridTemplateAreas: `
      "navigation"
      "projects"
      "details"
      `
    }
  },

  navigation: {
    gridArea: 'navigation'
  },

  projects: {
    gridArea: 'projects',
    width: '100%'
  },

  details: {
    gridArea: 'details'
  },

  caption: {
    margin: theme.spacing(1.5)
  },

  settings: {
    margin: theme.spacing(1.5)
  },

  dangerZone: {
    borderColor: 'red',
    borderWidth: '1px',
    borderRadius: '1px',
    borderStyle: 'solid',
    padding: theme.spacing(1.5),
    margin: theme.spacing(1.5)
  },

  dangerActionList: {
    listStyleType: 'none',
    margin: theme.spacing(1.5)
  },

  preview: {
    margin: theme.spacing(1.5),
    objectFit: 'contain',
    boxShadow: '0 1px 0 rgba(255,255,255,.6), 0 11px 35px 2px rgba(0,0,0,0.56), 0 0 0 1px rgba(0, 0, 0, 0.0)'
  }
}))

const Management = props => {
  const { currentProjectPath, onCloseClicked } = props
  const classes = useStyles()

  /* currentProjects holds an array of all projects metadata */
  const [currentProjects, setCurrentProjects] = React.useState([])
  const [selectedProject, setSelectedProject] = React.useState(undefined)
  const [previewImageData, setPreviewImageData] = React.useState(undefined)
  /* reloadProject forces the enumerateProjects to re-run */
  const [reloadProjects, setReloadProjects] = React.useState(true)

  const { t } = useTranslation()

  const byName = (one, other) => {
    if (one.metadata.lastAccess < other.metadata.lastAccess) return -1
    if (one.metadata.lastAccess > other.metadata.lastAccess) return 1
    return 0
  }


  React.useEffect(() => {
    projects.enumerateProjects().then(allProjects => {
      /* read all metadata */
      Promise.all(
        allProjects.map(projectPath => projects.readMetadata(projectPath)))
        .then(projects => projects.sort(byName))
        .then(projects => projects.reverse())
        .then(augmentedProjects => {
          setReloadProjects(false)
          setCurrentProjects(augmentedProjects)
          /* choose a project for startup */
          if (!selectedProject && augmentedProjects.length > 0) setSelectionAndLoadPreview(augmentedProjects[0])
        })
    })
  }, [reloadProjects])

  React.useEffect(() => {
    const reloadProjects = () => setReloadProjects(true)

    /* emitted by share-projects.js after a projects has been imported */
    ipcRenderer.on('IPC_PROJECT_IMPORTED', reloadProjects)
    return () => ipcRenderer.removeListener('IPC_PROJECT_IMPORTED', reloadProjects)
  }, [])

  const setSelectionAndLoadPreview = project => {
    setSelectedProject(project)
    if (project) {
      /* the default readPreview options are { encoding: 'base64' } */
      projects.readPreview(project.path).then(encodedPreview => {
        setPreviewImageData(encodedPreview)
      })
    } else {
      setPreviewImageData(undefined)
    }
  }

  /*  if a project is selected the main process will switch the
      renderer process to this project
  */
  const handleSwitchProject = project => {
    ipcRenderer.send('IPC_SWITCH_PROJECT', project.path)
  }

  const handleProjectSelected = project => {
    setSelectionAndLoadPreview(project)
  }

  const handleNewProject = () => {
    projects.createProject().then((_) => {
      /*
        An undefined selected project will select the first
        project in the list. See the useEffect hook above.
      */
      setSelectionAndLoadPreview(undefined)
      setReloadProjects(true)
    })
  }

  const handleDeleteProject = project => {
    projects.deleteProject(project.path).then(() => {
      setReloadProjects(true)
      setSelectionAndLoadPreview(undefined)
    })
  }

  const handleSaveProject = (metadata) => {
    /* optimistic update the window title if we are saving the currently active project */
    if (remote.getCurrentWindow().path === selectedProject.path) {
      remote.getCurrentWindow().setTitle(metadata.name)
    }

    /* tell react to re-render */
    const updatedSelectedProject = { ...selectedProject, ...{ metadata: metadata } }
    setSelectedProject(updatedSelectedProject)

    projects.writeMetadata(selectedProject.path, metadata).then(() => {
      setReloadProjects(true)
    })
  }

  /**
   *
   * @param {*} projectPath the absolute filesystem path of the project
   */
  const handleExportProject = projectPath => {
    ipcRenderer.send('IPC_EXPORT_PROJECT', projectPath)
  }

  /* see the useEffect hook above how the asynchronous reply is handeled */
  const handleImportProject = () => {
    ipcRenderer.send('IPC_IMPORT_PROJECT')
  }

  /* sub components */

  const Details = (props) => {
    const { project } = props
    if (!project) return null
    return (
      <React.Fragment>
        <Caption project={project} />
        <Settings project={project}/>
        <Preview project={project}/>
        <DangerousActions project={project}/>
      </React.Fragment>
    )
  }
  Details.propTypes = { project: PropTypes.object }

  const Caption = props => {
    const { project } = props
    return (
      <div className={classes.caption}>
        <Typography variant="h4">{project.metadata.name}</Typography>
      </div>
    )
  }
  Caption.propTypes = { project: PropTypes.object }

  const Settings = (props) => {
    const { project } = props
    if (!project) return null

    const [edit, setEdit] = React.useState(project.metadata)
    const formHasError = edit.name.length === 0

    const handleNameChanged = name => {
      const metadata = { ...edit, ...{ name: name } }
      setEdit(metadata)
    }

    const handleDetectEnter = keyCode => {
      if (keyCode === 13) {
        handleSaveProject(edit)
      }
    }

    return (
      <div className={classes.settings} id="projectSettings">
        <FormControl error={formHasError}>
          <InputLabel htmlFor="projectName">{t('projectManagement.name')}</InputLabel>
          <Input id="projectName" name="projectName" defaultValue={edit.name}
            onChange={ event => handleNameChanged(event.target.value)}
            onKeyDown={ event => handleDetectEnter(event.keyCode)}
            style={{ minWidth: '20em' }}
          />
        </FormControl>
        <Button id="exportProject" aria-label="export" variant="outlined" color="primary"
          style={{ float: 'right', margin: '2px' }} startIcon={<ExportIcon />}
          onClick={() => handleExportProject(project.path) }
        >
          {t('projectManagement.export')}
        </Button>
        <Button id="saveProject" aria-label="save" variant="contained" color="primary"
          style={{ float: 'right', margin: '2px' }} disabled={formHasError}
          onClick={() => handleSaveProject(edit)} startIcon={<SaveIcon />}>
          {t('projectManagement.save')}
        </Button>
      </div>
    )
  }
  Settings.propTypes = { project: PropTypes.object }

  const Preview = (props) => {
    const { project } = props
    /* previewImageData gets lazy loaded whenever the selected project changes */
    if (!project || !previewImageData) return null
    return (
      <div className={classes.preview} id="preview">
        <img src={`data:image/jpeg;base64,${previewImageData}`} style={{ width: '100%', objectFit: 'contain' }} />
      </div>
    )
  }
  Preview.propTypes = { project: PropTypes.object }

  const DangerousActions = (props) => {
    const { project } = props
    if (currentProjectPath === project.path) return null
    return (
      <div id="dangerousActions">
        <Typography variant="h5">{t('projectManagement.dangerZone')}</Typography>
        <div className={classes.dangerZone}>
          <ul className={classes.dangerActionList}>
            <li>
              <Button id="deleteProject" aria-label="delete" variant="outlined" color="secondary" style={{ float: 'right' }}
                onClick={() => handleDeleteProject(project)} startIcon={<DeleteForeverIcon />}>
                {t('projectManagement.delete')}
              </Button>
              <Typography variant="h6">{t('projectManagement.deleteThisProject')}</Typography>
              <Typography variant="body1">{t('projectManagement.deleteThisProjectDescription')}</Typography>
            </li>
          </ul>
        </div>
      </div>
    )
  }
  DangerousActions.propTypes = { project: PropTypes.object }

  const Projects = ({ projects }) => {
    const items = projects.map(project => (
      <ListItem key={project.path}
        selected={selectedProject && (selectedProject.path === project.path)}
        button onClick={ () => handleProjectSelected(project) }>
        <ListItemText primary={project.metadata.name} secondary={t('projectManagement.lastAccess', { date: fromISO(project.metadata.lastAccess) })}/>
        <Button id={'switchTo' + project.metadata.name} color="primary" variant="outlined" disabled={currentProjectPath === project.path}
          onClick={ () => handleSwitchProject(project)} startIcon={<PlayCircleOutlineIcon />} >
          {t('projectManagement.switch')}
        </Button>
      </ListItem>
    ))
    return (<React.Fragment>{items}</React.Fragment>)
  }
  Projects.propTypes = {
    projects: PropTypes.array,
    project: PropTypes.object
  }

  /* main screen */
  return (
    <div className={classes.management}>
      <div className={classes.navigation}>
        <BackToMapIcon id="backToMap" onClick={onCloseClicked}/>
      </div>
      <div className={classes.projects} id="projects">
        <div style={{ marginBottom: '3em' }} id="projectActions">
          <Button id="importProject" variant="outlined" color="primary" style={{ float: 'right', marginRight: '1em', marginLeft: '2px' }}
            startIcon={<ImportProjectIcon />}
            onClick={ event => handleImportProject() }
          >
            {t('projectManagement.import')}
          </Button>
          <Button id="newProject" variant="contained" color="primary" style={{ float: 'right', marginRight: '2px' }}
            startIcon={<AddCircleOutlineIcon />}
            onClick={ event => handleNewProject(event) }>
            {t('projectManagement.new')}
          </Button>
        </div>
        <List id="projectList"><Projects projects={currentProjects}/></List>
      </div>
      <div className={classes.details}>
        <Details project={selectedProject}/>
      </div>
    </div>
  )
}

/* validating component property types */
Management.propTypes = {
  classes: PropTypes.object,
  currentProjectPath: PropTypes.string.isRequired,
  onCloseClicked: PropTypes.func
}

export default Management
