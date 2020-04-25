import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import BackToMapIcon from '@material-ui/icons/ExitToApp'
import { Button, FormControl, Input, InputLabel, List, ListItem, ListItemText } from '@material-ui/core'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'

import basemap, { setBasemap } from '../map/basemap'
import * as ol from 'ol'
import { fromLonLat } from 'ol/proj'
import { ipcRenderer } from 'electron'

import { useTranslation } from 'react-i18next'

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
    gridTemplateAreas: '"projects details"',
    '@media (max-width:1024px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto',
      gridTemplateAreas: `
      "sources"
      "details"`
    }
  },

  sidebar: {
    position: 'fixed',
    display: 'grid',
    gridTemplateColumns: '3em',
    gridTemplateRows: 'auto',
    top: '1em',
    left: '0.5em',
    zIndex: 21
  },

  details: {
    gridArea: 'details',
    zIndex: 21
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
        </ListItem>
      )) : null
      }
    </List>
  )
}
SourceDescriptorList.propTypes = {
  onDescriptorSelected: PropTypes.func
}

const SourceDetails = props => {
  const { t } = props
  return (
    <div id="basemapSettings">
      <FormControl error={false} fullWidth>
        <InputLabel htmlFor="name">{t('basemapManagement.name')}</InputLabel>
        <Input id="basemapName" name="basemapName" />
      </FormControl>
      <FormControl error={false} fullWidth>
        <InputLabel htmlFor="url">{t('basemapManagement.url')}</InputLabel>
        <Input id="basemapUrl" name="basemapUrl" />
      </FormControl>
    </div>
  )
}
SourceDetails.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func
}


const BasemapManagement = props => {
  const { onCloseClicked } = props

  const { t } = useTranslation()
  const classes = useStyles()

  let map

  const [selectedDescriptor, setSelectedDescriptor] = React.useState(null)

  /* initialize Open Layers map */
  React.useEffect(() => {
    map = new ol.Map({
      view: new ol.View({
        center: fromLonLat([16.363449, 48.210033]),
        zoom: 4
      }),
      layers: [],
      target: 'mapPreview'
    })
    basemap(map)
  }, [])

  React.useEffect(() => {
    const handleDescriptorChanged = async () => {
      await setBasemap(selectedDescriptor)
    }
    handleDescriptorChanged()
  }, [selectedDescriptor])

  return (
    <div>
      <div className={classes.sidebar}>
        <BackToMapIcon id="backToMap" onClick={onCloseClicked}/>
      </div>
      <div className={classes.management}>

        <div className={classes.sources}>
          <Button id="newSourceDescriptor" variant="contained" color="primary" style={{ float: 'right', marginRight: '2px' }}
            startIcon={<AddCircleOutlineIcon />}
          >
            {t('basemapManagement.new')}
          </Button>
          <SourceDescriptorList onDescriptorSelected={descriptor => setSelectedDescriptor(descriptor)}/>
        </div>
        <div className={classes.details}>
          <SourceDetails t={t} />
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
