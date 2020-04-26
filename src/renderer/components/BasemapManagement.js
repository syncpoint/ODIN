import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import BackToMapIcon from '@material-ui/icons/ExitToApp'
import { Button, FormControl, Input, InputLabel, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@material-ui/core'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import EditIcon from '@material-ui/icons/Edit'

import basemap, { setBasemap } from '../map/basemap'
import * as ol from 'ol'
import { fromLonLat } from 'ol/proj'
import { ipcRenderer } from 'electron'

import { useTranslation } from 'react-i18next'

const useStyles = makeStyles(theme => ({
  management: {
    padding: theme.spacing(1.5),
    zIndex: 20,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '3em auto',
    gridGap: theme.spacing(1.5),
    gridTemplateAreas: `
      "navigation navigation"
      "sources details"
    `,
    '@media (max-width:1024px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '3em auto auto',
      gridTemplateAreas: `
      "navigation"
      "sources"
      "details"
    `
    }
  },

  navigation: {
    gridArea: 'navigation'
  },

  sources: {
    gridArea: 'sources',
    zIndex: 21
  },

  details: {
    gridArea: 'details',
    zIndex: 21
  },

  preview: {
    margin: theme.spacing(1.5),
    objectFit: 'contain',
    boxShadow: '0 1px 0 rgba(255,255,255,.6), 0 11px 35px 2px rgba(0,0,0,0.56), 0 0 0 1px rgba(0, 0, 0, 0.0)'
  },

  actions: {
    margin: theme.spacing(1.5)
  },

  sourceList: {
    margin: theme.spacing(1.5)
  },

  formControl: {
    margin: theme.spacing(1.5)
  }
}))

const SourceDescriptorList = props => {
  const [sourceDescriptors, setSourceDescriptors] = React.useState(null)
  const [reloadDescriptors, setReloadDescriptors] = React.useState(true)

  React.useEffect(() => {
    if (!reloadDescriptors) return
    const loadSourceDescriptors = async () => {
      setSourceDescriptors(await ipcRenderer.invoke('IPC_LIST_SOURCE_DESCRIPTORS'))
      setReloadDescriptors(false)
    }
    loadSourceDescriptors()
  }, [reloadDescriptors])

  return (
    <List>
      { sourceDescriptors ? sourceDescriptors.map(descriptor => (
        <ListItem key={descriptor.name} button onClick={() => props.onDescriptorSelected(descriptor)}>
          <ListItemText primary={descriptor.name} />
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={() => props.onDescriptorEdited(descriptor)}>
              <EditIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )) : null
      }
    </List>
  )
}
SourceDescriptorList.propTypes = {
  onDescriptorSelected: PropTypes.func,
  onDescriptorEdited: PropTypes.func
}

const DescriptorDetails = props => {
  const { classes, t, selectedDescriptor } = props

  const [descriptor, setDescriptor] = React.useState(selectedDescriptor)

  const handlePropertyChange = (event) => {
    const updated = { ...descriptor }
    updated[event.target.name] = event.target.value
    setDescriptor(updated)
  }

  return (
    <form id="descriptorDetails">
      <FormControl error={false} fullWidth className={classes.formControl}>
        <InputLabel htmlFor="descriptorName">{t('basemapManagement.descriptorName')}</InputLabel>
        <Input id="name" name="name" value={descriptor.name}
          onChange={handlePropertyChange}
        />
      </FormControl>
      <FormControl error={false} fullWidth className={classes.formControl}>
        <InputLabel htmlFor="descriptorUrl">{t('basemapManagement.descriptorUrl')}</InputLabel>
        <Input id="url" name="url" value={descriptor.url}
          onChange={handlePropertyChange}
        />
      </FormControl>
    </form>
  )
}
DescriptorDetails.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  selectedDescriptor: PropTypes.object
}


const Overview = props => {
  const { classes, t } = props
  const { onDescriptorSelected, onDescriptorEdited } = props
  return (
    <>
      <div className={classes.actions}>
        <Button id="newSourceDescriptor" variant="contained" color="primary"
          startIcon={<AddCircleOutlineIcon />}
        >
          {t('basemapManagement.new')}
        </Button>
      </div>
      <div className={classes.sourceList}>
        <SourceDescriptorList
          onDescriptorSelected={onDescriptorSelected}
          onDescriptorEdited={onDescriptorEdited}
        />
      </div>
    </>
  )
}
Overview.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  onDescriptorSelected: PropTypes.func,
  onDescriptorEdited: PropTypes.func
}


const BasemapManagement = props => {
  const { onCloseClicked } = props

  const { t } = useTranslation()
  const classes = useStyles()

  const [selectedDescriptor, setSelectedDescriptor] = React.useState(null)
  const [isEditing, setIsEditing] = React.useState(false)

  /* initialize Open Layers map */
  React.useEffect(() => {
    basemap(new ol.Map({
      view: new ol.View({
        center: fromLonLat([16.363449, 48.210033]),
        zoom: 4
      }),
      layers: [],
      target: 'mapPreview'
    }))
  }, [])

  React.useEffect(() => {
    const handleDescriptorChanged = async () => {
      await setBasemap(selectedDescriptor)
    }
    handleDescriptorChanged()
  }, [selectedDescriptor])

  const onDescriptorEdited = descriptor => {
    setSelectedDescriptor(descriptor)
    setIsEditing(true)
  }

  return (
    <div className={classes.management}>
      <div className={classes.navigation}>
        <BackToMapIcon id="backToMap" onClick={onCloseClicked}/>
      </div>
      <div className={classes.sources}>
        { isEditing
          ? <DescriptorDetails classes={classes} t={t}
            selectedDescriptor={selectedDescriptor}
          />
          : <Overview classes={classes} t={t}
            onDescriptorEdited={onDescriptorEdited}
            onDescriptorSelected={setSelectedDescriptor}
          /> }
      </div>
      <div className={classes.details}>
        <div className={classes.preview}>
          <div id="mapPreview" style={{ width: '100%', height: '400px' }}/>
        </div>
      </div>
    </div>
  )
}
BasemapManagement.propTypes = {
  onCloseClicked: PropTypes.func
}

export default BasemapManagement
