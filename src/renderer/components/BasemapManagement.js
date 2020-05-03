import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import BackToMapIcon from '@material-ui/icons/ExitToApp'

import basemap, { setBasemap, clearBasemap } from '../map/basemap'
import * as ol from 'ol'
import { fromLonLat } from 'ol/proj'
import { ipcRenderer } from 'electron'

import Overview from './basemap/Overview'
import SourceDescriptorDetails from './basemap/SourceDescriptorDetails'

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
    margin: theme.spacing(1.5),
    display: 'inlineBlock',
    overflow: 'auto'
  },

  actionButton: {
    margin: theme.spacing(1.5),
    float: 'right'
  },

  sourceList: {
    margin: theme.spacing(1.5)
  },

  formControl: {
    margin: theme.spacing(1.5)
  }
}))

const BasemapManagement = props => {
  const { onCloseClicked } = props

  const { t } = useTranslation()
  const classes = useStyles()

  const [selectedDescriptor, setSelectedDescriptor] = React.useState(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isPersisted, setIsPersisted] = React.useState(true)

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

  React.useEffect(() => {
    if (isPersisted) return
    const doPersist = async () => {
      await ipcRenderer.invoke('IPC_PERSIST_DESCRIPTOR', selectedDescriptor)
      setIsPersisted(true)
    }
    doPersist()
  }, [isPersisted])

  const onDescriptorEdited = descriptor => {
    setSelectedDescriptor(descriptor)
    setIsEditing(true)
    clearBasemap()
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleEditSave = sourceDescriptor => {
    setSelectedDescriptor(sourceDescriptor)
    /* this will trigger the React effect */
    setIsPersisted(false)
    setIsEditing(false)
  }

  const handleEditNew = () => {
    setSelectedDescriptor({ options: {} })
    setIsEditing(true)
    clearBasemap()
  }

  return (
    <div className={classes.management}>
      <div className={classes.navigation}>
        <BackToMapIcon id="backToMap" onClick={onCloseClicked}/>
      </div>
      <div className={classes.sources}>
        { isEditing
          ? <SourceDescriptorDetails classes={classes} t={t}
            selectedDescriptor={selectedDescriptor}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            onVerify={descriptor => setSelectedDescriptor(descriptor)}
          />
          : <Overview classes={classes} t={t}
            onNew={handleEditNew}
            onDescriptorEdited={onDescriptorEdited}
            onDescriptorSelected={setSelectedDescriptor}
            forceReload={isPersisted}
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
