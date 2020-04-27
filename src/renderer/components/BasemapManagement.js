import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import BackToMapIcon from '@material-ui/icons/ExitToApp'
import {
  Button,
  List, ListItem,
  ListItemText, ListItemSecondaryAction,
  IconButton,
  Stepper, Step, StepLabel, StepContent
} from '@material-ui/core'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos'
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos'
import CloseIcon from '@material-ui/icons/Close'
import EditIcon from '@material-ui/icons/Edit'
import SaveIcon from '@material-ui/icons/Save'

import basemap, { setBasemap } from '../map/basemap'
import * as ol from 'ol'
import { fromLonLat } from 'ol/proj'
import { ipcRenderer } from 'electron'

import Url from './basemap/Url'
import XYZOptions from './basemap/XYZOptions'
import WMTSOptions from './basemap/WMTSOptions'
import Name from './basemap/Name'

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
  const { onCancel, onSave } = props

  const [descriptor, setDescriptor] = React.useState(selectedDescriptor)
  const [stepIndex, setStepIndex] = React.useState(0)
  const [allowNextStep, setAllowNextStep] = React.useState(true)
  const [sourceType, setSourceType] = React.useState(null)


  const nextStep = () => setStepIndex(stepIndex => stepIndex + 1)
  const previousStep = () => setStepIndex(stepIndex => stepIndex - 1)

  const handleUrlReady = url => {
    const shadow = { ...descriptor }
    shadow.type = sourceType

    const options = { ...descriptor.options }
    options.url = url
    shadow.options = options

    setDescriptor(shadow)
  }

  const handleNameReady = name => {
    const shadow = { ...descriptor }
    shadow.name = name
    shadow.options = { ...descriptor.options }
    setDescriptor(shadow)
  }

  const steps = [
    'Provide URL',
    'Specify options',
    'Verify using the preview',
    'Provide name and save'
  ]

  const Options = props => {
    switch (sourceType) {
      case 'XYZ': return <XYZOptions />
      case 'WMTS': return <WMTSOptions />
      default: return <div>UNKNOWN SOURCE TYPE</div>
    }
  }

  const Verify = props => {
    const { descriptor, onValidation } = props
    React.useEffect(() => {
      setBasemap(descriptor)
      // visual verification is done by the user and always returns true
      onValidation(true)
    })
    return <div>Use the map preview to verify the basemap settings.</div>
  }
  Verify.propTypes = {
    descriptor: PropTypes.object,
    onValidation: PropTypes.func
  }

  const getStepContent = index => {
    switch (index) {
      case 0:
        return <Url
          classes={classes}
          url={selectedDescriptor.options.url}
          onValidation={setAllowNextStep}
          onTypePrediction={setSourceType}
          onUrlReady={handleUrlReady}
        />
      case 1:
        return <Options />
      case 2:
        return <Verify
          descriptor={descriptor}
          onValidation={setAllowNextStep}
        />
      case 3:
        return <Name
          classes={classes}
          name={selectedDescriptor.name}
          onValidation={setAllowNextStep}
          onNameReady={handleNameReady}
        />
      default: return <div>UNKNOWN STEP</div>
    }
  }

  return (
    <>
      <div>
        <Button id="cancel" variant="contained"
          startIcon={<CloseIcon />}
          onClick={onCancel} >
          {t('basemapManagement.cancel')}
        </Button>
      </div>
      <div>
        <Stepper activeStep={stepIndex} orientation="vertical">
          { steps.map(label => {
            return (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  { getStepContent(stepIndex) }
                  <div className={classes.actions}>

                    { stepIndex < (steps.length - 1)
                      ? (<Button id="nextStep" variant="contained" color="primary" className={classes.actionButton}
                        endIcon={<ArrowForwardIosIcon />}
                        onClick={nextStep}
                        disabled={!allowNextStep}
                      >
                        {t('basemapManagement.nextStep')}
                      </Button>)
                      : (<Button id="save" variant="contained" color="primary" className={classes.actionButton}
                        startIcon={<SaveIcon />}
                        onClick={() => onSave(descriptor)}
                        disabled={!allowNextStep}
                      >
                        {t('basemapManagement.save')}
                      </Button>)
                    }
                    <Button id="previousStep" variant="contained" className={classes.actionButton}
                      startIcon={<ArrowBackIosIcon />}
                      onClick={previousStep}
                      disabled={stepIndex === 0}
                    >
                      {t('basemapManagement.previousStep')}
                    </Button>
                  </div>
                </StepContent>
              </Step>
            )
          })
          }
        </Stepper>
      </div>
    </>
  )
}
DescriptorDetails.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  selectedDescriptor: PropTypes.object,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onVerify: PropTypes.func
}


const Overview = props => {
  const { classes, t } = props
  const { onDescriptorSelected, onDescriptorEdited, onNew } = props

  return (
    <>
      <div className={classes.actions}>
        <Button id="newSourceDescriptor" variant="contained" color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onNew}
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
  onNew: PropTypes.func,
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

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleEditSave = sourceDescriptor => {
    // TODO: save descriptor
    console.log('handle edit save')
    console.dir(sourceDescriptor)
    setIsEditing(false)
  }

  const handleEditNew = () => {
    setSelectedDescriptor({ options: {} })
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
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            onVerify={descriptor => setSelectedDescriptor(descriptor)}
          />
          : <Overview classes={classes} t={t}
            onNew={handleEditNew}
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
