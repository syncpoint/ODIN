import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import BackToMapIcon from '@material-ui/icons/ExitToApp'
import { Button } from '@material-ui/core'

import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'

import { setBasemap, clearBasemap } from '../map/basemap/single'
import * as ol from 'ol'
import { fromLonLat } from 'ol/proj'
import { boundingExtent } from 'ol/extent'
import { ipcRenderer } from 'electron'

import SourceDescriptorList from './basemap/SourceDescriptorList'
import SourceDescriptorDetails from './basemap/SourceDescriptorDetails'

import { useTranslation } from 'react-i18next'

const useStyles = makeStyles(theme => ({
  blurredBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    background: theme.palette.grey[700],
    opacity: theme.palette.action.disabledOpacity,
    zIndex: 199
  },
  management: {
    position: 'relative',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    background: theme.palette.background.paper,
    padding: theme.spacing(1.5),
    zIndex: 200,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1em auto',
    gridGap: theme.spacing(1.5),
    gridTemplateAreas: `
      "navigation navigation"
      "sources details"
    `,
    '@media (max-width:1024px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '2em auto auto',
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
    gridArea: 'sources'
  },

  details: {
    gridArea: 'details'
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

  const [sourceDescriptors, setSourceDescriptors] = React.useState(null)
  const [selectedDescriptor, setSelectedDescriptor] = React.useState(null)

  const [isEditing, setIsEditing] = React.useState(false)

  const [shouldUpsertSelected, setShouldUpsertSelected] = React.useState(false)
  const [shouldDeleteSelected, setShouldDeleteSelected] = React.useState(false)

  /* map is initialized by the useEffect hook */
  const [map] = React.useState(new ol.Map({
    view: new ol.View({
      center: fromLonLat([16.363449, 48.210033]),
      zoom: 4
    }),
    layers: []
  }))

  /* initialize Open Layers map */
  React.useEffect(() => {
    map.setTarget('mapPreview')
  }, [])

  /* source descriptors */
  React.useEffect(() => {
    /* pending upsert or delete action */
    if (shouldUpsertSelected || shouldDeleteSelected) return
    const loadSourceDescriptors = async () => {
      const descriptors = await ipcRenderer.invoke('IPC_LIST_SOURCE_DESCRIPTORS')
      setSourceDescriptors(descriptors)

      const selection = descriptors && descriptors.length > 0
        ? descriptors[0]
        : null
      setSelectedDescriptor(selection)
    }
    loadSourceDescriptors()
  }, [shouldUpsertSelected, shouldDeleteSelected])

  /* changes the preview whenever a new descriptor is selected */
  React.useEffect(() => {
    updatePreview(selectedDescriptor)
  }, [selectedDescriptor])

  /* save new or update current selection */
  React.useEffect(() => {
    if (!shouldUpsertSelected) return
    const addDescriptor = async () => {
      await ipcRenderer.invoke('IPC_UPSERT_DESCRIPTOR', selectedDescriptor)
      setShouldUpsertSelected(false)
    }
    addDescriptor()
  }, [shouldUpsertSelected])

  /* Delete the current selection */
  React.useEffect(() => {
    if (!shouldDeleteSelected) return
    const deleteDescriptor = async () => {
      await ipcRenderer.invoke('IPC_DELETE_DESCRIPTOR', selectedDescriptor)
      setShouldDeleteSelected(false)
      setSelectedDescriptor(null)
    }
    deleteDescriptor()
  }, [shouldDeleteSelected])

  /* map helper functions */
  const zoomToExtent = wgs84boundingBox => {
    if (map && wgs84boundingBox) {
      const southWest = fromLonLat(wgs84boundingBox.slice(0, 2))
      const northEast = fromLonLat(wgs84boundingBox.slice(2, 4))
      const extent = boundingExtent([southWest, northEast])
      map.getView().fit(extent)
    }
  }

  const updatePreview = async (descriptor) => {
    clearBasemap(map)
    if (descriptor) {
      await setBasemap(map, descriptor)
      zoomToExtent(descriptor.options.wgs84BoundingBox)
    }
  }

  const handleEdit = descriptor => {
    setSelectedDescriptor(descriptor)
    setIsEditing(true)
    clearBasemap(map)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleEditSave = sourceDescriptor => {
    setIsEditing(false)
    setSelectedDescriptor(sourceDescriptor)
    /* this will trigger the React effect */
    setShouldUpsertSelected(true)
  }

  const handleEditNew = () => {
    setIsEditing(true)
    setSelectedDescriptor(null)
    clearBasemap(map)
  }

  const handleDelete = () => {
    setShouldDeleteSelected(true)
  }

  return (
    <>
      <div className={classes.blurredBackground} />
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
              onVerify={descriptor => updatePreview(descriptor)}
            />
            : <div>
              <div className={classes.actions}>
                <Button id="newSourceDescriptor" variant="contained" color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleEditNew}
                  className={classes.actionButton}
                >
                  {t('basemapManagement.new')}
                </Button>
              </div>
              <div className={classes.sourceList}>
                <SourceDescriptorList
                  onDescriptorSelected={descriptor => setSelectedDescriptor(descriptor)}
                  onDescriptorEdit={handleEdit}
                  sourceDescriptors={sourceDescriptors}
                  selectedDescriptor={selectedDescriptor}
                />
              </div>
            </div>
          }
        </div>
        <div className={classes.details}>
          <div className={classes.preview}>
            <div id="mapPreview" style={{ width: '100%', height: '400px' }}/>
          </div>
          <div className={classes.actions}>
            <div className={classes.actions}>
              <Button variant="outlined" edge="end" color="secondary"
                onClick={() => handleDelete()}
                className={classes.actionButton}
                startIcon={<DeleteForeverIcon />}
                disabled={!selectedDescriptor || isEditing}
              >
                {t('basemapManagement.delete')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
BasemapManagement.propTypes = {
  onCloseClicked: PropTypes.func
}

export default BasemapManagement
